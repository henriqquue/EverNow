import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { createCheckoutSession, PaymentType } from "@/lib/payment-gateway";
import { BillingInterval } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, type, interval } = body;

    if (!itemId || !type) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    // Determine URLs based on referer or env
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      itemId,
      type: type as PaymentType,
      interval: interval as BillingInterval,
      successUrl: `${baseUrl}/app/payment/success?sessionId={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/app/payment/cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
