import { Suspense } from 'react';
import prisma from '@/lib/db';
import PlansPage from '@/components/commercial/plans-page';

async function getPlansData() {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        status: 'ACTIVE',
        showOnLanding: true
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
      },
      orderBy: { order: 'asc' }
    });

    return { plans };
  } catch (error) {
    console.error('Error fetching plans:', error);
    return { plans: [] };
  }
}

export default async function PlansRoute() {
  const data = await getPlansData();
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <PlansPage plans={data.plans} />
    </Suspense>
  );
}
