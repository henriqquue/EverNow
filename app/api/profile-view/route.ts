import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';

// POST /api/profile-view - Record a profile view
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId || userId === session.user.id) {
      return NextResponse.json({ success: true }); // Ignore self views
    }

    // Create view record
    await prisma.profileView.create({
      data: {
        viewerId: session.user.id,
        viewedUserId: userId
      }
    });

    // Track event
    await trackEvent({
      userId: session.user.id,
      eventType: 'profile_viewed',
      eventData: { viewedUserId: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error recording profile view:', error);
    return NextResponse.json(
      { error: 'Failed to record profile view' },
      { status: 500 }
    );
  }
}

// GET /api/profile-view - Get who viewed my profile (premium feature)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if premium
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true }
    });

    const isPremium = user?.plan?.slug === 'premium';

    // Get views from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const views = await prisma.profileView.findMany({
      where: {
        viewedUserId: session.user.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        viewer: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            city: true,
            userPhotos: { take: 1, orderBy: { order: 'asc' } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // For non-premium users, blur the data
    const formattedViews = views.map(v => ({
      id: v.id,
      viewedAt: v.createdAt,
      viewer: isPremium
        ? {
            id: v.viewer.id,
            name: v.viewer.name,
            age: v.viewer.birthDate
              ? Math.floor((Date.now() - new Date(v.viewer.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null,
            city: v.viewer.city,
            photo: v.viewer.userPhotos[0]?.url || null
          }
        : {
            id: v.viewer.id,
            name: '???',
            age: null,
            city: null,
            photo: null,
            blurred: true
          }
    }));

    return NextResponse.json({
      views: formattedViews,
      totalCount: views.length,
      isPremium
    });
  } catch (error: any) {
    console.error('Error fetching profile views:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile views' },
      { status: 500 }
    );
  }
}
