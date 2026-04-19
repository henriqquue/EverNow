import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/db";
import { CampaignStatus, CampaignDisplayType, CampaignTrigger } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { campaignId: string } }
) {
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.campaignId },
      include: {
        targetPlan: { select: { id: true, name: true } },
        offerPlan: { select: { id: true, name: true } },
        events: {
          take: 50,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { campaignId: string } }
) {
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
    const campaign = await prisma.campaign.update({
      where: { id: params.campaignId },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        title: body.title,
        message: body.message,
        ctaText: body.ctaText,
        ctaUrl: body.ctaUrl,
        imageUrl: body.imageUrl,
        displayType: body.displayType as CampaignDisplayType,
        triggers: body.triggers as CampaignTrigger[],
        targetFeatures: body.targetFeatures,
        targetPages: body.targetPages,
        targetPlanId: body.targetPlanId || null,
        offerPlanId: body.offerPlanId || null,
        discountPercent: body.discountPercent,
        discountCode: body.discountCode,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        status: body.status as CampaignStatus,
        priority: body.priority,
        maxImpressions: body.maxImpressions,
        maxPerUser: body.maxPerUser,
      },
      include: {
        targetPlan: { select: { id: true, name: true } },
        offerPlan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { campaignId: string } }
) {
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

    await prisma.campaign.delete({
      where: { id: params.campaignId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}
