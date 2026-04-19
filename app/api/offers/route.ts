import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { CampaignTrigger } from "@prisma/client";

// GET - Buscar ofertas ativas para o usuário
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const trigger = searchParams.get("trigger") as CampaignTrigger | null;
    const featureSlug = searchParams.get("feature");
    const page = searchParams.get("page");

    const now = new Date();

    // Buscar campanhas ativas
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: "ACTIVE",
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
          {
            OR: [
              { targetPlanId: null },
              { targetPlanId: user.planId },
            ],
          },
        ],
      },
      include: {
        offerPlan: { select: { id: true, name: true, price: true } },
      },
      orderBy: [{ priority: "desc" }],
    });

    // Filtrar campanhas por gatilho e contexto
    let filteredCampaigns = campaigns;

    if (trigger) {
      filteredCampaigns = filteredCampaigns.filter((c) =>
        c.triggers.includes(trigger)
      );
    }

    if (featureSlug) {
      filteredCampaigns = filteredCampaigns.filter(
        (c) => c.targetFeatures.length === 0 || c.targetFeatures.includes(featureSlug)
      );
    }

    if (page) {
      filteredCampaigns = filteredCampaigns.filter(
        (c) => c.targetPages.length === 0 || c.targetPages.includes(page)
      );
    }

    // Contar eventos do usuário para cada campanha
    const userEventCounts = await prisma.campaignEvent.groupBy({
      by: ["campaignId"],
      where: {
        userId: user.id,
        campaignId: { in: filteredCampaigns.map((c) => c.id) },
      },
      _count: true,
    });

    const eventCountMap = new Map(userEventCounts.map((e) => [e.campaignId, e._count]));

    // Filtrar campanhas que já atingiram limite por usuário
    filteredCampaigns = filteredCampaigns.filter((c) => {
      const userCount = eventCountMap.get(c.id) || 0;
      return userCount < c.maxPerUser;
    });

    // Buscar banners ativos
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
          {
            OR: [
              { targetPlanId: null },
              { targetPlanId: user.planId },
            ],
          },
        ],
      },
      orderBy: [{ priority: "desc" }],
    });

    // Filtrar banners por página
    let filteredBanners = banners;
    if (page) {
      filteredBanners = filteredBanners.filter(
        (b) => b.pages.length === 0 || b.pages.includes(page)
      );
    }

    return NextResponse.json({
      campaigns: filteredCampaigns.map((c) => ({
        id: c.id,
        title: c.title,
        message: c.message,
        ctaText: c.ctaText,
        ctaUrl: c.ctaUrl,
        imageUrl: c.imageUrl,
        displayType: c.displayType,
        discountPercent: c.discountPercent,
        discountCode: c.discountCode,
        offerPlan: c.offerPlan,
      })),
      banners: filteredBanners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        ctaText: b.ctaText,
        ctaUrl: b.ctaUrl,
        imageUrl: b.imageUrl,
        backgroundColor: b.backgroundColor,
        textColor: b.textColor,
        position: b.position,
        dismissible: b.dismissible,
      })),
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST - Registrar evento de campanha
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { campaignId, eventType, trigger, featureSlug, page, metadata } = body;

    // Registrar evento
    const event = await prisma.campaignEvent.create({
      data: {
        campaignId,
        userId: user.id,
        eventType,
        trigger,
        featureSlug,
        page,
        metadata,
      },
    });

    // Atualizar métricas da campanha
    const updateData: Record<string, { increment: number }> = {};
    if (eventType === "VIEW") updateData.impressions = { increment: 1 };
    if (eventType === "CLICK") updateData.clicks = { increment: 1 };
    if (eventType === "CONVERT") updateData.conversions = { increment: 1 };

    if (Object.keys(updateData).length > 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error recording campaign event:", error);
    return NextResponse.json({ error: "Erro ao registrar evento" }, { status: 500 });
  }
}
