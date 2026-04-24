/**
 * Central Profile Field Governance Service
 * 
 * Resolves governance rules, user visibility, and builds safe public profiles.
 * This is the SINGLE source of truth for what profile data is visible.
 */

import prisma from '@/lib/db';

// Types
export interface GovernanceRule {
  id: string;
  fieldKey: string;
  fieldType: string;
  label: string;
  description: string | null;
  icon: string | null;
  isRequired: boolean;
  requiredInOnboarding: boolean;
  requiredBeforeDiscovery: boolean;
  visibleInOnboarding: boolean;
  visibleInProfileEdit: boolean;
  visibleInProfileCard: boolean;
  visibleInFullProfile: boolean;
  defaultPublicVisible: boolean;
  userCanToggleVisibility: boolean;
  hiddenByDefault: boolean;
  premiumOnly: boolean;
  verifiedOnly: boolean;
  affectsCompatibility: boolean;
  affectsDiscoveryRanking: boolean;
  isActive: boolean;
  displayOrder: number;
  group: string | null;
}

export interface UserVisibility {
  fieldKey: string;
  isPublic: boolean;
}

export interface ResolvedFieldVisibility {
  fieldKey: string;
  label: string;
  isPublic: boolean;
  userCanChange: boolean;
  isRequired: boolean;
  reason?: string; // Why it can't be hidden
}

export interface PublicProfileData {
  id: string;
  name: string | null;
  nickname: string | null;
  age: number | null;
  bio: string | null;
  headline: string | null;
  pronouns: string | null;
  statusMood: string | null;
  gender: string | null;
  lookingFor: string | null;
  relationshipStatus: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  country: string | null;
  photos: string[];
  interests: string[];
  languages: string[];
  work: string | null;
  education: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  birthChartData: any;
  profileQuality: number;
  profileByCategory: Record<string, { name: string; values: string[] }>;
  plan: { name: string; slug: string } | null;
  isOwnProfile: boolean;
  isVerified?: boolean;
}

// ============================================
// GOVERNANCE RULES
// ============================================

