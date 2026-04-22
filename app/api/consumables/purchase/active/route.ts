import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/**
 * GET /api/consumables/purchase/active
 * Retorna os boosts ativos do usuário logado
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

    const now = new Date();

    const activeBoosts = await prisma.activeBoost.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        expiresAt: {
          gt: now
        }
      },
      include: {
        item: true
      }
    });

    return NextResponse.json(activeBoosts);
  } catch (error) {
    console.error("Erro ao buscar boosts ativos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar boosts ativos" },
      { status: 500 }
    );
  }
}
