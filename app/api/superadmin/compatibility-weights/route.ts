import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { DEFAULT_COMPATIBILITY_WEIGHTS } from '@/lib/profile-data';

// GET /api/superadmin/compatibility-weights - Listar pesos de compatibilidade
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const categories = await prisma.profileCategory.findMany({
      include: {
        weights: true,
      },
      orderBy: { order: 'asc' },
    });

    // Combinar com pesos padrão
    const weightsWithDefaults = categories.map((cat: any) => {
      const savedWeight = cat.weights[0];
      const defaultWeight = DEFAULT_COMPATIBILITY_WEIGHTS[cat.slug as keyof typeof DEFAULT_COMPATIBILITY_WEIGHTS];
      
      return {
        categoryId: cat.id,
        categorySlug: cat.slug,
        categoryName: cat.name,
        weight: savedWeight?.weight ?? defaultWeight?.weight ?? 1.0,
        boostMatch: savedWeight?.boostMatch ?? defaultWeight?.boostMatch ?? 0.1,
        penalty: savedWeight?.penalty ?? defaultWeight?.penalty ?? 0.1,
        hasCustomWeight: !!savedWeight,
      };
    });

    return NextResponse.json({ weights: weightsWithDefaults });
  } catch (error) {
    console.error('Erro ao buscar pesos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pesos' },
      { status: 500 }
    );
  }
}

// POST /api/superadmin/compatibility-weights - Atualizar pesos
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { weights } = body;

    if (!Array.isArray(weights)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    // Atualizar cada peso
    for (const w of weights) {
      await prisma.compatibilityWeight.upsert({
        where: { categoryId: w.categoryId },
        create: {
          categoryId: w.categoryId,
          weight: w.weight,
          boostMatch: w.boostMatch,
          penalty: w.penalty,
        },
        update: {
          weight: w.weight,
          boostMatch: w.boostMatch,
          penalty: w.penalty,
        },
      });
    }

    // Invalidar cache de compatibilidade
    await prisma.compatibilityCache.deleteMany({});

    // Registrar evento
    await prisma.analyticsEvent.create({
      data: {
        userId: session.user.id,
        eventType: 'COMPATIBILITY_WEIGHTS_UPDATED',
        eventData: { updatedCount: weights.length },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar pesos:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pesos' },
      { status: 500 }
    );
  }
}
