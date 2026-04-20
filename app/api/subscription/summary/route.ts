export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { getSubscriptionSummary } from "@/lib/subscription-service";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const summary = await getSubscriptionSummary(user.id);

    if (!summary) {
      return NextResponse.json({ error: "Dados não encontrados" }, { status: 404 });
    }

    // Adicionar labels de status
    const statusLabels: Record<string, string> = {
      ACTIVE: "Ativa",
      CANCELED: "Cancelada",
      EXPIRED: "Expirada",
      PENDING: "Pendente",
      TRIAL: "Período de teste",
    };

    const intervalLabels: Record<string, string> = {
      DAILY: "Diário",
      WEEKLY: "Semanal",
      BIWEEKLY: "Quinzenal",
      MONTHLY: "Mensal",
      QUARTERLY: "Trimestral",
      SEMIANNUAL: "Semestral",
      YEARLY: "Anual",
    };

    return NextResponse.json({
      ...summary,
      subscription: summary.subscription
        ? {
            ...summary.subscription,
            statusLabel: statusLabels[summary.subscription.status] || summary.subscription.status,
            intervalLabel: intervalLabels[summary.subscription.billingInterval] || summary.subscription.billingInterval,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching subscription summary:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

