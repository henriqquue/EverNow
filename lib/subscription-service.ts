import prisma from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { SubscriptionStatus, BillingInterval } from "@prisma/client";

// Tipos de ação para histórico
export type SubscriptionAction = 
  | "SUBSCRIBE" 
  | "UPGRADE" 
  | "DOWNGRADE" 
  | "CANCEL" 
  | "REACTIVATE" 
  | "RENEW" 
  | "EXPIRE" 
  | "TRIAL_START" 
  | "TRIAL_END";

// Status de monetização para eventos
export type MonetizationEventType =
  | "subscription_upgrade"
  | "subscription_downgrade"
  | "subscription_cancel"
  | "subscription_reactivate"
  | "subscription_renew"
  | "subscription_expire"
  | "trial_start"
  | "trial_end"
  | "feature_blocked";

export interface SubscriptionResult {
  success: boolean;
  error?: string;
  subscription?: Awaited<ReturnType<typeof prisma.subscription.findUnique>>;
  action?: SubscriptionAction;
}

export interface TransitionValidation {
  isValid: boolean;
  error?: string;
  actionType?: SubscriptionAction;
}

// Calcular data de expiração baseado no intervalo
export function calculateExpirationDate(interval: BillingInterval, startDate: Date = new Date()): Date {
  const expiresAt = new Date(startDate);
  
  switch (interval) {
    case "DAILY":
      expiresAt.setDate(expiresAt.getDate() + 1);
      break;
    case "WEEKLY":
      expiresAt.setDate(expiresAt.getDate() + 7);
      break;
    case "BIWEEKLY":
      expiresAt.setDate(expiresAt.getDate() + 14);
      break;
    case "MONTHLY":
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      break;
    case "QUARTERLY":
      expiresAt.setMonth(expiresAt.getMonth() + 3);
      break;
    case "SEMIANNUAL":
      expiresAt.setMonth(expiresAt.getMonth() + 6);
      break;
    case "YEARLY":
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      break;
  }
  
  return expiresAt;
}

