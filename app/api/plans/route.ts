export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET public plans listing
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forLanding = searchParams.get("landing") === "true";
    const forComparison = searchParams.get("comparison") === "true";

    const plans = await prisma.plan.findMany({
      where: {
        status: "ACTIVE",
        ...(forLanding && { showOnLanding: true }),
        ...(forComparison && { showInComparison: true })
      },
      include: {
        planIntervals: {
          where: { isActive: true },
          orderBy: { interval: "asc" }
        },
        featureLimits: {
          where: { enabled: true },
          include: {
            feature: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                type: true,
                showInComparison: true,
                comparisonOrder: true,
                comparisonLabel: true
              }
            }
          }
        }
      },
      orderBy: { order: "asc" }
    });

    // Transform data for frontend
    const transformedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      shortDescription: plan.shortDescription,
      longDescription: plan.longDescription,
      price: plan.price,
      discountPrice: plan.discountPrice,
      badge: plan.badge,
      highlightColor: plan.highlightColor,
      popular: plan.popular,
      isHighlighted: plan.isHighlighted,
      hasTrial: plan.hasTrial,
      trialDays: plan.trialDays,
      intervals: plan.planIntervals.map(i => ({
        interval: i.interval,
        price: i.price,
        discountPrice: i.discountPrice,
        discountPercent: i.discountPercent
      })),
      features: plan.featureLimits
        .filter(fl => fl.feature.showInComparison)
        .sort((a, b) => (a.feature.comparisonOrder || 0) - (b.feature.comparisonOrder || 0))
        .map(fl => ({
          name: fl.feature.comparisonLabel || fl.feature.name,
          slug: fl.feature.slug,
          type: fl.feature.type,
          value: fl.unlimited ? -1 : fl.limitValue,
          unlimited: fl.unlimited,
          enabled: fl.enabled
        }))
    }));

    return NextResponse.json(transformedPlans);
  } catch (error) {
    console.error("Error fetching public plans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

