// Analytics tracking for metrics
import { prisma } from './db';

export type EventType =
  | 'profile_viewed'
  | 'like_sent'
  | 'superlike_sent'
  | 'dislike_sent'
  | 'match_created'
  | 'conversation_started'
  | 'message_sent'
  | 'filter_premium_attempted'
  | 'passport_activated'
  | 'passport_scheduled'
  | 'meeting_mode_activated'
  | 'profile_blocked'
  | 'profile_reported'
  | 'filter_saved'
  | 'user_signup'
  | 'user_login'
  | 'subscription_created'
  | 'subscription_upgraded'
  | 'profile_completed';

export interface TrackEventOptions {
  userId?: string;
  eventType: EventType;
  eventData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Track an analytics event
export async function trackEvent(options: TrackEventOptions) {
  const { userId, eventType, eventData = {}, ipAddress, userAgent } = options;

  try {
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType,
        eventData,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Get event counts for a period
export async function getEventCounts(
  eventTypes: EventType[],
  startDate: Date,
  endDate: Date
) {
  const counts: Record<EventType, number> = {} as any;

  for (const eventType of eventTypes) {
    const count = await prisma.analyticsEvent.count({
      where: {
        eventType,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    counts[eventType] = count;
  }

  return counts;
}

// Get user-specific event counts
export async function getUserEventCounts(
  userId: string,
  eventTypes: EventType[],
  startDate?: Date
) {
  const where: any = { userId, eventType: { in: eventTypes } };
  if (startDate) {
    where.createdAt = { gte: startDate };
  }

  const events = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where,
    _count: true
  });

  return events.reduce((acc, e) => {
    acc[e.eventType as EventType] = e._count;
    return acc;
  }, {} as Record<EventType, number>);
}
