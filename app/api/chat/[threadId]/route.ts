import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';
import { checkFeatureEntitlement } from '@/lib/entitlement-service';
import { notifyUser } from '@/lib/notification-service';

// GET /api/chat/[threadId] - Get messages for a thread
export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verify user has access to this thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
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
                userPhotos: { take: 1, orderBy: { order: 'asc' } }
              }
            },
            user2: {
              select: {
                id: true,
                name: true,
                nickname: true,
                lastLoginAt: true,
                userPhotos: { take: 1, orderBy: { order: 'asc' } }
              }
            }
          }
        }
      }
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Get messages (exclude deleted-for-sender for current user, exclude deleted-for-all for everyone)
    const messages = await prisma.chatMessage.findMany({
      where: {
        threadId,
        deletedForAll: false,
        NOT: {
          OR: [
            {
              AND: [
                { senderId: session.user.id },
                { deletedForSender: true },
              ],
            },
            {
              AND: [
                { senderId: { not: session.user.id } },
                { deletedForReceiver: true },
              ],
            },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: { select: { name: true } },
          },
        },
      },
    });

    // Mark unread messages as read
    await prisma.chatMessage.updateMany({
      where: {
        threadId,
        senderId: { not: session.user.id },
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    const otherUser = thread.match.user1Id === session.user.id
      ? thread.match.user2
      : thread.match.user1;

    // Check if the other user allows read receipts (privacy control)
    const otherUserPrivacy = await prisma.user.findUnique({
      where: { id: otherUser.id },
      select: { showReadReceipts: true, showOnlineStatus: true, showLastActive: true },
    });

    const isOnline = otherUserPrivacy?.showOnlineStatus !== false && otherUser.lastLoginAt
      ? Date.now() - new Date(otherUser.lastLoginAt).getTime() < 24 * 60 * 60 * 1000
      : false;

    // Format messages, respecting read receipt privacy
    const formattedMessages = messages.reverse().map((msg: any) => {
      const formatted = { ...msg };
      // If other user disabled read receipts, don't show read status for our messages
      if (msg.senderId === session.user.id && otherUserPrivacy?.showReadReceipts === false) {
        if (formatted.status === 'READ') {
          formatted.status = 'DELIVERED';
        }
        formatted.readAt = null;
      }
      return formatted;
    });

    return NextResponse.json({
      thread: {
        id: thread.id,
        matchId: thread.matchId,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          nickname: otherUser.nickname,
          photo: otherUser.userPhotos[0]?.url || null,
          isOnline,
        },
      },
      messages: formattedMessages,
      hasMore: messages.length === limit,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/[threadId] - Send a message
export async function POST(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = params;
    const { content, attachmentType, attachmentUrl, replyToId } = await request.json();

    if (!content && !attachmentUrl) {
      return NextResponse.json(
        { error: 'Message content or attachment is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this thread
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        match: {
          status: 'ACTIVE',
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id }
          ]
        }
      },
      include: {
        match: true
      }
    });

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found or inactive' },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        threadId,
        senderId: session.user.id,
        content: content || '',
        attachmentType,
        attachmentUrl,
        replyToId: replyToId || null,
        status: 'SENT',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            sender: { select: { name: true } },
          },
        },
      },
    });

    // Update thread's last message
    await prisma.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessage: content || '[Anexo]',
        lastMessageAt: new Date()
      }
    });

    // Create notification for the recipient
    const recipientId = thread.match.user1Id === session.user.id ? thread.match.user2Id : thread.match.user1Id;
    await notifyUser(recipientId, {
      type: 'message',
      title: `Nova mensagem de ${session.user.name}`,
      message: content ? (content.length > 50 ? content.substring(0, 47) + '...' : content) : 'Enviou um anexo',
      metadata: { 
        link: `/app/conversas`,
        avatarUrl: (message.sender as any).userPhotos[0]?.url || null
      }
    });


    // Track event
    await trackEvent({
      userId: session.user.id,
      eventType: 'message_sent',
      eventData: { threadId }
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
