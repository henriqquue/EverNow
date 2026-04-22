import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';

/**
 * GET /api/admin/lgpd/requests
 * Lista todas as requisições LGPD (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { email: session.user.email! },
    });

    if (admin?.role !== 'ADMIN' && admin?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Build filters
    const where: any = {};
    if (status) where.status = status;
    if (type) where.requestType = type;

    // Fetch requests
    const [requests, total] = await Promise.all([
      db.lGPDRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      db.lGPDRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('LGPD requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/lgpd/requests
 * Criar uma nova requisição LGPD (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await db.user.findUnique({
      where: { email: session.user.email! },
    });

    if (admin?.role !== 'ADMIN' && admin?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, requestType, reason } = body;

    if (!userId || !requestType) {
      return NextResponse.json(
        { error: 'userId and requestType are required' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Criar requisição
    const request = await db.lGPDRequest.create({
      data: {
        userId,
        requestType,
        reason,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Create LGPD request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
