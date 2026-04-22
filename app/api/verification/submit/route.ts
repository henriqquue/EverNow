import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * POST /api/verification/submit
 * Enviar fotos para verificação de identidade
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const photoUrl = formData.get("photoUrl") as string;
    const selfieUrl = formData.get("selfieUrl") as string;
    const documentUrl = formData.get("documentUrl") as string;
    const documentType = formData.get("documentType") as string;

    if (!photoUrl || !selfieUrl) {
      return NextResponse.json(
        { error: "Foto do rosto e selfie são obrigatórias" },
        { status: 400 }
      );
    }

    // Buscar verificação existente
    let verification = await prisma.userVerification.findUnique({
      where: { userId: session.user.id },
    });

    if (!verification) {
      verification = await prisma.userVerification.create({
        data: {
          userId: session.user.id,
          isVerified: false,
          verificationStatus: "PENDING",
          attempts: 1,
          photoUrl,
          selfieUrl,
          documentUrl,
          documentType: (documentType as any) || undefined,
          lastAttemptAt: new Date(),
        },
      });
    } else {
      // Atualizar tentativa
      verification = await prisma.userVerification.update({
        where: { userId: session.user.id },
        data: {
          photoUrl,
          selfieUrl,
          documentUrl,
          documentType: (documentType as any) || undefined,
          verificationStatus: "PENDING",
          attempts: verification.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });
    }

    // TODO: Aqui você poderia chamar um serviço de IA/liveness detection
    // Por exemplo: AWS Rekognition, Google Vision API, ou Veriff API

    return NextResponse.json({
      message: "Fotos enviadas com sucesso! Análise em andamento...",
      verificationId: verification.id,
      status: "PENDING",
      attempts: verification.attempts,
      maxAttempts: verification.maxAttempts,
    });
  } catch (error) {
    console.error("Erro ao enviar fotos:", error);
    return NextResponse.json(
      { error: "Erro ao enviar fotos de verificação" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verification/submit
 * [ADMIN] Listar verificações pendentes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    const pendingVerifications = await prisma.userVerification.findMany({
      where: { verificationStatus: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { lastAttemptAt: "asc" },
      take: 50,
    });

    return NextResponse.json(pendingVerifications);
  } catch (error) {
    console.error("Erro ao buscar verificações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar verificações" },
      { status: 500 }
    );
  }
}
