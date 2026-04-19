import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalUsers, activeSubscribers, revenue, plans] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE', plan: { slug: { not: 'gratuito' } } } }),
      prisma.subscription.aggregate({
        where: { status: 'ACTIVE', plan: { slug: { not: 'gratuito' } } },
        _sum: { amount: true },
      }),
      prisma.plan.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, slug: true } }),
    ]);

    const freeUsers = totalUsers - activeSubscribers;
    const conversionRate = totalUsers > 0 ? parseFloat(((activeSubscribers / totalUsers) * 100).toFixed(1)) : 0;
    const monthlyRevenue = revenue._sum.amount || 0;

    // Plan distribution
    const planDistribution = await Promise.all(
      plans.map(async (p) => ({
        name: p.name,
        slug: p.slug,
        count: await prisma.subscription.count({ where: { planId: p.id, status: 'ACTIVE' } }),
      }))
    );

    // Recent upgrades from SubscriptionHistory
    const recentHistory = await prisma.subscriptionHistory.findMany({
      where: { action: 'UPGRADE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        plan: { select: { name: true } },
      },
    });

    // Fetch user emails separately
    const userIds = recentHistory.map(h => h.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.email]));

    const recentUpgrades = recentHistory.map((h) => {
      const diff = Date.now() - new Date(h.createdAt).getTime();
      const hours = Math.floor(diff / 3600000);
      const time = hours < 1 ? 'agora' : hours < 24 ? `${hours}h atrás` : `${Math.floor(hours / 24)}d atrás`;
      return {
        email: userMap.get(h.userId) || 'desconhecido',
        planName: h.plan?.name || 'Premium',
        time,
      };
    });

    return NextResponse.json({
      totalUsers,
      activeSubscribers,
      freeUsers,
      conversionRate,
      monthlyRevenue,
      planDistribution,
      recentUpgrades,
    });
  } catch (error: any) {
    console.error('SA dashboard error:', error);
    return NextResponse.json({ error: 'Falha ao buscar dados' }, { status: 500 });
  }
}
