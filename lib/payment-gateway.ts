import prisma from "@/lib/db";
import { BillingInterval } from "@prisma/client";
import { upgradePlan } from "@/lib/subscription-service";

export type PaymentType = "SUBSCRIPTION" | "CONSUMABLE";

export interface CheckoutSessionOptions {
  userId: string;
  itemId: string; // planId or consumableId
  type: PaymentType;
  interval?: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(options: CheckoutSessionOptions) {
  // In a real implementation, this would call Stripe/MercadoPago API
  // and create a session on their server.
  
  // Here we'll create a record in our DB to track this pending transaction
  const session = await prisma.paymentSession.create({
    data: {
      userId: options.userId,
      itemId: options.itemId,
      type: options.type,
      interval: options.interval || "MONTHLY",
      status: "PENDING",
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
      metadata: {
        createdAt: new Date().toISOString(),
      }
    }
  });

  // Return a mock URL that leads to our mock payment processing page
  // In a real app, this would be https://checkout.stripe.com/...
  return {
    id: session.id,
    url: `/app/payment/mock-checkout?sessionId=${session.id}`
  };
}

export async function processPayment(sessionId: string, paymentMethodId?: string) {
  const session = await prisma.paymentSession.findUnique({
    where: { id: sessionId },
    include: { user: true }
  });

  if (!session || session.status !== "PENDING") {
    throw new Error("Sessão inválida ou já processada");
  }

  // Update session status
  await prisma.paymentSession.update({
    where: { id: sessionId },
    data: { 
      status: "COMPLETED", 
      paidAt: new Date(),
      metadata: {
        ...(session.metadata as object || {}),
        paymentMethodId,
        completedAt: new Date().toISOString()
      }
    }
  });

  if (session.type === "SUBSCRIPTION") {
    // Process subscription upgrade
    const result = await upgradePlan(session.userId, session.itemId, session.interval as BillingInterval);
    if (!result.success) {
      throw new Error(result.error || "Erro ao processar assinatura");
    }
  } else if (session.type === "CONSUMABLE") {
    // Process consumable item
    const item = await prisma.consumableItem.findUnique({ where: { id: session.itemId } });
    if (!item) throw new Error("Item não encontrado");

    // Create a purchase record
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.userId,
        itemId: session.itemId,
        amount: item.price,
        status: "COMPLETED",
        paymentMethod: "MOCK_GATEWAY",
        transactionId: sessionId,
      }
    });

    // If it's a boost with duration, activate it immediately
    if (item.durationDays) {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + item.durationDays);

      await prisma.activeBoost.create({
        data: {
          userId: session.userId,
          itemId: session.itemId,
          purchaseId: purchase.id,
          isActive: true,
          activatedAt: now,
          expiresAt: expiresAt,
        }
      });
    }
  }

  return { success: true };
}
