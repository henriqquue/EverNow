"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Users,
  MessageCircle,
  Eye,
  Sparkles,
  ArrowRight,
  Crown,
  User,
  Camera,
  MapPin,
  Info,
} from "lucide-react";
import { useRouter, Link } from "@/navigation";
import { motion } from "framer-motion";

export default function AppDashboard() {
  const { data: session } = useSession() || {};
  const t = useTranslations('Dashboard');
  const common = useTranslations('Common');
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    likesReceived: 0,
    profileViews: 0,
    connections: 0,
    activeConversations: 0,
    profileCompletion: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Fetch user dashboard stats
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/profile/dashboard-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    fetchStats();
  }, []);

  if (!mounted) return null;

  const isPremium = session?.user?.planSlug === "premium";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {t('welcome', { name: session?.user?.name?.split(" ")[0] || common('user') })}
        </h1>
        <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Upgrade Banner (for free users) */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-brand rounded-2xl p-6 text-white"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t('upgrade_title')}</h3>
                <p className="text-white/80 text-sm">
                  {t('upgrade_desc')}
                </p>
              </div>
            </div>
            <Link href="/app/assinatura">
              <Button className="bg-white text-primary-600 hover:bg-neutral-100">
                {t('view_plans')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatsCard
          title={t('likes_received')}
          value={stats.likesReceived}
          icon={Heart}
          color="primary"
          delay={0}
        />
        <StatsCard
          title={t('profile_views')}
          value={stats.profileViews}
          icon={Eye}
          color="secondary"
          delay={0.1}
        />
        <StatsCard
          title={t('connections')}
          value={stats.connections}
          icon={Users}
          color="success"
          delay={0.2}
        />
        <StatsCard
          title={t('active_conversations')}
          value={stats.activeConversations}
          icon={MessageCircle}
          color="warning"
          delay={0.3}
        />
      </div>

      {/* Profile & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Completion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-indigo-500" />
                {t('complete_profile')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    {t('progress')}
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {stats.profileCompletion}%
                  </span>
                </div>
                <Progress value={stats.profileCompletion} color="primary" className="h-2" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t('complete_profile_desc')}
              </p>
              <Link href="/app/perfil">
                <Button className="w-full text-xs font-bold" variant="outline">
                  {t('complete_profile_btn')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                {t('quick_actions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href="/app/descobrir" className="block group">
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-all text-center border border-indigo-100/50 dark:border-indigo-800/50">
                    <Heart className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                    <p className="font-bold text-sm text-neutral-900 dark:text-white">
                      {t('discover_people')}
                    </p>
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-1">
                      {t('find_connections')}
                    </p>
                  </div>
                </Link>
                <Link href="/app/perfil" className="block group">
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-all text-center border border-purple-100/50 dark:border-purple-800/50">
                    <Camera className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <p className="font-bold text-sm text-neutral-900 dark:text-white">
                      {t('add_photos')}
                    </p>
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-1">
                      {t('update_photos')}
                    </p>
                  </div>
                </Link>
                <Link href="/app/perfil" className="block group">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-all text-center border border-green-100/50 dark:border-green-800/50">
                    <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="font-bold text-sm text-neutral-900 dark:text-white">
                      {t('update_location')}
                    </p>
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-1">
                      {t('set_location')}
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Plan Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary-500" />
              {t('current_plan')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={isPremium ? "premium" : "default"}>
                  {isPremium ? t('premium') : t('free')}
                </Badge>
                <span className="text-neutral-600 dark:text-neutral-400">
                  {isPremium
                    ? t('full_access')
                    : t('limited_access')}
                </span>
              </div>
              {!isPremium && (
                <Link href="/app/assinatura">
                  <Button size="sm">{t('upgrade_btn')}</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
