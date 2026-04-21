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
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold truncate">{profile.name || t('profile')}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-500"
            onClick={() => setShowReportModal(true)}
            title={t('report_profile')}
          >
            <Flag className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Photo gallery */}
      <div className="relative aspect-[3/4] bg-muted group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[currentPhoto]}
          alt={profile.name || t('photo_alt')}
          className="w-full h-full object-cover"
        />
        
        {/* Indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhoto(i)}
                className={`h-1.5 rounded-full transition-all shadow-sm ${i === currentPhoto ? 'w-8 bg-white' : 'w-4 bg-white/50 hover:bg-white/70'}`}
              />
            ))}
          </div>
        )}

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setCurrentPhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentPhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* Invisible tap zones for mobile */}
        {photos.length > 1 && (
          <div className="absolute inset-0 flex z-0">
            <div className="w-1/2 h-full cursor-pointer" onClick={() => setCurrentPhoto((prev) => (prev > 0 ? prev - 1 : prev))} />
            <div className="w-1/2 h-full cursor-pointer" onClick={() => setCurrentPhoto((prev) => (prev < photos.length - 1 ? prev + 1 : prev))} />
          </div>
        )}
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-4 -mt-8 relative z-10">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {profile.name}{profile.age ? `, ${profile.age}` : ''}
                  </h2>
                  {profile.isVerified && (
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                {profile.headline && (
                  <p className="text-muted-foreground text-sm mt-1">{profile.headline}</p>
                )}
                {profile.pronouns && (
                  <p className="text-xs text-muted-foreground">{profile.pronouns}</p>
                )}
              </div>
              {profile.statusMood && (
                <Badge variant="secondary">{profile.statusMood}</Badge>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-2">
              {profile.gender && (
                <Badge variant="outline" className="bg-indigo-50/50 border-indigo-100 text-indigo-700">
                  {t(`gender_${profile.gender.toLowerCase()}`)}
                </Badge>
              )}
              {profile.lookingFor && (
                <Badge variant="outline" className="bg-pink-50/50 border-pink-100 text-pink-700">
                  {t(`looking_${profile.lookingFor.toLowerCase()}`)}
                </Badge>
              )}
              {profile.relationshipStatus && (
                <Badge variant="outline" className="bg-blue-50/50 border-blue-100 text-blue-700">
                  {t(`status_${profile.relationshipStatus}`)}
                </Badge>
              )}
            </div>

            {/* Location */}
            {(profile.city || profile.state || profile.neighborhood) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {[profile.country, profile.state, profile.city, profile.neighborhood].filter(Boolean).join(', ')}
              </div>
            )}

            {/* Work & Education */}
            {profile.work && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4" /> {profile.work}
              </div>
            )}
            {profile.education && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <GraduationCap className="w-4 h-4" /> {profile.education}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="text-sm font-semibold mb-1">{t('about')}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Interests */}
            {profile.interests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{t('interests')}</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {profile.languages.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                {profile.languages.map(lang => 
                  LANGUAGE_KEYS[lang] && tLang.has(LANGUAGE_KEYS[lang] as any) ? tLang(LANGUAGE_KEYS[lang] as any) : lang
                ).join(', ')}
              </div>
            )}

            {/* Profile categories */}
            {categories.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                {categories.map(([slug, cat]) => {
                  if (cat.values.length === 0) return null;
                  
                  // Simple icon mapping based on slug
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
                    <div key={slug} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <h3 className="text-[13px] font-bold mb-2 flex items-center gap-1.5 text-gray-700">
                        <Icon className="w-4 h-4 text-indigo-500" />
                        {tCat.has(`cat_${slug}` as any) ? tCat(`cat_${slug}` as any) : cat.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.values.map((v) => {
                          const optionSlug = OPTION_NAME_TO_SLUG[v];
                          const translatedLabel = optionSlug && tCat.has(`opt_${optionSlug}` as any) ? tCat(`opt_${optionSlug}` as any) : v;
                          return (
                            <Badge 
                              key={v} 
                              variant="default" 
                              className="text-xs font-medium bg-indigo-100/80 hover:bg-indigo-200 text-indigo-800 border-indigo-200 shadow-sm"
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
            )}
          </CardContent>
        </Card>
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
