import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';
import { trackDiscoveryEvent } from '@/lib/discovery-engine';

// POST /api/block - Block a user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if already blocked
    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedUserId: {
          blockerId: session.user.id,
          blockedUserId: userId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyBlocked: true });
    }

    // Create block
    await prisma.block.create({
      data: {
        blockerId: session.user.id,
        blockedUserId: userId,
        reason
      }
    });

    // Update any active match to BLOCKED status
    const [id1, id2] = [session.user.id, userId].sort();
    await prisma.match.updateMany({
      where: {
        user1Id: id1,
        user2Id: id2,
        status: 'ACTIVE'
      },
      data: { status: 'BLOCKED' }
    });

    // Track event
    await trackEvent({
      userId: session.user.id,
      eventType: 'profile_blocked',
      eventData: { blockedUserId: userId }
    });

    // Track discovery event for behavioral learning
    trackDiscoveryEvent(session.user.id, userId, 'BLOCK').catch(err => {
      console.error('Discovery block event error:', err);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    );
  }
}

// DELETE /api/block - Unblock a user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.block.deleteMany({
      where: {
        blockerId: session.user.id,
        blockedUserId: userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}

// GET /api/block - Get blocked users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blocks = await prisma.block.findMany({
      where: { blockerId: session.user.id },
      include: {
        blockedUser: {
          select: {
            id: true,
            name: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(blocks);
  } catch (error: any) {
    console.error('Error fetching blocked users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked users' },
      { status: 500 }
    );
  }
}
