import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const paymentSession = await prisma.paymentSession.findUnique({
      where: { id: params.id },
    });

    if (!paymentSession) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }

    if (paymentSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Fetch item details
    let itemDetails = null;
    if (paymentSession.type === "SUBSCRIPTION") {
      itemDetails = await prisma.plan.findUnique({
        where: { id: paymentSession.itemId },
        include: { planIntervals: true }
      });
    } else {
      itemDetails = await prisma.consumableItem.findUnique({
        where: { id: paymentSession.itemId }
      });
    }

    return NextResponse.json({
      session: paymentSession,
      item: itemDetails
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
