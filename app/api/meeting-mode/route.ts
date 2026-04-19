import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';
import { calculateDistance } from '@/lib/discovery';

// GET /api/meeting-mode - Get user's meeting mode or find people with meeting mode
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const findPeople = searchParams.get('findPeople') === 'true';

    if (findPeople) {
      // Find people with active meeting mode near the user
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { latitude: true, longitude: true, blocksMade: true, blocksReceived: true }
      });

      if (!user?.latitude || !user?.longitude) {
        return NextResponse.json([]);
      }

      // Get blocked user IDs
      const blockedIds = [
        ...user.blocksMade.map(b => b.blockedUserId),
        ...user.blocksReceived.map(b => b.blockerId)
      ];

      // Find users with active meeting mode
      const meetingModes = await prisma.meetingMode.findMany({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
          userId: { notIn: [session.user.id, ...blockedIds] }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              birthDate: true,
              city: true,
              latitude: true,
              longitude: true,
              userPhotos: { take: 1, orderBy: { order: 'asc' } },
              verificationStatus: true
            }
          }
        }
      });

      // Calculate distances and filter by max distance
      const results = meetingModes
        .map(mm => {
          const distance = mm.user.latitude && mm.user.longitude
            ? calculateDistance(
                user.latitude!,
                user.longitude!,
                mm.user.latitude,
                mm.user.longitude
              )
            : null;

          return {
            id: mm.id,
            activities: mm.activities,
            expiresAt: mm.expiresAt,
            distance,
            user: {
              id: mm.user.id,
              name: mm.user.name,
              age: mm.user.birthDate
                ? Math.floor((Date.now() - new Date(mm.user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null,
              city: mm.user.city,
              photo: mm.user.userPhotos[0]?.url || null,
              isVerified: mm.user.verificationStatus === 'VERIFIED'
            }
          };
        })
        .filter(r => r.distance === null || r.distance <= 50) // Max 50km
        .sort((a, b) => {
          // Prioritize verified users
          if (a.user.isVerified && !b.user.isVerified) return -1;
          if (!a.user.isVerified && b.user.isVerified) return 1;
          // Then sort by distance
          return (a.distance || 999) - (b.distance || 999);
        });

      return NextResponse.json(results);
    }

    // Get user's own meeting mode
    const meetingMode = await prisma.meetingMode.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    return NextResponse.json(meetingMode);
  } catch (error: any) {
    console.error('Error fetching meeting mode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting mode' },
      { status: 500 }
    );
  }
}

// POST /api/meeting-mode - Activate meeting mode
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { activities, city, latitude, longitude, maxDistance, hoursActive } = data;

    if (!activities || activities.length === 0) {
      return NextResponse.json(
        { error: 'At least one activity is required' },
        { status: 400 }
      );
    }

    // Deactivate any existing meeting mode
    await prisma.meetingMode.updateMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      data: { isActive: false }
    });

    // Create new meeting mode
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (hoursActive || 8));

    const meetingMode = await prisma.meetingMode.create({
      data: {
        userId: session.user.id,
        activities,
        city,
        latitude,
        longitude,
        maxDistance: maxDistance || 10,
        expiresAt,
        isActive: true
      }
    });

    // Track event
    await trackEvent({
      userId: session.user.id,
      eventType: 'meeting_mode_activated',
      eventData: { activities, city, hoursActive }
    });

    return NextResponse.json(meetingMode);
  } catch (error: any) {
    console.error('Error activating meeting mode:', error);
    return NextResponse.json(
      { error: 'Failed to activate meeting mode' },
      { status: 500 }
    );
  }
}

// DELETE /api/meeting-mode - Deactivate meeting mode
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.meetingMode.updateMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deactivating meeting mode:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate meeting mode' },
      { status: 500 }
    );
  }
}
