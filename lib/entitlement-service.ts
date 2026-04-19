import prisma from "@/lib/db";
import type { ResetPeriod, LimitMode, SubscriptionStatus, BillingInterval } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export interface EntitlementContext {
  userId: string;
  planId: string | null;
  planSlug: string | null;
  planStatus: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  billingInterval: BillingInterval | null;
  isTrial: boolean;
  trialEndsAt: Date | null;
  subscriptionExpiresAt: Date | null;
  isSubscriptionActive: boolean;
}

export interface ModuleAccess {
  moduleId: string;
  moduleSlug: string;
  moduleName: string;
  allowed: boolean;
  isVisibleLocked: boolean;
  blockMessage: string | null;
  ctaText: string | null;
}

export interface FeatureAccess {
  featureId: string;
  featureSlug: string;
  featureName: string;
  allowed: boolean;
  enabled: boolean;
  unlimited: boolean;
  limit: number | null;
  currentUsage: number;
  remaining: number | null;
  warningThreshold: number | null;
  isWarning: boolean;
  limitMode: LimitMode;
  resetPeriod: ResetPeriod;
  isVisibleLocked: boolean;
  reason?: "feature_disabled" | "module_disabled" | "limit_exceeded" | "subscription_inactive" | "plan_missing";
  requiredPlan?: string;
  requiredPlanId?: string;
  blockMessage?: string;
  ctaText?: string;
  upgradeUrl?: string;
}

export interface FeatureConsumeResult {
  success: boolean;
  newUsage: number;
  remaining: number | null;
  isWarning: boolean;
  error?: string;
}

// ============================================
// PERIOD CALCULATION
// ============================================

