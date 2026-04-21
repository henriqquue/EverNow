'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, MapPin, Calendar, Plus, Trash2, Eye, EyeOff,
  Globe, ChevronRight, Settings, Crown, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import {
  PASSPORT_START_MODE_OPTIONS,
  PASSPORT_VISIBILITY_OPTIONS
} from '@/lib/filter-options';

interface PassportSetting {
  id: string;
  isActive: boolean;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  country: string | null;
  isExploring: boolean;
  isAppearing: boolean;
}

interface ScheduledPassport {
  id: string;
  city: string;
  state: string | null;
  neighborhood: string | null;
  country: string;
  startDate: string;
  endDate: string;
  startMode: string;
  visibility: string;
  isActive: boolean;
}

export default function PassaportePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const t = useTranslations('Passport');
  const tProfile = useTranslations('Profile');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Current passport
  const [currentPassport, setCurrentPassport] = useState<PassportSetting | null>(null);
  const [passportCity, setPassportCity] = useState('');
  const [passportState, setPassportState] = useState('');
  const [passportNeighborhood, setPassportNeighborhood] = useState('');
  const [passportCountry, setPassportCountry] = useState('');
  const [isExploring, setIsExploring] = useState(true);
  const [isAppearing, setIsAppearing] = useState(false);

  // Scheduled passports
  const [scheduledPassports, setScheduledPassports] = useState<ScheduledPassport[]>([]);
  const [showAddScheduled, setShowAddScheduled] = useState(false);
  const [newScheduled, setNewScheduled] = useState({
    city: '',
    state: '',
    neighborhood: '',
    country: '',
    startDate: '',
    endDate: '',
    startMode: 'DURING_PERIOD',
    visibility: 'CITY_AND_DATES'
  });

  // Check premium status
  useEffect(() => {
    if (session?.user) {
      const checkPremium = async () => {
        try {
          const res = await fetch(`/api/profile/${session.user.id}`);
          const data = await res.json();
          // Fallback to session planSlug if API doesn't return it directly
          const planSlug = data.profile?.plan || (session.user as any)?.planSlug;
          setIsPremium(!!planSlug && planSlug !== 'gratuito');
        } catch (error) {
          console.error('Error checking premium:', error);
        }
      };
      checkPremium();
    }
  }, [session?.user]);

  // Fetch passport data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [passportRes, scheduledRes] = await Promise.all([
        fetch('/api/passport'),
        fetch('/api/passport/scheduled')
      ]);

      const passportData = await passportRes.json();
      const scheduledData = await scheduledRes.json();

      if (passportData.id) {
        setCurrentPassport(passportData);
        setPassportCity(passportData.city || '');
        setPassportState(passportData.state || '');
        setPassportNeighborhood(passportData.neighborhood || '');
        setPassportCountry(passportData.country || '');
        setIsExploring(passportData.isExploring);
        setIsAppearing(passportData.isAppearing);
      }

      if (Array.isArray(scheduledData)) {
        setScheduledPassports(scheduledData);
      }
    } catch (error) {
      console.error('Error fetching passport data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session?.user]);

  // Save current passport
  const handleSavePassport = async (activate: boolean) => {
    if (!isPremium) {
      router.push('/app/assinatura');
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: activate,
          city: passportCity,
          state: passportState,
          neighborhood: passportNeighborhood,
          country: passportCountry,
          isExploring,
          isAppearing
        })
      });
      fetchData();
    } catch (error) {
      console.error('Error saving passport:', error);
    } finally {
      setSaving(false);
    }
  };

  // Deactivate passport
  const handleDeactivate = async () => {
    setSaving(true);
    try {
      await fetch('/api/passport', { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deactivating passport:', error);
    } finally {
      setSaving(false);
    }
  };

  // Add scheduled passport
  const handleAddScheduled = async () => {
    if (!isPremium) {
      router.push('/app/assinatura');
      return;
    }

    if (!newScheduled.city || !newScheduled.country || !newScheduled.startDate || !newScheduled.endDate) {
      return;
    }

    setSaving(true);
    try {
      await fetch('/api/passport/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScheduled)
      });
      setShowAddScheduled(false);
      setNewScheduled({
        city: '',
        state: '',
        neighborhood: '',
        country: '',
        startDate: '',
        endDate: '',
        startMode: 'DURING_PERIOD',
        visibility: 'CITY_AND_DATES'
      });
      fetchData();
    } catch (error) {
      console.error('Error adding scheduled passport:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete scheduled passport
  const handleDeleteScheduled = async (id: string) => {
    if (!confirm(t('delete_confirm'))) return;

    try {
      await fetch(`/api/passport/scheduled?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting scheduled passport:', error);
    }
  };

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pb-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-50/50 via-background to-indigo-50/30 dark:from-purple-950/20 dark:to-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/40 backdrop-blur-xl border-b border-white/10 dark:border-white/5">
        <div className="p-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <Plane className="w-7 h-7 text-purple-600" />
              {t('title')}
            </h1>
            <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
              {t('subtitle')}
            </p>
          </div>
          {isPremium && (
            <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white border-none shadow-lg shadow-amber-500/20">
              <Crown className="w-3 h-3 mr-1" /> Premium
            </Badge>
          )}
        </div>
      </div>

      <div className="p-5 space-y-8 max-w-2xl mx-auto">
        {/* Premium upsell - Redesigned as a Glass Card */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 shadow-2xl shadow-amber-500/20"
          >
            <div className="relative bg-background/90 dark:bg-black/80 backdrop-blur-xl rounded-[22px] p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-inner">
                <Crown className="w-8 h-8" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold text-foreground">{t('upsell_title')}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {t('upsell_desc')}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-8 rounded-2xl shadow-lg transition-all active:scale-95"
                onClick={() => router.push('/app/assinatura')}
              >
                {t('activate_now')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Current passport - Immersive Design */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <h2 className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">{t('real_time_travel')}</h2>
          </div>

          <Card className="overflow-hidden border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl shadow-xl rounded-[32px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  {t('current_destination')}
                </CardTitle>
                {currentPassport?.isActive && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1 animate-pulse">
                    {t('active_now')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground px-1">País</label>
                  <div className="relative group">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      placeholder="Ex: Brasil"
                      value={passportCountry}
                      onChange={e => setPassportCountry(e.target.value)}
                      disabled={!isPremium}
                      className="pl-11 h-12 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground px-1">Estado</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      placeholder="Ex: Rio de Janeiro"
                      value={passportState}
                      onChange={e => setPassportState(e.target.value)}
                      disabled={!isPremium}
                      className="pl-11 h-12 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground px-1">Cidade</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-purple-600 transition-colors" />
                    <Input
                      placeholder="Ex: Rio de Janeiro"
                      value={passportCity}
                      onChange={e => setPassportCity(e.target.value)}
                      disabled={!isPremium}
                      className="pl-11 h-12 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 rounded-2xl focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground px-1">Bairro</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-purple-600 transition-colors" />
                    <Input
                      placeholder="Ex: Copacabana"
                      value={passportNeighborhood}
                      onChange={e => setPassportNeighborhood(e.target.value)}
                      disabled={!isPremium}
                      className="pl-11 h-12 bg-white/50 dark:bg-black/20 border-white/20 dark:border-white/10 rounded-2xl focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={cn(
                  "flex items-center gap-4 cursor-pointer p-4 rounded-2xl border transition-all active:scale-95",
                  isExploring ? "bg-purple-500/10 border-purple-500/30" : "bg-muted/30 border-transparent hover:bg-muted/50"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    isExploring ? "bg-purple-600 border-purple-600 text-white" : "border-muted-foreground/30"
                  )}>
                    {isExploring && <Check className="w-4 h-4" />}
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isExploring}
                      onChange={e => setIsExploring(e.target.checked)}
                      disabled={!isPremium}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t('explore_label')}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{t('explore_desc')}</p>
                  </div>
                </label>

                <label className={cn(
                  "flex items-center gap-4 cursor-pointer p-4 rounded-2xl border transition-all active:scale-95",
                  isAppearing ? "bg-indigo-500/10 border-indigo-500/30" : "bg-muted/30 border-transparent hover:bg-muted/50"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    isAppearing ? "bg-indigo-500 border-indigo-500 text-white" : "border-muted-foreground/30"
                  )}>
                    {isAppearing && <Check className="w-4 h-4" />}
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isAppearing}
                      onChange={e => setIsAppearing(e.target.checked)}
                      disabled={!isPremium}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t('appear_label')}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">{t('appear_desc')}</p>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                {currentPassport?.isActive ? (
                  <Button
                    variant="outline"
                    onClick={handleDeactivate}
                    disabled={saving}
                    className="w-full h-12 rounded-2xl border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold transition-all"
                  >
                    {t('end_travel')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSavePassport(true)}
                    disabled={saving || !passportCity || !passportCountry}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-600/25 text-white font-bold transition-all disabled:opacity-50"
                  >
                    {saving ? t('teleporting') : t('start_travel')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Scheduled passports - Modern Timeline Design */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              <h2 className="text-sm font-bold uppercase tracking-tighter text-muted-foreground">{t('schedule_title')}</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddScheduled(true)}
              disabled={!isPremium}
              className="text-purple-600 font-bold hover:bg-purple-600/10 rounded-xl px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t('schedule_btn')}
            </Button>
          </div>

          <div className="space-y-4">
            {scheduledPassports.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center bg-white/20 dark:bg-white/[0.02] border border-dashed rounded-[32px] border-muted-foreground/20">
                <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t('no_schedule')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {scheduledPassports.map((sp, idx) => (
                  <motion.div
                    key={sp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative"
                  >
                    <Card className="p-5 overflow-hidden border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl rounded-[24px] hover:shadow-lg transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plane className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold truncate leading-tight">{sp.city}</h4>
                          <p className="text-xs font-bold text-muted-foreground/70 uppercase">{sp.country}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] font-bold py-0.5 px-2 bg-muted rounded-md text-muted-foreground">
                              {new Date(sp.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                            <span className="text-[11px] font-bold py-0.5 px-2 bg-muted rounded-md text-muted-foreground">
                              {new Date(sp.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteScheduled(sp.id)}
                          className="text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Add scheduled modal - Using standard Dialog for perfect portaling and blur */}
        <Dialog open={showAddScheduled} onOpenChange={setShowAddScheduled}>
          <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none">
            <div className="bg-background border border-white/20 dark:border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
              <div className="p-8 space-y-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight">{t('schedule_modal_title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('schedule_modal_desc')}</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground px-1">País</label>
                      <Input
                        placeholder="Ex: Brasil"
                        value={newScheduled.country}
                        onChange={e => setNewScheduled({ ...newScheduled, country: e.target.value })}
                        className="h-12 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground px-1">Estado</label>
                      <Input
                        placeholder="Ex: Rio de Janeiro"
                        value={newScheduled.state}
                        onChange={e => setNewScheduled({ ...newScheduled, state: e.target.value })}
                        className="h-12 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground px-1">Cidade</label>
                      <Input
                        placeholder="Ex: Rio de Janeiro"
                        value={newScheduled.city}
                        onChange={e => setNewScheduled({ ...newScheduled, city: e.target.value })}
                        className="h-12 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground px-1">Bairro</label>
                      <Input
                        placeholder="Ex: Copacabana"
                        value={newScheduled.neighborhood}
                        onChange={e => setNewScheduled({ ...newScheduled, neighborhood: e.target.value })}
                        className="h-12 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground px-1">{t('start_date')}</label>
                      <Input
                        type="date"
                        value={newScheduled.startDate}
                        onChange={e => setNewScheduled({ ...newScheduled, startDate: e.target.value })}
                        className="h-12 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground px-1">{t('end_date')}</label>
                      <Input
                        type="date"
                        value={newScheduled.endDate}
                        onChange={e => setNewScheduled({ ...newScheduled, endDate: e.target.value })}
                        className="h-12 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddScheduled(false)}
                      className="flex-1 h-12 rounded-2xl font-bold border-transparent bg-muted hover:bg-muted/80"
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={handleAddScheduled}
                      disabled={saving || !newScheduled.city || !newScheduled.country || !newScheduled.startDate || !newScheduled.endDate}
                      className="flex-2 h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 shadow-lg shadow-purple-600/20"
                    >
                      {saving ? t('scheduling') : t('confirm_schedule')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
