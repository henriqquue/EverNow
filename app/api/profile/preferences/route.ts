import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// GET /api/profile/preferences - Obter preferências do usuário atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const preferences = await prisma.userPreference.findMany({
      where: { userId: session.user.id },
      include: {
        option: {
          include: {
            category: true,
          },
        },
      },
    });

    // Agrupar por categoria
    const grouped: Record<string, { optionId: string; values: string[]; importance: string }[]> = {};
    for (const pref of preferences) {
      const catSlug = pref.option.category.slug;
      if (!grouped[catSlug]) {
        grouped[catSlug] = [];
      }
      grouped[catSlug].push({
        optionId: pref.optionId,
        values: pref.values,
        importance: pref.importance,
      });
    }

    return NextResponse.json({ preferences: grouped });
  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar preferências' },
      { status: 500 }
    );
  }
}

// POST /api/profile/preferences - Salvar preferências do usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body; // { optionId: string, values: string[], importance: string }[]

    if (!Array.isArray(preferences)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    // Upsert cada preferência
    for (const pref of preferences) {
      await prisma.userPreference.upsert({
        where: {
          userId_optionId: {
            userId: session.user.id,
            optionId: pref.optionId,
          },
        },
        create: {
          userId: session.user.id,
          optionId: pref.optionId,
          values: pref.values || [],
          importance: pref.importance || 'PREFERENCE',
        },
        update: {
          values: pref.values || [],
          importance: pref.importance || 'PREFERENCE',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar preferências' },
      { status: 500 }
    );
  }
}
