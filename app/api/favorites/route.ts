import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackDiscoveryEvent } from '@/lib/discovery-engine';

// GET /api/favorites - Get user's favorites
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        favoriteUser: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            city: true,
            lastLoginAt: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedFavorites = favorites.map(f => ({
      id: f.id,
      createdAt: f.createdAt,
      user: {
        id: f.favoriteUser.id,
        name: f.favoriteUser.name,
        age: f.favoriteUser.birthDate
          ? Math.floor((Date.now() - new Date(f.favoriteUser.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null,
        city: f.favoriteUser.city,
        photo: f.favoriteUser.userPhotos[0]?.url || null,
        isOnline: f.favoriteUser.lastLoginAt
          ? Date.now() - new Date(f.favoriteUser.lastLoginAt).getTime() < 24 * 60 * 60 * 1000
          : false
      }
    }));

    return NextResponse.json(formattedFavorites);
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add to favorites
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_favoriteUserId: {
          userId: session.user.id,
          favoriteUserId: userId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyFavorited: true });
    }

    await prisma.favorite.create({
      data: {
        userId: session.user.id,
        favoriteUserId: userId
      }
    });

    // Track discovery event for behavioral learning
    trackDiscoveryEvent(session.user.id, userId, 'FAVORITE').catch(err => {
      console.error('Discovery favorite event error:', err);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove from favorites
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

    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        favoriteUserId: userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
