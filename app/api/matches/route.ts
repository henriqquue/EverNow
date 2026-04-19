import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/matches - Get user's matches
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ACTIVE';

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ],
        status: status as any
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            nickname: true,
            birthDate: true,
            city: true,
            lastLoginAt: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } }
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            nickname: true,
            birthDate: true,
            city: true,
            lastLoginAt: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } }
          }
        },
        chatThread: {
          select: {
            id: true,
            lastMessage: true,
            lastMessageAt: true,
            messages: {
              where: {
                senderId: { not: session.user.id },
                status: { not: 'READ' }
              },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format matches to show the other user
    const formattedMatches = matches.map(match => {
      const otherUser = match.user1Id === session.user.id ? match.user2 : match.user1;
      const isOnline = otherUser.lastLoginAt 
        ? Date.now() - new Date(otherUser.lastLoginAt).getTime() < 24 * 60 * 60 * 1000
        : false;

      return {
        id: match.id,
        status: match.status,
        createdAt: match.createdAt,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          nickname: otherUser.nickname,
          age: otherUser.birthDate
            ? Math.floor((Date.now() - new Date(otherUser.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null,
          city: otherUser.city,
          photo: otherUser.userPhotos[0]?.url || null,
          isOnline
        },
        chatThread: match.chatThread ? {
          id: match.chatThread.id,
          lastMessage: match.chatThread.lastMessage,
          lastMessageAt: match.chatThread.lastMessageAt,
          unreadCount: match.chatThread.messages.length
        } : null
      };
    });

    return NextResponse.json(formattedMatches);
  } catch (error: any) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

// DELETE /api/matches - Unmatch
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('id');

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Verify user is part of the match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      }
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Update match status
    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'UNMATCHED' }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error unmatching:', error);
    return NextResponse.json(
      { error: 'Failed to unmatch' },
      { status: 500 }
    );
  }
}
