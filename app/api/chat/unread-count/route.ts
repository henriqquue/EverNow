export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unreadCount = await prisma.chatMessage.count({
      where: {
        thread: {
          match: {
            OR: [
              { user1Id: session.user.id },
              { user2Id: session.user.id }
            ],
            status: 'ACTIVE'
          }
        },
        senderId: { not: session.user.id },
        status: { not: 'READ' }
      }
    });

    return NextResponse.json({ unreadCount });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

