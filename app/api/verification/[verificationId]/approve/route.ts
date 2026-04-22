import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * PUT /api/verification/[verificationId]/approve
 * [ADMIN] Aprovar verificação de identidade
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { verificationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    const { action, rejectionReason } = await request.json();

    const verification = await prisma.userVerification.findUnique({
      where: { id: params.verificationId },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verificação não encontrada" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // Aprovar
      const updatedVerification = await prisma.userVerification.update({
        where: { id: params.verificationId },
        data: {
          isVerified: true,
          verificationStatus: "VERIFIED",
          approvedAt: new Date(),
          approvedById: session.user.id,
          profileBadge: "verified",
        },
      });

      // Aumentar trust score do usuário
      const user = await prisma.user.findUnique({
        where: { id: verification.userId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: verification.userId },
          data: {
            trustScore: Math.min(100, (user.trustScore || 50) + 10),
          },
        });
      }

      return NextResponse.json({
        message: "Verificação aprovada com sucesso!",
        verification: updatedVerification,
      });
    } else if (action === "reject") {
      // Rejeitar
      const updatedVerification = await prisma.userVerification.update({
        where: { id: params.verificationId },
        data: {
          isVerified: false,
          verificationStatus: "REJECTED",
          rejectedAt: new Date(),
          rejectionReason,
          approvedById: session.user.id,
        },
      });

      return NextResponse.json({
        message: "Verificação rejeitada. Usuário pode tentar novamente.",
        verification: updatedVerification,
      });
    }

    return NextResponse.json(
      { error: "Ação inválida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao processar verificação:", error);
    return NextResponse.json(
      { error: "Erro ao processar verificação" },
      { status: 500 }
    );
  }
}
