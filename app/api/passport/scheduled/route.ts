import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';

// GET /api/passport/scheduled - Get scheduled passports
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduled = await prisma.scheduledPassport.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        endDate: { gte: new Date() }
      },
      orderBy: { startDate: 'asc' }
    });

    return NextResponse.json(scheduled);
  } catch (error: any) {
    console.error('Error fetching scheduled passports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled passports' },
      { status: 500 }
    );
  }
}

// POST /api/passport/scheduled - Create scheduled passport
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      city,
      state,
      country,
      latitude,
      longitude,
      startDate,
      endDate,
      startMode,
      customDaysBefore,
      visibility
    } = data;

    if (!city || !country || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'City, country, start date and end date are required' },
        { status: 400 }
      );
    }

    const scheduled = await prisma.scheduledPassport.create({
      data: {
        userId: session.user.id,
        city,
        state,
        country,
        latitude,
        longitude,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startMode: startMode || 'DURING_PERIOD',
        customDaysBefore,
        visibility: visibility || 'CITY_AND_DATES',
        isActive: true
      }
    });

    // Track event
    await trackEvent({
      userId: session.user.id,
      eventType: 'passport_scheduled',
      eventData: { city, country, startDate, endDate }
    });

    return NextResponse.json(scheduled);
  } catch (error: any) {
    console.error('Error creating scheduled passport:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduled passport' },
      { status: 500 }
    );
  }
}

// DELETE /api/passport/scheduled - Delete scheduled passport
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Scheduled passport ID is required' },
        { status: 400 }
      );
    }

    await prisma.scheduledPassport.deleteMany({
      where: {
        id,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting scheduled passport:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled passport' },
      { status: 500 }
    );
  }
}
