import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/admin/moderation - Get moderation action history
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const targetUserId = searchParams.get('userId');

    const where: any = {};
    if (targetUserId) {
      where.targetUserId = targetUserId;
    }

    const [actions, total] = await Promise.all([
      prisma.moderationAction.findMany({
        where,
        include: {
          targetUser: {
            select: { id: true, name: true, email: true },
          },
          moderator: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.moderationAction.count({ where }),
    ]);

    return NextResponse.json({ actions, total, page, limit });
  } catch (error: any) {
    console.error('Moderation history error:', error);
    return NextResponse.json(
      { error: 'Falha ao listar histórico de moderação' },
      { status: 500 }
    );
  }
}
