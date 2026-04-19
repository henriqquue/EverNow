import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

// Registrar evento comercial público
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, page, planId, planSlug, source, medium, campaign, sessionId, metadata } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 });
    }

    // Verificar se usuário está logado
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    const event = await prisma.commercialEvent.create({
      data: {
        eventType,
        page,
        planId,
        planSlug,
        source,
        medium,
        campaign,
        sessionId,
        userId,
        metadata
      }
    });

    return NextResponse.json({ success: true, id: event.id }, { status: 201 });
  } catch (error) {
    console.error('Error recording commercial event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Buscar eventos (apenas SuperAdmin)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const events = await prisma.commercialEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Agregar métricas
    const metrics = await prisma.commercialEvent.groupBy({
      by: ['eventType'],
      _count: true,
      where: where.createdAt ? { createdAt: where.createdAt } : undefined
    });

    return NextResponse.json({ events, metrics });
  } catch (error) {
    console.error('Error fetching commercial events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
