import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { reactivateSubscription } from "@/lib/subscription-service";
import { BillingInterval } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { interval } = body;

    // Validar interval se fornecido
    if (interval) {
      const validIntervals: BillingInterval[] = [
        "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"
      ];
      if (!validIntervals.includes(interval)) {
        return NextResponse.json({ error: "Intervalo inválido" }, { status: 400 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const result = await reactivateSubscription(user.id, interval as BillingInterval | undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      action: result.action,
      message: "Assinatura reativada com sucesso!",
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
