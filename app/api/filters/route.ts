import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackEvent } from '@/lib/analytics';

// GET /api/filters - Get user's saved filters
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filters = await prisma.savedFilter.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(filters);
  } catch (error: any) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    );
  }
}

// POST /api/filters - Save a new filter
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, filters, isDefault, isQuick } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Filter name is required' },
        { status: 400 }
      );
    }

    // If setting as default, remove default from others
    if (isDefault) {
      await prisma.savedFilter.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        userId: session.user.id,
        name,
        filters: filters || {},
        isDefault: isDefault || false,
        isQuick: isQuick || false
      }
    });

    // Track event
    await trackEvent({
      userId: session.user.id,
      eventType: 'filter_saved',
      eventData: { filterId: savedFilter.id, name }
    });

    return NextResponse.json(savedFilter);
  } catch (error: any) {
    console.error('Error saving filter:', error);
    return NextResponse.json(
      { error: 'Failed to save filter' },
      { status: 500 }
    );
  }
}

// DELETE /api/filters - Delete a filter
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get('id');

    if (!filterId) {
      return NextResponse.json(
        { error: 'Filter ID is required' },
        { status: 400 }
      );
    }

    await prisma.savedFilter.deleteMany({
      where: {
        id: filterId,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting filter:', error);
    return NextResponse.json(
      { error: 'Failed to delete filter' },
      { status: 500 }
    );
  }
}
