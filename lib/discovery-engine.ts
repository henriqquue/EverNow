// Phase 4: Smart Discovery Engine
// Hybrid ranking with behavioral signals, affinity, fatigue, and explanation labels

import { prisma } from './db';
import { DiscoveryEventType } from '@prisma/client';
import { checkFeatureEntitlement } from './entitlement-service';

// =============================================
// Types
// =============================================

export type DiscoveryMode = 'compatibility' | 'new' | 'active';

export interface ExplanationLabel {
  key: string;
  label: string;
  icon: string; // emoji
}

export interface HybridScoreResult {
  finalScore: number;
  components: {
    compatibility: number;
    affinity: number;
    recency: number;
    profileQuality: number;
    distance: number;
    diversity: number;
    fatigue: number;
  };
  labels: ExplanationLabel[];
}

// Weights for each signal component (sum ~1.0, fatigue is subtractive)
const MODE_WEIGHTS: Record<DiscoveryMode, {
  compatibility: number;
  affinity: number;
  recency: number;
  profileQuality: number;
  distance: number;
  diversity: number;
}> = {
  compatibility: {
    compatibility: 0.35,
    affinity: 0.25,
    recency: 0.10,
    profileQuality: 0.10,
    distance: 0.10,
    diversity: 0.10,
  },
  new: {
    compatibility: 0.15,
    affinity: 0.10,
    recency: 0.40,  // heavily favor recently created accounts
    profileQuality: 0.15,
    distance: 0.10,
    diversity: 0.10,
  },
  active: {
    compatibility: 0.15,
    affinity: 0.15,
    recency: 0.35,  // heavily favor recently active users
    profileQuality: 0.10,
    distance: 0.10,
    diversity: 0.15,
  },
};

// Label definitions
const LABEL_DEFS = {
  highCompatibility: { key: 'highCompatibility', label: 'Alta compatibilidade', icon: '💕' },
  commonInterests: { key: 'commonInterests', label: 'Interesses em comum', icon: '🎯' },
  activeProfile: { key: 'activeProfile', label: 'Perfil ativo', icon: '🟢' },
  completeProfile: { key: 'completeProfile', label: 'Perfil completo', icon: '✨' },
  affinityMatch: { key: 'affinityMatch', label: 'Você costuma curtir perfis parecidos', icon: '💡' },
  nearby: { key: 'nearby', label: 'Perto de você', icon: '📍' },
  newProfile: { key: 'newProfile', label: 'Perfil novo', icon: '🆕' },
  verifiedProfile: { key: 'verifiedProfile', label: 'Perfil Verificado', icon: '✅' },
} as const;

// =============================================
// Core Scoring Functions
// =============================================

/**
 * Compute recency/activity score based on mode
 * - For 'new' mode: how recently the user created their account
 * - For 'active' mode: how recently the user was active
 * - For 'compatibility' mode: blend of both
 */
export function computeRecencyScore(
  profile: { lastLoginAt: Date | null; createdAt: Date },
  mode: DiscoveryMode
): number {
  const now = Date.now();
  
  if (mode === 'new') {
    // Favor accounts created within the last 14 days
    const ageMs = now - new Date(profile.createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 1) return 1.0;
    if (ageDays <= 3) return 0.9;
    if (ageDays <= 7) return 0.7;
    if (ageDays <= 14) return 0.5;
    if (ageDays <= 30) return 0.3;
    return 0.1;
  }
  
  // For 'active' and 'compatibility' modes, favor recent login
  if (!profile.lastLoginAt) return 0.05;
  const lastActiveMs = now - new Date(profile.lastLoginAt).getTime();
  const lastActiveHours = lastActiveMs / (1000 * 60 * 60);
  
  if (lastActiveHours <= 1) return 1.0;
  if (lastActiveHours <= 6) return 0.85;
  if (lastActiveHours <= 24) return 0.7;
  if (lastActiveHours <= 72) return 0.5;
  if (lastActiveHours <= 168) return 0.3; // 7 days
  return 0.1;
}

/**
 * Profile quality score (0-1) from the existing profileQuality field (0-100)
 */
export function computeProfileQualityScore(
  profile: { profileQuality: number; profileComplete: number }
): number {
  // Blend quality score and completeness
  const quality = Math.min(profile.profileQuality, 100) / 100;
  const completeness = Math.min(profile.profileComplete, 100) / 100;
  return quality * 0.6 + completeness * 0.4;
}

/**
 * Distance score (0-1) - closer is better
 */
export function computeDistanceScore(distanceKm: number | undefined): number {
  if (distanceKm === undefined || distanceKm === null) return 0.5; // neutral
  if (distanceKm <= 5) return 1.0;
  if (distanceKm <= 15) return 0.9;
  if (distanceKm <= 30) return 0.75;
  if (distanceKm <= 50) return 0.6;
  if (distanceKm <= 100) return 0.4;
  if (distanceKm <= 300) return 0.2;
  return 0.1;
}

