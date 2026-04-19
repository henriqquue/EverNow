import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// GET /api/profile/onboarding - Obter progresso do onboarding
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId: session.user.id,
          completedSteps: [],
          skippedSteps: [],
          currentStep: 'basico',
          isComplete: false,
          completionRate: 0,
        },
      });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar progresso' },
      { status: 500 }
    );
  }
}

// POST /api/profile/onboarding - Atualizar progresso do onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { completedStep, skippedStep, currentStep, isComplete } = body;

    const currentProgress = await prisma.onboardingProgress.findUnique({
      where: { userId: session.user.id },
    });

    const completedSteps = currentProgress?.completedSteps || [];
    const skippedSteps = currentProgress?.skippedSteps || [];

    if (completedStep && !completedSteps.includes(completedStep)) {
      completedSteps.push(completedStep);
    }

    if (skippedStep && !skippedSteps.includes(skippedStep)) {
      skippedSteps.push(skippedStep);
    }

    // Calcular taxa de conclusão
    const totalCategories = await prisma.profileCategory.count({
      where: { status: 'ACTIVE' },
    });
    const completionRate = totalCategories > 0 
      ? Math.round((completedSteps.length / totalCategories) * 100) 
      : 0;

    const progress = await prisma.onboardingProgress.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        completedSteps,
        skippedSteps,
        currentStep: currentStep || 'basico',
        isComplete: isComplete || false,
        completionRate,
      },
      update: {
        completedSteps,
        skippedSteps,
        currentStep: currentStep || undefined,
        isComplete: isComplete || undefined,
        completionRate,
      },
    });

    // Se onboarding completo, atualizar usuário
    if (isComplete) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { onboardingComplete: true },
      });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar progresso' },
      { status: 500 }
    );
  }
}
