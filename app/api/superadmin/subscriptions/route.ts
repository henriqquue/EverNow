import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const where: any = {
      plan: { slug: { not: 'gratuito' } },
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [subscriptions, total, activeCount, totalRevenue] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          plan: { select: { name: true, slug: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription.count({ where }),
      prisma.subscription.count({ where: { status: 'ACTIVE', plan: { slug: { not: 'gratuito' } } } }),
      prisma.subscription.aggregate({
        where: { status: 'ACTIVE', plan: { slug: { not: 'gratuito' } } },
        _sum: { amount: true },
      }),
    ]);

    // Churn: canceled in last 30 days vs active
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const canceledRecent = await prisma.subscription.count({
      where: { status: 'CANCELED', canceledAt: { gte: thirtyDaysAgo }, plan: { slug: { not: 'gratuito' } } },
    });
    const churnRate = activeCount > 0 ? parseFloat(((canceledRecent / activeCount) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        user: s.user,
        plan: s.plan?.name || 'N/A',
        status: s.status,
        startedAt: s.startedAt,
        expiresAt: s.expiresAt,
        amount: s.amount,
      })),
      total,
      stats: {
        active: activeCount,
        revenue: totalRevenue._sum.amount || 0,
        churnRate,
      },
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Subscriptions list error:', error);
    return NextResponse.json({ error: 'Falha ao buscar assinaturas' }, { status: 500 });
  }
}
