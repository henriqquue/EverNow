import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { CampaignStatus, CampaignDisplayType, CampaignTrigger } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const campaigns = await prisma.campaign.findMany({
      where: status ? { status: status as CampaignStatus } : undefined,
      include: {
        targetPlan: { select: { id: true, name: true } },
        offerPlan: { select: { id: true, name: true } },
        _count: { select: { events: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      title,
      message,
      ctaText,
      ctaUrl,
      imageUrl,
      displayType,
      triggers,
      targetFeatures,
      targetPages,
      targetPlanId,
      offerPlanId,
      discountPercent,
      discountCode,
      startsAt,
      endsAt,
      status,
      priority,
      maxImpressions,
      maxPerUser,
    } = body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        slug,
        description,
        title,
        message,
        ctaText: ctaText || "Fazer upgrade",
        ctaUrl: ctaUrl || "/app/planos",
        imageUrl,
        displayType: displayType as CampaignDisplayType || "MODAL",
        triggers: triggers as CampaignTrigger[] || [],
        targetFeatures: targetFeatures || [],
        targetPages: targetPages || [],
        targetPlanId: targetPlanId || null,
        offerPlanId: offerPlanId || null,
        discountPercent,
        discountCode,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        status: status as CampaignStatus || "DRAFT",
        priority: priority || 0,
        maxImpressions,
        maxPerUser: maxPerUser || 3,
      },
      include: {
        targetPlan: { select: { id: true, name: true } },
        offerPlan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Erro ao criar campanha" }, { status: 500 });
  }
}
