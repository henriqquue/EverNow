'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders, RefreshCw, Sparkles, MapPin, Crown, Heart, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { ProfileCard } from '@/components/discovery/profile-card';
import { FilterPanel } from '@/components/discovery/filter-panel';
import { ReportModal } from '@/components/discovery/report-modal';
import { MatchModal } from '@/components/discovery/match-modal';
import { GoogleAd } from '@/components/google-ad';
import { toast } from 'sonner';

interface ExplanationLabel {
  key: string;
  label: string;
  icon: string;
}

type DiscoveryMode = 'compatibility' | 'new' | 'active';

interface Profile {
  user: {
    id: string;
    name: string;
    nickname?: string;
    age: number | null;
    bio?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    country?: string;
    gender?: string;
    lookingFor?: string;
    relationshipStatus?: string;
    photos: Array<{ url: string; isMain?: boolean; isVerified?: boolean }>;
    interests?: string[];
    profileComplete?: number;
    plan?: string;
  };
  compatibility: number;
  distance?: number;
  isOnline?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  meetingMode?: any;
  explanationLabels?: ExplanationLabel[];
  hybridScore?: number;
}



export default function DescobertaPage() {
  const { data: session, status } = useSession() || {};
  const t = useTranslations('Discovery');
  const pt = useTranslations('Subscription');
  const common = useTranslations('Common');
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [savedFilters, setSavedFilters] = useState<Array<{ id: string; name: string; filters: Record<string, any> }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{ name: string; photo?: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>('compatibility');

  const currentProfile = profiles[currentIndex];

  // Track impression when profile is shown
  useEffect(() => {
    if (currentProfile) {
      fetch('/api/discovery/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentProfile.user.id,
          eventType: 'IMPRESSION',
          metadata: { mode: discoveryMode, position: currentIndex },
        }),
      }).catch(() => {});
    }
  }, [currentProfile?.user?.id, currentIndex, discoveryMode]);

  // Fetch profiles
  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('mode', discoveryMode);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            if (value.length > 0) params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const res = await fetch(`/api/discovery?${params.toString()}`);
      const data = await res.json();

      if (data.profiles) {
        setProfiles(data.profiles);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, discoveryMode]);

  // Fetch saved filters
  const fetchSavedFilters = async () => {
    try {
      const res = await fetch('/api/filters');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedFilters(data);
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error);
    }
  };

  // Check premium status
  useEffect(() => {
    if (session?.user) {
      const checkPremium = async () => {
        try {
          const res = await fetch(`/api/profile/${session.user.id}`);
          const data = await res.json();
          setIsPremium(data.plan?.slug === 'premium');
        } catch (error) {
          console.error('Error checking premium:', error);
        }
      };
      checkPremium();
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchProfiles();
      fetchSavedFilters();
    }
  }, [session?.user, fetchProfiles]);

  // Handle like
  const handleLike = async (type: 'LIKE' | 'SUPERLIKE' = 'LIKE') => {
    if (!currentProfile) return;

    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentProfile.user.id,
          type,
          isPrivate: false
        })
      });

      const data = await res.json();

      if (data.isMatch) {
        setMatchedUser({
          name: currentProfile.user.name || common('someone'),
          photo: currentProfile.user.photos[0]?.url
        });
        setShowMatchModal(true);
      }

      nextProfile();
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  // Handle dislike
  const handleDislike = async () => {
    if (!currentProfile) return;

    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: currentProfile.user.id,
          type: 'DISLIKE'
        })
      });

      nextProfile();
    } catch (error) {
      console.error('Error disliking:', error);
    }
  };

  // Handle block
  const handleBlock = async () => {
    if (!currentProfile) return;

    try {
      await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentProfile.user.id })
      });

      nextProfile();
    } catch (error) {
      console.error('Error blocking:', error);
    }
  };

  // Handle report
  const handleReport = async (reason: string, description: string) => {
    if (!currentProfile) return;

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentProfile.user.id,
          reason,
          description
        })
      });

      if (res.ok) {
        toast.success(t('report_received'));
        setShowReportModal(false);
        nextProfile();
      } else {
        const data = await res.json();
        toast.error(data.error || common('error'));
      }
    } catch (error) {
      console.error('Error reporting:', error);
      toast.error(common('error'));
    }
  };

  // Handle favorite
  const handleFavorite = async () => {
    if (!currentProfile) return;

    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentProfile.user.id })
      });
    } catch (error) {
      console.error('Error favoriting:', error);
    }
  };

  // Handle save filters
  const handleSaveFilters = async (name: string) => {
    try {
      const res = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, filters })
      });

      if (res.ok) {
        fetchSavedFilters();
      }
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  // Next profile
  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Reload profiles when we reach the end
      fetchProfiles();
    }
  };

  // Record profile view
  useEffect(() => {
    if (currentProfile) {
      fetch('/api/profile-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentProfile.user.id })
      }).catch(console.error);
    }
  }, [currentProfile]);

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between p-4 pb-2">
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                <Sparkles className="w-7 h-7 text-purple-600" />
                {t('title')}
              </h1>
              <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
                {t('header_subtitle')}
              </p>
            </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProfiles}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="relative"
            >
              <Sliders className="w-4 h-4 mr-2" />
              {t('filters')}
              {Object.values(filters).filter(v =>
                v !== undefined && v !== null && v !== '' &&
                !(Array.isArray(v) && v.length === 0)
              ).length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-purple-600">
                  {Object.values(filters).filter(v =>
                    v !== undefined && v !== null && v !== '' &&
                    !(Array.isArray(v) && v.length === 0)
                  ).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
          <div className="flex gap-1 px-4 pb-3 overflow-x-auto no-scrollbar">
            {[
              { id: 'compatibility', label: t('compatibility'), icon: Heart },
              { id: 'new', label: t('new_profiles'), icon: Sparkles },
              { id: 'active', label: t('recent_active'), icon: Users },
            ].map(m => {
              const Icon = m.icon;
              const isActive = discoveryMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setDiscoveryMode(m.id as DiscoveryMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto p-4">
        {profiles.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('no_profiles')}
            description={t('no_profiles_desc')}
            action={{
              label: t('adjust_filters'),
              onClick: () => setShowFilters(true)
            }}
          />
        ) : currentProfile ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile.user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileCard
                profile={currentProfile}
                onLike={() => handleLike('LIKE')}
                onSuperLike={() => handleLike('SUPERLIKE')}
                onDislike={handleDislike}
                onViewProfile={() => router.push(`/app/perfil/${currentProfile.user.id}`)}
                onBlock={handleBlock}
                onReport={() => setShowReportModal(true)}
                onFavorite={handleFavorite}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <EmptyState
            icon={Heart}
            title={t('all_seen')}
            description={t('all_seen_desc')}
            action={{
              label: t('refresh'),
              onClick: fetchProfiles
            }}
          />
        )}

        {/* Profile counter */}
        {profiles.length > 0 && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            {currentIndex + 1} {common('of')} {profiles.length} {common('profiles')}
          </div>
        )}

        {/* Google Ad Slot */}
        <GoogleAd slot="discovery_footer" className="mt-8" />

        {/* Premium upsell */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500 text-white">
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{t('unlock_more')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('unlock_more_desc')}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600"
                onClick={() => router.push('/app/assinatura')}
              >
                {pt('upgrade')}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={newFilters => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
        onSaveFilters={handleSaveFilters}
        savedFilters={savedFilters}
        onLoadFilter={setFilters}
        isPremium={isPremium}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        userName={currentProfile?.user.name}
      />

      {/* Match Modal */}
      <MatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        onStartChat={() => {
          setShowMatchModal(false);
          router.push('/app/conversas');
        }}
        matchedUser={matchedUser}
        currentUserPhoto={session?.user?.image || undefined}
      />
    </div>
  );
}