let _cachedRules: GovernanceRule[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getGovernanceRules(): Promise<GovernanceRule[]> {
  const now = Date.now();
  if (_cachedRules && now - _cacheTime < CACHE_TTL) {
    return _cachedRules;
  }
  
  const rules = await prisma.profileFieldGovernance.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
  
  _cachedRules = rules;
  _cacheTime = now;
  return rules;
}

export function invalidateGovernanceCache() {
  _cachedRules = null;
  _cacheTime = 0;
}

export async function getGovernanceRule(fieldKey: string): Promise<GovernanceRule | null> {
  const rules = await getGovernanceRules();
  return rules.find(r => r.fieldKey === fieldKey) || null;
}

// ============================================
// USER VISIBILITY RESOLUTION
// ============================================

export async function getUserVisibilityChoices(userId: string): Promise<UserVisibility[]> {
  return prisma.userFieldVisibility.findMany({
    where: { userId },
  });
}

/**
 * Resolve effective visibility for a field, considering:
 * 1. Governance rule (admin policy)
 * 2. User's visibility choice
 * 3. Entitlement (premium/verified gates)
 */
export function resolveFieldVisibility(
  rule: GovernanceRule,
  userChoice: UserVisibility | undefined,
  isPremium: boolean,
  isVerified: boolean
): { isPublic: boolean; reason?: string } {
  // Premium-only field and user is not premium: always hidden
  if (rule.premiumOnly && !isPremium) {
    return { isPublic: false, reason: 'Recurso premium' };
  }
  
  // Verified-only field and user is not verified
  if (rule.verifiedOnly && !isVerified) {
    return { isPublic: false, reason: 'Requer verificação' };
  }
  
  // If user can't toggle, use admin default
  if (!rule.userCanToggleVisibility) {
    return { isPublic: rule.defaultPublicVisible, reason: 'Definido pelo administrador' };
  }
  
  // If user has a choice, respect it
  if (userChoice) {
    return { isPublic: userChoice.isPublic };
  }
  
  // Default: hidden if hiddenByDefault, otherwise use admin default
  if (rule.hiddenByDefault) {
    return { isPublic: false };
  }
  
  return { isPublic: rule.defaultPublicVisible };
}

/**
 * Get all resolved field visibilities for a user (for the settings UI)
 */
export async function getResolvedVisibilities(
  userId: string,
  isPremium: boolean,
  isVerified: boolean
): Promise<ResolvedFieldVisibility[]> {
  const [rules, userChoices] = await Promise.all([
    getGovernanceRules(),
    getUserVisibilityChoices(userId),
  ]);
  
  const choiceMap = new Map(userChoices.map(c => [c.fieldKey, c]));
  
  return rules
    .filter(r => r.visibleInProfileEdit)
    .map(rule => {
      const choice = choiceMap.get(rule.fieldKey);
      const resolved = resolveFieldVisibility(rule, choice, isPremium, isVerified);
      
      return {
        fieldKey: rule.fieldKey,
        label: rule.label,
        isPublic: resolved.isPublic,
        userCanChange: rule.userCanToggleVisibility && 
          !(rule.premiumOnly && !isPremium) && 
          !(rule.verifiedOnly && !isVerified),
        isRequired: rule.isRequired,
        reason: resolved.reason,
      };
    });
}

/**
 * Save user visibility choices (validates against governance rules)
 */
export async function saveUserVisibilityChoices(
  userId: string,
  choices: { fieldKey: string; isPublic: boolean }[]
): Promise<void> {
  const rules = await getGovernanceRules();
  const ruleMap = new Map(rules.map(r => [r.fieldKey, r]));
  
  for (const choice of choices) {
    const rule = ruleMap.get(choice.fieldKey);
    if (!rule) continue;
    
    // Skip if user can't toggle
    if (!rule.userCanToggleVisibility) continue;
    
    await prisma.userFieldVisibility.upsert({
      where: {
        userId_fieldKey: { userId, fieldKey: choice.fieldKey },
      },
      update: { isPublic: choice.isPublic },
      create: { userId, fieldKey: choice.fieldKey, isPublic: choice.isPublic },
    });
  }
}

// ============================================
// PUBLIC PROFILE RESOLVER
// ============================================

function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Central public profile resolver.
 * Builds a safe, governance-aware profile object.
 * Used by: discovery cards, profile modals, public profile, matches views.
 */
export async function resolvePublicProfile(
  targetUserId: string,
  viewerUserId?: string
): Promise<PublicProfileData | null> {
  const isOwnProfile = targetUserId === viewerUserId;
  
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      nickname: true,
      bio: true,
      headline: true,
      pronouns: true,
      statusMood: true,
      birthDate: true,
      gender: true,
      lookingFor: true,
      relationshipStatus: true,
      city: true,
      state: true,
      neighborhood: true,
      country: true,
      photos: true,
      interests: true,
      languages: true,
      work: true,
      education: true,
      birthTime: true,
      birthPlace: true,
      birthChartData: true,
      profileQuality: true,
      profileComplete: true,
      showAge: true,
      showDistance: true,
      userPhotos: { orderBy: { order: 'asc' } },
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
      plan: { select: { name: true, slug: true } },
      fieldVisibility: true,
      verificationStatus: true,
      scheduledPassports: {
        where: { startDate: { lte: new Date() }, endDate: { gte: new Date() } },
        take: 1
      },
      passportSetting: {
        select: {
          isActive: true,
          city: true,
          state: true,
          neighborhood: true,
          country: true,
          isAppearing: true,
        }
      },
    },
  });
  
  if (!user) return null;
  
  // Determine effective location based on passport
  const getEffectiveLocation = () => {
    // Check scheduled passport first
    if (user.scheduledPassports.length > 0) {
      const scheduled = user.scheduledPassports[0];
      return { city: scheduled.city, state: scheduled.state, neighborhood: scheduled.neighborhood, country: scheduled.country };
    }
    // Check active passport
    if (user.passportSetting?.isActive && (isOwnProfile || user.passportSetting.isAppearing)) {
      return {
        city: user.passportSetting.city,
        state: user.passportSetting.state,
        neighborhood: user.passportSetting.neighborhood,
        country: user.passportSetting.country
      };
    }
    // Real location
    return { city: user.city, state: user.state, neighborhood: user.neighborhood, country: user.country };
  };

  const effectiveLoc = getEffectiveLocation();

  // If own profile, return everything
  if (isOwnProfile) {
    const profileByCategory = buildCategoryMap(user.profileAnswers);
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      age: calculateAge(user.birthDate),
      bio: user.bio,
      headline: user.headline,
      pronouns: user.pronouns,
      statusMood: user.statusMood,
      gender: user.gender,
      lookingFor: user.lookingFor,
      relationshipStatus: user.relationshipStatus,
      city: effectiveLoc.city,
      state: effectiveLoc.state,
      neighborhood: effectiveLoc.neighborhood,
      country: effectiveLoc.country,
      photos: (() => {
        const photos = user.userPhotos.length > 0 
          ? (() => {
              const p = new Array(6).fill("");
              user.userPhotos.forEach(photo => {
                if (photo.order >= 0 && photo.order < 6) p[photo.order] = photo.url;
              });
              return p;
            })()
          : (user.photos && user.photos.length > 0 ? user.photos : new Array(6).fill(""));
        // Ensure at least 6 slots
        while (photos.length < 6) photos.push("");
        return photos;
      })(),
      interests: user.interests,
      languages: user.languages,
      work: user.work,
      education: user.education,
      birthTime: user.birthTime,
      birthPlace: user.birthPlace,
      birthChartData: user.birthChartData,
      profileQuality: user.profileQuality,
      profileByCategory,
      plan: user.plan,
      isOwnProfile: true,
      isVerified: user.verificationStatus === 'VERIFIED',
    };
  }
  
  // For other viewers: apply governance rules
  const rules = await getGovernanceRules();
  const ruleMap = new Map(rules.map(r => [r.fieldKey, r]));
  const visibilityMap = new Map(user.fieldVisibility.map(v => [v.fieldKey, v]));
  
  // Determine premium/verified status (simplified: check plan slug)
  const isPremium = user.plan?.slug !== 'gratuito' && user.plan?.slug !== undefined;
  const isVerified = user.verificationStatus === 'VERIFIED';
  
  const isFieldPublic = (fieldKey: string): boolean => {
    const rule = ruleMap.get(fieldKey);
    if (!rule) return true; // No rule = show by default
    const choice = visibilityMap.get(fieldKey);
    return resolveFieldVisibility(rule, choice ? { fieldKey, isPublic: choice.isPublic } : undefined, isPremium, isVerified).isPublic;
  };
  
  // Build category map, filtering by governance
  const profileByCategory: Record<string, { name: string; values: string[] }> = {};
  for (const answer of user.profileAnswers) {
    const catSlug = answer.option.category.slug;
    const catFieldKey = `cat:${catSlug}`;
    
    if (!isFieldPublic(catFieldKey)) continue;
    
    const catName = answer.option.category.name;
    if (!profileByCategory[catSlug]) {
      profileByCategory[catSlug] = { name: catName, values: [] };
    }
    
    // Push the option name
    profileByCategory[catSlug].values.push(answer.option.name);
    
    // If there's a custom text value (e.g., for "Other" option), add it too
    if (answer.value && answer.value !== answer.option.name) {
      profileByCategory[catSlug].values.push(answer.value);
    }
    if (answer.values.length > 0) {
      profileByCategory[catSlug].values.push(...answer.values);
    }
  }
  
  return {
    id: user.id,
    name: user.name, // Name is always public
    nickname: user.nickname,
    age: user.showAge !== false ? calculateAge(user.birthDate) : null, // Respect user showAge preference
    bio: isFieldPublic('bio') ? user.bio : null,
    headline: isFieldPublic('headline') ? user.headline : null,
    pronouns: isFieldPublic('pronouns') ? user.pronouns : null,
    statusMood: isFieldPublic('statusMood') ? user.statusMood : null,
    gender: user.gender, // Gender always shown for matching
    lookingFor: user.lookingFor,
    relationshipStatus: isFieldPublic('relationshipStatus') ? user.relationshipStatus : null,
    city: isFieldPublic('city') ? effectiveLoc.city : null,
    state: isFieldPublic('state') ? effectiveLoc.state : null,
    neighborhood: isFieldPublic('neighborhood') ? effectiveLoc.neighborhood : null,
    country: isFieldPublic('country') ? effectiveLoc.country : null,
    photos: (() => {
      const photos = user.userPhotos.length > 0 
        ? (() => {
            const p = new Array(6).fill("");
            user.userPhotos.forEach(photo => {
              if (photo.order >= 0 && photo.order < 6) p[photo.order] = photo.url;
            });
            return p;
          })()
        : (user.photos && user.photos.length > 0 ? user.photos : new Array(6).fill(""));
      while (photos.length < 6) photos.push("");
      return photos;
    })(),
    interests: isFieldPublic('interests') ? user.interests : [],
    languages: isFieldPublic('languages') ? user.languages : [],
    work: isFieldPublic('work') ? user.work : null,
    education: isFieldPublic('education') ? user.education : null,
    birthTime: isFieldPublic('birthTime') ? user.birthTime : null,
    birthPlace: isFieldPublic('birthPlace') ? user.birthPlace : null,
    birthChartData: isFieldPublic('birthChartData') ? user.birthChartData : null,
    profileQuality: user.profileQuality,
    profileByCategory,
    plan: null, // Don't expose plan to other users
    isOwnProfile: false,
    isVerified,
  };
}

