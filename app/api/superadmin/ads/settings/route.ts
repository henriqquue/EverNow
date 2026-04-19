import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { DEFAULT_PLAN_AD_SETTINGS, BLOCKED_PAGES } from '@/lib/ads';

// GET - Get global ad settings and plan settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Get or create global settings
    let globalSettings = await prisma.adGlobalSettings.findFirst();
    if (!globalSettings) {
      globalSettings = await prisma.adGlobalSettings.create({
        data: {
          adsenseEnabled: false,
          maxConsecutiveAds: 1,
          cooldownAfterAction: 30,
          blockedPages: BLOCKED_PAGES,
          estimatedCpm: 1.0,
        },
      });
    }

    // Get plan settings
    const planSettings = await prisma.planAdSettings.findMany({
      include: {
        planZones: {
          include: {
            adZone: true,
          },
        },
      },
    });

    // Get all plans for reference
    const plans = await prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({
      globalSettings,
      planSettings,
      plans,
    });
  } catch (error) {
    console.error('Error fetching ad settings:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Update global settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    let settings;
    if (id) {
      settings = await prisma.adGlobalSettings.update({
        where: { id },
        data,
      });
    } else {
      settings = await prisma.adGlobalSettings.create({ data });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating global ad settings:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

// POST - Create or update plan ad settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      planId,
      adsEnabled,
      adsFrequency,
      adsPerSession,
      adsPerDay,
      minTimeBetween,
      allowedZones,
    } = body;

    const settings = await prisma.planAdSettings.upsert({
      where: { planId },
      create: {
        planId,
        adsEnabled: adsEnabled ?? true,
        adsFrequency: adsFrequency ?? 5,
        adsPerSession: adsPerSession ?? 10,
        adsPerDay: adsPerDay ?? 50,
        minTimeBetween: minTimeBetween ?? 30,
        allowedZones: allowedZones ?? [],
      },
      update: {
        adsEnabled,
        adsFrequency,
        adsPerSession,
        adsPerDay,
        minTimeBetween,
        allowedZones,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving plan ad settings:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
