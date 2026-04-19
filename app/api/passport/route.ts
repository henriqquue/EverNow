import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';

// GET /api/passport - Get passport settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.passportSetting.findUnique({
      where: { userId: session.user.id }
    });

    return NextResponse.json(settings || { isActive: false });
  } catch (error: any) {
    console.error('Error fetching passport settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passport settings' },
      { status: 500 }
    );
  }
}

// POST /api/passport - Update passport settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { isActive, city, state, country, latitude, longitude, isExploring, isAppearing } = data;

    const settings = await prisma.passportSetting.upsert({
      where: { userId: session.user.id },
      update: {
        isActive: isActive ?? false,
        city,
        state,
        country,
        latitude,
        longitude,
        isExploring: isExploring ?? true,
        isAppearing: isAppearing ?? false
      },
      create: {
        userId: session.user.id,
        isActive: isActive ?? false,
        city,
        state,
        country,
        latitude,
        longitude,
        isExploring: isExploring ?? true,
        isAppearing: isAppearing ?? false
      }
    });

    // Track event
    if (isActive) {
      await trackEvent({
        userId: session.user.id,
        eventType: 'passport_activated',
        eventData: { city, country, isExploring, isAppearing }
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating passport settings:', error);
    return NextResponse.json(
      { error: 'Failed to update passport settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/passport - Deactivate passport
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.passportSetting.updateMany({
      where: { userId: session.user.id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deactivating passport:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate passport' },
      { status: 500 }
    );
  }
}
