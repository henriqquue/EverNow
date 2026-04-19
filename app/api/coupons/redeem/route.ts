import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { calculateCouponDiscount } from '@/lib/coupons';

// POST - Redeem coupon (create redemption record)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { couponId, planSlug, billingInterval, amount, complete } = body;

    // Get coupon
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    // Calculate discount
    const discount = calculateCouponDiscount(coupon, amount);

    // Check for existing redemption
    const existingRedemption = await prisma.couponRedemption.findFirst({
      where: {
        couponId,
        userId,
        isCompleted: false,
      },
    });

    if (existingRedemption && !complete) {
      // Update existing redemption
      const updated = await prisma.couponRedemption.update({
        where: { id: existingRedemption.id },
        data: {
          planSlug,
          billingInterval,
          originalAmount: discount.originalAmount,
          discountAmount: discount.discountAmount,
          finalAmount: discount.finalAmount,
        },
      });
      return NextResponse.json(updated);
    }

    if (complete && existingRedemption) {
      // Mark as completed
      const completed = await prisma.couponRedemption.update({
        where: { id: existingRedemption.id },
        data: { isCompleted: true },
      });

      // Update coupon usage count
      await prisma.coupon.update({
        where: { id: couponId },
        data: { currentUses: { increment: 1 } },
      });

      return NextResponse.json(completed);
    }

    // Create new redemption
    const redemption = await prisma.couponRedemption.create({
      data: {
        couponId,
        userId,
        planSlug,
        billingInterval,
        originalAmount: discount.originalAmount,
        discountAmount: discount.discountAmount,
        finalAmount: discount.finalAmount,
        isCompleted: complete || false,
      },
    });

    // If completed, update coupon usage
    if (complete) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { currentUses: { increment: 1 } },
      });
    }

    return NextResponse.json(redemption);
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json({ error: 'Erro ao resgatar cupom' }, { status: 500 });
  }
}
