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

    const userId = session.user.id;

    // Run queries in parallel for better performance
    const [
      likesReceived,
      profileViews,
      connections,
      activeConversations,
      user
    ] = await Promise.all([
      // 1. Curtidas recebidas (LIKE or SUPERLIKE)
      prisma.like.count({
        where: {
          toUserId: userId,
          type: { in: ['LIKE', 'SUPERLIKE'] }
        }
      }),
      
      // 2. Visualizações do perfil
      prisma.profileView.count({
        where: {
          viewedUserId: userId
        }
      }),
      
      // 3. Conexões (Matches ativos)
      prisma.match.count({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ],
          status: 'ACTIVE'
        }
      }),
      
      // 4. Conversas ativas (Threads com mensagens)
      prisma.chatThread.count({
        where: {
          match: {
            OR: [
              { user1Id: userId },
              { user2Id: userId }
            ],
            status: 'ACTIVE'
          },
          lastMessageAt: { not: null }
        }
      }),
      
      // 5. Progresso do perfil
      prisma.user.findUnique({
        where: { id: userId },
        select: { profileComplete: true }
      })
    ]);

    return NextResponse.json({
      likesReceived,
      profileViews,
      connections,
      activeConversations,
      profileCompletion: user?.profileComplete || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