/**
 * Simple diversity injection - adds slight randomization to prevent
 * identical orderings across sessions
 */
export function computeDiversityFactor(): number {
  // Small random boost between 0.8 and 1.0
  return 0.8 + Math.random() * 0.2;
}

// =============================================
// Affinity Scoring
// =============================================

interface AffinityData {
  preferredAgeMin: number | null;
  preferredAgeMax: number | null;
  preferredGenders: string[] | null;
  preferredLocations: string[] | null;
  positivePatterns: Record<string, number> | null;
  negativePatterns: Record<string, number> | null;
}

/**
 * Compute affinity score: how well does target match user's behavioral preferences?
 */
export function computeAffinityScore(
  affinity: AffinityData | null,
  targetProfile: {
    age: number | null;
    gender: string | null;
    city: string | null;
    interests: string[];
  }
): number {
  if (!affinity) return 0.5; // neutral when no affinity data

  let score = 0;
  let factors = 0;

  // Age match
  if (affinity.preferredAgeMin !== null && affinity.preferredAgeMax !== null && targetProfile.age) {
    factors++;
    if (targetProfile.age >= affinity.preferredAgeMin && targetProfile.age <= affinity.preferredAgeMax) {
      score += 1.0;
    } else {
      // Partial credit for close ages
      const minDist = Math.min(
        Math.abs(targetProfile.age - affinity.preferredAgeMin),
        Math.abs(targetProfile.age - affinity.preferredAgeMax)
      );
      score += Math.max(0, 1 - minDist * 0.1);
    }
  }

  // Gender match
  if (affinity.preferredGenders && affinity.preferredGenders.length > 0 && targetProfile.gender) {
    factors++;
    if (affinity.preferredGenders.includes(targetProfile.gender)) {
      score += 1.0;
    } else {
      score += 0.2;
    }
  }

  // Location match
  if (affinity.preferredLocations && affinity.preferredLocations.length > 0 && targetProfile.city) {
    factors++;
    if (affinity.preferredLocations.includes(targetProfile.city)) {
      score += 1.0;
    } else {
      score += 0.3;
    }
  }

  // Interest pattern match (from positive/negative behavioral patterns)
  if (affinity.positivePatterns && targetProfile.interests.length > 0) {
    factors++;
    let interestScore = 0;
    let interestCount = 0;
    for (const interest of targetProfile.interests) {
      const key = interest.toLowerCase();
      if (affinity.positivePatterns[key]) {
        interestScore += Math.min(affinity.positivePatterns[key] / 5, 1); // normalize
        interestCount++;
      }
      if (affinity.negativePatterns && affinity.negativePatterns[key]) {
        interestScore -= Math.min(affinity.negativePatterns[key] / 5, 0.5);
        interestCount++;
      }
    }
    score += interestCount > 0 ? Math.max(0, Math.min(1, interestScore / interestCount + 0.5)) : 0.5;
  }

  return factors > 0 ? score / factors : 0.5;
}

// =============================================
// Fatigue Penalty
// =============================================

/**
 * Load recent events for fatigue calculation
 * Returns a map of targetUserId -> { impressions, passes, totalEvents }
 */
export async function loadFatigueData(
  userId: string,
  targetUserIds: string[],
  lookbackDays: number = 7
): Promise<Map<string, { impressions: number; passes: number; total: number }>> {
  if (targetUserIds.length === 0) return new Map();

  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  const events = await prisma.discoveryEvent.groupBy({
    by: ['targetUserId', 'eventType'],
    where: {
      userId,
      targetUserId: { in: targetUserIds },
      createdAt: { gte: lookbackDate },
    },
    _count: { id: true },
  });

  const fatigueMap = new Map<string, { impressions: number; passes: number; total: number }>();

  for (const ev of events) {
    const existing = fatigueMap.get(ev.targetUserId) || { impressions: 0, passes: 0, total: 0 };
    const count = ev._count.id;
    existing.total += count;
    if (ev.eventType === 'IMPRESSION' || ev.eventType === 'PROFILE_OPEN') {
      existing.impressions += count;
    }
    if (ev.eventType === 'DISLIKE') {
      existing.passes += count;
    }
    fatigueMap.set(ev.targetUserId, existing);
  }

  return fatigueMap;
}

/**
 * Compute fatigue penalty (0-1, where 0 = no penalty, 1 = max penalty)
 */
export function computeFatiguePenalty(
  fatigueData: { impressions: number; passes: number; total: number } | undefined
): number {
  if (!fatigueData) return 0;
  
  let penalty = 0;
  // Each pass adds significant penalty
  penalty += fatigueData.passes * 0.3;
  // Each impression adds small penalty
  penalty += fatigueData.impressions * 0.05;
  
  return Math.min(penalty, 0.8); // cap at 80% penalty
}

