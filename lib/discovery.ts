// Discovery engine for profile matching and filtering
import { prisma } from './db';
import { calculateCompatibility, type UserProfileData } from './compatibility-engine';
import {
  type DiscoveryMode,
  type ExplanationLabel,
  computeHybridScore,
  computeRecencyScore,
  computeProfileQualityScore,
  computeDistanceScore,
  computeDiversityFactor,
  computeFatiguePenalty,
  computeAffinityScore,
  generateExplanationLabels,
  loadFatigueData,
  loadUserAffinity,
  hasPremiumDiscoveryBoost,
} from './discovery-engine';

export interface DiscoveryFilters {
  minAge?: number;
  maxAge?: number;
  maxDistance?: number;
  genders?: string[];
  orientations?: string[];
  minCompatibility?: number;
  verifiedOnly?: boolean;
  onlineRecently?: boolean;
  withPhotos?: boolean;
  premiumOnly?: boolean;
  intentions?: string[];
  bodyTypes?: string[];
  minHeight?: number;
  maxHeight?: number;
  religions?: string[];
  hasChildren?: string;
  wantsChildren?: string;
  lifestyles?: string[];
  habits?: string[];
  pets?: string[];
  cities?: string[];
  countries?: string[];
  education?: string[];
  professions?: string[];
  passportCity?: string;
  meetingMode?: boolean;
}

export interface DiscoveryResult {
  user: any;
  compatibility: number;
  distance?: number;
  isOnline?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  meetingMode?: any;
  explanationLabels?: ExplanationLabel[];
  hybridScore?: number;
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Check if user was online recently (within 24 hours)
export function isUserOnline(lastLoginAt: Date | null): boolean {
  if (!lastLoginAt) return false;
  const onlineThreshold = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - new Date(lastLoginAt).getTime() < onlineThreshold;
}

// Calculate age from birth date
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Get effective location (considering passport)
export async function getEffectiveLocation(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      city: true,
      state: true,
      country: true,
      latitude: true,
      longitude: true,
      passportSetting: true,
      scheduledPassports: {
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        orderBy: { startDate: 'desc' },
        take: 1
      }
    }
  });

  if (!user) return null;

  // Check scheduled passport first (Scheduled travels always affect exploration)
  if (user.scheduledPassports.length > 0) {
    const scheduled = user.scheduledPassports[0];
    return {
      city: scheduled.city,
      state: scheduled.state,
      country: scheduled.country,
      latitude: scheduled.latitude,
      longitude: scheduled.longitude,
      isPassport: true
    };
  }

  // Check active passport (isExploring means the user wants to see people from that city)
  if (user.passportSetting?.isActive && user.passportSetting?.isExploring) {
    return {
      city: user.passportSetting.city,
      state: user.passportSetting.state,
      country: user.passportSetting.country,
      latitude: user.passportSetting.latitude,
      longitude: user.passportSetting.longitude,
      isPassport: true
    };
  }

  // Return real location
  return {
    city: user.city,
    state: user.state,
    country: user.country,
    latitude: user.latitude,
    longitude: user.longitude,
    isPassport: false
  };
}

