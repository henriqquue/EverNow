import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// GET - List all coupons
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Create new coupon
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      type,
      discountPercent,
      discountAmount,
      trialDays,
      applicablePlans,
      applicableIntervals,
      minAmount,
      maxUses,
      maxUsesPerUser,
      startsAt,
      expiresAt,
      status,
    } = body;

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Código já existe' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        type: type || 'PERCENTAGE',
        discountPercent,
        discountAmount,
        trialDays,
        applicablePlans: applicablePlans || [],
        applicableIntervals: applicableIntervals || [],
        minAmount,
        maxUses,
        maxUsesPerUser: maxUsesPerUser ?? 1,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 });
  }
}

// PUT - Update coupon
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, code, startsAt, expiresAt, ...data } = body;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        code: code?.toUpperCase(),
        startsAt: startsAt ? new Date(startsAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cupom' }, { status: 500 });
  }
}

// DELETE - Delete coupon
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

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Erro ao deletar cupom' }, { status: 500 });
  }
}
