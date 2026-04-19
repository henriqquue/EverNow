import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { discoverProfiles, DiscoveryFilters } from '@/lib/discovery';
import { trackEvent } from '@/lib/analytics';
import { getGovernanceRules } from '@/lib/profile-governance';
import type { DiscoveryMode } from '@/lib/discovery-engine';

// Field key → user object key mapping for governance filtering
const FIELD_TO_USER_KEY: Record<string, string> = {
  name: 'name',
  bio: 'bio',
  city: 'city',
  gender: 'gender',
  lookingFor: 'lookingFor',
  interests: 'interests',
  photos: 'photos',
  birthDate: 'age', // age is derived from birthDate
};

// GET /api/discovery - Get discoverable profiles
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const mode = (searchParams.get('mode') || 'compatibility') as DiscoveryMode;
    const validModes: DiscoveryMode[] = ['compatibility', 'new', 'active'];
    const safeMode = validModes.includes(mode) ? mode : 'compatibility';

    // Parse filters from query params
    const filters: DiscoveryFilters = {
      minAge: searchParams.get('minAge') ? parseInt(searchParams.get('minAge')!) : undefined,
      maxAge: searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge')!) : undefined,
      maxDistance: searchParams.get('maxDistance') ? parseInt(searchParams.get('maxDistance')!) : undefined,
      genders: searchParams.get('genders')?.split(',').filter(Boolean) || undefined,
      orientations: searchParams.get('orientations')?.split(',').filter(Boolean) || undefined,
      minCompatibility: searchParams.get('minCompatibility') ? parseInt(searchParams.get('minCompatibility')!) : undefined,
      verifiedOnly: searchParams.get('verifiedOnly') === 'true',
      onlineRecently: searchParams.get('onlineRecently') === 'true',
      withPhotos: searchParams.get('withPhotos') !== 'false',
      premiumOnly: searchParams.get('premiumOnly') === 'true',
      intentions: searchParams.get('intentions')?.split(',').filter(Boolean) || undefined,
      bodyTypes: searchParams.get('bodyTypes')?.split(',').filter(Boolean) || undefined,
      religions: searchParams.get('religions')?.split(',').filter(Boolean) || undefined,
      hasChildren: searchParams.get('hasChildren') || undefined,
      wantsChildren: searchParams.get('wantsChildren') || undefined,
      lifestyles: searchParams.get('lifestyles')?.split(',').filter(Boolean) || undefined,
      habits: searchParams.get('habits')?.split(',').filter(Boolean) || undefined,
      pets: searchParams.get('pets')?.split(',').filter(Boolean) || undefined,
      cities: searchParams.get('cities')?.split(',').filter(Boolean) || undefined,
      countries: searchParams.get('countries')?.split(',').filter(Boolean) || undefined,
      meetingMode: searchParams.get('meetingMode') === 'true'
    };

    const result = await discoverProfiles(session.user.id, filters, page, limit, safeMode);

    // Apply governance filtering — strip fields not visible in profile cards
    try {
      const rules = await getGovernanceRules();
      const hiddenInCard = new Set<string>();
      for (const rule of rules) {
        if (!rule.visibleInProfileCard && rule.isActive) {
          const userKey = FIELD_TO_USER_KEY[rule.fieldKey];
          if (userKey) hiddenInCard.add(userKey);
        }
      }

      if (hiddenInCard.size > 0) {
        for (const profile of result.profiles) {
          const user = profile.user as Record<string, unknown>;
          for (const key of hiddenInCard) {
            if (key in user) {
              user[key] = key === 'photos' ? [] : key === 'interests' ? [] : null;
            }
          }
        }
      }
    } catch (govError) {
      // Governance filtering is best-effort — don't fail discovery if it errors
      console.error('Governance filtering error:', govError);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Discovery error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to discover profiles' },
      { status: 500 }
    );
  }
}
