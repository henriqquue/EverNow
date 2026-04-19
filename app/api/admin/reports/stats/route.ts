import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d';

    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const prevSince = new Date();
    prevSince.setDate(prevSince.getDate() - days * 2);

    // Current period counts
    const [signups, activeUsers, newSubscriptions, totalUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since }, role: 'USER' } }),
      prisma.user.count({ where: { lastLoginAt: { gte: since }, role: 'USER', status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { startedAt: { gte: since }, status: 'ACTIVE', plan: { slug: { not: 'gratuito' } } } }),
      prisma.user.count({ where: { role: 'USER' } }),
    ]);

    // Previous period for trend
    const [prevSignups, prevActive, prevSubs] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: prevSince, lt: since }, role: 'USER' } }),
      prisma.user.count({ where: { lastLoginAt: { gte: prevSince, lt: since }, role: 'USER', status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { startedAt: { gte: prevSince, lt: since }, status: 'ACTIVE', plan: { slug: { not: 'gratuito' } } } }),
    ]);

    const trend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const conversionRate = totalUsers > 0 ? parseFloat(((newSubscriptions / totalUsers) * 100).toFixed(1)) : 0;
    const prevConv = totalUsers > 0 ? parseFloat(((prevSubs / totalUsers) * 100).toFixed(1)) : 0;

    // Daily signups for chart (last N days)
    const dailySignups: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd }, role: 'USER' } });
      dailySignups.push({ date: dayStart.toISOString().slice(0, 10), count });
    }

    // Plan distribution
    const plans = await prisma.plan.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, slug: true } });
    const planDist = await Promise.all(
      plans.map(async (p) => ({
        name: p.name,
        slug: p.slug,
        count: await prisma.subscription.count({ where: { planId: p.id, status: 'ACTIVE' } }),
      }))
    );

    return NextResponse.json({
      signups,
      activeUsers,
      newSubscriptions,
      conversionRate,
      trends: {
        signups: trend(signups, prevSignups),
        activeUsers: trend(activeUsers, prevActive),
        newSubscriptions: trend(newSubscriptions, prevSubs),
        conversionRate: parseFloat((conversionRate - prevConv).toFixed(1)),
      },
      dailySignups,
      planDistribution: planDist,
    });
  } catch (error: any) {
    console.error('Reports stats error:', error);
    return NextResponse.json({ error: 'Falha ao buscar estatísticas' }, { status: 500 });
  }
}