export function getPeriodBounds(resetPeriod: ResetPeriod, now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now);
  const end = new Date(now);

  switch (resetPeriod) {
    case "DAILY":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "WEEKLY": {
      const dayOfWeek = start.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(start.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "MONTHLY":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "NEVER":
      // epoch to far future
      start.setTime(0);
      end.setFullYear(2099, 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

// ============================================
// CORE: RESOLVE ENTITLEMENT CONTEXT
// ============================================

export async function resolveEntitlementContext(userId: string): Promise<EntitlementContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      planId: true,
      plan: { select: { slug: true, status: true } },
      subscription: {
        select: {
          status: true,
          billingInterval: true,
          isTrial: true,
          trialEndsAt: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!user) {
    return {
      userId,
      planId: null,
      planSlug: null,
      planStatus: null,
      subscriptionStatus: null,
      billingInterval: null,
      isTrial: false,
      trialEndsAt: null,
      subscriptionExpiresAt: null,
      isSubscriptionActive: false,
    };
  }

  const sub = user.subscription;
  const now = new Date();

  // Determine if subscription is effectively active
  let isSubscriptionActive = false;
  if (sub) {
    if (sub.status === "ACTIVE") {
      isSubscriptionActive = !sub.expiresAt || sub.expiresAt > now;
    } else if (sub.status === "TRIAL") {
      isSubscriptionActive = !sub.trialEndsAt || sub.trialEndsAt > now;
    }
  }

  // Free plans are always "active"
  if (user.plan?.slug === "gratuito" && user.planId) {
    isSubscriptionActive = true;
  }

  return {
    userId,
    planId: user.planId,
    planSlug: user.plan?.slug || null,
    planStatus: user.plan?.status || null,
    subscriptionStatus: sub?.status || null,
    billingInterval: sub?.billingInterval || null,
    isTrial: sub?.isTrial || false,
    trialEndsAt: sub?.trialEndsAt || null,
    subscriptionExpiresAt: sub?.expiresAt || null,
    isSubscriptionActive,
  };
}

// ============================================
// CORE: CHECK MODULE ACCESS
// ============================================

export async function checkModuleAccess(
  userId: string,
  moduleSlug: string
): Promise<ModuleAccess> {
  const ctx = await resolveEntitlementContext(userId);

  // Find the module
  const mod = await prisma.module.findUnique({
    where: { slug: moduleSlug },
    select: { id: true, slug: true, name: true, status: true },
  });

  if (!mod || mod.status !== "ACTIVE") {
    return {
      moduleId: mod?.id || "",
      moduleSlug,
      moduleName: mod?.name || moduleSlug,
      allowed: false,
      isVisibleLocked: false,
      blockMessage: "Módulo não disponível",
      ctaText: null,
    };
  }

  if (!ctx.planId || !ctx.isSubscriptionActive) {
    return {
      moduleId: mod.id,
      moduleSlug,
      moduleName: mod.name,
      allowed: false,
      isVisibleLocked: false,
      blockMessage: "Você precisa de um plano ativo para acessar este módulo",
      ctaText: "Escolher Plano",
    };
  }

  // Check plan-module assignment
  const planModule = await prisma.planModule.findUnique({
    where: {
      planId_moduleId: { planId: ctx.planId, moduleId: mod.id },
    },
  });

  // If no explicit plan-module record, module is accessible by default
  if (!planModule) {
    return {
      moduleId: mod.id,
      moduleSlug,
      moduleName: mod.name,
      allowed: true,
      isVisibleLocked: false,
      blockMessage: null,
      ctaText: null,
    };
  }

  return {
    moduleId: mod.id,
    moduleSlug,
    moduleName: mod.name,
    allowed: planModule.isEnabled && !planModule.isVisibleLocked,
    isVisibleLocked: planModule.isVisibleLocked,
    blockMessage: planModule.blockMessage || (planModule.isVisibleLocked ? `Desbloqueie com um plano superior` : null),
    ctaText: planModule.ctaText || (planModule.isVisibleLocked ? "Fazer Upgrade" : null),
  };
}

// ============================================
// CORE: CHECK FEATURE ACCESS (with usage)
// ============================================

export async function checkFeatureEntitlement(
  userId: string,
  featureSlug: string
): Promise<FeatureAccess> {
  const ctx = await resolveEntitlementContext(userId);

  // Find the feature
  const feature = await prisma.feature.findUnique({
    where: { slug: featureSlug },
    include: { module: true },
  });

  const baseResult: Omit<FeatureAccess, "allowed" | "reason"> = {
    featureId: feature?.id || "",
    featureSlug,
    featureName: feature?.name || featureSlug,
    enabled: false,
    unlimited: false,
    limit: null,
    currentUsage: 0,
    remaining: null,
    warningThreshold: null,
    isWarning: false,
    limitMode: "HARD",
    resetPeriod: feature?.resetPeriod || "NEVER",
    isVisibleLocked: false,
  };

  if (!feature) {
    return { ...baseResult, allowed: false, reason: "feature_disabled" };
  }

  // Check if plan is missing or subscription inactive
  if (!ctx.planId) {
    return {
      ...baseResult,
      allowed: false,
      reason: "plan_missing",
      blockMessage: "Você precisa de um plano para usar esta funcionalidade",
      ctaText: "Escolher Plano",
    };
  }

  if (!ctx.isSubscriptionActive && ctx.planSlug !== "gratuito") {
    return {
      ...baseResult,
      allowed: false,
      reason: "subscription_inactive",
      blockMessage: "Sua assinatura não está ativa",
      ctaText: "Reativar Assinatura",
    };
  }

  // Check module access
  if (feature.module.status !== "ACTIVE") {
    return {
      ...baseResult,
      allowed: false,
      reason: "module_disabled",
      blockMessage: "Este módulo não está disponível",
    };
  }

  // Check plan-module assignment
  const planModule = await prisma.planModule.findUnique({
    where: {
      planId_moduleId: { planId: ctx.planId, moduleId: feature.moduleId },
    },
  });

  if (planModule && (!planModule.isEnabled || planModule.isVisibleLocked)) {
    return {
      ...baseResult,
      allowed: false,
      isVisibleLocked: planModule.isVisibleLocked,
      reason: "module_disabled",
      blockMessage: planModule.blockMessage || "Módulo não disponível no seu plano",
      ctaText: planModule.ctaText || "Fazer Upgrade",
      ...(await findRequiredPlanForFeature(featureSlug)),
    };
  }

  // Check feature limit for this plan
  const featureLimit = await prisma.featureLimit.findUnique({
    where: {
      planId_featureId: { planId: ctx.planId, featureId: feature.id },
    },
  });

  // No explicit feature limit record = feature allowed with defaults
  if (!featureLimit) {
    return {
      ...baseResult,
      allowed: true,
      enabled: true,
    };
  }

  // Feature disabled for this plan
  if (!featureLimit.enabled) {
    const requiredInfo = await findRequiredPlanForFeature(featureSlug);
    return {
      ...baseResult,
      allowed: false,
      enabled: false,
      isVisibleLocked: featureLimit.isVisibleLocked,
      reason: "feature_disabled",
      blockMessage: featureLimit.blockMessage || `Disponível no plano ${requiredInfo.requiredPlan || "Premium"}`,
      ctaText: featureLimit.ctaText || "Fazer Upgrade",
      upgradeUrl: featureLimit.upgradeUrl || undefined,
      ...requiredInfo,
    };
  }

  // Feature is BOOLEAN or UNLIMITED type
  if (feature.type === "BOOLEAN" || feature.type === "UNLIMITED" || featureLimit.unlimited || featureLimit.isUnlimited) {
    return {
      ...baseResult,
      allowed: true,
      enabled: true,
      unlimited: true,
    };
  }

  // Feature is LIMIT type — check usage
  const limit = featureLimit.limitValue || 0;
  const resetPeriod = feature.resetPeriod || "NEVER";
  const { start: periodStart } = getPeriodBounds(resetPeriod);

  // Get current usage count
  const usage = await prisma.featureUsage.findUnique({
    where: {
      userId_featureId_periodStart: {
        userId,
        featureId: feature.id,
        periodStart,
      },
    },
  });

  const currentUsage = usage?.usageCount || 0;
  const remaining = Math.max(0, limit - currentUsage);
  const warningThreshold = featureLimit.warningThreshold;
  const isWarning = warningThreshold != null && currentUsage >= warningThreshold && remaining > 0;

  if (remaining <= 0 && featureLimit.limitMode === "HARD") {
    const requiredInfo = await findRequiredPlanForFeature(featureSlug);
    return {
      ...baseResult,
      allowed: false,
      enabled: true,
      limit,
      currentUsage,
      remaining: 0,
      warningThreshold,
      isWarning: false,
      limitMode: featureLimit.limitMode,
      reason: "limit_exceeded",
      blockMessage: featureLimit.blockMessage || `Você atingiu o limite de ${limit} para esta funcionalidade`,
      ctaText: featureLimit.ctaText || "Aumentar Limite",
      upgradeUrl: featureLimit.upgradeUrl || undefined,
      ...requiredInfo,
    };
  }

  // Soft limit reached — still allowed but flagged
  const isSoftLimitExceeded = remaining <= 0 && featureLimit.limitMode === "SOFT";

  return {
    ...baseResult,
    allowed: true,
    enabled: true,
    unlimited: false,
    limit,
    currentUsage,
    remaining: Math.max(0, remaining),
    warningThreshold,
    isWarning: isWarning || isSoftLimitExceeded,
    limitMode: featureLimit.limitMode,
  };
}

// ============================================
// CORE: CONSUME FEATURE USAGE
// ============================================

export async function consumeFeatureUsage(
  userId: string,
  featureSlug: string,
  amount: number = 1
): Promise<FeatureConsumeResult> {
  // First check entitlement
  const access = await checkFeatureEntitlement(userId, featureSlug);

  if (!access.allowed) {
    return {
      success: false,
      newUsage: access.currentUsage,
      remaining: access.remaining,
      isWarning: false,
      error: access.blockMessage || "Acesso negado",
    };
  }

  // If unlimited, no tracking needed (but we still track for analytics)
  if (access.unlimited) {
    // Optionally track even unlimited usage for analytics
    return {
      success: true,
      newUsage: access.currentUsage + amount,
      remaining: null,
      isWarning: false,
    };
  }

  // Atomic increment to prevent race conditions
  const feature = await prisma.feature.findUnique({
    where: { slug: featureSlug },
  });

  if (!feature) {
    return { success: false, newUsage: 0, remaining: null, isWarning: false, error: "Feature não encontrada" };
  }

  const resetPeriod = feature.resetPeriod || "NEVER";
  const { start: periodStart, end: periodEnd } = getPeriodBounds(resetPeriod);

  // Use upsert with raw SQL for atomic increment
  const usage = await prisma.featureUsage.upsert({
    where: {
      userId_featureId_periodStart: {
        userId,
        featureId: feature.id,
        periodStart,
      },
    },
    update: {
      usageCount: { increment: amount },
      lastUsedAt: new Date(),
    },
    create: {
      userId,
      featureId: feature.id,
      usageCount: amount,
      periodStart,
      periodEnd,
      lastUsedAt: new Date(),
    },
  });

  const newUsage = usage.usageCount;
  const limit = access.limit || 0;
  const remaining = Math.max(0, limit - newUsage);
  const isWarning = access.warningThreshold != null && newUsage >= access.warningThreshold && remaining > 0;

  return {
    success: true,
    newUsage,
    remaining,
    isWarning,
  };
}

// ============================================
// HELPER: Get current usage for a feature
// ============================================

export async function getFeatureUsage(
  userId: string,
  featureSlug: string
): Promise<number> {
  const feature = await prisma.feature.findUnique({
    where: { slug: featureSlug },
  });

  if (!feature) return 0;

  const resetPeriod = feature.resetPeriod || "NEVER";
  const { start: periodStart } = getPeriodBounds(resetPeriod);

  const usage = await prisma.featureUsage.findUnique({
    where: {
      userId_featureId_periodStart: {
        userId,
        featureId: feature.id,
        periodStart,
      },
    },
  });

  return usage?.usageCount || 0;
}

// ============================================
// HELPER: Find which plan enables a feature
// ============================================

async function findRequiredPlanForFeature(
  featureSlug: string
): Promise<{ requiredPlan?: string; requiredPlanId?: string }> {
  const enabledInPlan = await prisma.featureLimit.findFirst({
    where: {
      feature: { slug: featureSlug },
      enabled: true,
      OR: [{ unlimited: true }, { limitValue: { gt: 0 } }],
      plan: { status: "ACTIVE" },
    },
    include: { plan: true },
    orderBy: { plan: { order: "asc" } },
  });

  if (enabledInPlan) {
    return {
      requiredPlan: enabledInPlan.plan.name,
      requiredPlanId: enabledInPlan.planId,
    };
  }

  return { requiredPlan: "Premium" };
}

// ============================================
// HELPER: Get all entitlements for a user (dashboard/comparison)
// ============================================

export async function getUserEntitlements(userId: string) {
  const ctx = await resolveEntitlementContext(userId);

  if (!ctx.planId) {
    return {
      context: ctx,
      modules: [],
      features: [],
    };
  }

  // Get all modules with plan assignments
  const modules = await prisma.module.findMany({
    where: { status: "ACTIVE" },
    include: {
      planModules: {
        where: { planId: ctx.planId },
      },
    },
    orderBy: { order: "asc" },
  });

  // Get all features with limits for current plan
  const features = await prisma.feature.findMany({
    include: {
      module: true,
      featureLimits: {
        where: { planId: ctx.planId },
      },
    },
    orderBy: [{ module: { order: "asc" } }, { comparisonOrder: "asc" }],
  });

  // Get usage for limit-type features
  const now = new Date();
  const limitFeatureIds = features
    .filter(f => f.type === "LIMIT" && f.featureLimits.length > 0 && !f.featureLimits[0].unlimited)
    .map(f => f.id);

  let usageMap: Record<string, number> = {};
  if (limitFeatureIds.length > 0) {
    const usageRecords = await prisma.featureUsage.findMany({
      where: {
        userId,
        featureId: { in: limitFeatureIds },
      },
      orderBy: { periodStart: "desc" },
    });

    // Get only the current period usage for each feature
    for (const record of usageRecords) {
      const feature = features.find(f => f.id === record.featureId);
      if (!feature) continue;
      const { start: periodStart } = getPeriodBounds(feature.resetPeriod);
      if (record.periodStart.getTime() === periodStart.getTime()) {
        usageMap[record.featureId] = record.usageCount;
      }
    }
  }

  return {
    context: ctx,
    modules: modules.map(m => {
      const pm = m.planModules[0];
      return {
        id: m.id,
        slug: m.slug,
        name: m.name,
        allowed: pm ? pm.isEnabled && !pm.isVisibleLocked : true,
        isEnabled: pm ? pm.isEnabled : true,
        isVisibleLocked: pm?.isVisibleLocked || false,
        blockMessage: pm?.blockMessage || null,
        ctaText: pm?.ctaText || null,
      };
    }),
    features: features.map(f => {
      const fl = f.featureLimits[0];
      const usage = usageMap[f.id] || 0;
      const limit = fl?.limitValue || 0;
      const isUnlimited = fl?.unlimited || fl?.isUnlimited || false;
      const enabled = fl?.enabled !== false;
      const remaining = isUnlimited ? null : Math.max(0, limit - usage);

      return {
        id: f.id,
        slug: f.slug,
        name: f.name,
        moduleName: f.module.name,
        moduleSlug: f.module.slug,
        type: f.type,
        enabled,
        unlimited: isUnlimited,
        limit: f.type === "LIMIT" ? limit : null,
        currentUsage: usage,
        remaining,
        isVisibleLocked: fl?.isVisibleLocked || false,
        resetPeriod: f.resetPeriod,
        comparisonLabel: fl?.comparisonLabel || f.comparisonLabel,
        showInComparison: fl?.showInComparison !== false && f.showInComparison !== false,
      };
    }),
  };
}
