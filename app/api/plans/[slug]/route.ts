import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const plan = await prisma.plan.findFirst({
      where: {
        slug,
        status: 'ACTIVE'
      },
      include: {
        planIntervals: {
          where: { isActive: true },
          orderBy: { interval: 'asc' }
        },
        featureLimits: {
          where: { showInComparison: true },
          include: {
            feature: {
              include: { module: true }
            }
          },
          orderBy: { comparisonOrder: 'asc' }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
