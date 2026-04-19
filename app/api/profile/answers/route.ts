import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { calculateProfileCompleteness } from '@/lib/profile-completeness';

// GET /api/profile/answers - Obter respostas do usuário atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const answers = await prisma.userProfileAnswer.findMany({
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
    const grouped: Record<string, { optionId: string; value: string | null; values: string[] }[]> = {};
    for (const answer of answers) {
      const catSlug = answer.option.category.slug;
      if (!grouped[catSlug]) {
        grouped[catSlug] = [];
      }
      grouped[catSlug].push({
        optionId: answer.optionId,
        value: answer.value,
        values: answer.values,
      });
    }

    return NextResponse.json({ answers: grouped });
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar respostas' },
      { status: 500 }
    );
  }
}

// POST /api/profile/answers - Salvar respostas do usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body; // { optionId: string, value?: string, values?: string[] }[]

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    // Sync: Deletar todas as respostas anteriores para garantir que opções removidas sumam
    await prisma.userProfileAnswer.deleteMany({
      where: { userId: session.user.id }
    });

    // Inserir as novas
    if (answers.length > 0) {
      await prisma.userProfileAnswer.createMany({
        data: answers.map(answer => ({
          userId: session.user.id,
          optionId: answer.optionId,
          value: answer.value || null,
          values: answer.values || [],
        }))
      });
    }

    // Recalcular progresso do perfil
    const completeness = await calculateProfileCompleteness(session.user.id);

    // Atualizar progresso no usuário
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileComplete: completeness },
    });

    return NextResponse.json({ success: true, profileComplete: completeness });
  } catch (error) {
    console.error('Erro ao salvar respostas:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar respostas' },
      { status: 500 }
    );
  }
}
