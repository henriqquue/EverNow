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
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-950 p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl h-full max-h-[850px] bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl shadow-neutral-200 dark:shadow-none overflow-hidden border border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row"
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

        {/* Photo Section (Left side on desktop) */}
        <div className="w-full md:w-[45%] h-[400px] md:h-full relative bg-neutral-100 dark:bg-neutral-800">
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

        {/* Info Section (Right side on desktop) */}
        <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="space-y-8">
            {/* Main Info */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black text-neutral-900 dark:text-white">
                    {profile.name}{profile.age ? `, ${profile.age}` : ''}
                  </h2>
                  {profile.isVerified && (
                    <div className="bg-blue-500 rounded-full p-1 shadow-lg shadow-blue-500/20">
                      <BadgeCheck className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-neutral-500 font-medium">
                  {profile.city && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <MapPin size={16} className="text-primary-500" />
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
              <div className="flex flex-col gap-2">
                <Button className="rounded-full bg-gradient-brand text-white font-black px-6 shadow-xl shadow-primary-500/20">
                  Conectar
                </Button>
                {profile.statusMood && (
                  <div className="flex justify-center">
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold">
                      {profile.statusMood}
                    </Badge>
                  </div>
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
