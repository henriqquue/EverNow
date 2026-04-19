import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// GET - List all ad campaigns
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const campaigns = await prisma.adCampaign.findMany({
      orderBy: [{ status: 'asc' }, { priority: 'desc' }],
      include: {
        zones: {
          include: {
            zone: true,
          },
        },
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching ad campaigns:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      adType,
      title,
      subtitle,
      imageUrl,
      ctaText,
      ctaUrl,
      backgroundColor,
      textColor,
      targetPlanSlugs,
      startsAt,
      endsAt,
      status,
      priority,
      maxImpressions,
      maxPerUser,
      maxPerDay,
      zoneIds,
    } = body;

    const campaign = await prisma.adCampaign.create({
      data: {
        name,
        slug,
        description,
        adType: adType || 'INTERNAL_BANNER',
        title,
        subtitle,
        imageUrl,
        ctaText: ctaText || 'Saiba mais',
        ctaUrl,
        backgroundColor,
        textColor,
        targetPlanSlugs: targetPlanSlugs || [],
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        status: status || 'DRAFT',
        priority: priority || 0,
        maxImpressions,
        maxPerUser: maxPerUser || 5,
        maxPerDay,
        zones: zoneIds?.length ? {
          create: zoneIds.map((zoneId: string, index: number) => ({
            zoneId,
            priority: index,
          })),
        } : undefined,
      },
      include: {
        zones: {
          include: {
            zone: true,
          },
        },
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Erro ao criar campanha' }, { status: 500 });
  }
}

// PUT - Update campaign
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, zoneIds, startsAt, endsAt, ...data } = body;

    // Update campaign
    const campaign = await prisma.adCampaign.update({
      where: { id },
      data: {
        ...data,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    // Update zones if provided
    if (zoneIds !== undefined) {
      await prisma.adCampaignZone.deleteMany({ where: { campaignId: id } });
      if (zoneIds.length > 0) {
        await prisma.adCampaignZone.createMany({
          data: zoneIds.map((zoneId: string, index: number) => ({
            campaignId: id,
            zoneId,
            priority: index,
          })),
        });
      }
    }

    const updatedCampaign = await prisma.adCampaign.findUnique({
      where: { id },
      include: {
        zones: {
          include: {
            zone: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Erro ao atualizar campanha' }, { status: 500 });
  }
}

// DELETE - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await prisma.adCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Erro ao deletar campanha' }, { status: 500 });
  }
}
