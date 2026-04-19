import prisma from "@/lib/db";
import {
  checkFeatureEntitlement,
  getUserEntitlements,
  type FeatureAccess as EntitlementFeatureAccess,
} from "@/lib/entitlement-service";

// Re-export the old interface for backward compatibility
export interface FeatureAccess {
  allowed: boolean;
  unlimited: boolean;
  limit: number | null;
  remaining: number | null;
  reason?: "feature_disabled" | "limit_exceeded";
  requiredPlan?: string;
  requiredPlanId?: string;
  blockMessage?: string;
  ctaText?: string;
}

/**
 * Check feature access for a user.
 * Now delegates to the central entitlement service.
 * @param userId - The user's ID
 * @param featureSlug - The feature slug to check
 * @param currentUsage - Deprecated: usage is now tracked internally
 */
export async function checkFeatureAccess(
  userId: string,
  featureSlug: string,
  currentUsage: number = 0
): Promise<FeatureAccess> {
  const access = await checkFeatureEntitlement(userId, featureSlug);

  return {
    allowed: access.allowed,
    unlimited: access.unlimited,
    limit: access.limit,
    remaining: access.remaining,
    reason: access.reason === "limit_exceeded" ? "limit_exceeded" : access.reason === "feature_disabled" ? "feature_disabled" : access.allowed ? undefined : "feature_disabled",
    requiredPlan: access.requiredPlan,
    requiredPlanId: access.requiredPlanId,
    blockMessage: access.blockMessage,
    ctaText: access.ctaText,
  };
}

/**
 * Get all plan features for a user.
 * Now delegates to the central entitlement service.
 */
export async function getUserPlanFeatures(userId: string) {
  const entitlements = await getUserEntitlements(userId);

  if (!entitlements.context.planId) {
    return null;
  }

  // Fetch the plan for backward compatibility
  const plan = await prisma.plan.findUnique({
    where: { id: entitlements.context.planId },
  });

  if (!plan) return null;

  return {
    plan,
    features: entitlements.features.map((f) => ({
      slug: f.slug,
      name: f.name,
      module: f.moduleName,
      enabled: f.enabled,
      unlimited: f.unlimited,
      limit: f.limit,
      isVisibleLocked: f.isVisibleLocked,
    })),
    modules: entitlements.modules.map((m) => ({
      slug: m.slug,
      name: m.name,
      enabled: m.isEnabled,
      isVisibleLocked: m.isVisibleLocked,
    })),
  };
}
