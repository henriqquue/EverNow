import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { calculateBirthChart } from '@/lib/astrology';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Astrology API] Request body:', body);
    const { birthDate, birthTime, birthPlace } = body;

    if (!birthDate) {
      return NextResponse.json({ error: 'Data de nascimento é obrigatória' }, { status: 400 });
    }

    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Data de nascimento inválida' }, { status: 400 });
    }

    const chart = calculateBirthChart(date, birthTime, birthPlace);
    console.log('[Astrology API] Chart generated:', chart);

    return NextResponse.json({ chart });
  } catch (error: any) {
    console.error('Erro ao calcular mapa astral:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular mapa astral', details: error.message },
      { status: 500 }
    );
  }
}
