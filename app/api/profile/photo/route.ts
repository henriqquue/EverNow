import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";
import { storage } from "@/lib/storage";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const index = parseInt(formData.get("index") as string) || 0;

    if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

    const fileName = `${session.user.id}-${index}-${Date.now()}.png`;
    const publicUrl = await storage.upload(file, "profiles", fileName);

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { photos: true }
    });

    const dbPhotos = user?.photos || [];
    let currentPhotos = [...dbPhotos];
    while (currentPhotos.length < 6) currentPhotos.push("");
    
    // Optional: Delete old photo if it exists
    if (currentPhotos[index]) {
      await storage.delete(currentPhotos[index]).catch(() => {});
    }

    currentPhotos[index] = publicUrl;

    await db.user.update({
      where: { id: session.user.id },
      data: {
        photos: currentPhotos,
        ...(index === 0 && { image: publicUrl }),
        userPhotos: {
          upsert: {
            where: { id: `photo-${session.user.id}-${index}` },
            update: { url: publicUrl, order: index },
            create: { id: `photo-${session.user.id}-${index}`, url: publicUrl, order: index }
          }
        }
      }
    });

    const completeness = await calculateProfileCompleteness(session.user.id);
    await db.user.update({
      where: { id: session.user.id },
      data: { profileComplete: completeness }
    });

    return NextResponse.json({ url: publicUrl, index });
  } catch (error: any) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const index = parseInt(searchParams.get("index") || "-1");

    if (index < 0 || index >= 6) return NextResponse.json({ error: "Índice inválido" }, { status: 400 });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { photos: true }
    });

    const dbPhotos = user?.photos || [];
    let currentPhotos = [...dbPhotos];
    while (currentPhotos.length < 6) currentPhotos.push("");
    
    const photoUrl = currentPhotos[index];
    if (photoUrl) {
      await storage.delete(photoUrl).catch(() => {});
    }

    currentPhotos[index] = "";

    await db.user.update({
      where: { id: session.user.id },
      data: {
        photos: currentPhotos,
        ...(index === 0 && { image: null }),
        userPhotos: {
          deleteMany: { order: index }
        }
      }
    });

    const completeness = await calculateProfileCompleteness(session.user.id);
    await db.user.update({
      where: { id: session.user.id },
      data: { profileComplete: completeness }
    });

    return NextResponse.json({ success: true, index });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}