import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { calculateCompatibility, generateCompatibilityExplanation, type UserProfileData } from '@/lib/compatibility-engine';

// GET /api/compatibility/[userId] - Calcular compatibilidade com outro usuário
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { userId: targetUserId } = params;

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: 'Não é possível calcular compatibilidade consigo mesmo' }, { status: 400 });
    }

    // Verificar cache
    const cached = await prisma.compatibilityCache.findUnique({
      where: {
        userId_targetUserId: {
          userId: session.user.id,
          targetUserId,
        },
      },
    });

    if (cached && new Date(cached.expiresAt) > new Date()) {
      return NextResponse.json({
        compatibility: {
          overallScore: cached.overallScore,
          overallPercentage: Math.round(cached.overallScore),
          categoryScores: cached.categoryScores,
          explanation: generateCompatibilityExplanation({
            overallScore: cached.overallScore,
            overallPercentage: Math.round(cached.overallScore),
            categoryScores: cached.categoryScores as any,
            explanations: cached.explanation as string[],
            highlights: [],
          }),
        },
        cached: true,
      });
    }

    // Buscar dados dos dois usuários
    const [currentUserData, targetUserData] = await Promise.all([
      getUserProfileData(session.user.id),
      getUserProfileData(targetUserId),
    ]);

    if (!currentUserData || !targetUserData) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Buscar pesos customizados
    const weights = await prisma.compatibilityWeight.findMany({
      include: { category: true },
    });

    const customWeights: Record<string, { weight: number; boostMatch: number; penalty: number }> = {};
    for (const w of weights) {
      customWeights[w.category.slug] = {
        weight: w.weight,
        boostMatch: w.boostMatch,
        penalty: w.penalty,
      };
    }

    // Calcular compatibilidade
    const result = calculateCompatibility(
      currentUserData,
      targetUserData,
      Object.keys(customWeights).length > 0 ? customWeights : undefined
    );

    // Salvar no cache (expira em 24h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.compatibilityCache.upsert({
      where: {
        userId_targetUserId: {
          userId: session.user.id,
          targetUserId,
        },
      },
      create: {
        userId: session.user.id,
        targetUserId,
        overallScore: result.overallPercentage,
        categoryScores: result.categoryScores as any,
        explanation: result.explanations as any,
        expiresAt,
      },
      update: {
        overallScore: result.overallPercentage,
        categoryScores: result.categoryScores as any,
        explanation: result.explanations as any,
        calculatedAt: new Date(),
        expiresAt,
      },
    });

    return NextResponse.json({
      compatibility: {
        ...result,
        explanation: generateCompatibilityExplanation(result),
      },
      cached: false,
    });
  } catch (error) {
    console.error('Erro ao calcular compatibilidade:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular compatibilidade' },
      { status: 500 }
    );
  }
}

async function getUserProfileData(userId: string): Promise<UserProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profileAnswers: {
        include: {
          option: {
            include: { category: true },
          },
        },
      },
      preferences: {
        include: {
          option: {
            include: { category: true },
          },
        },
      },
    },
  });

  if (!user) return null;

  // Agrupar respostas por categoria
  const answers: Record<string, string[]> = {};
  for (const answer of user.profileAnswers) {
    const catSlug = answer.option.category.slug;
    if (!answers[catSlug]) {
      answers[catSlug] = [];
    }
    if (answer.value) {
      answers[catSlug].push(answer.value);
    }
    if (answer.values.length > 0) {
      answers[catSlug].push(...answer.values);
    }
  }

  // Agrupar preferências por categoria
  const preferences: Record<string, { values: string[]; importance: string }> = {};
  for (const pref of user.preferences) {
    const catSlug = pref.option.category.slug;
    preferences[catSlug] = {
      values: pref.values,
      importance: pref.importance,
    };
  }

  return {
    userId,
    answers,
    preferences,
  };
}
