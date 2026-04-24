'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Briefcase, GraduationCap, Globe,
  Heart, Flag, Ban, BadgeCheck, Crown, Sparkles, MessageCircle,
  ChevronLeft, ChevronRight, User, Smile, Users, Activity, Coffee, Music, Cat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Loading } from '@/components/ui/loading';
import { ReportModal } from '@/components/discovery/report-modal';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";

interface ProfileData {
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
  photos: string[];
  interests: string[];
  languages: string[];
  work: string | null;
  country: string | null;
  education: string | null;
  profileQuality: number;
  profileByCategory: Record<string, { name: string; values: string[] }>;
  isOwnProfile: boolean;
  isVerified?: boolean;
  birthChartData?: any;
}

const OPTION_NAME_TO_SLUG: Record<string, string> = {
  "Relacionamento sério": "relacionamento-serio", "Namoro": "namoro", "Date": "date", "Casual": "casual", "Amizade": "amizade", "Ainda não sei": "ainda-nao-sei",
  "Magro": "magro", "Atlético": "atletico", "Musculoso": "musculoso", "Corpo médio": "corpo-medio", "Curvilíneo": "curvilineo", "Plus size": "plus-size",
  "Não tenho filhos": "sem-filhos", "Tenho filhos": "com-filhos", "Quero filhos": "quer-filhos", "Não quero filhos": "nao-quer-filhos", "Aceito alguém com filhos": "aceita-filhos",
  "Católico": "catolico", "Evangélico": "evangelico", "Espírita": "espirita", "Agnóstico": "agnostico", "Ateu": "ateu", "Outro": "outro",
  "Sedentário": "sedentario", "Moderado": "moderado", "Atleta": "atleta", "Academia": "academia", "Caseiro": "caseiro", "Vida noturna": "vida-noturna", "Viajar": "viajar",
  "Não fumo": "nao-fumo", "Fumo": "fumo", "Não bebo": "nao-bebo", "Bebo socialmente": "bebo-socialmente", "Vegetariano": "vegetariano", "Vegano": "vegano",
  "Rock": "rock", "Pop": "pop", "MPB": "mpb", "Sertanejo": "sertanejo", "Eletrônica": "eletronica", "Hip Hop": "hip-hop", "Gospel": "gospel",
  "Tenho cachorro": "tenho-cachorro", "Tenho gato": "tenho-gato", "Amo animais": "amo-animais", "Prefiro sem animais": "prefiro-sem",
  "Café": "cafe", "Restaurante": "restaurante", "Bar": "bar", "Cinema": "cinema", "Caminhada": "caminhada", "Viagem": "viagem"
};

const LANGUAGE_KEYS: Record<string, string> = {
  "Alemão": "de", "Árabe": "ar", "Coreano": "ko", "Espanhol": "es", "Francês": "fr",
  "Inglês": "en", "Italiano": "it", "Japonês": "ja", "Libras": "libras", "Mandarim": "zh",
  "Português": "pt", "Russo": "ru"
};

