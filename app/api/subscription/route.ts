import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { trackEvent } from "@/lib/analytics";

// GET current user's subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscription: {
          include: {
            plan: {
              include: {
                planIntervals: true,
                featureLimits: {
                  include: { feature: true }
                }
              }
            }
          }
        },
        plan: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      subscription: user.subscription,
      plan: user.plan
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST subscribe to a plan
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, interval = "MONTHLY" } = body;

    if (!planId) {
      return NextResponse.json({ error: "planId é obrigatório" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        planIntervals: {
          where: { interval: interval as "MONTHLY" | "YEARLY", isActive: true }
        }
      }
    });

    if (!plan || plan.status !== "ACTIVE") {
      return NextResponse.json({ error: "Plano não encontrado ou inativo" }, { status: 404 });
    }

    const planInterval = plan.planIntervals[0];
    const amount = planInterval?.discountPrice || planInterval?.price || plan.discountPrice || plan.price;

    // Calculate expiration date
    const now = new Date();
    let expiresAt = new Date(now);
    switch (interval) {
      case "YEARLY":
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        break;
      case "SEMIANNUAL":
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        break;
      case "QUARTERLY":
        expiresAt.setMonth(expiresAt.getMonth() + 3);
        break;
      case "MONTHLY":
      default:
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        break;
    }

    // Determine action type
    const oldPlanId = user.planId;
    let action = "SUBSCRIBE";
    if (user.subscription) {
      const oldPlan = await prisma.plan.findUnique({ where: { id: oldPlanId || "" } });
      if (oldPlan && oldPlan.price < plan.price) {
        action = "UPGRADE";
      } else if (oldPlan && oldPlan.price > plan.price) {
        action = "DOWNGRADE";
      }
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        planId,
        status: "ACTIVE",
        billingInterval: interval as "MONTHLY" | "YEARLY",
        amount,
        startedAt: now,
        expiresAt,
        canceledAt: null
      },
      create: {
        userId: user.id,
        planId,
        status: "ACTIVE",
        billingInterval: interval as "MONTHLY" | "YEARLY",
        amount,
        startedAt: now,
        expiresAt
      },
      include: { plan: true }
    });

    // Update user's plan
    await prisma.user.update({
      where: { id: user.id },
      data: { planId }
    });

    // Record history
    await prisma.subscriptionHistory.create({
      data: {
        userId: user.id,
        planId,
        action,
        fromPlanId: oldPlanId,
        toPlanId: planId,
        amount,
        billingInterval: interval as "MONTHLY" | "YEARLY"
      }
    });

    // Track event
    await trackEvent({
      userId: user.id, 
      eventType: "subscription_created",
      eventData: {
        planId,
        planName: plan.name,
        interval,
        amount,
        action
      }
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE cancel subscription
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: { include: { plan: true } } }
    });

    if (!user || !user.subscription) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });
    }

    // Cancel subscription (keeps active until expiration)
    await prisma.subscription.update({
      where: { id: user.subscription.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date()
      }
    });

    // Record history
    await prisma.subscriptionHistory.create({
      data: {
        userId: user.id,
        planId: user.subscription.planId,
        action: "CANCEL",
        amount: user.subscription.amount,
        billingInterval: user.subscription.billingInterval
      }
    });

    // Track event
    await trackEvent({
      userId: user.id, 
      eventType: "subscription_created", // Using subscription_created since there's no specific canceled event type
      eventData: {
        planId: user.subscription.planId,
        planName: user.subscription.plan.name,
        action: "CANCELED"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
