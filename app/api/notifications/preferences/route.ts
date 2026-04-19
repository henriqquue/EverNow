import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const NOTIF_FIELDS = ['notifyMatches', 'notifyMessages', 'notifyLikes', 'notifyMarketing'] as const;

// GET - get notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notifyMatches: true,
        notifyMessages: true,
        notifyLikes: true,
        notifyMarketing: true,
      },
    });

    return NextResponse.json({ preferences: user });
  } catch (error: any) {
    console.error('Notification prefs error:', error);
    return NextResponse.json({ error: 'Falha ao buscar preferências' }, { status: 500 });
  }
}

// PUT - update notification preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data: Record<string, boolean> = {};
    for (const field of NOTIF_FIELDS) {
      if (typeof body[field] === 'boolean') {
        data[field] = body[field];
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notification prefs update error:', error);
    return NextResponse.json({ error: 'Falha ao atualizar preferências' }, { status: 500 });
  }
}