function buildCategoryMap(
  answers: Array<{ value: string | null; values: string[]; option: { name: string; category: { slug: string; name: string } } }>
): Record<string, { name: string; values: string[] }> {
  const result: Record<string, { name: string; values: string[] }> = {};
  for (const answer of answers) {
    const catSlug = answer.option.category.slug;
    const catName = answer.option.category.name;
    if (!result[catSlug]) result[catSlug] = { name: catName, values: [] };
    
    result[catSlug].values.push(answer.option.name);
    
    if (answer.value && answer.value !== answer.option.name) {
      result[catSlug].values.push(answer.value);
    }
    if (answer.values.length > 0) {
      result[catSlug].values.push(...answer.values);
    }
  }
  return result;
}

// ============================================
// ONBOARDING HELPERS
// ============================================

/**
 * Get governance-aware onboarding steps.
 * Returns which fields/categories are required vs optional in onboarding.
 */
export async function getOnboardingGovernance(): Promise<{
  requiredFields: GovernanceRule[];
  optionalFields: GovernanceRule[];
  allFields: GovernanceRule[];
}> {
  const rules = await getGovernanceRules();
  const onboardingRules = rules.filter(r => r.visibleInOnboarding);
  
  return {
    requiredFields: onboardingRules.filter(r => r.requiredInOnboarding),
    optionalFields: onboardingRules.filter(r => !r.requiredInOnboarding),
    allFields: onboardingRules,
  };
}

