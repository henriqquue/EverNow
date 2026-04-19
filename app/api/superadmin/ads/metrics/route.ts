import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// GET - Get ad metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range
    const days = parseInt(period.replace('d', ''), 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total impressions and clicks
    const totalImpressions = await prisma.adImpression.count({
      where: { createdAt: { gte: startDate } },
    });

    const totalClicks = await prisma.adClick.count({
      where: { createdAt: { gte: startDate } },
    });

    // Get impressions by zone
    const impressionsByZone = await prisma.adImpression.groupBy({
      by: ['zoneId'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    const clicksByZone = await prisma.adClick.groupBy({
      by: ['zoneId'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    // Get zones for mapping
    const zones = await prisma.adZone.findMany();
    const zonesMap = new Map(zones.map(z => [z.id, z]));

    // Calculate zone metrics
    const zoneMetrics = impressionsByZone.map(imp => {
      const zone = zonesMap.get(imp.zoneId);
      const clicks = clicksByZone.find(c => c.zoneId === imp.zoneId)?._count || 0;
      const ctr = imp._count > 0 ? (clicks / imp._count) * 100 : 0;
      return {
        zoneId: imp.zoneId,
        zoneName: zone?.name || 'Desconhecido',
        zoneSlug: zone?.slug || '',
        impressions: imp._count,
        clicks,
        ctr: Math.round(ctr * 100) / 100,
      };
    });

    // Get impressions by ad type
    const impressionsByType = await prisma.adImpression.groupBy({
      by: ['adType'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    // Get campaign metrics
    const campaigns = await prisma.adCampaign.findMany({
      select: {
        id: true,
        name: true,
        impressions: true,
        clicks: true,
        conversions: true,
        status: true,
      },
      orderBy: { impressions: 'desc' },
      take: 10,
    });

    // Estimate revenue (based on CPM)
    const globalSettings = await prisma.adGlobalSettings.findFirst();
    const cpm = globalSettings?.estimatedCpm || 1.0;
    const estimatedRevenue = (totalImpressions / 1000) * cpm;

    // Daily impressions for chart
    const dailyImpressions = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "AdImpression"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

    return NextResponse.json({
      summary: {
        totalImpressions,
        totalClicks,
        ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
        estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
      },
      zoneMetrics: zoneMetrics.sort((a, b) => b.impressions - a.impressions),
      impressionsByType: impressionsByType.map(i => ({
        type: i.adType,
        count: i._count,
      })),
      topCampaigns: campaigns.map(c => ({
        ...c,
        ctr: c.impressions > 0 ? Math.round((c.clicks / c.impressions) * 10000) / 100 : 0,
      })),
      dailyImpressions: dailyImpressions.map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
    });
  } catch (error) {
    console.error('Error fetching ad metrics:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
