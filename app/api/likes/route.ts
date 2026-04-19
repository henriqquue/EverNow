import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';
import { checkFeatureEntitlement, consumeFeatureUsage } from '@/lib/entitlement-service';
import { trackDiscoveryEvent } from '@/lib/discovery-engine';
import { notifyUser } from '@/lib/notification-service';

// POST /api/likes - Send a like, super like, or dislike
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId, type, isPrivate } = await request.json();

    if (!targetUserId || !type) {
      return NextResponse.json(
        { error: 'Target user ID and type are required' },
        { status: 400 }
      );
    }

    // Fetch current user with photo
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        name: true,
        verificationStatus: true,
        userPhotos: { take: 1, orderBy: { order: 'asc' } }
      }
    });
    const currentUserPhoto = currentUser?.userPhotos[0]?.url || null;

    // --- ENTITLEMENT ENFORCEMENT ---
    // Check and consume feature usage for likes/superlikes
    if (type === 'LIKE' || type === 'SUPERLIKE') {
      const featureSlug = type === 'SUPERLIKE' ? 'super_curtidas_por_dia' : 'curtidas_por_dia';

      // Check if already liked (updates don't consume quota)
      const existingLikeCheck = await prisma.like.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: session.user.id,
            toUserId: targetUserId
          }
        }
      });

      if (!existingLikeCheck) {
        // Only enforce limit for new likes, not updates
        const consumeResult = await consumeFeatureUsage(session.user.id, featureSlug);
        if (!consumeResult.success) {
          return NextResponse.json({
            error: consumeResult.error || 'Limite atingido',
            code: 'LIMIT_EXCEEDED',
            featureSlug,
            remaining: consumeResult.remaining,
            newUsage: consumeResult.newUsage,
          }, { status: 403 });
        }
      }
    }

    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: session.user.id,
          toUserId: targetUserId
        }
      }
    });

    if (existingLike) {
      // Update existing like
      await prisma.like.update({
        where: { id: existingLike.id },
        data: { type, isPrivate: isPrivate || false }
      });
    } else {
      // Create new like
      await prisma.like.create({
        data: {
          fromUserId: session.user.id,
          toUserId: targetUserId,
          type,
          isPrivate: isPrivate || false
        }
      });
    }

    // Track event
    const eventType = type === 'LIKE' ? 'like_sent' : type === 'SUPERLIKE' ? 'superlike_sent' : 'dislike_sent';
    await trackEvent({
      userId: session.user.id,
      eventType,
      eventData: { targetUserId, type }
    });

    // Track discovery event for behavioral learning
    const discoveryEventType = type === 'LIKE' ? 'LIKE' : type === 'SUPERLIKE' ? 'SUPERLIKE' : 'DISLIKE';
    trackDiscoveryEvent(session.user.id, targetUserId, discoveryEventType as any).catch(err => {
      console.error('Discovery event tracking error:', err);
    });

    // Check for mutual like (match)
    let match = null;
    if (type === 'LIKE' || type === 'SUPERLIKE') {
      const reciprocalLike = await prisma.like.findFirst({
        where: {
          fromUserId: targetUserId,
          toUserId: session.user.id,
          type: { in: ['LIKE', 'SUPERLIKE'] }
        }
      });

      if (reciprocalLike) {
        // Create match! (user1Id should be the smaller ID for consistency)
        const [user1Id, user2Id] = [session.user.id, targetUserId].sort();

        // Check if match already exists
        const existingMatch = await prisma.match.findUnique({
          where: {
            user1Id_user2Id: { user1Id, user2Id }
          }
        });

        if (!existingMatch) {
          match = await prisma.match.create({
            data: {
              user1Id,
              user2Id,
              status: 'ACTIVE'
            },
            include: {
              user1: { select: { id: true, name: true, userPhotos: { take: 1 } } },
              user2: { select: { id: true, name: true, userPhotos: { take: 1 } } }
            }
          });

          // Track match event
          await trackEvent({
            userId: session.user.id,
            eventType: 'match_created',
            eventData: { matchId: match.id, user1Id, user2Id }
          });

          // Track match discovery event
          trackDiscoveryEvent(session.user.id, targetUserId, 'MATCH' as any).catch(err => {
            console.error('Discovery match event error:', err);
          });

          // Create chat thread for the match
          await prisma.chatThread.create({
            data: {
              matchId: match.id
            }
          });

          // Create notifications for both users
          const targetUserPhoto = (targetUser as any).userPhotos?.[0]?.url || null;
          
          await notifyUser(session.user.id, {
            type: 'match',
            title: 'Novo Match!',
            message: `Você combinou com ${targetUser.name}!`,
            metadata: { 
              link: '/app/conversas',
              avatarUrl: targetUserPhoto
            }
          });

          await notifyUser(targetUserId, {
            type: 'match',
            title: 'Novo Match!',
            message: `Você combinou com ${session.user.name || 'alguém'}!`,
            metadata: { 
              link: '/app/conversas',
              avatarUrl: currentUserPhoto
            }
          });

        }
      } else if (!match && (type === 'LIKE' || type === 'SUPERLIKE')) {
        // Notificar sobre curtida simples (se não for privada)
        if (!isPrivate) {
          const title = type === 'SUPERLIKE' ? 'Super Like recebido!' : 'Alguém te curtiu!';
          const message = type === 'SUPERLIKE' 
            ? `${session.user.name || 'Alguém'} te deu um Super Like!` 
            : 'Veja quem se interessou pelo seu perfil.';
          
          await notifyUser(targetUserId, {
            title,
            message,
            type: 'like',
            metadata: { 
              fromUserId: session.user.id,
              avatarUrl: currentUserPhoto
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      isMatch: !!match,
      match
    });
  } catch (error: any) {
    console.error('Error processing like:', error);
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}

// GET /api/likes - Get likes received (for premium users to see who liked them)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'received'; // received or sent

    if (type === 'received') {
      // Get IDs of users already matched
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id }
          ]
        },
        select: { user1Id: true, user2Id: true }
      });
      
      const matchedUserIds = matches.map(m => 
        m.user1Id === session.user.id ? m.user2Id : m.user1Id
      );

      const likes = await prisma.like.findMany({
        where: {
          toUserId: session.user.id,
          type: { in: ['LIKE', 'SUPERLIKE'] },
          isPrivate: false,
          fromUserId: { notIn: matchedUserIds }
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              birthDate: true,
              city: true,
              userPhotos: { take: 1, orderBy: { order: 'asc' } },
              plan: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(likes);
    } else {
      const likes = await prisma.like.findMany({
        where: {
          fromUserId: session.user.id
        },
        include: {
          toUser: {
            select: {
              id: true,
              name: true,
              birthDate: true,
              city: true,
              userPhotos: { take: 1, orderBy: { order: 'asc' } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(likes);
    }
  } catch (error: any) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}
