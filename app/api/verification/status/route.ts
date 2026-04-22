import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * GET /api/verification/status
 * Status de verificação do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar verificação do usuário
    const verification = await prisma.userVerification.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        isVerified: true,
        verificationStatus: true,
        attempts: true,
        maxAttempts: true,
        rejectionReason: true,
        approvedAt: true,
        lastAttemptAt: true,
        profileBadge: true,
        visibilityBoost: true,
        trustScoreBoost: true,
      },
    });

    // Se não existe, criar registro vazio
    if (!verification) {
      return NextResponse.json({
        isVerified: false,
        verificationStatus: "UNVERIFIED",
        attempts: 0,
        maxAttempts: 3,
        canAttempt: true,
        message: "Nenhuma verificação iniciada",
      });
    }

    return NextResponse.json({
      ...verification,
      canAttempt: verification.attempts < verification.maxAttempts,
    });
  } catch (error) {
    console.error("Erro ao buscar status:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status de verificação" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/verification/status
 * Iniciar verificação de identidade
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

    // Verificar se já existe
    let verification = await prisma.userVerification.findUnique({
      where: { userId: session.user.id },
    });

    if (!verification) {
      // Criar novo registro de verificação
      verification = await prisma.userVerification.create({
        data: {
          userId: session.user.id,
          isVerified: false,
          verificationStatus: "PENDING",
          attempts: 0,
        },
      });
    } else if (
      verification.verificationStatus === "VERIFIED" &&
      verification.isVerified
    ) {
      return NextResponse.json(
        { error: "Usuário já está verificado" },
        { status: 400 }
      );
    } else if (verification.attempts >= verification.maxAttempts) {
      return NextResponse.json(
        { error: "Limite de tentativas atingido. Tente novamente mais tarde." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verificationId: verification.id,
      userId: session.user.id,
      attempts: verification.attempts,
      maxAttempts: verification.maxAttempts,
      message: "Verificação iniciada. Envie suas fotos.",
    });
  } catch (error) {
    console.error("Erro ao iniciar verificação:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar verificação" },
      { status: 500 }
    );
  }
}