export default function ViewProfilePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const t = useTranslations('Profile');
  const tCat = useTranslations('ProfileCategories');
  const tLang = useTranslations('Languages');
  const common = useTranslations('Common');

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showAstrology, setShowAstrology] = useState(false);

  useEffect(() => {
    if (!session?.user?.id || !userId) return;
    // If viewing own profile, redirect to /app/perfil
    if (userId === session.user.id) {
      router.replace('/app/perfil');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/profile/${userId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProfile(data.profile);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user?.id, userId, router]);

  // Track profile view
  useEffect(() => {
    if (!session?.user?.id || !userId || userId === session.user.id) return;
    fetch('/api/profile-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewedUserId: userId }),
    }).catch(() => {});
  }, [session?.user?.id, userId]);

  if (status === 'loading' || loading) return <Loading />;

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t('not_found')}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> {common('back')}
        </Button>
      </div>
    );
  }

  const photos = profile.photos.length > 0 ? profile.photos : ['/placeholder-avatar.png'];
  const categories = Object.entries(profile.profileByCategory || {});

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-start md:items-center justify-center bg-neutral-50/50 dark:bg-neutral-950 p-0 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl min-h-[calc(100vh-64px)] md:min-h-0 md:max-h-[850px] bg-white dark:bg-neutral-900 md:rounded-[2rem] shadow-2xl shadow-neutral-200 dark:shadow-none overflow-hidden border-0 md:border border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row"
      >
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold">{profile.name}</h1>
          <Button variant="ghost" size="icon" onClick={() => setShowReportModal(true)}>
            <Flag className="w-5 h-5 text-neutral-400" />
          </Button>
        </div>

        {/* Photo Section (Left side on desktop, top on mobile) */}
        <div className="w-full md:w-[45%] h-[50vw] max-h-[320px] md:max-h-full md:h-full relative bg-neutral-100 dark:bg-neutral-800 shrink-0">
          <img
            src={photos[currentPhoto]}
            alt={profile.name || t('photo_alt')}
            className="w-full h-full object-cover"
          />
          
          {/* Back button (Desktop only) */}
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => router.back()}
            className="absolute top-6 left-6 z-20 rounded-full bg-white/80 backdrop-blur-md border-none shadow-lg hidden md:flex"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Indicators */}
          {photos.length > 1 && (
            <div className="absolute top-6 left-0 right-0 flex justify-center gap-1.5 z-10">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`h-1 rounded-full transition-all shadow-sm ${i === currentPhoto ? 'w-10 bg-white' : 'w-5 bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => setCurrentPhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Report Button (Desktop only) */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-6 right-6 z-20 rounded-full bg-white/20 hover:bg-red-500/80 backdrop-blur-md border-none text-white transition-all hidden md:flex"
            onClick={() => setShowReportModal(true)}
          >
            <Flag className="w-5 h-5" />
          </Button>
        </div>

        {/* Info Section (Right side on desktop, scrollable on mobile) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar">
          <div className="space-y-6 sm:space-y-8">
            {/* Main Info */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 dark:text-white">
                    {profile.name}{profile.age ? `, ${profile.age}` : ''}
                  </h2>
                  {profile.isVerified && (
                    <div className="bg-blue-500 rounded-full p-1 shadow-lg shadow-blue-500/20 shrink-0">
                      <BadgeCheck className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-neutral-500 font-medium">
                  {profile.city && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <MapPin size={16} className="text-primary-500 shrink-0" />
                      {profile.city}, {profile.state}
                    </span>
                  )}
                  {profile.pronouns && (
                    <Badge variant="outline" className="bg-neutral-50 dark:bg-neutral-800 text-[10px] font-bold">
                      {profile.pronouns}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-row sm:flex-col gap-2 items-center sm:items-end shrink-0">
                <Button className="rounded-full bg-gradient-brand text-white font-black px-5 sm:px-6 shadow-xl shadow-primary-500/20 text-sm">
                  Conectar
                </Button>
                {profile.statusMood && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold whitespace-nowrap">
                    {profile.statusMood}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Details */}
            <div className="flex flex-wrap gap-2">
              {profile.gender && (
                <div className="px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-bold flex items-center gap-2">
                  <User size={16} />
                  {t(`gender_${profile.gender.toLowerCase()}`)}
                </div>
              )}
              {profile.lookingFor && (
                <div className="px-4 py-2 rounded-2xl bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 text-sm font-bold flex items-center gap-2">
                  <Heart size={16} />
                  {t(`looking_${profile.lookingFor.toLowerCase()}`)}
                </div>
              )}
              {profile.relationshipStatus && (
                <div className="px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center gap-2">
                  <Users size={16} />
                  {t(`status_${profile.relationshipStatus}`)}
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Sobre</h3>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-3xl">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Birth Chart Integration */}
            {profile.birthChartData && (
              <div className="space-y-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-500" />
                    {t('tab_astrology')}
                  </h3>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 text-[10px] font-bold">
                    Essência Cósmica
                  </Badge>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 p-8 rounded-[3rem] border border-indigo-100/50 dark:border-indigo-900/30 space-y-10 relative overflow-hidden group">
                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-300/30 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/20 rounded-full blur-2xl -ml-12 -mb-12" />

                  <div className="grid grid-cols-3 gap-3 relative z-10">
                    <div className="text-center space-y-2 p-3 rounded-[1.5rem] bg-white/60 dark:bg-white/5 backdrop-blur-sm shadow-sm border border-white/50 dark:border-white/10">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-1">
                        <Smile size={14} className="text-orange-600" />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-black leading-none">{t('sun_sign')}</p>
                      <p className="text-sm font-black text-indigo-950 dark:text-indigo-100 capitalize">{tCat(`opt_${profile.birthChartData.sun}` as any)}</p>
                    </div>
                    <div className="text-center space-y-2 p-3 rounded-[1.5rem] bg-white/60 dark:bg-white/5 backdrop-blur-sm shadow-sm border border-white/50 dark:border-white/10">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-1">
                        <Activity size={14} className="text-indigo-600" />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-black leading-none">{t('moon_sign')}</p>
                      <p className="text-sm font-black text-indigo-950 dark:text-indigo-100 capitalize">{tCat(`opt_${profile.birthChartData.moon}` as any)}</p>
                    </div>
                    <div className="text-center space-y-2 p-3 rounded-[1.5rem] bg-white/60 dark:bg-white/5 backdrop-blur-sm shadow-sm border border-white/50 dark:border-white/10">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-1">
                        <Sparkles size={14} className="text-purple-600" />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-black leading-none">{t('ascendant')}</p>
                      <p className="text-sm font-black text-indigo-950 dark:text-indigo-100 capitalize">{tCat(`opt_${profile.birthChartData.ascendant}` as any)}</p>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-black uppercase tracking-tighter text-red-600/90">{t('fire')}</span>
                          <span className="text-[11px] font-black text-red-600/70">{profile.birthChartData.elements.fire}%</span>
                        </div>
                        <div className="h-1.5 bg-red-100 dark:bg-red-950/20 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${profile.birthChartData.elements.fire}%` }} className="h-full bg-gradient-to-r from-red-500 to-orange-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-black uppercase tracking-tighter text-green-600/90">{t('earth')}</span>
                          <span className="text-[11px] font-black text-green-600/70">{profile.birthChartData.elements.earth}%</span>
                        </div>
                        <div className="h-1.5 bg-green-100 dark:bg-green-950/20 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${profile.birthChartData.elements.earth}%` }} className="h-full bg-gradient-to-r from-green-500 to-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-black uppercase tracking-tighter text-sky-600/90">{t('air')}</span>
                          <span className="text-[11px] font-black text-sky-600/70">{profile.birthChartData.elements.air}%</span>
                        </div>
                        <div className="h-1.5 bg-sky-100 dark:bg-sky-950/20 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${profile.birthChartData.elements.air}%` }} className="h-full bg-gradient-to-r from-sky-400 to-indigo-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[11px] font-black uppercase tracking-tighter text-blue-600/90">{t('water')}</span>
                          <span className="text-[11px] font-black text-blue-600/70">{profile.birthChartData.elements.water}%</span>
                        </div>
                        <div className="h-1.5 bg-blue-100 dark:bg-blue-950/20 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${profile.birthChartData.elements.water}%` }} className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-indigo-200/20 dark:border-indigo-800/20">
                    <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed font-semibold italic text-center px-4">
                      "{profile.birthChartData.summary}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Preferências & Estilo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map(([slug, cat]) => {
                    if (cat.values.length === 0) return null;
                    
                    const Icon = slug === 'basico' ? User 
                      : slug === 'intencao' ? Heart 
                      : slug === 'aparencia' ? Smile 
                      : slug === 'familia' ? Users 
                      : slug === 'religiao' ? Sparkles 
                      : slug === 'estilo-vida' ? Activity 
                      : slug === 'habitos' ? Coffee 
                      : slug === 'cultura' ? Music 
                      : slug === 'pets' ? Cat 
                      : slug === 'profissao' ? Briefcase 
                      : slug === 'encontro' ? MapPin 
                      : Sparkles;

                    return (
                      <div key={slug} className="bg-neutral-50 dark:bg-neutral-800/30 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-900/30 transition-colors">
                        <h4 className="text-[11px] font-black uppercase tracking-wider mb-3 flex items-center gap-2 text-neutral-500">
                          <Icon className="w-3.5 h-3.5 text-primary-500" />
                          {tCat.has(`cat_${slug}` as any) ? tCat(`cat_${slug}` as any) : cat.name}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cat.values.map((v) => {
                            const optionSlug = OPTION_NAME_TO_SLUG[v];
                            const translatedLabel = optionSlug && tCat.has(`opt_${optionSlug}` as any) ? tCat(`opt_${optionSlug}` as any) : v;
                            return (
                              <Badge 
                                key={v} 
                                variant="secondary" 
                                className="text-xs font-bold bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border-none shadow-sm"
                              >
                                {translatedLabel}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Professional & Education */}
            {(profile.work || profile.education) && (
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                {profile.work && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Trabalho</h3>
                    <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-bold">
                      <Briefcase size={16} className="text-primary-500" />
                      {profile.work}
                    </div>
                  </div>
                )}
                {profile.education && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Educação</h3>
                    <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-bold">
                      <GraduationCap size={16} className="text-primary-500" />
                      {profile.education}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        userName={profile.name || undefined}
        onSubmit={async (reason, description) => {
          try {
            const res = await fetch('/api/report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: profile.id,
                reason,
                description
              })
            });

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Erro ao enviar denúncia');
            }

            toast.success(t.has('report_received' as any) ? t('report_received' as any) : 'Report received');
            setShowReportModal(false);
          } catch (error: any) {
            toast.error(t.has('report_error' as any) ? t('report_error' as any) : error.message);
          }
        }}
      />
    </div>
  );
}
