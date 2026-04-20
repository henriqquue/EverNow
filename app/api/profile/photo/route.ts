import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import db from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const index = parseInt(formData.get("index") as string || "0");

    if (!file) return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });

    // 1. Converter imagem para Base64 (Texto)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 2. Buscar o usuário atual
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { photos: true }
    });

    const currentPhotos = [...(user?.photos || ["", "", "", "", "", ""])];
    while (currentPhotos.length < 6) currentPhotos.push("");
    
    // Salvar a string Base64 direto no array de fotos
    currentPhotos[index] = base64Image;

    // 3. Atualizar o Usuário no Banco
    await db.user.update({
      where: { id: session.user.id },
      data: {
        photos: currentPhotos,
        ...(index === 0 && { image: base64Image })
      }
    });

    // 4. Também atualizar a tabela UserPhoto para consistência
    const existing = await db.userPhoto.findFirst({
      where: { userId: session.user.id, order: index }
    });

    if (existing) {
      await db.userPhoto.update({
        where: { id: existing.id },
        data: { url: base64Image }
      });
    } else {
      await db.userPhoto.create({
        data: {
          userId: session.user.id,
          url: base64Image,
          order: index,
          isMain: index === 0
        }
      });
    }

    return NextResponse.json({ url: base64Image, index });
  } catch (error: any) {
    console.error("❌ ERRO NO MODO BASE64:", error);
    return NextResponse.json({ 
      error: "Erro ao salvar foto no banco", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const index = parseInt(searchParams.get("index") || "0");

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { photos: true }
    });

    if (user) {
      const newPhotos = [...user.photos];
      newPhotos[index] = "";
      
      await db.user.update({
        where: { id: session.user.id },
        data: { photos: newPhotos }
      });

      const photoEntry = await db.userPhoto.findFirst({
        where: { userId: session.user.id, order: index }
      });
      if (photoEntry) {
        await db.userPhoto.delete({ where: { id: photoEntry.id } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}