'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Heart, X, Star, MapPin, Briefcase, GraduationCap,
  ChevronLeft, ChevronRight, MoreHorizontal, Flag,
  Ban, Bookmark, CheckCircle, Circle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExplanationLabel {
  key: string;
  label: string;
  icon: string;
}

interface ProfileCardProps {
  profile: {
    user: {
      id: string;
      name: string;
      nickname?: string;
      age: number | null;
      bio?: string;
      city?: string;
      state?: string;
      gender?: string;
      lookingFor?: string;
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
  };
  onLike: () => void;
  onSuperLike: () => void;
  onDislike: () => void;
  onViewProfile: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onFavorite?: () => void;
}

export function ProfileCard({
  profile,
  onLike,
  onSuperLike,
  onDislike,
  onViewProfile,
  onBlock,
  onReport,
  onFavorite
}: ProfileCardProps) {
  const t = useTranslations('Discovery');
  const common = useTranslations('Common');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  const photos = profile.user.photos.length > 0
    ? profile.user.photos
    : [{ url: '/placeholder-avatar.png', isMain: true }];

  const nextPhoto = () => {
    setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onLike();
    } else if (info.offset.x < -threshold) {
      onDislike();
    }
    setDragDirection(null);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (info.offset.x > 50) {
      setDragDirection('right');
    } else if (info.offset.x < -50) {
      setDragDirection('left');
    } else {
      setDragDirection(null);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'bg-indigo-600';
    if (score >= 60) return 'bg-indigo-500';
    if (score >= 40) return 'bg-purple-500';
    return 'bg-purple-400';
  };

  const getLookingForLabel = (lookingFor?: string) => {
    switch (lookingFor) {
      case 'SERIOUS': return t('serious_relationship');
      case 'CASUAL': return t('casual_thing');
      case 'FRIENDSHIP': return t('friendship');
      case 'OPEN': return t('open_to_possibilities');
      default: return null;
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="relative w-full max-w-sm mx-auto"
    >
      {/* Drag indicators */}
      <AnimatePresence>
        {dragDirection === 'right' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-8 left-8 z-20 bg-indigo-600/90 backdrop-blur-sm text-white rounded-full p-4 shadow-xl shadow-indigo-500/20"
          >
            <Heart className="w-8 h-8" fill="white" />
          </motion.div>
        )}
        {dragDirection === 'left' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute top-8 right-8 z-20 bg-neutral-800/90 backdrop-blur-sm text-white rounded-full p-4 shadow-xl shadow-black/20"
          >
            <X className="w-8 h-8" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-muted">
        {/* Photo */}
        <div className="absolute inset-0">
          <Image
            src={photos[currentPhotoIndex].url}
            alt={profile.user.name || common('profile')}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Photo navigation */}
        {photos.length > 1 && (
          <>
            {/* Photo indicators */}
            <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all',
                    idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                  )}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Status badges */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
          {profile.isOnline && (
            <Badge className="bg-indigo-600/30 backdrop-blur-md border-indigo-500/40 text-white shadow-sm">
              <Circle className="w-2 h-2 mr-1.5 fill-current animate-pulse text-indigo-200" />
              {common('online')}
            </Badge>
          )}
          {profile.isVerified && (
            <Badge className="bg-blue-600/40 backdrop-blur-md border-blue-500/40 text-white shadow-sm">
              <CheckCircle className="w-3 h-3 mr-1.5 text-blue-100" />
              {t('confirmed')}
            </Badge>
          )}
          {profile.isPremium && (
            <Badge className="bg-gradient-to-r from-amber-400/95 to-amber-600/95 backdrop-blur-md text-white border-none shadow-md">
              <Star className="w-3 h-3 mr-1.5 fill-current" />
              {common('premium')}
            </Badge>
          )}
          {profile.meetingMode && (
            <Badge className="bg-purple-600/40 backdrop-blur-md border-purple-600/40 text-white shadow-sm">
              {t('want_to_go_out')}
            </Badge>
          )}
        </div>

        {/* More options button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute top-4 left-4 p-2 bg-black/30 rounded-full text-white z-10"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {/* Options menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-14 left-4 bg-background rounded-lg shadow-xl z-20 overflow-hidden"
            >
              {onFavorite && (
                <button
                  onClick={() => { onFavorite(); setShowMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted text-left"
                >
                  <Bookmark className="w-4 h-4" />
                  {t('favorite')}
                </button>
              )}
              {onBlock && (
                <button
                  onClick={() => { onBlock(); setShowMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted text-left"
                >
                  <Ban className="w-4 h-4" />
                  {common('block')}
                </button>
              )}
              {onReport && (
                <button
                  onClick={() => { onReport(); setShowMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-muted text-left text-red-500"
                >
                  <Flag className="w-4 h-4" />
                  {common('report')}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
          {/* Top Info Row: Compatibility & Distance */}
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/20',
              getCompatibilityColor(profile.compatibility)
            )}>
              {Math.round(profile.compatibility)}% {t('compatible')}
            </div>
            {profile.distance !== undefined && (
              <div className="flex items-center px-2 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold text-white/90 border border-white/10">
                <MapPin className="w-3 h-3 mr-1 text-purple-400" />
                {profile.distance < 1 ? '<1' : Math.round(profile.distance)} KM
              </div>
            )}
          </div>

