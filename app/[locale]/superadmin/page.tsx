"use client";

import { useEffect, useState, useCallback } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Crown,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface DashStats {
  totalUsers: number;
  activeSubscribers: number;
  freeUsers: number;
  conversionRate: number;
  monthlyRevenue: number;
  planDistribution: { name: string; slug: string; count: number }[];
  recentUpgrades: { email: string; planName: string; time: string }[];
}

export default function SuperAdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/metrics/dashboard');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error('Erro ao buscar stats:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) fetchStats();
  }, [mounted, fetchStats]);

  if (!mounted) return null;

  const totalPlanUsers = stats?.planDistribution?.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <div className="space-y-8">
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-neutral-900 dark:text-white">
          <Crown className="w-7 h-7 text-amber-500" />
          Dashboard SuperAdmin
        </h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          Visão completa do sistema EverNOW
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total de usuários" value={stats?.totalUsers ?? 0} icon={Users} color="primary" delay={0} />
            <StatsCard title="Assinantes ativos" value={stats?.activeSubscribers ?? 0} icon={Crown} color="secondary" delay={0.1} />
            <StatsCard title="Usuários gratuitos" value={stats?.freeUsers ?? 0} icon={Users} color="warning" delay={0.2} />
            <StatsCard title="Taxa de conversão" value={stats?.conversionRate ?? 0} suffix="%" icon={TrendingUp} color="success" delay={0.3} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary-500" />
                    Receita recorrente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                      {formatCurrency(stats?.monthlyRevenue ?? 0)}
                    </span>
                    <p className="text-sm text-neutral-500 mt-1">Soma das assinaturas ativas</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary-500" />
                    Distribuição de planos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(stats?.planDistribution || []).map((plan) => {
                    const pct = totalPlanUsers > 0 ? ((plan.count / totalPlanUsers) * 100).toFixed(1) : '0';
                    return (
                      <div key={plan.slug} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-neutral-900 dark:text-white">{plan.name}</span>
                          <span className="text-neutral-500">{plan.count} usuários ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${plan.slug === 'gratuito' ? 'bg-neutral-300' : 'bg-gradient-to-r from-primary-500 to-secondary-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card>
              <CardHeader>
                <CardTitle>Eventos recentes de upgrade</CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.recentUpgrades || []).length === 0 ? (
                  <p className="text-neutral-500 text-sm py-4 text-center">Nenhum upgrade recente</p>
                ) : (
                  <div className="space-y-4">
                    {(stats?.recentUpgrades || []).map((event, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{event.email}</p>
                            <p className="text-sm text-neutral-500">Upgrade para {event.planName}</p>
                          </div>
                        </div>
                        <span className="text-sm text-neutral-400">{event.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
