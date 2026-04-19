import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

// GET plan feature limits
export async function GET(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await params;

    const featureLimits = await prisma.featureLimit.findMany({
      where: { planId },
      include: {
        feature: {
          include: { module: true }
        }
      },
      orderBy: { feature: { module: { order: "asc" } } }
    });

    return NextResponse.json(featureLimits);
  } catch (error) {
    console.error("Error fetching feature limits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST update feature limits
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
    const { features } = body;

    if (!Array.isArray(features)) {
      return NextResponse.json({ error: "features deve ser um array" }, { status: 400 });
    }

    // Upsert each feature limit
    for (const f of features) {
      await prisma.featureLimit.upsert({
        where: {
          planId_featureId: {
            planId,
            featureId: f.featureId
          }
        },
        update: {
          limitValue: f.limitValue,
          unlimited: f.unlimited || false,
          enabled: f.enabled !== false,
          isVisibleLocked: f.isVisibleLocked || false,
          blockMessage: f.blockMessage || null,
          ctaText: f.ctaText || null,
          upgradeUrl: f.upgradeUrl || null,
          limitMode: f.limitMode || "HARD",
          warningThreshold: f.warningThreshold ?? null,
          showInComparison: f.showInComparison !== false,
          comparisonLabel: f.comparisonLabel || null,
          comparisonOrder: f.comparisonOrder || 0,
        },
        create: {
          planId,
          featureId: f.featureId,
          limitValue: f.limitValue || 0,
          unlimited: f.unlimited || false,
          enabled: f.enabled !== false,
          isVisibleLocked: f.isVisibleLocked || false,
          blockMessage: f.blockMessage || null,
          ctaText: f.ctaText || null,
          upgradeUrl: f.upgradeUrl || null,
          limitMode: f.limitMode || "HARD",
          warningThreshold: f.warningThreshold ?? null,
          showInComparison: f.showInComparison !== false,
          comparisonLabel: f.comparisonLabel || null,
          comparisonOrder: f.comparisonOrder || 0,
        }
      });
    }

    const updatedFeatures = await prisma.featureLimit.findMany({
      where: { planId },
      include: { feature: { include: { module: true } } }
    });

    return NextResponse.json(updatedFeatures);
  } catch (error) {
    console.error("Error updating feature limits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