          {/* Name & Age */}
          <div className="flex items-end gap-2 mb-2">
            <h2 className="text-3xl font-black tracking-tight text-white">
              {profile.user.name || profile.user.nickname}
            </h2>
            {profile.user.age && (
              <span className="text-xl font-medium text-white/70 mb-0.5">{profile.user.age}</span>
            )}
          </div>

          {/* Primary Details: Location & Career */}
          <div className="space-y-1.5 mb-4">
            {(profile.user.city || profile.user.state) && (
              <div className="flex items-center text-sm font-medium text-white/80">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                {[profile.user.city, profile.user.state].filter(Boolean).join(', ')}
              </div>
            )}
            {profile.user.lookingFor && (
              <div className="flex items-center text-sm font-medium text-white/80">
                <Heart className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                {getLookingForLabel(profile.user.lookingFor)}
              </div>
            )}
          </div>

          {/* Explanation labels (Intelligently grouped) */}
          {profile.explanationLabels && profile.explanationLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.explanationLabels.map((lbl) => (
                <span
                  key={lbl.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-indigo-100"
                >
                  <span className="text-sm leading-none">{lbl.icon}</span>
                  {t.has(lbl.key as any) ? t(lbl.key as any) : lbl.label}
                </span>
              ))}
            </div>
          )}

          {/* Action Footer: Bio preview & Detailed View */}
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
            {profile.user.bio ? (
              <p className="text-xs text-white/60 line-clamp-1 italic flex-1">
                "{profile.user.bio}"
              </p>
            ) : (
              <div className="flex-1" />
            )}
            <button
              onClick={onViewProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[10px] font-bold uppercase tracking-widest text-white/90"
            >
              <Info className="w-3 h-3" />
              {t('bio')}
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center items-center gap-6 mt-6">
        <motion.button
          whileHover={{ scale: 1.15, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDislike}
          className="w-16 h-16 rounded-full bg-white dark:bg-neutral-900 shadow-xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 border border-neutral-100 dark:border-neutral-800 transition-colors"
        >
          <X className="w-8 h-8" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15, y: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSuperLike}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-xl shadow-blue-500/20 flex items-center justify-center text-white border-none"
        >
          <Star className="w-6 h-6 fill-current" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.15, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLike}
          className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xl shadow-purple-600/30 flex items-center justify-center text-white border-none"
        >
          <Heart className="w-8 h-8 fill-current" />
        </motion.button>
      </div>
    </motion.div>
  );
}
