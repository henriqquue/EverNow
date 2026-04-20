import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/prisma";
import { storage } from "@/lib/storage";

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

    const fileName = `${session.user.id}-${index}-${Date.now()}.png`;
    
    // 1. Upload para o Supabase
    const publicUrl = await storage.upload(file, "", fileName);

    // 2. Buscar o usuário atual para atualizar a lista de strings
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { photos: true }
    });

    const currentPhotos = [...(user?.photos || ["", "", "", "", "", ""])];
    // Garantir que o array tenha pelo menos 6 posições
    while (currentPhotos.length < 6) currentPhotos.push("");
    currentPhotos[index] = publicUrl;

    // 3. Atualizar o Usuário (Lista simples e Foto de perfil se for a primeira)
    await db.user.update({
      where: { id: session.user.id },
      data: {
        photos: currentPhotos,
        ...(index === 0 && { image: publicUrl })
      }
    });

    // 4. Tentar atualizar a tabela UserPhoto de forma segura (Opcional para a UI funcionar)
    try {
      // Primeiro, removemos se já existir uma foto nessa ordem para evitar conflito de ID
      const existing = await db.userPhoto.findFirst({
        where: { userId: session.user.id, order: index }
      });

      if (existing) {
        await db.userPhoto.update({
          where: { id: existing.id },
          data: { url: publicUrl }
        });
      } else {
        await db.userPhoto.create({
          data: {
            userId: session.user.id,
            url: publicUrl,
            order: index,
            isMain: index === 0
          }
        });
      }
    } catch (dbErr) {
      console.warn("Aviso: Falha ao atualizar UserPhoto, mas a foto principal foi salva:", dbErr);
    }

    return NextResponse.json({ url: publicUrl, index });
  } catch (error: any) {
    console.error("❌ FALHA CRÍTICA NO UPLOAD:", error);
    return NextResponse.json({ 
      error: "Erro ao processar imagem", 
      details: error.message
    }, { status: 500 });
  }
}