/**
 * Calculate profile quality score based on filled fields and governance rules.
 */
export async function calculateProfileQuality(userId: string): Promise<number> {
  const rules = await getGovernanceRules();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      bio: true,
      headline: true,
      pronouns: true,
      statusMood: true,
      birthDate: true,
      gender: true,
      relationshipStatus: true,
      city: true,
      state: true,
      neighborhood: true,
      work: true,
      education: true,
      interests: true,
      languages: true,
      photos: true,
      userPhotos: true,
      birthTime: true,
      birthPlace: true,
      birthChartData: true,
      profileAnswers: { select: { option: { select: { category: { select: { slug: true } } } } } },
    },
  });
  
  if (!user) return 0;
  
  let filled = 0;
  let total = 0;
  
  const directFieldValues: Record<string, boolean> = {
    'name': !!user.name,
    'bio': !!user.bio,
    'headline': !!user.headline,
    'pronouns': !!user.pronouns,
    'statusMood': !!user.statusMood,
    'birthDate': !!user.birthDate,
    'gender': !!user.gender,
    'relationshipStatus': !!user.relationshipStatus,
    'city': !!user.city,
    'state': !!user.state,
    'neighborhood': !!user.neighborhood,
    'work': !!user.work,
    'education': !!user.education,
    'interests': user.interests.length > 0,
    'languages': user.languages.length > 0,
    'photos': user.userPhotos.length > 0 || user.photos.length > 0,
    'birthTime': !!user.birthTime,
    'birthPlace': !!user.birthPlace,
    'birthChartData': !!user.birthChartData,
  };
  
  const answeredCategories = new Set(
    user.profileAnswers.map(a => a.option.category.slug)
  );
  
  for (const rule of rules) {
    if (!rule.isActive) continue;
    total++;
    
    if (rule.fieldType === 'direct') {
      if (directFieldValues[rule.fieldKey]) filled++;
    } else if (rule.fieldType === 'category') {
      const catSlug = rule.fieldKey.replace('cat:', '');
      if (answeredCategories.has(catSlug)) filled++;
    }
  }
  
  const score = total > 0 ? Math.round((filled / total) * 100) : 0;
  
  // Update user's profileQuality
  await prisma.user.update({
    where: { id: userId },
    data: { profileQuality: score },
  });
  
  return score;
}
