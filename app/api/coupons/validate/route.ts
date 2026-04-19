import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { calculateCouponDiscount } from '@/lib/coupons';

// POST - Validate and apply coupon
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await request.json();
    const { code, planSlug, billingInterval, amount } = body;

    if (!code || !planSlug || amount === undefined) {
      return NextResponse.json({ valid: false, error: 'Dados incompletos' }, { status: 400 });
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Cupom não encontrado' });
    }

    // Check status
    if (coupon.status !== 'ACTIVE') {
      return NextResponse.json({ valid: false, error: 'Cupom inativo' });
    }

    // Check dates
    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ valid: false, error: 'Cupom ainda não está válido' });
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json({ valid: false, error: 'Cupom expirado' });
    }

    // Check max uses
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: 'Cupom esgotado' });
    }

    // Check user usage limit
    if (userId) {
      const userRedemptions = await prisma.couponRedemption.count({
        where: {
          couponId: coupon.id,
          userId,
        },
      });

      if (userRedemptions >= coupon.maxUsesPerUser) {
        return NextResponse.json({ valid: false, error: 'Você já usou este cupom' });
      }
    }

    // Check applicable plans
    if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(planSlug)) {
      return NextResponse.json({ valid: false, error: 'Cupom não válido para este plano' });
    }

    // Check applicable intervals
    if (coupon.applicableIntervals.length > 0 && billingInterval && !coupon.applicableIntervals.includes(billingInterval)) {
      return NextResponse.json({ valid: false, error: 'Cupom não válido para este período' });
    }

    // Check minimum amount
    if (coupon.minAmount && amount < coupon.minAmount) {
      return NextResponse.json({ 
        valid: false, 
        error: `Valor mínimo: R$ ${coupon.minAmount.toFixed(2)}` 
      });
    }

    // Calculate discount
    const discount = calculateCouponDiscount(coupon, amount);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        discountPercent: coupon.discountPercent,
        discountAmount: coupon.discountAmount,
        trialDays: coupon.trialDays,
      },
      discount,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ valid: false, error: 'Erro ao validar cupom' }, { status: 500 });
  }
}