// Validar transição de status
export function validateStatusTransition(
  currentStatus: SubscriptionStatus,
  targetStatus: SubscriptionStatus
): { isValid: boolean; error?: string } {
  const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
    PENDING: ["ACTIVE", "TRIAL", "CANCELED"],
    ACTIVE: ["CANCELED", "EXPIRED"],
    TRIAL: ["ACTIVE", "EXPIRED", "CANCELED"],
    CANCELED: ["ACTIVE"], // reativação
    EXPIRED: ["ACTIVE"], // reativação
  };

  if (!validTransitions[currentStatus]?.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Transição inválida: ${currentStatus} → ${targetStatus}`,
    };
  }

  return { isValid: true };
}

// Validar transição de plano (upgrade/downgrade)
export async function validatePlanTransition(
  userId: string,
  currentPlanId: string | null,
  targetPlanId: string
): Promise<TransitionValidation> {
  // Não permitir mudar para o mesmo plano
  if (currentPlanId === targetPlanId) {
    return {
      isValid: false,
      error: "Você já está neste plano",
    };
  }

  // Buscar os planos
  const [currentPlan, targetPlan] = await Promise.all([
    currentPlanId ? prisma.plan.findUnique({ where: { id: currentPlanId } }) : null,
    prisma.plan.findUnique({ where: { id: targetPlanId } }),
  ]);

  if (!targetPlan) {
    return {
      isValid: false,
      error: "Plano de destino não encontrado",
    };
  }

  if (targetPlan.status !== "ACTIVE") {
    return {
      isValid: false,
      error: "Este plano não está disponível",
    };
  }

  // Determinar se é upgrade ou downgrade
  let actionType: SubscriptionAction = "SUBSCRIBE";
  if (currentPlan) {
    if (targetPlan.price > currentPlan.price) {
      actionType = "UPGRADE";
    } else if (targetPlan.price < currentPlan.price) {
      actionType = "DOWNGRADE";
    }
  }

  return {
    isValid: true,
    actionType,
  };
}

// Registrar histórico de assinatura
export async function recordSubscriptionHistory(
  userId: string,
  planId: string,
  action: SubscriptionAction,
  options: {
    fromPlanId?: string | null;
    toPlanId?: string | null;
    fromStatus?: SubscriptionStatus;
    toStatus?: SubscriptionStatus;
    fromInterval?: BillingInterval;
    toInterval?: BillingInterval;
    amount?: number;
    billingInterval?: BillingInterval;
    reason?: string;
  } = {}
) {
  const metadata = {
    fromStatus: options.fromStatus,
    toStatus: options.toStatus,
    fromInterval: options.fromInterval,
    toInterval: options.toInterval,
    reason: options.reason,
    timestamp: new Date().toISOString(),
  };

  return prisma.subscriptionHistory.create({
    data: {
      userId,
      planId,
      action,
      fromPlanId: options.fromPlanId,
      toPlanId: options.toPlanId,
      amount: options.amount,
      billingInterval: options.billingInterval,
      metadata,
    },
  });
}

// Registrar evento de monetização
export async function recordMonetizationEvent(
  userId: string,
  eventType: MonetizationEventType,
  data: {
    planId?: string;
    planName?: string;
    featureSlug?: string;
    amount?: number;
    interval?: BillingInterval;
    fromPlanId?: string;
    toPlanId?: string;
    reason?: string;
  } = {}
) {
  // Registrar no PaywallEvent se for bloqueio de feature
  if (eventType === "feature_blocked" && data.featureSlug) {
    await prisma.paywallEvent.create({
      data: {
        userId,
        eventType: "VIEW",
        featureSlug: data.featureSlug,
        planRequired: data.planId,
        metadata: data,
      },
    });
  }

  // Mapear tipos de eventos de monetização para tipos de analytics
  // Usar subscription_upgraded para upgrade e subscription_created para outros
  const analyticsEventType = eventType === "subscription_upgrade" 
    ? "subscription_upgraded" 
    : "subscription_created";

  // Registrar evento de analytics
  return trackEvent({
    userId,
    eventType: analyticsEventType,
    eventData: { ...data, originalEventType: eventType },
  });
}

// Upgrade de plano
export async function upgradePlan(
  userId: string,
  targetPlanId: string,
  interval: BillingInterval = "MONTHLY"
): Promise<SubscriptionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: { include: { plan: true } },
      plan: true,
    },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado" };
  }

  // Validar transição
  const validation = await validatePlanTransition(
    userId,
    user.planId,
    targetPlanId
  );

  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  if (validation.actionType !== "UPGRADE") {
    return {
      success: false,
      error: "Esta mudança não é um upgrade. Use a opção de downgrade.",
    };
  }

  // Buscar plano de destino
  const targetPlan = await prisma.plan.findUnique({
    where: { id: targetPlanId },
    include: {
      planIntervals: { where: { interval, isActive: true } },
    },
  });

  if (!targetPlan) {
    return { success: false, error: "Plano não encontrado" };
  }

  const planInterval = targetPlan.planIntervals[0];
  const amount = planInterval?.discountPrice || planInterval?.price || targetPlan.discountPrice || targetPlan.price;
  const now = new Date();
  const expiresAt = calculateExpirationDate(interval, now);

  // Status anterior
  const fromStatus = user.subscription?.status || "PENDING";
  const fromInterval = user.subscription?.billingInterval || "MONTHLY";

  // Atualizar assinatura
  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId: targetPlanId,
      status: "ACTIVE",
      billingInterval: interval,
      amount,
      startedAt: now,
      expiresAt,
      canceledAt: null,
    },
    create: {
      userId,
      planId: targetPlanId,
      status: "ACTIVE",
      billingInterval: interval,
      amount,
      startedAt: now,
      expiresAt,
    },
    include: { plan: true },
  });

  // Atualizar plano do usuário
  await prisma.user.update({
    where: { id: userId },
    data: { planId: targetPlanId },
  });

  // Registrar histórico
  await recordSubscriptionHistory(userId, targetPlanId, "UPGRADE", {
    fromPlanId: user.planId,
    toPlanId: targetPlanId,
    fromStatus,
    toStatus: "ACTIVE",
    fromInterval,
    toInterval: interval,
    amount,
    billingInterval: interval,
  });

  // Registrar evento de monetização
  await recordMonetizationEvent(userId, "subscription_upgrade", {
    planId: targetPlanId,
    planName: targetPlan.name,
    amount,
    interval,
    fromPlanId: user.planId || undefined,
    toPlanId: targetPlanId,
  });

  return { success: true, subscription, action: "UPGRADE" };
}

// Downgrade de plano
export async function downgradePlan(
  userId: string,
  targetPlanId: string,
  interval: BillingInterval = "MONTHLY"
): Promise<SubscriptionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: { include: { plan: true } },
      plan: true,
    },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado" };
  }

  // Validar transição
  const validation = await validatePlanTransition(
    userId,
    user.planId,
    targetPlanId
  );

  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  if (validation.actionType !== "DOWNGRADE") {
    return {
      success: false,
      error: "Esta mudança não é um downgrade. Use a opção de upgrade.",
    };
  }

  // Buscar plano de destino
  const targetPlan = await prisma.plan.findUnique({
    where: { id: targetPlanId },
    include: {
      planIntervals: { where: { interval, isActive: true } },
    },
  });

  if (!targetPlan) {
    return { success: false, error: "Plano não encontrado" };
  }

  const planInterval = targetPlan.planIntervals[0];
  const amount = planInterval?.discountPrice || planInterval?.price || targetPlan.discountPrice || targetPlan.price;
  const now = new Date();
  
  // Para downgrade, manter a assinatura atual até expirar, depois aplica o novo plano
  // Ou aplicar imediatamente se for plano gratuito
  const isFreePlan = amount === 0;
  const expiresAt = isFreePlan 
    ? null 
    : (user.subscription?.expiresAt || calculateExpirationDate(interval, now));

  const fromStatus = user.subscription?.status || "PENDING";
  const fromInterval = user.subscription?.billingInterval || "MONTHLY";

  // Atualizar assinatura
  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId: targetPlanId,
      status: isFreePlan ? "ACTIVE" : user.subscription?.status || "ACTIVE",
      billingInterval: interval,
      amount,
      ...(isFreePlan && { startedAt: now, expiresAt: null }),
      canceledAt: null,
    },
    create: {
      userId,
      planId: targetPlanId,
      status: "ACTIVE",
      billingInterval: interval,
      amount,
      startedAt: now,
      expiresAt,
    },
    include: { plan: true },
  });

  // Atualizar plano do usuário
  await prisma.user.update({
    where: { id: userId },
    data: { planId: targetPlanId },
  });

  // Registrar histórico
  await recordSubscriptionHistory(userId, targetPlanId, "DOWNGRADE", {
    fromPlanId: user.planId,
    toPlanId: targetPlanId,
    fromStatus,
    toStatus: subscription.status,
    fromInterval,
    toInterval: interval,
    amount,
    billingInterval: interval,
  });

  // Registrar evento de monetização
  await recordMonetizationEvent(userId, "subscription_downgrade", {
    planId: targetPlanId,
    planName: targetPlan.name,
    amount,
    interval,
    fromPlanId: user.planId || undefined,
    toPlanId: targetPlanId,
  });

  return { success: true, subscription, action: "DOWNGRADE" };
}

// Cancelar assinatura
export async function cancelSubscription(
  userId: string,
  reason?: string
): Promise<SubscriptionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: { include: { plan: true } },
    },
  });

  if (!user || !user.subscription) {
    return { success: false, error: "Assinatura não encontrada" };
  }

  // Validar se pode cancelar
  if (user.subscription.status === "CANCELED") {
    return { success: false, error: "Assinatura já está cancelada" };
  }

  if (user.subscription.status === "EXPIRED") {
    return { success: false, error: "Assinatura já expirou" };
  }

  const fromStatus = user.subscription.status;

  // Cancelar (mantém ativa até expiração)
  const subscription = await prisma.subscription.update({
    where: { id: user.subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
    include: { plan: true },
  });

  // Registrar histórico
  await recordSubscriptionHistory(userId, user.subscription.planId, "CANCEL", {
    fromStatus,
    toStatus: "CANCELED",
    amount: user.subscription.amount,
    billingInterval: user.subscription.billingInterval,
    reason,
  });

  // Registrar evento de monetização
  await recordMonetizationEvent(userId, "subscription_cancel", {
    planId: user.subscription.planId,
    planName: user.subscription.plan.name,
    amount: user.subscription.amount,
    reason,
  });

  return { success: true, subscription, action: "CANCEL" };
}

// Reativar assinatura
export async function reactivateSubscription(
  userId: string,
  interval?: BillingInterval
): Promise<SubscriptionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: { include: { plan: true } },
      plan: true,
    },
  });

  if (!user || !user.subscription) {
    return { success: false, error: "Assinatura não encontrada" };
  }

  // Validar se pode reativar
  if (user.subscription.status === "ACTIVE") {
    return { success: false, error: "Assinatura já está ativa" };
  }

  if (user.subscription.status !== "CANCELED" && user.subscription.status !== "EXPIRED") {
    return { success: false, error: "Apenas assinaturas canceladas ou expiradas podem ser reativadas" };
  }

  const fromStatus = user.subscription.status;
  const billingInterval = interval || user.subscription.billingInterval;
  const now = new Date();
  const expiresAt = calculateExpirationDate(billingInterval, now);

  // Buscar preço atualizado
  const plan = await prisma.plan.findUnique({
    where: { id: user.subscription.planId },
    include: {
      planIntervals: { where: { interval: billingInterval, isActive: true } },
    },
  });

  if (!plan || plan.status !== "ACTIVE") {
    return { success: false, error: "O plano não está mais disponível" };
  }

  const planInterval = plan.planIntervals[0];
  const amount = planInterval?.discountPrice || planInterval?.price || plan.discountPrice || plan.price;

  // Reativar
  const subscription = await prisma.subscription.update({
    where: { id: user.subscription.id },
    data: {
      status: "ACTIVE",
      billingInterval,
      amount,
      startedAt: now,
      expiresAt,
      canceledAt: null,
    },
    include: { plan: true },
  });

  // Registrar histórico
  await recordSubscriptionHistory(userId, user.subscription.planId, "REACTIVATE", {
    fromStatus,
    toStatus: "ACTIVE",
    amount,
    billingInterval,
  });

  // Registrar evento de monetização
  await recordMonetizationEvent(userId, "subscription_reactivate", {
    planId: user.subscription.planId,
    planName: plan.name,
    amount,
    interval: billingInterval,
  });

  return { success: true, subscription, action: "REACTIVATE" };
}

// Renovar assinatura
export async function renewSubscription(userId: string): Promise<SubscriptionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: { include: { plan: true } },
    },
  });

  if (!user || !user.subscription) {
    return { success: false, error: "Assinatura não encontrada" };
  }

  if (user.subscription.status !== "ACTIVE") {
    return { success: false, error: "Apenas assinaturas ativas podem ser renovadas" };
  }

  const now = new Date();
  const currentExpiration = user.subscription.expiresAt || now;
  const startDate = currentExpiration > now ? currentExpiration : now;
  const expiresAt = calculateExpirationDate(user.subscription.billingInterval, startDate);

  // Buscar preço atualizado
  const plan = await prisma.plan.findUnique({
    where: { id: user.subscription.planId },
    include: {
      planIntervals: { where: { interval: user.subscription.billingInterval, isActive: true } },
    },
  });

  if (!plan || plan.status !== "ACTIVE") {
    return { success: false, error: "O plano não está mais disponível" };
  }

  const planInterval = plan.planIntervals[0];
  const amount = planInterval?.discountPrice || planInterval?.price || plan.discountPrice || plan.price;

  // Renovar
  const subscription = await prisma.subscription.update({
    where: { id: user.subscription.id },
    data: {
      amount,
      expiresAt,
    },
    include: { plan: true },
  });

  // Registrar histórico
  await recordSubscriptionHistory(userId, user.subscription.planId, "RENEW", {
    amount,
    billingInterval: user.subscription.billingInterval,
  });

  // Registrar evento de monetização
  await recordMonetizationEvent(userId, "subscription_renew", {
    planId: user.subscription.planId,
    planName: plan.name,
    amount,
    interval: user.subscription.billingInterval,
  });

  return { success: true, subscription, action: "RENEW" };
}

// Verificar e expirar assinaturas
export async function checkAndExpireSubscriptions(): Promise<number> {
  const now = new Date();

  // Buscar assinaturas ativas que expiraram
  const expiredSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: now },
    },
    include: { plan: true, user: true },
  });

  for (const subscription of expiredSubscriptions) {
    // Atualizar status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    });

    // Buscar plano gratuito
    const freePlan = await prisma.plan.findFirst({
      where: { slug: "gratuito", status: "ACTIVE" },
    });

    // Atualizar usuário para plano gratuito
    if (freePlan) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { planId: freePlan.id },
      });
    }

    // Registrar histórico
    await recordSubscriptionHistory(subscription.userId, subscription.planId, "EXPIRE", {
      fromStatus: "ACTIVE",
      toStatus: "EXPIRED",
      amount: subscription.amount,
      billingInterval: subscription.billingInterval,
    });

    // Registrar evento
    await recordMonetizationEvent(subscription.userId, "subscription_expire", {
      planId: subscription.planId,
      planName: subscription.plan.name,
    });
  }

  return expiredSubscriptions.length;
}

// Obter histórico de assinatura do usuário
export async function getSubscriptionHistory(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;

  const [history, total] = await Promise.all([
    prisma.subscriptionHistory.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.subscriptionHistory.count({ where: { userId } }),
  ]);

  return { history, total };
}

// Obter resumo da assinatura do usuário
export async function getSubscriptionSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        include: {
          plan: {
            include: {
              featureLimits: { include: { feature: true } },
              planIntervals: true,
            },
          },
        },
      },
      plan: {
        include: {
          featureLimits: { include: { feature: true } },
          planIntervals: true,
        },
      },
    },
  });

  if (!user) return null;

  const subscription = user.subscription;
  const plan = user.plan;

  // Calcular dias restantes
  let daysRemaining: number | null = null;
  if (subscription?.expiresAt) {
    const now = new Date();
    const diff = subscription.expiresAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Verificar se pode cancelar/reativar
  const canCancel = subscription?.status === "ACTIVE" || subscription?.status === "TRIAL";
  const canReactivate = subscription?.status === "CANCELED" || subscription?.status === "EXPIRED";
  const canUpgrade = plan?.slug === "gratuito" || plan?.price === 0;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          billingInterval: subscription.billingInterval,
          amount: subscription.amount,
          startedAt: subscription.startedAt,
          expiresAt: subscription.expiresAt,
          canceledAt: subscription.canceledAt,
          isTrial: subscription.isTrial,
          trialEndsAt: subscription.trialEndsAt,
          daysRemaining,
        }
      : null,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          description: plan.shortDescription,
          price: plan.price,
          features: plan.featureLimits.map((fl) => ({
            name: fl.feature.name,
            slug: fl.feature.slug,
            type: fl.feature.type,
            value: fl.limitValue,
            isUnlimited: fl.unlimited,
            enabled: fl.enabled,
          })),
          intervals: plan.planIntervals.map((pi) => ({
            interval: pi.interval,
            price: pi.price,
            discountPrice: pi.discountPrice,
            discountPercent: pi.discountPercent,
          })),
        }
      : null,
    actions: {
      canCancel,
      canReactivate,
      canUpgrade,
    },
  };
}
