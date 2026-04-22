import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

/**
 * POST /api/consumables/purchase
 * Compra um consumível (simula pagamento)
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

    const { itemId, paymentMethod = "card" } = await request.json();

    // Validar item
    const item = await prisma.consumableItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Consumível não encontrado ou inativo" },
        { status: 404 }
      );
    }

    // TODO: Implementar integração com gateway de pagamento (Stripe, Mercado Pago, etc)
    // Por enquanto, simulamos um pagamento bem-sucedido
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.user.id,
        itemId: item.id,
        quantity: 1,
        amount: item.price,
        currency: item.currency,
        status: "COMPLETED",
        paymentMethod,
        transactionId: `TRX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: item.durationDays
          ? new Date(Date.now() + item.durationDays * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    // Se tem duração, criar boost ativo
    if (item.durationDays) {
      const activeBoost = await prisma.activeBoost.create({
        data: {
          userId: session.user.id,
          itemId: item.id,
          purchaseId: purchase.id,
          expiresAt: new Date(Date.now() + item.durationDays * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });

      return NextResponse.json({
        purchase,
        activeBoost,
        message: `${item.name} ativado com sucesso!`,
      });
    }

    return NextResponse.json({
      purchase,
      message: `${item.name} adquirido com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao processar compra:", error);
    return NextResponse.json(
      { error: "Erro ao processar compra" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consumables/purchase/history
 * Histórico de compras do usuário
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

    const purchases = await prisma.purchase.findMany({
      where: { userId: session.user.id },
      include: { item: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}
