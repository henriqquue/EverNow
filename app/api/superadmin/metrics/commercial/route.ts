import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar se é SuperAdmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";
    const planId = searchParams.get("planId") || null;

    // Calcular data de início baseado no período
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "365d":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Métricas de usuários
    const [totalUsers, freeUsers, premiumUsers] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({
        where: {
          role: "USER",
          plan: { OR: [{ slug: "gratuito" }, { price: 0 }] },
        },
      }),
      prisma.user.count({
        where: {
          role: "USER",
          plan: { price: { gt: 0 } },
        },
      }),
    ]);

    // Métricas de assinaturas
    const [activeSubscriptions, canceledSubscriptions, expiredSubscriptions] = await Promise.all([
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "CANCELED" } }),
      prisma.subscription.count({ where: { status: "EXPIRED" } }),
    ]);

    // Novos usuários no período
    const newUsersInPeriod = await prisma.user.count({
      where: {
        role: "USER",
        createdAt: { gte: startDate },
      },
    });

    // Novos assinantes no período
    const newSubscribersInPeriod = await prisma.subscriptionHistory.count({
      where: {
        action: "SUBSCRIBE",
        createdAt: { gte: startDate },
      },
    });

    // Distribuição por plano
    const planDistribution = await prisma.plan.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        _count: { select: { users: true } },
      },
      orderBy: { order: "asc" },
    });

    // Eventos de assinatura no período
    const subscriptionEvents = await prisma.subscriptionHistory.groupBy({
      by: ["action"],
      where: {
        createdAt: { gte: startDate },
        ...(planId && { planId }),
      },
      _count: true,
    });

    const eventsMap: Record<string, number> = {};
    subscriptionEvents.forEach((e) => {
      eventsMap[e.action] = e._count;
    });

    // Taxa de conversão
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : "0";

    // Eventos recentes de assinatura
    const recentEvents = await prisma.subscriptionHistory.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(planId && { planId }),
      },
      include: {
        plan: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Buscar nomes dos usuários para os eventos
    const userIds = [...new Set(recentEvents.map((e) => e.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const usersMap = new Map(users.map((u) => [u.id, u]));

    const formattedRecentEvents = recentEvents.map((e) => {
      const eventUser = usersMap.get(e.userId);
      return {
        id: e.id,
        action: e.action,
        actionLabel: getActionLabel(e.action),
        user: {
          id: e.userId,
          name: eventUser?.name || "Usuário",
          email: eventUser?.email || "",
        },
        plan: e.plan,
        amount: e.amount,
        createdAt: e.createdAt,
      };
    });

    // Métricas de paywall
    const paywallEvents = await prisma.paywallEvent.groupBy({
      by: ["eventType"],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    const paywallMap: Record<string, number> = {};
    paywallEvents.forEach((e) => {
      paywallMap[e.eventType] = e._count;
    });

    // Features mais tentadas (bloqueadas)
    const topBlockedFeatures = await prisma.paywallEvent.groupBy({
      by: ["featureSlug"],
      where: {
        eventType: "VIEW",
        featureSlug: { not: null },
        createdAt: { gte: startDate },
      },
      _count: true,
      orderBy: { _count: { featureSlug: "desc" } },
      take: 5,
    });

    // Dados para gráfico de crescimento diário
    const dailyGrowth = await getDailyGrowthData(startDate, now);

    // Dados para gráfico de eventos de assinatura
    const dailySubscriptionEvents = await getDailySubscriptionEventsData(startDate, now);

    // Métricas de campanhas
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        displayType: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
      orderBy: { conversions: "desc" },
      take: 5,
    });

    const campaignTotals = await prisma.campaign.aggregate({
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
      },
    });

    // Top campanhas por conversão
    const topCampaigns = activeCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      displayType: c.displayType,
      impressions: c.impressions,
      clicks: c.clicks,
      conversions: c.conversions,
      ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0",
      cvr: c.impressions > 0 ? ((c.conversions / c.impressions) * 100).toFixed(1) : "0",
    }));

    // Métricas de banners
    const activeBanners = await prisma.banner.count({ where: { isActive: true } });
    const bannerTotals = await prisma.banner.aggregate({
      _sum: {
        impressions: true,
        clicks: true,
      },
    });

    // Métricas de eventos comerciais públicos
    const commercialEventsRaw = await prisma.commercialEvent.groupBy({
      by: ["eventType"],
      where: {
        createdAt: { gte: startDate, lte: now },
      },
      _count: true,
    });

    const commercialEventsMap: Record<string, number> = {};
    commercialEventsRaw.forEach((e) => {
      commercialEventsMap[e.eventType] = e._count;
    });

    return NextResponse.json({
      period,
      startDate,
      endDate: now,
      metrics: {
        users: {
          total: totalUsers,
          free: freeUsers,
          premium: premiumUsers,
          newInPeriod: newUsersInPeriod,
        },
        subscriptions: {
          active: activeSubscriptions,
          canceled: canceledSubscriptions,
          expired: expiredSubscriptions,
          newInPeriod: newSubscribersInPeriod,
        },
        conversion: {
          rate: parseFloat(conversionRate),
          freeToPayingRatio: freeUsers > 0 ? (premiumUsers / freeUsers).toFixed(2) : "0",
        },
        events: {
          upgrades: eventsMap["UPGRADE"] || 0,
          downgrades: eventsMap["DOWNGRADE"] || 0,
          cancellations: eventsMap["CANCEL"] || 0,
          reactivations: eventsMap["REACTIVATE"] || 0,
          renewals: eventsMap["RENEW"] || 0,
          newSubscriptions: eventsMap["SUBSCRIBE"] || 0,
        },
        paywall: {
          views: paywallMap["VIEW"] || 0,
          clickUpgrade: paywallMap["CLICK_UPGRADE"] || 0,
          closes: paywallMap["CLOSE"] || 0,
          subscribes: paywallMap["SUBSCRIBE"] || 0,
          conversionRate: paywallMap["VIEW"] > 0
            ? (((paywallMap["SUBSCRIBE"] || 0) / paywallMap["VIEW"]) * 100).toFixed(1)
            : "0",
        },
      },
      planDistribution: planDistribution.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        userCount: p._count.users,
        percentage: totalUsers > 0 ? ((p._count.users / totalUsers) * 100).toFixed(1) : "0",
      })),
      topBlockedFeatures: topBlockedFeatures.map((f) => ({
        featureSlug: f.featureSlug,
        count: f._count,
      })),
      recentEvents: formattedRecentEvents,
      charts: {
        dailyGrowth,
        dailySubscriptionEvents,
      },
      campaigns: {
        active: activeCampaigns.length,
        totalImpressions: campaignTotals._sum.impressions || 0,
        totalClicks: campaignTotals._sum.clicks || 0,
        totalConversions: campaignTotals._sum.conversions || 0,
        overallCtr: (campaignTotals._sum.impressions || 0) > 0
          ? (((campaignTotals._sum.clicks || 0) / (campaignTotals._sum.impressions || 1)) * 100).toFixed(1)
          : "0",
        overallCvr: (campaignTotals._sum.impressions || 0) > 0
          ? (((campaignTotals._sum.conversions || 0) / (campaignTotals._sum.impressions || 1)) * 100).toFixed(1)
          : "0",
        topCampaigns,
      },
      banners: {
        active: activeBanners,
        totalImpressions: bannerTotals._sum.impressions || 0,
        totalClicks: bannerTotals._sum.clicks || 0,
        ctr: (bannerTotals._sum.impressions || 0) > 0
          ? (((bannerTotals._sum.clicks || 0) / (bannerTotals._sum.impressions || 1)) * 100).toFixed(1)
          : "0",
      },
      publicEvents: {
        landingVisits: commercialEventsMap["landing_visit"] || 0,
        ctaClicks: commercialEventsMap["cta_click"] || 0,
        planClicks: commercialEventsMap["plan_click"] || 0,
        subscribeClicks: commercialEventsMap["subscribe_click"] || 0,
        signupStarts: commercialEventsMap["signup_start"] || 0,
        upgradeStarts: commercialEventsMap["upgrade_start"] || 0,
        checkoutViews: commercialEventsMap["checkout_view"] || 0,
        checkoutCompletes: commercialEventsMap["checkout_complete"] || 0,
        funnelConversion: (commercialEventsMap["landing_visit"] || 0) > 0
          ? (((commercialEventsMap["checkout_complete"] || 0) / (commercialEventsMap["landing_visit"] || 1)) * 100).toFixed(2)
          : "0",
      },
    });
  } catch (error) {
    console.error("Error fetching commercial metrics:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    SUBSCRIBE: "Nova Assinatura",
    UPGRADE: "Upgrade",
    DOWNGRADE: "Downgrade",
    CANCEL: "Cancelamento",
    REACTIVATE: "Reativação",
    RENEW: "Renovação",
    EXPIRE: "Expiração",
    TRIAL_START: "Início Trial",
    TRIAL_END: "Fim Trial",
  };
  return labels[action] || action;
}

async function getDailyGrowthData(startDate: Date, endDate: Date) {
  const days: { date: string; users: number; subscribers: number }[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [usersCount, subscribersCount] = await Promise.all([
      prisma.user.count({
        where: {
          role: "USER",
          createdAt: { lte: dayEnd },
        },
      }),
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          startedAt: { lte: dayEnd },
        },
      }),
    ]);

    days.push({
      date: currentDate.toISOString().split("T")[0],
      users: usersCount,
      subscribers: subscribersCount,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Limitar a 30 pontos para performance
  if (days.length > 30) {
    const step = Math.ceil(days.length / 30);
    return days.filter((_, i) => i % step === 0 || i === days.length - 1);
  }

  return days;
}

async function getDailySubscriptionEventsData(startDate: Date, endDate: Date) {
  const events = await prisma.subscriptionHistory.groupBy({
    by: ["action"],
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
  });

  return events.map((e) => ({
    action: e.action,
    label: getActionLabel(e.action),
    count: e._count,
  }));
}
