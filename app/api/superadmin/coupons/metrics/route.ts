import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// GET - Get coupon metrics
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

    // Total redemptions
    const totalRedemptions = await prisma.couponRedemption.count({
      where: { createdAt: { gte: startDate } },
    });

    // Completed redemptions
    const completedRedemptions = await prisma.couponRedemption.count({
      where: {
        createdAt: { gte: startDate },
        isCompleted: true,
      },
    });

    // Total discount given
    const discountSum = await prisma.couponRedemption.aggregate({
      where: {
        createdAt: { gte: startDate },
        isCompleted: true,
      },
      _sum: {
        discountAmount: true,
      },
    });

    // Revenue generated (finalAmount from completed redemptions)
    const revenueSum = await prisma.couponRedemption.aggregate({
      where: {
        createdAt: { gte: startDate },
        isCompleted: true,
      },
      _sum: {
        finalAmount: true,
      },
    });

    // Top coupons by usage
    const topCoupons = await prisma.couponRedemption.groupBy({
      by: ['couponId'],
      where: {
        createdAt: { gte: startDate },
        isCompleted: true,
      },
      _count: true,
      _sum: {
        discountAmount: true,
        finalAmount: true,
      },
      orderBy: {
        _count: {
          couponId: 'desc',
        },
      },
      take: 10,
    });

    // Get coupon details
    const couponIds = topCoupons.map(c => c.couponId);
    const coupons = await prisma.coupon.findMany({
      where: { id: { in: couponIds } },
    });
    const couponsMap = new Map(coupons.map(c => [c.id, c]));

    // Active coupons count
    const activeCoupons = await prisma.coupon.count({
      where: { status: 'ACTIVE' },
    });

    // Daily redemptions for chart
    const dailyRedemptions = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "CouponRedemption"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

    return NextResponse.json({
      summary: {
        totalRedemptions,
        completedRedemptions,
        conversionRate: totalRedemptions > 0 ? Math.round((completedRedemptions / totalRedemptions) * 100) : 0,
        totalDiscount: Math.round((discountSum._sum.discountAmount || 0) * 100) / 100,
        revenueGenerated: Math.round((revenueSum._sum.finalAmount || 0) * 100) / 100,
        activeCoupons,
      },
      topCoupons: topCoupons.map(c => {
        const coupon = couponsMap.get(c.couponId);
        return {
          couponId: c.couponId,
          code: coupon?.code || 'Desconhecido',
          name: coupon?.name || '',
          redemptions: c._count,
          totalDiscount: Math.round((c._sum.discountAmount || 0) * 100) / 100,
          revenueGenerated: Math.round((c._sum.finalAmount || 0) * 100) / 100,
        };
      }),
      dailyRedemptions: dailyRedemptions.map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
    });
  } catch (error) {
    console.error('Error fetching coupon metrics:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
