export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';

// GET /api/chat - Get all chat threads for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const threads = await prisma.chatThread.findMany({
      where: {
        match: {
          status: 'ACTIVE',
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id }
          ]
        }
      },
      include: {
        match: {
          include: {
            user1: {
              select: {
                id: true,
                name: true,
                nickname: true,
                lastLoginAt: true,
                showOnlineStatus: true,
                userPhotos: { take: 1, orderBy: { order: 'asc' } }
              }
            },
            user2: {
              select: {
                id: true,
                name: true,
                nickname: true,
                lastLoginAt: true,
                showOnlineStatus: true,
                userPhotos: { take: 1, orderBy: { order: 'asc' } }
              }
            }
          }
        },
        messages: {
          where: {
            senderId: { not: session.user.id },
            status: { not: 'READ' }
          },
          select: { id: true }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    // Format threads
    const formattedThreads = threads.map(thread => {
      const otherUser = thread.match.user1Id === session.user.id
        ? thread.match.user2
        : thread.match.user1;

      const isOnline = (otherUser as any).showOnlineStatus !== false && otherUser.lastLoginAt
        ? Date.now() - new Date(otherUser.lastLoginAt).getTime() < 24 * 60 * 60 * 1000
        : false;

      return {
        id: thread.id,
        matchId: thread.matchId,
        lastMessage: thread.lastMessage,
        lastMessageAt: thread.lastMessageAt,
        unreadCount: thread.messages.length,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          nickname: otherUser.nickname,
          photo: otherUser.userPhotos[0]?.url || null,
          isOnline
        }
      };
    });

    // Apply search filter
    const filtered = search
      ? formattedThreads.filter(t =>
          t.otherUser.name?.toLowerCase().includes(search.toLowerCase()) ||
          t.otherUser.nickname?.toLowerCase().includes(search.toLowerCase())
        )
      : formattedThreads;

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