// =============================================
// Explanation Labels
// =============================================

export function generateExplanationLabels(
  components: HybridScoreResult['components'],
  extra: {
    compatibility: number;
    hasCommonInterests: boolean;
    isOnline: boolean;
    profileComplete: number;
    hasAffinityMatch: boolean;
    distanceKm: number | undefined;
    isNewProfile: boolean;
    isVerified: boolean;
  }
): ExplanationLabel[] {
  const labels: ExplanationLabel[] = [];

  if (extra.compatibility >= 70) {
    labels.push(LABEL_DEFS.highCompatibility);
  }
  if (extra.hasCommonInterests) {
    labels.push(LABEL_DEFS.commonInterests);
  }
  if (extra.isOnline) {
    labels.push(LABEL_DEFS.activeProfile);
  }
  if (extra.profileComplete >= 80) {
    labels.push(LABEL_DEFS.completeProfile);
  }
  if (extra.hasAffinityMatch && components.affinity >= 0.7) {
    labels.push(LABEL_DEFS.affinityMatch);
  }
  if (extra.distanceKm !== undefined && extra.distanceKm <= 20) {
    labels.push(LABEL_DEFS.nearby);
  }
  if (extra.isNewProfile) {
    labels.push(LABEL_DEFS.newProfile);
  }
  if (extra.isVerified) {
    labels.push(LABEL_DEFS.verifiedProfile);
  }

  // Return at most 3 labels
  return labels.slice(0, 3);
}

// =============================================
// Main Hybrid Scoring
// =============================================

export function computeHybridScore(
  mode: DiscoveryMode,
  compatibilityPct: number,
  affinityScore: number,
  recencyScore: number,
  qualityScore: number,
  distanceScore: number,
  diversityFactor: number,
  fatiguePenalty: number,
  premiumBoost: boolean,
  verificationBoost: boolean
): HybridScoreResult['components'] & { finalScore: number } {
  const weights = MODE_WEIGHTS[mode];

  // Normalize compatibility to 0-1
  const compNorm = Math.min(compatibilityPct, 100) / 100;

  const rawScore =
    compNorm * weights.compatibility +
    affinityScore * weights.affinity +
    recencyScore * weights.recency +
    qualityScore * weights.profileQuality +
    distanceScore * weights.distance +
    diversityFactor * weights.diversity;

  // Apply fatigue penalty (subtractive)
  let finalScore = rawScore * (1 - fatiguePenalty);

  // Premium boost: small multiplier
  if (premiumBoost) {
    finalScore *= 1.05;
  }

  // Verification boost: significant multiplier for reach
  if (verificationBoost) {
    finalScore *= 1.15; // 15% boost in reach/ranking
  }

  // Clamp to 0-1
  finalScore = Math.max(0, Math.min(1, finalScore));

  return {
    finalScore,
    compatibility: compNorm,
    affinity: affinityScore,
    recency: recencyScore,
    profileQuality: qualityScore,
    distance: distanceScore,
    diversity: diversityFactor,
    fatigue: fatiguePenalty,
  };
}

// =============================================
// Affinity Recalculation
// =============================================

/**
 * Recalculate a user's affinity model from their discovery events.
 * Aggregates positive (like, superlike, favorite) and negative (dislike, block) events
 * into preference patterns.
 */
