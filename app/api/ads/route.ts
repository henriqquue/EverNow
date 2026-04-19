import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';
import { isPageAllowedForAds, BLOCKED_PAGES } from '@/lib/ads';

// GET - Get ad to show for a zone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneSlug = searchParams.get('zone');
    const page = searchParams.get('page') || '';
    const sessionId = searchParams.get('sessionId');

    if (!zoneSlug) {
      return NextResponse.json({ error: 'Zone required' }, { status: 400 });
    }

    // Check if page is blocked
    if (!isPageAllowedForAds(page)) {
      return NextResponse.json({ showAd: false, reason: 'blocked_page' });
    }

    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Get user's plan
    let planSlug = 'gratuito';
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true },
      });
      planSlug = user?.plan?.slug || 'gratuito';
    }

    // Get plan ad settings
    const planSettings = await prisma.planAdSettings.findFirst({
      where: {
        planId: {
          in: await prisma.plan.findMany({
            where: { slug: planSlug },
            select: { id: true },
          }).then(plans => plans.map(p => p.id)),
        },
      },
    });

    // Check if ads are enabled for this plan
    if (planSettings && !planSettings.adsEnabled) {
      return NextResponse.json({ showAd: false, reason: 'ads_disabled' });
    }

    // Check if zone is allowed for this plan
    if (planSettings && planSettings.allowedZones.length > 0 && !planSettings.allowedZones.includes(zoneSlug)) {
      return NextResponse.json({ showAd: false, reason: 'zone_not_allowed' });
    }

    // Get zone
    const zone = await prisma.adZone.findUnique({
      where: { slug: zoneSlug },
    });

    if (!zone || !zone.isActive) {
      return NextResponse.json({ showAd: false, reason: 'zone_inactive' });
    }

    // Check session limits
    if (planSettings && sessionId) {
      const sessionImpressions = await prisma.adImpression.count({
        where: {
          sessionId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (sessionImpressions >= planSettings.adsPerSession) {
        return NextResponse.json({ showAd: false, reason: 'session_limit' });
      }
    }

    // Get global settings
    const globalSettings = await prisma.adGlobalSettings.findFirst();

    // Try to get an internal campaign first
    const now = new Date();
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        status: 'ACTIVE',
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
          {
            zones: {
              some: { zoneId: zone.id },
            },
          },
          {
            OR: [
              { targetPlanSlugs: { isEmpty: true } },
              { targetPlanSlugs: { has: planSlug } },
            ],
          },
        ],
      },
      orderBy: { priority: 'desc' },
      include: {
        zones: true,
      },
    });

    if (campaign) {
      return NextResponse.json({
        showAd: true,
        type: 'internal',
        adType: campaign.adType,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          subtitle: campaign.subtitle,
          imageUrl: campaign.imageUrl,
          ctaText: campaign.ctaText,
          ctaUrl: campaign.ctaUrl,
          backgroundColor: campaign.backgroundColor,
          textColor: campaign.textColor,
        },
        zone: {
          id: zone.id,
          slug: zone.slug,
          width: zone.width,
          height: zone.height,
        },
      });
    }

    // Fallback to Google AdSense if enabled
    if (globalSettings?.adsenseEnabled && zone.adsenseSlot) {
      return NextResponse.json({
        showAd: true,
        type: 'adsense',
        adType: 'GOOGLE_ADSENSE',
        adsense: {
          publisherId: globalSettings.adsensePublisherId,
          slotId: zone.adsenseSlot,
        },
        zone: {
          id: zone.id,
          slug: zone.slug,
          width: zone.width,
          height: zone.height,
        },
      });
    }

    return NextResponse.json({ showAd: false, reason: 'no_ads_available' });
  } catch (error) {
    console.error('Error getting ad:', error);
    return NextResponse.json({ showAd: false, error: 'internal_error' });
  }
}

// POST - Record ad impression or click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, zoneId, campaignId, adType, page, sessionId, targetUrl } = body;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (action === 'impression') {
      // Record impression
      await prisma.adImpression.create({
        data: {
          userId,
          sessionId,
          zoneId,
          campaignId,
          adType: adType || 'INTERNAL_BANNER',
          page,
        },
      });

      // Update zone metrics
      await prisma.adZone.update({
        where: { id: zoneId },
        data: { totalImpressions: { increment: 1 } },
      });

      // Update campaign metrics if applicable
      if (campaignId) {
        await prisma.adCampaign.update({
          where: { id: campaignId },
          data: { impressions: { increment: 1 } },
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'click') {
      // Record click
      await prisma.adClick.create({
        data: {
          userId,
          sessionId,
          zoneId,
          campaignId,
          adType: adType || 'INTERNAL_BANNER',
          targetUrl,
          page,
        },
      });

      // Update zone metrics
      await prisma.adZone.update({
        where: { id: zoneId },
        data: { totalClicks: { increment: 1 } },
      });

      // Update campaign metrics if applicable
      if (campaignId) {
        await prisma.adCampaign.update({
          where: { id: campaignId },
          data: { clicks: { increment: 1 } },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error recording ad event:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
