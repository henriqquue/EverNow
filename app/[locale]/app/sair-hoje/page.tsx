'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee, UtensilsCrossed, Wine, Clapperboard, Footprints,
  Dumbbell, TreePine, MapPin, Clock, Users, Power, Crown,
  Heart, MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { MEETING_ACTIVITY_OPTIONS } from '@/lib/filter-options';

const iconMap: Record<string, any> = {
  Coffee, UtensilsCrossed, Wine, Clapperboard, Footprints, Dumbbell, TreePine
};

interface MeetingMode {
  id: string;
  activities: string[];
  expiresAt: string;
  isActive: boolean;
}

interface NearbyPerson {
  id: string;
  activities: string[];
  expiresAt: string;
  distance: number | null;
  user: {
    id: string;
    name: string;
    age: number | null;
    city: string | null;
    photo: string | null;
  };
}

export default function SairHojePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const t = useTranslations('SairHoje');
  const common = useTranslations('Common');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const [myMeetingMode, setMyMeetingMode] = useState<MeetingMode | null>(null);
  const [nearbyPeople, setNearbyPeople] = useState<NearbyPerson[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [hoursActive, setHoursActive] = useState(8);

  // Check premium status
  useEffect(() => {
    if (session?.user) {
      const checkPremium = async () => {
        try {
          const res = await fetch(`/api/profile/${session.user.id}`);
          const data = await res.json();
          // Fixed path: data.profile.plan.slug or fallback
          const planSlug = data.profile?.plan?.slug || data.profile?.plan || (session.user as any)?.planSlug;
          setIsPremium(!!planSlug && planSlug !== 'gratuito');
        } catch (error) {
          console.error('Error checking premium:', error);
        }
      };
      checkPremium();
    }
  }, [session?.user]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [modeRes, peopleRes] = await Promise.all([
        fetch('/api/meeting-mode'),
        fetch('/api/meeting-mode?findPeople=true')
      ]);

      const modeData = await modeRes.json();
      const peopleData = await peopleRes.json();

      if (modeData?.id) {
        setMyMeetingMode(modeData);
        setSelectedActivities(modeData.activities || []);
      } else {
        setMyMeetingMode(null);
      }

      if (Array.isArray(peopleData)) {
        setNearbyPeople(peopleData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session?.user]);

  // Toggle activity
  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  // Activate meeting mode
  const handleActivate = async () => {
    if (selectedActivities.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/meeting-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activities: selectedActivities,
          hoursActive
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao ativar');
      }

      await fetchData();
    } catch (error: any) {
      console.error('Error activating:', error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Deactivate meeting mode
  const handleDeactivate = async () => {
    setSaving(true);
    try {
      await fetch('/api/meeting-mode', { method: 'DELETE' });
      setMyMeetingMode(null);
      await fetchData();
    } catch (error) {
      console.error('Error deactivating:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle Like with feedback
  const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set());
  const handleLike = async (userId: string) => {
    if (likedUserIds.has(userId)) return;

    setLikedUserIds(prev => new Set(prev).add(userId));
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          type: 'LIKE'
        })
      });
    } catch (error) {
      console.error('Error liking:', error);
      setLikedUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Get time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return t('expired');

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}min`;
  };

  // Get common activities
  const getCommonActivities = (activities: string[]) => {
    return activities.filter(a => selectedActivities.includes(a));
  };

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pb-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-background to-purple-50/30 dark:from-indigo-950/20 dark:to-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/40 backdrop-blur-xl border-b border-white/10 dark:border-white/5">
        <div className="p-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <Coffee className="w-7 h-7 text-purple-600" />
              {t('title')}
            </h1>
            <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
              {t('subtitle')}
            </p>
          </div>
          {isPremium && (
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none shadow-lg">
              <Crown className="w-3 h-3 mr-1" /> {common('premium')}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-5 space-y-8 max-w-2xl mx-auto">
        {/* My meeting mode - Redesigned Card */}
        <Card className="overflow-hidden border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl shadow-xl rounded-[32px]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {myMeetingMode?.isActive ? (
                  <>
                    <div className="w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" />
                    {t('mode_active')}
                  </>
                ) : (
                  t('what_to_do')
                )}
              </CardTitle>
              {myMeetingMode?.isActive && (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 px-3 py-1 font-bold">
                  <Clock className="w-3 h-3 mr-1.5" />
                  {getTimeRemaining(myMeetingMode.expiresAt)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Activity selection grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MEETING_ACTIVITY_OPTIONS.map((activity, idx) => {
                const Icon = iconMap[activity.icon] || Coffee;
                const isSelected = selectedActivities.includes(activity.value);

                return (
                  <motion.button
                    key={activity.value}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleActivity(activity.value)}
                    className={cn(
                      'p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden group',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/20 dark:border-white/10 hover:border-indigo-500/50 bg-white/50 dark:bg-white/[0.02]'
                    )}
                  >
                    <div className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6',
                      isSelected ? activity.color : 'bg-muted/50'
                    )}>
                      <Icon className={cn(
                        'w-7 h-7',
                        isSelected ? 'text-white' : 'text-muted-foreground'
                      )} />
                    </div>
                    <span className={cn(
                      "text-xs font-black uppercase tracking-tighter",
                      isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
                    )}>
                      {t.has(`activity_${activity.value}` as any) ? t(`activity_${activity.value}` as any) : activity.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Duration slider simulation */}
            {!myMeetingMode?.isActive && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">{t('duration')}</label>
                  <span className="text-xs font-bold text-indigo-600">{hoursActive} {t('hours')}</span>
                </div>
                <div className="flex gap-2">
                  {[4, 8, 12, 24].map(hours => (
                    <Button
                      key={hours}
                      variant={hoursActive === hours ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHoursActive(hours)}
                      className={cn(
                        "flex-1 h-10 rounded-xl font-bold transition-all",
                        hoursActive === hours
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 border-none'
                          : 'border-white/20 dark:border-white/10'
                      )}
                    >
                      {hours}h
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2">
              {myMeetingMode?.isActive ? (
                <Button
                  variant="outline"
                  onClick={handleDeactivate}
                  disabled={saving}
                  className="w-full h-14 rounded-[20px] border-red-500/20 text-red-500 hover:bg-red-500/10 font-black uppercase tracking-widest transition-all"
                >
                  <Power className="w-5 h-5 mr-2" />
                  {t('end_status')}
                </Button>
              ) : (
                <Button
                  onClick={handleActivate}
                  disabled={saving || selectedActivities.length === 0}
                  className="w-full h-14 rounded-[20px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl hover:shadow-indigo-600/25 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? t('publishing') : t('publish_btn')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nearby people - Modern List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              <h2 className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">{t('nearby_people')}</h2>
            </div>
            <Badge variant="secondary" className="bg-white/50 dark:bg-white/[0.05] border-white/20 text-muted-foreground font-bold">
              {nearbyPeople.length} {t('online')}
            </Badge>
          </div>

          {nearbyPeople.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-white/20 dark:bg-white/[0.02] border border-dashed rounded-[40px] border-muted-foreground/20 text-center px-10">
              <Users className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-bold">{t('nobody_nearby')}</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                {t('nobody_nearby_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {nearbyPeople.map((person, index) => {
                const commonActivities = getCommonActivities(person.activities);
                const isLiked = likedUserIds.has(person.user.id);

                return (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <Card className="overflow-hidden p-5 border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl rounded-[32px] hover:shadow-xl hover:bg-white/60 dark:hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center gap-5">
                        <Link href={`/app/perfil/${person.user.id}`} className="relative">
                          <Avatar 
                            src={person.user.photo} 
                            name={person.user.name}
                            className="w-20 h-20 rounded-[24px] ring-2 ring-background group-hover:scale-105 transition-transform overflow-hidden" 
                          />
                          <div className="absolute -bottom-1 -right-1 p-1.5 bg-purple-500 border-4 border-background rounded-full" />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-black tracking-tight truncate">
                              {person.user.name}
                              {person.user.age && <span className="text-muted-foreground font-medium ml-1.5">{person.user.age}</span>}
                            </h3>
                            <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/20 text-indigo-600 bg-indigo-500/5 px-2">
                              {getTimeRemaining(person.expiresAt)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/70 uppercase tracking-tighter">
                            {person.distance !== null && (
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1 text-purple-500" />
                                {person.distance < 1 ? '<1' : Math.round(person.distance)} km
                              </span>
                            )}
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1 text-indigo-500" />
                              {person.activities.length} {t('activities')}
                            </span>
                          </div>

                          {/* Matching Activities Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {person.activities.map(activity => {
                              const activityInfo = MEETING_ACTIVITY_OPTIONS.find(a => a.value === activity);
                              const Icon = iconMap[activityInfo?.icon || 'Coffee'] || Coffee;
                              const isCommon = commonActivities.includes(activity);

                              return (
                                <div
                                  key={activity}
                                  className={cn(
                                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all',
                                    isCommon
                                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                      : 'bg-muted/50 text-muted-foreground'
                                  )}
                                >
                                  <Icon className="w-3 h-3" />
                                  {t.has(`activity_${activityInfo?.value}` as any) ? t(`activity_${activityInfo?.value}` as any) : activityInfo?.label}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleLike(person.user.id)}
                            className={cn(
                              "w-12 h-12 rounded-2xl transition-all active:scale-90",
                              isLiked
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                                : "text-indigo-600 hover:bg-indigo-600/10"
                            )}
                          >
                            <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
