import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkFeatureEntitlement } from "@/lib/entitlement-service";

export const dynamic = "force-dynamic";

// POST /api/features/check - Check if user has access to a feature
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { featureSlug } = body;

    if (!featureSlug) {
      return NextResponse.json({ error: "featureSlug é obrigatório" }, { status: 400 });
    }

    const access = await checkFeatureEntitlement(session.user.id, featureSlug);

    return NextResponse.json({
      allowed: access.allowed,
      enabled: access.enabled,
      unlimited: access.unlimited,
      limit: access.limit,
      currentUsage: access.currentUsage,
      remaining: access.remaining,
      isWarning: access.isWarning,
      warningThreshold: access.warningThreshold,
      limitMode: access.limitMode,
      isVisibleLocked: access.isVisibleLocked,
      reason: access.reason,
      requiredPlan: access.requiredPlan,
      requiredPlanId: access.requiredPlanId,
      blockMessage: access.blockMessage,
      ctaText: access.ctaText,
      upgradeUrl: access.upgradeUrl,
    });
  } catch (error) {
    console.error("Error checking feature access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/features/check?featureSlug=xxx - Lightweight GET variant
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const featureSlug = searchParams.get("featureSlug");

    if (!featureSlug) {
      return NextResponse.json({ error: "featureSlug é obrigatório" }, { status: 400 });
    }

    const access = await checkFeatureEntitlement(session.user.id, featureSlug);

    return NextResponse.json({
      allowed: access.allowed,
      unlimited: access.unlimited,
      limit: access.limit,
      remaining: access.remaining,
      isWarning: access.isWarning,
      reason: access.reason,
      blockMessage: access.blockMessage,
      ctaText: access.ctaText,
    });
  } catch (error) {
    console.error("Error checking feature access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