export async function recalculateUserAffinity(userId: string): Promise<void> {
  const lookbackDays = 90;
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

  // Get recent events with target user info
  const events = await prisma.discoveryEvent.findMany({
    where: {
      userId,
      createdAt: { gte: lookbackDate },
      eventType: { in: ['LIKE', 'SUPERLIKE', 'DISLIKE', 'FAVORITE', 'BLOCK'] },
    },
    include: {
      targetUser: {
        select: {
          birthDate: true,
          gender: true,
          city: true,
          interests: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500, // limit to last 500 events
  });

  if (events.length === 0) {
    // No events yet, create/update with neutral affinity
    await prisma.userAffinity.upsert({
      where: { userId },
      create: { userId, totalEvents: 0 },
      update: { totalEvents: 0, lastComputedAt: new Date() },
    });
    return;
  }

  const positiveTypes = new Set<DiscoveryEventType>(['LIKE', 'SUPERLIKE', 'FAVORITE']);
  const negativeTypes = new Set<DiscoveryEventType>(['DISLIKE', 'BLOCK']);

  const ages: number[] = [];
  const genderCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  const positiveInterests: Record<string, number> = {};
  const negativeInterests: Record<string, number> = {};

  const now = new Date();

  for (const event of events) {
    const target = event.targetUser;
    const isPositive = positiveTypes.has(event.eventType);
    const isNegative = negativeTypes.has(event.eventType);

    // Time decay: recent events count more (exponential decay over 90 days)
    const daysAgo = (now.getTime() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const decayWeight = Math.exp(-daysAgo / 30); // half-life ~30 days
    const weight = decayWeight * (event.eventType === 'SUPERLIKE' ? 2 : 1);

    if (isPositive) {
      // Track age preferences from positive events
      if (target.birthDate) {
        const age = now.getFullYear() - new Date(target.birthDate).getFullYear();
        ages.push(age);
      }

      // Track gender preferences
      if (target.gender) {
        genderCounts[target.gender] = (genderCounts[target.gender] || 0) + weight;
      }

      // Track location preferences
      if (target.city) {
        locationCounts[target.city] = (locationCounts[target.city] || 0) + weight;
      }

      // Track interest patterns
      for (const interest of target.interests) {
        const key = interest.toLowerCase();
        positiveInterests[key] = (positiveInterests[key] || 0) + weight;
      }
    }

    if (isNegative) {
      for (const interest of target.interests) {
        const key = interest.toLowerCase();
        negativeInterests[key] = (negativeInterests[key] || 0) + weight;
      }
    }
  }

  // Compute age range from positive events
  let preferredAgeMin: number | null = null;
  let preferredAgeMax: number | null = null;
  if (ages.length >= 3) {
    ages.sort((a, b) => a - b);
    // Use 10th-90th percentile to avoid outliers
    const p10 = ages[Math.floor(ages.length * 0.1)];
    const p90 = ages[Math.floor(ages.length * 0.9)];
    preferredAgeMin = Math.max(18, p10 - 2);
    preferredAgeMax = p90 + 2;
  }

  // Top genders (those with significant counts)
  const sortedGenders = Object.entries(genderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  // Top locations
  const sortedLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([l]) => l);

  await prisma.userAffinity.upsert({
    where: { userId },
    create: {
      userId,
      preferredAgeMin,
      preferredAgeMax,
      preferredGenders: sortedGenders,
      preferredLocations: sortedLocations,
      positivePatterns: positiveInterests,
      negativePatterns: negativeInterests,
      totalEvents: events.length,
      lastComputedAt: new Date(),
    },
    update: {
      preferredAgeMin,
      preferredAgeMax,
      preferredGenders: sortedGenders,
      preferredLocations: sortedLocations,
      positivePatterns: positiveInterests,
      negativePatterns: negativeInterests,
      totalEvents: events.length,
      lastComputedAt: new Date(),
    },
  });
}

// =============================================
// Event Tracking Helper
// =============================================

export async function trackDiscoveryEvent(
  userId: string,
  targetUserId: string,
  eventType: DiscoveryEventType,
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.discoveryEvent.create({
    data: {
      userId,
      targetUserId,
      eventType,
      metadata: metadata || undefined,
    },
  });

  // Trigger async affinity recalculation after significant events
  const significantEvents = new Set<DiscoveryEventType>(['LIKE', 'SUPERLIKE', 'DISLIKE', 'FAVORITE', 'BLOCK']);
  if (significantEvents.has(eventType)) {
    // Check if we should recalculate (not too frequently)
    const affinity = await prisma.userAffinity.findUnique({
      where: { userId },
      select: { lastComputedAt: true, totalEvents: true },
    });

    const shouldRecalc = !affinity ||
      (affinity.totalEvents < 10) || // Always recalc when few events
      (Date.now() - new Date(affinity.lastComputedAt).getTime() > 30 * 60 * 1000); // Or every 30 min

    if (shouldRecalc) {
      // Fire and forget - don't block the response
      recalculateUserAffinity(userId).catch(err => {
        console.error('Affinity recalculation error:', err);
      });
    }
  }
}

// =============================================
// Load User Affinity
// =============================================

export async function loadUserAffinity(userId: string): Promise<AffinityData | null> {
  const affinity = await prisma.userAffinity.findUnique({
    where: { userId },
  });

  if (!affinity) return null;

  return {
    preferredAgeMin: affinity.preferredAgeMin,
    preferredAgeMax: affinity.preferredAgeMax,
    preferredGenders: affinity.preferredGenders as string[] | null,
    preferredLocations: affinity.preferredLocations as string[] | null,
    positivePatterns: affinity.positivePatterns as Record<string, number> | null,
    negativePatterns: affinity.negativePatterns as Record<string, number> | null,
  };
}

/**
 * Check if current user has premium discovery boost entitlement
 */
export async function hasPremiumDiscoveryBoost(userId: string): Promise<boolean> {
  try {
    const result = await checkFeatureEntitlement(userId, 'boost_perfil');
    return result.allowed;
  } catch {
    return false;
  }
}
