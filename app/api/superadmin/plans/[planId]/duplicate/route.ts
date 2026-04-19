import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// POST duplicate plan
export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await params;
    const body = await req.json();
    const { name, slug } = body;

    // Get original plan with all relations
    const originalPlan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        planIntervals: true,
        planModules: true,
        featureLimits: true
      }
    });

    if (!originalPlan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    // Check slug uniqueness
    const newSlug = slug || `${originalPlan.slug}-copy`;
    const existing = await prisma.plan.findUnique({ where: { slug: newSlug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 400 });
    }

    // Create duplicated plan
    const duplicatedPlan = await prisma.plan.create({
      data: {
        name: name || `${originalPlan.name} (Cópia)`,
        slug: newSlug,
        shortDescription: originalPlan.shortDescription,
        longDescription: originalPlan.longDescription,
        price: originalPlan.price,
        discountPrice: originalPlan.discountPrice,
        badge: originalPlan.badge,
        highlightColor: originalPlan.highlightColor,
        status: "INACTIVE", // Start as inactive
        features: originalPlan.features as object || {},
        limits: originalPlan.limits as object || {},
        order: originalPlan.order + 1,
        popular: false,
        isHighlighted: false,
        showOnLanding: false,
        showInComparison: originalPlan.showInComparison,
        hasTrial: originalPlan.hasTrial,
        trialDays: originalPlan.trialDays,
        planIntervals: {
          create: originalPlan.planIntervals.map(interval => ({
            interval: interval.interval,
            price: interval.price,
            discountPrice: interval.discountPrice,
            discountPercent: interval.discountPercent,
            isActive: interval.isActive
          }))
        },
        planModules: {
          create: originalPlan.planModules.map(pm => ({
            moduleId: pm.moduleId,
            isEnabled: pm.isEnabled,
            isVisibleLocked: pm.isVisibleLocked,
            blockMessage: pm.blockMessage,
            ctaText: pm.ctaText
          }))
        },
        featureLimits: {
          create: originalPlan.featureLimits.map(fl => ({
            featureId: fl.featureId,
            limitValue: fl.limitValue,
            unlimited: fl.unlimited,
            enabled: fl.enabled,
            isVisibleLocked: fl.isVisibleLocked,
            blockMessage: fl.blockMessage,
            ctaText: fl.ctaText
          }))
        }
      },
      include: {
        planIntervals: true,
        planModules: { include: { module: true } },
        featureLimits: { include: { feature: true } }
      }
    });

    return NextResponse.json(duplicatedPlan, { status: 201 });
  } catch (error) {
    console.error("Error duplicating plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
