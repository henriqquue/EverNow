import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { trackDiscoveryEvent } from '@/lib/discovery-engine';
import { DiscoveryEventType } from '@prisma/client';

// POST /api/discovery/events - Track a discovery event (impression, profile open)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, eventType, metadata } = body;

    if (!targetUserId || !eventType) {
      return NextResponse.json(
        { error: 'targetUserId and eventType are required' },
        { status: 400 }
      );
    }

    // Only allow tracking impression and profile_open from client
    // Other events (like, dislike, etc.) are tracked from their respective APIs
    const allowedClientEvents: DiscoveryEventType[] = ['IMPRESSION', 'PROFILE_OPEN'];
    if (!allowedClientEvents.includes(eventType as DiscoveryEventType)) {
      return NextResponse.json(
        { error: 'Invalid event type for client tracking' },
        { status: 400 }
      );
    }

    await trackDiscoveryEvent(
      session.user.id,
      targetUserId,
      eventType as DiscoveryEventType,
      metadata
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Discovery event tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track event' },
      { status: 500 }
    );
  }
}
