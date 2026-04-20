export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { getSubscriptionHistory } from "@/lib/subscription-service";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const result = await getSubscriptionHistory(user.id, { limit, offset });

    // Formatar histórico para exibição
    const formattedHistory = result.history.map((item) => {
      const metadata = item.metadata as Record<string, unknown> || {};
      
      return {
        id: item.id,
        action: item.action,
        actionLabel: getActionLabel(item.action),
        plan: {
          id: item.plan.id,
          name: item.plan.name,
          slug: item.plan.slug,
        },
        fromPlanId: item.fromPlanId,
        toPlanId: item.toPlanId,
        amount: item.amount,
        billingInterval: item.billingInterval,
        intervalLabel: getIntervalLabel(item.billingInterval),
        fromStatus: metadata.fromStatus,
        toStatus: metadata.toStatus,
        reason: metadata.reason,
        createdAt: item.createdAt,
      };
    });

    return NextResponse.json({
      history: formattedHistory,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    SUBSCRIBE: "Assinatura",
    UPGRADE: "Upgrade",
    DOWNGRADE: "Downgrade",
    CANCEL: "Cancelamento",
    REACTIVATE: "Reativação",
    RENEW: "Renovação",
    EXPIRE: "Expiração",
    TRIAL_START: "Início do Trial",
    TRIAL_END: "Fim do Trial",
  };
  return labels[action] || action;
}

function getIntervalLabel(interval: string | null): string {
  if (!interval) return "";
  const labels: Record<string, string> = {
    DAILY: "Diário",
    WEEKLY: "Semanal",
    BIWEEKLY: "Quinzenal",
    MONTHLY: "Mensal",
    QUARTERLY: "Trimestral",
    SEMIANNUAL: "Semestral",
    YEARLY: "Anual",
  };
  return labels[interval] || interval;
}

