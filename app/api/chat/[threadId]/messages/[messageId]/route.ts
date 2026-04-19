import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// DELETE /api/chat/[threadId]/messages/[messageId] - Delete a message
export async function DELETE(
  request: Request,
  { params }: { params: { threadId: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId, messageId } = params;
    const { searchParams } = new URL(request.url);
    const forAll = searchParams.get('type') === 'all';

    // Verify thread access (only ACTIVE matches)
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

    if (forAll) {
      // Only sender can delete for all, and only within 1 hour
      if (message.senderId !== session.user.id) {
        return NextResponse.json(
          { error: 'Apenas o remetente pode apagar para todos' },
          { status: 403 }
        );
      }
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(message.createdAt) < oneHourAgo) {
        return NextResponse.json(
          { error: 'Só é possível apagar para todos até 1 hora após envio' },
          { status: 400 }
        );
      }
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: { deletedForAll: true, content: '' },
      });
    } else {
      // Delete for current user only
      if (message.senderId === session.user.id) {
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: { deletedForSender: true },
        });
      } else {
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: { deletedForReceiver: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Message delete error:', error);
    return NextResponse.json(
      { error: 'Falha ao apagar mensagem' },
      { status: 500 }
    );
  }
}
