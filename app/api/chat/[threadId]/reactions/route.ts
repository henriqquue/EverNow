import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// POST /api/chat/[threadId]/reactions - Toggle a reaction on a message
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
    const { messageId, emoji } = await request.json();

    if (!messageId || !emoji) {
      return NextResponse.json(
        { error: 'messageId and emoji are required' },
        { status: 400 }
      );
    }

    // Validate emoji (only allow a safe set)
    const allowedEmojis = ['\u2764\ufe0f', '\ud83d\ude02', '\ud83d\ude2e', '\ud83d\udc4d', '\ud83d\ude22', '\ud83d\udd25'];
    if (!allowedEmojis.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    // Verify access (only ACTIVE matches)
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        match: {
          status: 'ACTIVE',
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id },
          ],
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.threadId !== threadId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Toggle reaction
    const reactions = (message.reactions as Record<string, string[]>) || {};
    const userList = reactions[emoji] || [];
    const userIndex = userList.indexOf(session.user.id);

    if (userIndex >= 0) {
      userList.splice(userIndex, 1);
      if (userList.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = userList;
      }
    } else {
      reactions[emoji] = [...userList, session.user.id];
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { reactions: Object.keys(reactions).length > 0 ? reactions as any : Prisma.DbNull },
    });

    return NextResponse.json({ success: true, reactions });
  } catch (error: any) {
    console.error('Reaction error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle reaction' },
      { status: 500 }
    );
  }
}
