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
  Shield,
} from "lucide-react";
import { Link } from "@/navigation";
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
  userGrowth: { date: string; count: number }[];
  engagement: {
    likes: number;
    matches: number;
  };
}

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];

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

  const totalPlanUsers = stats?.planDistribution?.reduce((s, p) => s + (p?.count || 0), 0) || 1;

  const engagementData = [
    { name: 'Curtidas', value: stats?.engagement?.likes || 0 },
    { name: 'Matches', value: stats?.engagement?.matches || 0 },
  ];

  return (
    <div className="space-y-8 pb-10">
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
          {/* Painel de Emergência Mobile */}
          <div className="lg:hidden space-y-4 mb-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Crown className="w-20 h-20 text-amber-500" />
              </div>
              
              <h2 className="text-sm font-black text-white flex items-center gap-2 mb-4 uppercase tracking-tighter">
                <Activity className="w-4 h-4 text-emerald-500" />
                Status de Emergência
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Receita (Mês)</p>
                  <p className="text-xl font-black text-emerald-500 tracking-tighter">
                    {formatCurrency(stats?.monthlyRevenue ?? 0)}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase">Conversão</p>
                  <p className="text-xl font-black text-amber-500 tracking-tighter">
                    {stats?.conversionRate ?? 0}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Link href="/superadmin/assinaturas" className="flex flex-col items-center justify-center p-3 bg-neutral-800 rounded-xl text-center active:scale-95 transition-transform border border-neutral-700">
                  <CreditCard className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="text-[8px] font-bold text-neutral-300 uppercase">Vendas</span>
                </Link>
                <Link href="/superadmin/comercial" className="flex flex-col items-center justify-center p-3 bg-neutral-800 rounded-xl text-center active:scale-95 transition-transform border border-neutral-700">
                  <TrendingUp className="w-5 h-5 text-pink-400 mb-1" />
                  <span className="text-[8px] font-bold text-neutral-300 uppercase">Metas</span>
                </Link>
                <Link href="/superadmin/lgpd" className="flex flex-col items-center justify-center p-3 bg-neutral-800 rounded-xl text-center active:scale-95 transition-transform border border-neutral-700">
                  <Shield className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-[8px] font-bold text-neutral-300 uppercase">LGPD</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total de usuários" value={stats?.totalUsers ?? 0} icon={Users} color="primary" delay={0} />
            <StatsCard title="Assinantes ativos" value={stats?.activeSubscribers ?? 0} icon={Crown} color="secondary" delay={0.1} />
            <StatsCard title="Usuários gratuitos" value={stats?.freeUsers ?? 0} icon={Users} color="warning" delay={0.2} />
            <StatsCard title="Taxa de conversão" value={stats?.conversionRate ?? 0} suffix="%" icon={TrendingUp} color="success" delay={0.3} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* User Growth Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Crescimento de Usuários (30 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={10} 
                        tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                        stroke="#888888"
                      />
                      <YAxis fontSize={10} stroke="#888888" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#6366f1' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Novos Usuários"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Plan Distribution Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-pink-500" />
                    Mix de Planos
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={stats?.planDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {(stats?.planDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Engagement Bar Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    Engajamento (Últimos 7 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Volume" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Revenue and Recents */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Faturamento Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue ?? 0)}</div>
                    <Progress 
                      value={stats?.conversionRate || 0} 
                      className="h-1 mt-3"
                    />
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold tracking-tighter">
                      Taxa de Conversão: {stats?.conversionRate}%
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" />
                      Upgrades Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[120px] overflow-y-auto pr-2">
                    {(stats?.recentUpgrades || []).map((upgrade, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 border-neutral-100 dark:border-neutral-800">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold truncate max-w-[150px]">{upgrade?.email || 'desconhecido'}</span>
                          <span className="text-[10px] text-indigo-500 font-bold uppercase">{upgrade?.planName || 'Premium'}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-medium">{upgrade?.time || 'agora'}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
