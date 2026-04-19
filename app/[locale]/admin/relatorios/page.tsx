"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Users,
  UserPlus,
  CreditCard,
  TrendingUp,
  BarChart3,
  PieChart,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface ReportStats {
  signups: number;
  activeUsers: number;
  newSubscriptions: number;
  conversionRate: number;
  trends: {
    signups: number;
    activeUsers: number;
    newSubscriptions: number;
    conversionRate: number;
  };
  dailySignups: { date: string; count: number }[];
  planDistribution: { name: string; slug: string; count: number }[];
}

export default function RelatoriosPage() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState("7d");
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/stats?period=${period}`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error('Erro ao buscar relatórios:', e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (mounted) fetchStats();
  }, [mounted, fetchStats]);

  if (!mounted) return null;

  const maxDaily = stats?.dailySignups ? Math.max(...stats.dailySignups.map(d => d.count), 1) : 1;
  const totalPlanUsers = stats?.planDistribution ? stats.planDistribution.reduce((s, p) => s + p.count, 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-neutral-900 dark:text-white">
            <BarChart3 className="w-7 h-7 text-indigo-500" />
            Relatórios
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Análise e métricas do sistema
          </p>
        </div>
        <Select
          options={[
            { value: "7d", label: "Últimos 7 dias" },
            { value: "30d", label: "Últimos 30 dias" },
            { value: "90d", label: "Últimos 90 dias" },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Cadastros no período"
              value={stats?.signups ?? 0}
              icon={UserPlus}
              color="success"
              trend={stats ? { value: Math.abs(stats.trends.signups), positive: stats.trends.signups >= 0 } : undefined}
              delay={0}
            />
            <StatsCard
              title="Usuários ativos"
              value={stats?.activeUsers ?? 0}
              icon={Users}
              color="primary"
              trend={stats ? { value: Math.abs(stats.trends.activeUsers), positive: stats.trends.activeUsers >= 0 } : undefined}
              delay={0.1}
            />
            <StatsCard
              title="Novas assinaturas"
              value={stats?.newSubscriptions ?? 0}
              icon={CreditCard}
              color="secondary"
              trend={stats ? { value: Math.abs(stats.trends.newSubscriptions), positive: stats.trends.newSubscriptions >= 0 } : undefined}
              delay={0.2}
            />
            <StatsCard
              title="Taxa de conversão"
              value={stats?.conversionRate ?? 0}
              suffix="%"
              icon={TrendingUp}
              color="warning"
              trend={stats ? { value: Math.abs(stats.trends.conversionRate), positive: stats.trends.conversionRate >= 0 } : undefined}
              delay={0.3}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary-500" />
                    Cadastros por dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.dailySignups && stats.dailySignups.length > 0 ? (
                    <div className="space-y-2">
                      {stats.dailySignups.slice(-14).map((d) => (
                        <div key={d.date} className="flex items-center gap-3 text-sm">
                          <span className="w-20 text-neutral-500 shrink-0">
                            {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                          <div className="flex-1 h-5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${Math.max((d.count / maxDaily) * 100, 2)}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-medium text-neutral-700 dark:text-neutral-300">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-neutral-400">Sem dados no período</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary-500" />
                    Distribuição de planos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.planDistribution && stats.planDistribution.length > 0 ? (
                    <div className="space-y-4">
                      {stats.planDistribution.map((p) => {
                        const pct = totalPlanUsers > 0 ? ((p.count / totalPlanUsers) * 100).toFixed(1) : '0';
                        return (
                          <div key={p.slug} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-neutral-900 dark:text-white">{p.name}</span>
                              <span className="text-neutral-500">{p.count} ({pct}%)</span>
                            </div>
                            <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  p.slug === 'gratuito'
                                    ? 'bg-neutral-400'
                                    : 'bg-gradient-to-r from-primary-500 to-secondary-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-neutral-400">Sem dados de planos</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
