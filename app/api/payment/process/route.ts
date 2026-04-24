import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { processPayment } from "@/lib/payment-gateway";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, paymentMethodId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID é obrigatório" }, { status: 400 });
    }

    const result = await processPayment(sessionId, paymentMethodId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
