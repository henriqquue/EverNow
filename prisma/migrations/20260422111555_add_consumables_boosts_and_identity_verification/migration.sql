-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'PENDING', 'TRIAL');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaywallEventType" AS ENUM ('VIEW', 'CLICK_UPGRADE', 'CLOSE', 'SUBSCRIBE');

-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('BOOLEAN', 'LIMIT', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'HTML', 'JSON', 'IMAGE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'TRANS_MALE', 'TRANS_FEMALE', 'GENDER_FLUID', 'AGENDER', 'OTHER', 'PREFER_NOT_SAY');

-- CreateEnum
CREATE TYPE "LookingFor" AS ENUM ('SERIOUS', 'CASUAL', 'FRIENDSHIP', 'OPEN');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('SINGLE', 'DATING', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OPEN_RELATIONSHIP');

-- CreateEnum
CREATE TYPE "ImportanceLevel" AS ENUM ('INDIFFERENT', 'PREFERENCE', 'VERY_IMPORTANT', 'ESSENTIAL');

-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('SINGLE', 'MULTIPLE', 'TEXT', 'NUMBER', 'DATE', 'RANGE');

-- CreateEnum
CREATE TYPE "ResetPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER');

-- CreateEnum
CREATE TYPE "LimitMode" AS ENUM ('HARD', 'SOFT');

-- CreateEnum
CREATE TYPE "LikeType" AS ENUM ('LIKE', 'SUPERLIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('ACTIVE', 'UNMATCHED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FAKE_PROFILE', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SPAM', 'UNDERAGE', 'SCAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "MeetingActivity" AS ENUM ('COFFEE', 'RESTAURANT', 'BAR', 'CINEMA', 'WALK', 'GYM', 'OUTDOOR');

-- CreateEnum
CREATE TYPE "PassportVisibility" AS ENUM ('CITY_ONLY', 'CITY_AND_DATES', 'HIDDEN');

-- CreateEnum
CREATE TYPE "PassportStartMode" AS ENUM ('DURING_PERIOD', 'THREE_DAYS_BEFORE', 'SEVEN_DAYS_BEFORE', 'FOURTEEN_DAYS_BEFORE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "CampaignDisplayType" AS ENUM ('MODAL', 'BANNER', 'CARD');

-- CreateEnum
CREATE TYPE "CampaignTrigger" AS ENUM ('LIMIT_REACHED', 'PREMIUM_FEATURE', 'FILTER_BLOCKED', 'PASSPORT_BLOCKED', 'LIKES_BLOCKED', 'MESSAGE_LIMIT', 'MANUAL', 'PAGE_VIEW');

-- CreateEnum
CREATE TYPE "AdZoneType" AS ENUM ('DISCOVERY_FEED', 'MATCHES_LIST', 'PROFILE_CARDS', 'BETWEEN_PROFILES', 'EMPTY_RESULTS', 'LANDING_PAGE', 'CHAT_LIST', 'SIDEBAR');

-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('GOOGLE_ADSENSE', 'INTERNAL_BANNER', 'INTERNAL_CARD', 'INTERNAL_INTERSTITIAL');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'EXTENDED_TRIAL', 'FIRST_PAYMENT_FREE');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DiscoveryEventType" AS ENUM ('IMPRESSION', 'PROFILE_OPEN', 'LIKE', 'SUPERLIKE', 'DISLIKE', 'FAVORITE', 'UNFAVORITE', 'BLOCK', 'MATCH');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('PHOTO', 'DOCUMENT', 'SOCIAL');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARNING', 'TEMP_SUSPENSION', 'PERMANENT_BAN', 'CONTENT_REMOVAL', 'REPORT_RESOLVED', 'REPORT_DISMISSED', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'TRUST_SCORE_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LGPDRequestType" AS ENUM ('DATA_EXPORT', 'DATA_ANONYMIZATION', 'DATA_DELETION', 'DATA_RECTIFICATION', 'DATA_PORTABILITY', 'CONSENT_WITHDRAWAL', 'PROCESSING_OBJECTION');

-- CreateEnum
CREATE TYPE "LGPDRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'DOWNLOADED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LGPDAuditAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ANONYMIZED', 'DATA_EXPORTED', 'CONSENT_GRANTED', 'CONSENT_WITHDRAWN', 'PROFILE_VIEWED', 'PROFILE_UPDATED', 'MESSAGE_SENT', 'MESSAGE_DELETED', 'ACCOUNT_ACCESSED', 'PASSWORD_CHANGED', 'EMAIL_CHANGED', 'DATA_RETENTION_PURGED');

-- CreateEnum
CREATE TYPE "ConsumableType" AS ENUM ('BOOST', 'SUPERLIKES', 'UNLIMITED_LIKES', 'VISIBILITY_PASS', 'SPOTLIGHT', 'LIKES_NOTIFICATION', 'TRAVEL_PASS', 'RESET_STACK', 'PRIORITY_MESSAGE');

-- CreateEnum
CREATE TYPE "ConsumableStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CPF', 'PASSPORT', 'CNH', 'RG', 'BIRTH_CERTIFICATE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "nickname" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "bio" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "orientation" TEXT,
    "lookingFor" "LookingFor",
    "relationshipStatus" "RelationshipStatus",
    "city" TEXT,
    "state" TEXT,
    "neighborhood" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photos" TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "profileComplete" INTEGER NOT NULL DEFAULT 0,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "planId" TEXT,
    "pronouns" TEXT,
    "headline" TEXT,
    "statusMood" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "work" TEXT,
    "education" TEXT,
    "profileQuality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "showLastActive" BOOLEAN NOT NULL DEFAULT true,
    "showDistance" BOOLEAN NOT NULL DEFAULT true,
    "showAge" BOOLEAN NOT NULL DEFAULT true,
    "incognitoMode" BOOLEAN NOT NULL DEFAULT false,
    "showReadReceipts" BOOLEAN NOT NULL DEFAULT true,
    "notifyMatches" BOOLEAN NOT NULL DEFAULT true,
    "notifyMessages" BOOLEAN NOT NULL DEFAULT true,
    "notifyLikes" BOOLEAN NOT NULL DEFAULT true,
    "notifyMarketing" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPrice" DOUBLE PRECISION,
    "badge" TEXT,
    "highlightColor" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "features" JSONB DEFAULT '{}',
    "limits" JSONB DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "showOnLanding" BOOLEAN NOT NULL DEFAULT true,
    "showInComparison" BOOLEAN NOT NULL DEFAULT true,
    "hasTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialDays" INTEGER DEFAULT 7,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanInterval" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPrice" DOUBLE PRECISION,
    "discountPercent" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bestOffer" BOOLEAN NOT NULL DEFAULT false,
    "billingLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanInterval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanModule" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isVisibleLocked" BOOLEAN NOT NULL DEFAULT false,
    "blockMessage" TEXT,
    "ctaText" TEXT,
    "showInComparison" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromPlanId" TEXT,
    "toPlanId" TEXT,
    "amount" DOUBLE PRECISION,
    "billingInterval" "BillingInterval",
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaywallEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "PaywallEventType" NOT NULL,
    "featureSlug" TEXT,
    "moduleName" TEXT,
    "planRequired" TEXT,
    "sourcePage" TEXT,
    "sourceAction" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaywallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "FeatureType" NOT NULL DEFAULT 'BOOLEAN',
    "defaultLimit" INTEGER DEFAULT 0,
    "resetPeriod" "ResetPeriod" NOT NULL DEFAULT 'NEVER',
    "showInComparison" BOOLEAN NOT NULL DEFAULT true,
    "comparisonOrder" INTEGER NOT NULL DEFAULT 0,
    "comparisonLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureLimit" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "limitValue" INTEGER DEFAULT 0,
    "value" INTEGER DEFAULT 0,
    "unlimited" BOOLEAN NOT NULL DEFAULT false,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limitMode" "LimitMode" NOT NULL DEFAULT 'HARD',
    "warningThreshold" INTEGER,
    "isVisibleLocked" BOOLEAN NOT NULL DEFAULT false,
    "blockMessage" TEXT,
    "ctaText" TEXT,
    "upgradeUrl" TEXT,
    "showInComparison" BOOLEAN NOT NULL DEFAULT true,
    "comparisonOrder" INTEGER NOT NULL DEFAULT 0,
    "comparisonLabel" TEXT,

    CONSTRAINT "FeatureLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "group" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CmsBlock" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'TEXT',
    "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "hasIAm" BOOLEAN NOT NULL DEFAULT true,
    "hasIWant" BOOLEAN NOT NULL DEFAULT true,
    "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileOption" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "answerType" "AnswerType" NOT NULL DEFAULT 'SINGLE',
    "isMultiple" BOOLEAN NOT NULL DEFAULT false,
    "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfileAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "value" TEXT,
    "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfileAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "values" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importance" "ImportanceLevel" NOT NULL DEFAULT 'PREFERENCE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompatibilityWeight" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "boostMatch" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "penalty" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompatibilityWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompatibilityCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryScores" JSONB NOT NULL DEFAULT '{}',
    "explanation" JSONB NOT NULL DEFAULT '[]',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompatibilityCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skippedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentStep" TEXT,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileFieldGovernance" (
    "id" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'direct',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "requiredInOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "requiredBeforeDiscovery" BOOLEAN NOT NULL DEFAULT false,
    "visibleInOnboarding" BOOLEAN NOT NULL DEFAULT true,
    "visibleInProfileEdit" BOOLEAN NOT NULL DEFAULT true,
    "visibleInProfileCard" BOOLEAN NOT NULL DEFAULT true,
    "visibleInFullProfile" BOOLEAN NOT NULL DEFAULT true,
    "defaultPublicVisible" BOOLEAN NOT NULL DEFAULT true,
    "userCanToggleVisibility" BOOLEAN NOT NULL DEFAULT true,
    "hiddenByDefault" BOOLEAN NOT NULL DEFAULT false,
    "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
    "verifiedOnly" BOOLEAN NOT NULL DEFAULT false,
    "affectsCompatibility" BOOLEAN NOT NULL DEFAULT false,
    "affectsDiscoveryRanking" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "group" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileFieldGovernance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFieldVisibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFieldVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isQuick" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minAge" INTEGER DEFAULT 18,
    "maxAge" INTEGER DEFAULT 100,
    "maxDistance" INTEGER DEFAULT 100,
    "genders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orientations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minCompatibility" INTEGER DEFAULT 0,
    "verifiedOnly" BOOLEAN NOT NULL DEFAULT false,
    "onlineRecently" BOOLEAN NOT NULL DEFAULT false,
    "withPhotos" BOOLEAN NOT NULL DEFAULT true,
    "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
    "intentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bodyTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minHeight" INTEGER,
    "maxHeight" INTEGER,
    "religions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasChildren" TEXT,
    "wantsChildren" TEXT,
    "lifestyles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "habits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "neighborhoods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invisibleMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "type" "LikeType" NOT NULL DEFAULT 'LIKE',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "favoriteUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatThread" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessage" TEXT,
    "user1Archived" BOOLEAN NOT NULL DEFAULT false,
    "user2Archived" BOOLEAN NOT NULL DEFAULT false,
    "user1Muted" BOOLEAN NOT NULL DEFAULT false,
    "user2Muted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "attachmentType" TEXT,
    "attachmentUrl" TEXT,
    "replyToId" TEXT,
    "reactions" JSONB,
    "deletedForSender" BOOLEAN NOT NULL DEFAULT false,
    "deletedForReceiver" BOOLEAN NOT NULL DEFAULT false,
    "deletedForAll" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassportSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "state" TEXT,
    "neighborhood" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isExploring" BOOLEAN NOT NULL DEFAULT true,
    "isAppearing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassportSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledPassport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "neighborhood" TEXT,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startMode" "PassportStartMode" NOT NULL DEFAULT 'DURING_PERIOD',
    "customDaysBefore" INTEGER,
    "visibility" "PassportVisibility" NOT NULL DEFAULT 'CITY_AND_DATES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPassport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingMode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activities" "MeetingActivity"[] DEFAULT ARRAY[]::"MeetingActivity"[],
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "maxDistance" INTEGER DEFAULT 10,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ctaText" TEXT NOT NULL DEFAULT 'Fazer upgrade',
    "ctaUrl" TEXT NOT NULL DEFAULT '/app/planos',
    "imageUrl" TEXT,
    "displayType" "CampaignDisplayType" NOT NULL DEFAULT 'MODAL',
    "triggers" "CampaignTrigger"[],
    "targetFeatures" TEXT[],
    "targetPages" TEXT[],
    "targetPlanId" TEXT,
    "offerPlanId" TEXT,
    "discountPercent" INTEGER,
    "discountCode" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "maxImpressions" INTEGER,
    "maxPerUser" INTEGER NOT NULL DEFAULT 3,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "trigger" TEXT,
    "featureSlug" TEXT,
    "page" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "ctaText" TEXT NOT NULL DEFAULT 'Saiba mais',
    "ctaUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "position" TEXT NOT NULL DEFAULT 'top',
    "pages" TEXT[],
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "targetPlanId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "dismissals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "content" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "customStyles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingFAQ" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingTestimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "city" TEXT,
    "photo" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "label" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "AdZoneType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "adsenseSlot" TEXT,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanAdSettings" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "adsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "adsFrequency" INTEGER NOT NULL DEFAULT 5,
    "adsPerSession" INTEGER NOT NULL DEFAULT 10,
    "adsPerDay" INTEGER NOT NULL DEFAULT 50,
    "minTimeBetween" INTEGER NOT NULL DEFAULT 30,
    "allowedZones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanAdSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanAdZone" (
    "id" TEXT NOT NULL,
    "planAdSettingsId" TEXT NOT NULL,
    "adZoneId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" INTEGER,

    CONSTRAINT "PlanAdZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "adType" "AdType" NOT NULL DEFAULT 'INTERNAL_BANNER',
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT,
    "ctaText" TEXT NOT NULL DEFAULT 'Saiba mais',
    "ctaUrl" TEXT NOT NULL,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "targetPlanSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "maxImpressions" INTEGER,
    "maxPerUser" INTEGER NOT NULL DEFAULT 5,
    "maxPerDay" INTEGER,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaignZone" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AdCampaignZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdImpression" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "zoneId" TEXT NOT NULL,
    "campaignId" TEXT,
    "adType" "AdType" NOT NULL,
    "page" TEXT,
    "estimatedRevenue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdClick" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "zoneId" TEXT NOT NULL,
    "campaignId" TEXT,
    "adType" "AdType" NOT NULL,
    "targetUrl" TEXT,
    "page" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdGlobalSettings" (
    "id" TEXT NOT NULL,
    "adsenseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "adsensePublisherId" TEXT,
    "maxConsecutiveAds" INTEGER NOT NULL DEFAULT 1,
    "cooldownAfterAction" INTEGER NOT NULL DEFAULT 30,
    "blockedPages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimatedCpm" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdGlobalSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountPercent" INTEGER,
    "discountAmount" DOUBLE PRECISION,
    "trialDays" INTEGER,
    "applicablePlans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicableIntervals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minAmount" DOUBLE PRECISION,
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planSlug" TEXT NOT NULL,
    "billingInterval" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "page" TEXT,
    "planId" TEXT,
    "planSlug" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "eventType" "DiscoveryEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAffinity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredAgeMin" INTEGER,
    "preferredAgeMax" INTEGER,
    "preferredGenders" JSONB,
    "preferredLocations" JSONB,
    "preferredCategories" JSONB,
    "positivePatterns" JSONB,
    "negativePatterns" JSONB,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAffinity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL DEFAULT 'PHOTO',
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "photoUrl" TEXT,
    "documentUrl" TEXT,
    "socialLink" TEXT,
    "reviewedById" TEXT,
    "reviewerNotes" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "actionType" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "reportId" TEXT,
    "suspendedUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumableItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "ConsumableType" NOT NULL DEFAULT 'BOOST',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "quantity" INTEGER,
    "durationDays" INTEGER,
    "icon" TEXT,
    "color" TEXT,
    "benefits" JSONB,
    "badge" TEXT,
    "visibility" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "ConsumableStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveBoost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "photoUrl" TEXT,
    "documentUrl" TEXT,
    "documentType" "DocumentType",
    "selfieUrl" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "visibilityBoost" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "trustScoreBoost" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "profileBadge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LGPDRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" "LGPDRequestType" NOT NULL,
    "status" "LGPDRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "data" JSONB,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "downloadUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LGPDRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LGPDAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" "LGPDAuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "performedBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LGPDAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "analytics" BOOLEAN NOT NULL DEFAULT true,
    "thirdParty" BOOLEAN NOT NULL DEFAULT false,
    "profilingConsent" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LGPDCompliance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataInventoryDate" TIMESTAMP(3),
    "retentionReviewed" TIMESTAMP(3),
    "consentCurrent" BOOLEAN NOT NULL DEFAULT true,
    "lastAuditDate" TIMESTAMP(3),
    "complianceScore" INTEGER NOT NULL DEFAULT 100,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LGPDCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE INDEX "PlanInterval_planId_idx" ON "PlanInterval"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanInterval_planId_interval_key" ON "PlanInterval"("planId", "interval");

-- CreateIndex
CREATE INDEX "PlanModule_planId_idx" ON "PlanModule"("planId");

-- CreateIndex
CREATE INDEX "PlanModule_moduleId_idx" ON "PlanModule"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanModule_planId_moduleId_key" ON "PlanModule"("planId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_userId_idx" ON "SubscriptionHistory"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_planId_idx" ON "SubscriptionHistory"("planId");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_action_idx" ON "SubscriptionHistory"("action");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_createdAt_idx" ON "SubscriptionHistory"("createdAt");

-- CreateIndex
CREATE INDEX "PaywallEvent_userId_idx" ON "PaywallEvent"("userId");

-- CreateIndex
CREATE INDEX "PaywallEvent_eventType_idx" ON "PaywallEvent"("eventType");

-- CreateIndex
CREATE INDEX "PaywallEvent_featureSlug_idx" ON "PaywallEvent"("featureSlug");

-- CreateIndex
CREATE INDEX "PaywallEvent_createdAt_idx" ON "PaywallEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_slug_key" ON "Feature"("slug");

-- CreateIndex
CREATE INDEX "FeatureLimit_showInComparison_idx" ON "FeatureLimit"("showInComparison");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureLimit_planId_featureId_key" ON "FeatureLimit"("planId", "featureId");

-- CreateIndex
CREATE INDEX "FeatureUsage_userId_featureId_idx" ON "FeatureUsage"("userId", "featureId");

-- CreateIndex
CREATE INDEX "FeatureUsage_periodEnd_idx" ON "FeatureUsage"("periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureUsage_userId_featureId_periodStart_key" ON "FeatureUsage"("userId", "featureId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CmsBlock_key_key" ON "CmsBlock"("key");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileCategory_slug_key" ON "ProfileCategory"("slug");

-- CreateIndex
CREATE INDEX "ProfileOption_categoryId_idx" ON "ProfileOption"("categoryId");

-- CreateIndex
CREATE INDEX "ProfileOption_parentId_idx" ON "ProfileOption"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileOption_categoryId_slug_key" ON "ProfileOption"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "UserProfileAnswer_userId_idx" ON "UserProfileAnswer"("userId");

-- CreateIndex
CREATE INDEX "UserProfileAnswer_optionId_idx" ON "UserProfileAnswer"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfileAnswer_userId_optionId_key" ON "UserProfileAnswer"("userId", "optionId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_optionId_idx" ON "UserPreference"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_optionId_key" ON "UserPreference"("userId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompatibilityWeight_categoryId_key" ON "CompatibilityWeight"("categoryId");

-- CreateIndex
CREATE INDEX "CompatibilityCache_userId_idx" ON "CompatibilityCache"("userId");

-- CreateIndex
CREATE INDEX "CompatibilityCache_targetUserId_idx" ON "CompatibilityCache"("targetUserId");

-- CreateIndex
CREATE INDEX "CompatibilityCache_expiresAt_idx" ON "CompatibilityCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompatibilityCache_userId_targetUserId_key" ON "CompatibilityCache"("userId", "targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_userId_key" ON "OnboardingProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileFieldGovernance_fieldKey_key" ON "ProfileFieldGovernance"("fieldKey");

-- CreateIndex
CREATE INDEX "UserFieldVisibility_userId_idx" ON "UserFieldVisibility"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFieldVisibility_userId_fieldKey_key" ON "UserFieldVisibility"("userId", "fieldKey");

-- CreateIndex
CREATE INDEX "UserPhoto_userId_idx" ON "UserPhoto"("userId");

-- CreateIndex
CREATE INDEX "SavedFilter_userId_idx" ON "SavedFilter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryPreference_userId_key" ON "DiscoveryPreference"("userId");

-- CreateIndex
CREATE INDEX "Like_fromUserId_idx" ON "Like"("fromUserId");

-- CreateIndex
CREATE INDEX "Like_toUserId_idx" ON "Like"("toUserId");

-- CreateIndex
CREATE INDEX "Like_createdAt_idx" ON "Like"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Like_fromUserId_toUserId_key" ON "Like"("fromUserId", "toUserId");

-- CreateIndex
CREATE INDEX "Match_user1Id_idx" ON "Match"("user1Id");

-- CreateIndex
CREATE INDEX "Match_user2Id_idx" ON "Match"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Match_user1Id_user2Id_key" ON "Match"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_favoriteUserId_key" ON "Favorite"("userId", "favoriteUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_matchId_key" ON "ChatThread"("matchId");

-- CreateIndex
CREATE INDEX "ChatThread_lastMessageAt_idx" ON "ChatThread"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ChatMessage_threadId_idx" ON "ChatMessage"("threadId");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Block_blockerId_idx" ON "Block"("blockerId");

-- CreateIndex
CREATE INDEX "Block_blockedUserId_idx" ON "Block"("blockedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedUserId_key" ON "Block"("blockerId", "blockedUserId");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PassportSetting_userId_key" ON "PassportSetting"("userId");

-- CreateIndex
CREATE INDEX "ScheduledPassport_userId_idx" ON "ScheduledPassport"("userId");

-- CreateIndex
CREATE INDEX "ScheduledPassport_startDate_idx" ON "ScheduledPassport"("startDate");

-- CreateIndex
CREATE INDEX "ScheduledPassport_endDate_idx" ON "ScheduledPassport"("endDate");

-- CreateIndex
CREATE INDEX "MeetingMode_userId_idx" ON "MeetingMode"("userId");

-- CreateIndex
CREATE INDEX "MeetingMode_isActive_idx" ON "MeetingMode"("isActive");

-- CreateIndex
CREATE INDEX "MeetingMode_expiresAt_idx" ON "MeetingMode"("expiresAt");

-- CreateIndex
CREATE INDEX "ProfileView_viewerId_idx" ON "ProfileView"("viewerId");

-- CreateIndex
CREATE INDEX "ProfileView_viewedUserId_idx" ON "ProfileView"("viewedUserId");

-- CreateIndex
CREATE INDEX "ProfileView_createdAt_idx" ON "ProfileView"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_startsAt_endsAt_idx" ON "Campaign"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Campaign_targetPlanId_idx" ON "Campaign"("targetPlanId");

-- CreateIndex
CREATE INDEX "CampaignEvent_campaignId_idx" ON "CampaignEvent"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignEvent_userId_idx" ON "CampaignEvent"("userId");

-- CreateIndex
CREATE INDEX "CampaignEvent_eventType_idx" ON "CampaignEvent"("eventType");

-- CreateIndex
CREATE INDEX "CampaignEvent_createdAt_idx" ON "CampaignEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Banner_slug_key" ON "Banner"("slug");

-- CreateIndex
CREATE INDEX "Banner_isActive_idx" ON "Banner"("isActive");

-- CreateIndex
CREATE INDEX "Banner_startsAt_endsAt_idx" ON "Banner"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "LandingSection_key_key" ON "LandingSection"("key");

-- CreateIndex
CREATE INDEX "LandingSection_key_idx" ON "LandingSection"("key");

-- CreateIndex
CREATE INDEX "LandingSection_isActive_order_idx" ON "LandingSection"("isActive", "order");

-- CreateIndex
CREATE INDEX "LandingFAQ_isActive_order_idx" ON "LandingFAQ"("isActive", "order");

-- CreateIndex
CREATE INDEX "LandingTestimonial_isActive_order_idx" ON "LandingTestimonial"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LandingSetting_key_key" ON "LandingSetting"("key");

-- CreateIndex
CREATE INDEX "LandingSetting_group_idx" ON "LandingSetting"("group");

-- CreateIndex
CREATE UNIQUE INDEX "AdZone_slug_key" ON "AdZone"("slug");

-- CreateIndex
CREATE INDEX "AdZone_type_idx" ON "AdZone"("type");

-- CreateIndex
CREATE INDEX "AdZone_isActive_idx" ON "AdZone"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PlanAdSettings_planId_key" ON "PlanAdSettings"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanAdZone_planAdSettingsId_adZoneId_key" ON "PlanAdZone"("planAdSettingsId", "adZoneId");

-- CreateIndex
CREATE UNIQUE INDEX "AdCampaign_slug_key" ON "AdCampaign"("slug");

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AdCampaign_startsAt_endsAt_idx" ON "AdCampaign"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdCampaignZone_campaignId_zoneId_key" ON "AdCampaignZone"("campaignId", "zoneId");

-- CreateIndex
CREATE INDEX "AdImpression_userId_idx" ON "AdImpression"("userId");

-- CreateIndex
CREATE INDEX "AdImpression_sessionId_idx" ON "AdImpression"("sessionId");

-- CreateIndex
CREATE INDEX "AdImpression_zoneId_idx" ON "AdImpression"("zoneId");

-- CreateIndex
CREATE INDEX "AdImpression_campaignId_idx" ON "AdImpression"("campaignId");

-- CreateIndex
CREATE INDEX "AdImpression_createdAt_idx" ON "AdImpression"("createdAt");

-- CreateIndex
CREATE INDEX "AdClick_userId_idx" ON "AdClick"("userId");

-- CreateIndex
CREATE INDEX "AdClick_sessionId_idx" ON "AdClick"("sessionId");

-- CreateIndex
CREATE INDEX "AdClick_zoneId_idx" ON "AdClick"("zoneId");

-- CreateIndex
CREATE INDEX "AdClick_campaignId_idx" ON "AdClick"("campaignId");

-- CreateIndex
CREATE INDEX "AdClick_createdAt_idx" ON "AdClick"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_status_idx" ON "Coupon"("status");

-- CreateIndex
CREATE INDEX "Coupon_startsAt_expiresAt_idx" ON "Coupon"("startsAt", "expiresAt");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_idx" ON "CouponRedemption"("couponId");

-- CreateIndex
CREATE INDEX "CouponRedemption_userId_idx" ON "CouponRedemption"("userId");

-- CreateIndex
CREATE INDEX "CouponRedemption_createdAt_idx" ON "CouponRedemption"("createdAt");

-- CreateIndex
CREATE INDEX "CommercialEvent_eventType_idx" ON "CommercialEvent"("eventType");

-- CreateIndex
CREATE INDEX "CommercialEvent_userId_idx" ON "CommercialEvent"("userId");

-- CreateIndex
CREATE INDEX "CommercialEvent_sessionId_idx" ON "CommercialEvent"("sessionId");

-- CreateIndex
CREATE INDEX "CommercialEvent_createdAt_idx" ON "CommercialEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CommercialEvent_planId_idx" ON "CommercialEvent"("planId");

-- CreateIndex
CREATE INDEX "DiscoveryEvent_userId_createdAt_idx" ON "DiscoveryEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscoveryEvent_userId_targetUserId_idx" ON "DiscoveryEvent"("userId", "targetUserId");

-- CreateIndex
CREATE INDEX "DiscoveryEvent_targetUserId_createdAt_idx" ON "DiscoveryEvent"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscoveryEvent_eventType_createdAt_idx" ON "DiscoveryEvent"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAffinity_userId_key" ON "UserAffinity"("userId");

-- CreateIndex
CREATE INDEX "UserAffinity_userId_idx" ON "UserAffinity"("userId");

-- CreateIndex
CREATE INDEX "UserAffinity_lastComputedAt_idx" ON "UserAffinity"("lastComputedAt");

-- CreateIndex
CREATE INDEX "VerificationRequest_userId_idx" ON "VerificationRequest"("userId");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- CreateIndex
CREATE INDEX "VerificationRequest_createdAt_idx" ON "VerificationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_targetUserId_idx" ON "ModerationAction"("targetUserId");

-- CreateIndex
CREATE INDEX "ModerationAction_moderatorId_idx" ON "ModerationAction"("moderatorId");

-- CreateIndex
CREATE INDEX "ModerationAction_actionType_idx" ON "ModerationAction"("actionType");

-- CreateIndex
CREATE INDEX "ModerationAction_createdAt_idx" ON "ModerationAction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsumableItem_slug_key" ON "ConsumableItem"("slug");

-- CreateIndex
CREATE INDEX "ConsumableItem_slug_idx" ON "ConsumableItem"("slug");

-- CreateIndex
CREATE INDEX "ConsumableItem_status_idx" ON "ConsumableItem"("status");

-- CreateIndex
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");

-- CreateIndex
CREATE INDEX "Purchase_itemId_idx" ON "Purchase"("itemId");

-- CreateIndex
CREATE INDEX "Purchase_status_idx" ON "Purchase"("status");

-- CreateIndex
CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt");

-- CreateIndex
CREATE INDEX "ActiveBoost_userId_idx" ON "ActiveBoost"("userId");

-- CreateIndex
CREATE INDEX "ActiveBoost_itemId_idx" ON "ActiveBoost"("itemId");

-- CreateIndex
CREATE INDEX "ActiveBoost_isActive_idx" ON "ActiveBoost"("isActive");

-- CreateIndex
CREATE INDEX "ActiveBoost_expiresAt_idx" ON "ActiveBoost"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserVerification_userId_key" ON "UserVerification"("userId");

-- CreateIndex
CREATE INDEX "UserVerification_userId_idx" ON "UserVerification"("userId");

-- CreateIndex
CREATE INDEX "UserVerification_isVerified_idx" ON "UserVerification"("isVerified");

-- CreateIndex
CREATE INDEX "UserVerification_verificationStatus_idx" ON "UserVerification"("verificationStatus");

-- CreateIndex
CREATE INDEX "UserVerification_createdAt_idx" ON "UserVerification"("createdAt");

-- CreateIndex
CREATE INDEX "LGPDRequest_userId_idx" ON "LGPDRequest"("userId");

-- CreateIndex
CREATE INDEX "LGPDRequest_status_idx" ON "LGPDRequest"("status");

-- CreateIndex
CREATE INDEX "LGPDRequest_requestType_idx" ON "LGPDRequest"("requestType");

-- CreateIndex
CREATE INDEX "LGPDRequest_createdAt_idx" ON "LGPDRequest"("createdAt");

-- CreateIndex
CREATE INDEX "LGPDAuditLog_userId_idx" ON "LGPDAuditLog"("userId");

-- CreateIndex
CREATE INDEX "LGPDAuditLog_actionType_idx" ON "LGPDAuditLog"("actionType");

-- CreateIndex
CREATE INDEX "LGPDAuditLog_createdAt_idx" ON "LGPDAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "LGPDAuditLog_entityType_idx" ON "LGPDAuditLog"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "UserConsent_userId_key" ON "UserConsent"("userId");

-- CreateIndex
CREATE INDEX "UserConsent_userId_idx" ON "UserConsent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LGPDCompliance_userId_key" ON "LGPDCompliance"("userId");

-- CreateIndex
CREATE INDEX "LGPDCompliance_userId_idx" ON "LGPDCompliance"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInterval" ADD CONSTRAINT "PlanInterval_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanModule" ADD CONSTRAINT "PlanModule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureLimit" ADD CONSTRAINT "FeatureLimit_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureLimit" ADD CONSTRAINT "FeatureLimit_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureUsage" ADD CONSTRAINT "FeatureUsage_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileOption" ADD CONSTRAINT "ProfileOption_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProfileCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileOption" ADD CONSTRAINT "ProfileOption_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProfileOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileAnswer" ADD CONSTRAINT "UserProfileAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProfileOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileAnswer" ADD CONSTRAINT "UserProfileAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProfileOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompatibilityWeight" ADD CONSTRAINT "CompatibilityWeight_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProfileCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFieldVisibility" ADD CONSTRAINT "UserFieldVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPhoto" ADD CONSTRAINT "UserPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFilter" ADD CONSTRAINT "SavedFilter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryPreference" ADD CONSTRAINT "DiscoveryPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_favoriteUserId_fkey" FOREIGN KEY ("favoriteUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassportSetting" ADD CONSTRAINT "PassportSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledPassport" ADD CONSTRAINT "ScheduledPassport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMode" ADD CONSTRAINT "MeetingMode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewedUserId_fkey" FOREIGN KEY ("viewedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_offerPlanId_fkey" FOREIGN KEY ("offerPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_targetPlanId_fkey" FOREIGN KEY ("targetPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignEvent" ADD CONSTRAINT "CampaignEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_targetPlanId_fkey" FOREIGN KEY ("targetPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAdZone" ADD CONSTRAINT "PlanAdZone_adZoneId_fkey" FOREIGN KEY ("adZoneId") REFERENCES "AdZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAdZone" ADD CONSTRAINT "PlanAdZone_planAdSettingsId_fkey" FOREIGN KEY ("planAdSettingsId") REFERENCES "PlanAdSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignZone" ADD CONSTRAINT "AdCampaignZone_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaignZone" ADD CONSTRAINT "AdCampaignZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "AdZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdImpression" ADD CONSTRAINT "AdImpression_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdImpression" ADD CONSTRAINT "AdImpression_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "AdZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "AdZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryEvent" ADD CONSTRAINT "DiscoveryEvent_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryEvent" ADD CONSTRAINT "DiscoveryEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAffinity" ADD CONSTRAINT "UserAffinity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ConsumableItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveBoost" ADD CONSTRAINT "ActiveBoost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveBoost" ADD CONSTRAINT "ActiveBoost_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ConsumableItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerification" ADD CONSTRAINT "UserVerification_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVerification" ADD CONSTRAINT "UserVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LGPDRequest" ADD CONSTRAINT "LGPDRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LGPDRequest" ADD CONSTRAINT "LGPDRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LGPDAuditLog" ADD CONSTRAINT "LGPDAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LGPDCompliance" ADD CONSTRAINT "LGPDCompliance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
