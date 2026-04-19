import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { cancelSubscription } from "@/lib/subscription-service";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const result = await cancelSubscription(user.id, reason);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      message: "Assinatura cancelada. Você continua com acesso até o fim do período atual.",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