// Main discovery function with hybrid ranking engine
export async function discoverProfiles(
  userId: string,
  filters: DiscoveryFilters,
  page: number = 1,
  limit: number = 20,
  mode: DiscoveryMode = 'compatibility'
): Promise<{ profiles: DiscoveryResult[]; total: number; hasMore: boolean }> {
  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      plan: true,
      discoveryPreference: true,
      passportSetting: true,
      blocksMade: true,
      blocksReceived: true,
      likesSent: true,
      matchesAsUser1: true,
      matchesAsUser2: true
    }
  });

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Get blocked user IDs (both directions)
  const blockedUserIds = [
    ...currentUser.blocksMade.map(b => b.blockedUserId),
    ...currentUser.blocksReceived.map(b => b.blockerId)
  ];

  // Get users already liked
  const likedUserIds = currentUser.likesSent.map(l => l.toUserId);

  // Get matched users
  const matchedUserIds = [
    ...currentUser.matchesAsUser1.map(m => m.user2Id),
    ...currentUser.matchesAsUser2.map(m => m.user1Id)
  ];

  // Get user's effective location
  const userLocation = await getEffectiveLocation(userId);

  // Build base query
  const baseWhere: any = {
    id: { notIn: [userId, ...blockedUserIds, ...likedUserIds, ...matchedUserIds] },
    status: 'ACTIVE',
    role: 'USER',
    OR: [
      { onboardingComplete: true },
      { profileComplete: { gte: 50 } }
    ],
    incognitoMode: false, // Phase 5: Respect incognito mode - don't show incognito users
  };

  // Age filter
  if (filters.minAge || filters.maxAge) {
    const today = new Date();
    if (filters.maxAge) {
      const minBirthDate = new Date(
        today.getFullYear() - filters.maxAge - 1,
        today.getMonth(),
        today.getDate()
      );
      baseWhere.birthDate = { ...baseWhere.birthDate, gte: minBirthDate };
    }
    if (filters.minAge) {
      const maxBirthDate = new Date(
        today.getFullYear() - filters.minAge,
        today.getMonth(),
        today.getDate()
      );
      baseWhere.birthDate = { ...baseWhere.birthDate, lte: maxBirthDate };
    }
  }

  // Gender filter
  if (filters.genders && filters.genders.length > 0) {
    baseWhere.gender = { in: filters.genders };
  }

  // Looking for filter (intentions)
  if (filters.intentions && filters.intentions.length > 0) {
    baseWhere.lookingFor = { in: filters.intentions };
  }

  // Photos filter
  if (filters.withPhotos) {
    baseWhere.userPhotos = { some: {} };
  }

  // Location filters - Enhanced for Passport support
  const searchCities = filters.cities && filters.cities.length > 0 
    ? filters.cities 
    : (userLocation?.isPassport ? [userLocation.city] : undefined);
    
  const searchCountries = filters.countries && filters.countries.length > 0
    ? filters.countries
    : (userLocation?.isPassport ? [userLocation.country] : undefined);

  if (searchCities && searchCities.length > 0) {
    const locationCondition = {
      OR: [
        { city: { in: searchCities } },
        {
          passportSetting: {
            isActive: true,
            isAppearing: true,
            city: { in: searchCities }
          }
        },
        {
          scheduledPassports: {
            some: {
              isActive: true,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
              city: { in: searchCities }
            }
          }
        }
      ]
    };
    
    // Combine with existing filters using AND to avoid overwriting top-level OR
    if (!baseWhere.AND) baseWhere.AND = [];
    baseWhere.AND.push(locationCondition);

  } else if (searchCountries && searchCountries.length > 0) {
    const locationCondition = {
      OR: [
        { country: { in: searchCountries } },
        {
          passportSetting: {
            isActive: true,
            isAppearing: true,
            country: { in: searchCountries }
          }
        }
      ]
    };
    
    if (!baseWhere.AND) baseWhere.AND = [];
    baseWhere.AND.push(locationCondition);
  }

  // Mode-specific ordering hints for Prisma
  let orderBy: any = undefined;
  if (mode === 'new') {
    orderBy = { createdAt: 'desc' };
  } else if (mode === 'active') {
    orderBy = { lastLoginAt: 'desc' };
  }

  // Fetch potential matches
  const potentialMatches = await prisma.user.findMany({
    where: baseWhere,
    include: {
      userPhotos: { orderBy: { order: 'asc' }, take: 6 },
      plan: true,
      profileAnswers: {
        select: {
          value: true,
          values: true,
          option: {
            select: {
              name: true,
              category: {
                select: {
                  slug: true,
                  name: true
                }
              }
            }
          }
        }
      },
      preferences: { include: { option: { include: { category: true } } } },
      passportSetting: true,
      scheduledPassports: {
        where: {
          isActive: true,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      },
      meetingModes: {
        where: {
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        take: 1
      }
    },
    orderBy,
    take: limit * 3, // Get more to filter
    skip: 0
  });

  // ===== PRE-FETCH: Fix N+1 - load current user's answers and preferences ONCE =====
  const [currentUserAnswers, currentUserPrefs] = await Promise.all([
    prisma.userProfileAnswer.findMany({
      where: { userId },
      select: {
        value: true,
        values: true,
        option: {
          select: {
            name: true,
            category: {
              select: {
                slug: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.userPreference.findMany({
      where: { userId },
      include: { option: { include: { category: true } } }
    })
  ]);

  // Build current user's profile data for compatibility (once)
  const userAData: UserProfileData = { userId, answers: {}, preferences: {} };
  for (const answer of currentUserAnswers) {
    const catSlug = answer.option.category.slug;
    if (!userAData.answers[catSlug]) userAData.answers[catSlug] = [];
    userAData.answers[catSlug].push(...answer.values);
  }
  for (const pref of currentUserPrefs) {
    const catSlug = pref.option.category.slug;
    userAData.preferences[catSlug] = { values: pref.values, importance: pref.importance };
  }

  // ===== Load discovery engine data in parallel =====
  const candidateIds = potentialMatches.map(p => p.id);
  const [userAffinity, fatigueMap, premiumBoost] = await Promise.all([
    loadUserAffinity(userId),
    loadFatigueData(userId, candidateIds),
    hasPremiumDiscoveryBoost(userId),
  ]);

  // Process and filter results
  const results: DiscoveryResult[] = [];

  for (const profile of potentialMatches) {
    // Calculate distance if we have coordinates
    let distance: number | undefined;
    if (userLocation?.latitude && userLocation?.longitude && profile.latitude && profile.longitude) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        profile.latitude,
        profile.longitude
      );

      // Apply distance filter
      if (filters.maxDistance && distance > filters.maxDistance) {
        continue;
      }
    }

    // Check online status
    const isOnline = isUserOnline(profile.lastLoginAt);
    if (filters.onlineRecently && !isOnline) {
      continue;
    }

    // Check premium status
    const isPremium = profile.plan?.slug === 'premium';
    if (filters.premiumOnly && !isPremium) {
      continue;
    }

    // Check verified status (user-level verification OR photo-level)
    const isVerified = (profile as any).verificationStatus === 'VERIFIED' || profile.userPhotos.some(p => p.isVerified);
    if (filters.verifiedOnly && !isVerified) {
      continue;
    }

    // Calculate compatibility score (using pre-fetched user data)
    let compatibility = 0;
    let hasCommonInterests = false;
    try {
      const userBData: UserProfileData = { userId: profile.id, answers: {}, preferences: {} };
      for (const answer of profile.profileAnswers) {
        const catSlug = answer.option.category.slug;
        if (!userBData.answers[catSlug]) userBData.answers[catSlug] = [];
        userBData.answers[catSlug].push(...answer.values);
      }
      for (const pref of profile.preferences) {
        const catSlug = pref.option.category.slug;
        userBData.preferences[catSlug] = { values: pref.values, importance: pref.importance };
      }

      const compatResult = calculateCompatibility(userAData, userBData);
      compatibility = compatResult.overallPercentage;
      hasCommonInterests = compatResult.highlights.length > 0;
    } catch {
      compatibility = 50;
    }

    // Apply minimum compatibility filter
    if (filters.minCompatibility && compatibility < filters.minCompatibility) {
      continue;
    }

    // Meeting mode check
    const meetingMode = profile.meetingModes[0] || null;
    if (filters.meetingMode && !meetingMode) {
      continue;
    }

    // ===== Compute hybrid score using discovery engine =====
    const profileAge = profile.birthDate ? calculateAge(profile.birthDate) : null;
    const affinityScore = computeAffinityScore(userAffinity, {
      age: profileAge,
      gender: profile.gender,
      city: profile.city,
      interests: profile.interests,
    });
    const recencyScore = computeRecencyScore(
      { lastLoginAt: profile.lastLoginAt, createdAt: profile.createdAt },
      mode
    );
    const qualityScore = computeProfileQualityScore({
      profileQuality: profile.profileQuality,
      profileComplete: profile.profileComplete,
    });
    const distanceScore = computeDistanceScore(distance);
    const diversityFactor = computeDiversityFactor();
    const fatigueData = fatigueMap.get(profile.id);
    const fatiguePenalty = computeFatiguePenalty(fatigueData);

    const scored = computeHybridScore(
      mode,
      compatibility,
      affinityScore,
      recencyScore,
      qualityScore,
      distanceScore,
      diversityFactor,
      fatiguePenalty,
      premiumBoost,
      isVerified
    );

    // Generate explanation labels from real signals
    const isNewProfile = (Date.now() - new Date(profile.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000;
    const explanationLabels = generateExplanationLabels(
      {
        compatibility: scored.compatibility,
        affinity: scored.affinity,
        recency: scored.recency,
        profileQuality: scored.profileQuality,
        distance: scored.distance,
        diversity: scored.diversity,
        fatigue: scored.fatigue,
      },
      {
        compatibility,
        hasCommonInterests,
        isOnline,
        profileComplete: profile.profileComplete,
        hasAffinityMatch: affinityScore >= 0.7,
        distanceKm: distance,
        isNewProfile,
        isVerified
      }
    );

    results.push({
      user: {
        id: profile.id,
        name: profile.name,
        nickname: profile.nickname,
        age: profile.showAge !== false ? profileAge : null, // Respect target's showAge privacy
        bio: profile.bio,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        gender: profile.gender,
        lookingFor: profile.lookingFor,
        photos: profile.userPhotos.map(p => ({ url: p.url, isMain: p.isMain, isVerified: p.isVerified })),
        interests: profile.interests,
        profileComplete: profile.profileComplete,
        plan: profile.plan?.slug
      },
      compatibility,
      distance: profile.showDistance !== false ? distance : undefined, // Respect target's showDistance privacy
      isOnline,
      isPremium,
      isVerified,
      meetingMode,
      explanationLabels,
      hybridScore: scored.finalScore,
    });
  }

  // Sort by hybrid score (descending) instead of just compatibility
  results.sort((a, b) => (b.hybridScore || 0) - (a.hybridScore || 0));

  // Paginate
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + limit);

  return {
    profiles: paginatedResults,
    total: results.length,
    hasMore: startIndex + limit < results.length
  };
}

// Get user's discovery preferences
export async function getDiscoveryPreferences(userId: string) {
  return prisma.discoveryPreference.findUnique({
    where: { userId }
  });
}

// Update user's discovery preferences
export async function updateDiscoveryPreferences(
  userId: string,
  data: Partial<DiscoveryFilters>
) {
  return prisma.discoveryPreference.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data }
  });
}
