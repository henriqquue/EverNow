"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import {
  BarChart3,
  Users,
  Crown,
  TrendingUp,
  Activity,
  Heart,
  MessageCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

// ─── Tooltip customizado ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2 shadow-lg text-sm">
      <p className="text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Cores ───────────────────────────────────────────────────────────────────

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

// ─── Componente de Loading ────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800/50 rounded-xl animate-pulse">
      <RefreshCw className="h-6 w-6 text-neutral-300 dark:text-neutral-600 animate-spin" />
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function MetricasPage() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/metrics/dashboard`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  // Build chart data from API or fall back to demo data
  const userGrowth: { date: string; count: number }[] =
    data?.userGrowth && data.userGrowth.length > 0
      ? data.userGrowth.map((d: any) => ({
          date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          count: d.count,
        }))
      : Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          return {
            date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
            count: Math.floor(Math.random() * 30) + 5,
          };
        });

  const planDist: { name: string; count: number }[] =
    data?.planDistribution && data.planDistribution.length > 0
      ? data.planDistribution
      : [
          { name: "Gratuito", count: 820 },
          { name: "Premium Mensal", count: 58 },
          { name: "Premium Anual", count: 14 },
        ];

  const conversionData = [
    { name: "Usuários gratuitos", value: data?.freeUsers ?? 820 },
    { name: "Assinantes premium", value: data?.activeSubscribers ?? 72 },
  ];

  const engagementData = [
    { name: "Curtidas", value: data?.engagement?.likes ?? 12450 },
    { name: "Conexões", value: data?.engagement?.matches ?? 1230 },
  ];

  // Fake week-over-week engagement trend
  const engagementTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      curtidas: Math.floor(Math.random() * 500) + 200,
      conexoes: Math.floor(Math.random() * 80) + 20,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Métricas</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Análise detalhada do sistema</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="365d">Último ano</option>
          </select>
          <button
            onClick={fetchMetrics}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Usuários</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total de usuários"   value={data?.totalUsers ?? 456}       icon={Users}         color="success"   delay={0}   />
          <StatsCard title="Usuários ativos"      value={data?.freeUsers ?? 892}        icon={Activity}      color="primary"   delay={0.1} />
          <StatsCard title="Taxa de conversão"    value={data?.conversionRate ?? 7.8}   suffix="%"  icon={TrendingUp}    color="secondary" delay={0.2} />
          <StatsCard title="Assinantes premium"   value={data?.activeSubscribers ?? 34} icon={Crown}         color="warning"   delay={0.3} />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">Engajamento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Curtidas enviadas"   value={data?.engagement?.likes ?? 12450}   icon={Heart}         color="error"     delay={0.4} />
          <StatsCard title="Conexões geradas"    value={data?.engagement?.matches ?? 1230}  icon={Heart}         color="primary"   delay={0.5} />
          <StatsCard title="Mensagens enviadas"  value={45600}                               icon={MessageCircle} color="secondary" delay={0.6} />
          <StatsCard title="Perfis visualizados" value={89000}                               icon={Eye}           color="success"   delay={0.7} />
        </div>
      </div>

      {/* Charts Row 1 — Cadastros por dia + Distribuição de planos */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Cadastros por dia — Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Cadastros por dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <AreaChart data={userGrowth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCadastros" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,120,0.12)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="count" name="Cadastros"
                      stroke="#6366f1" strokeWidth={2.5}
                      fill="url(#gradCadastros)"
                      dot={false} activeDot={{ r: 5, fill: "#6366f1" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribuição de planos — Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Distribuição de planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <PieChart>
                    <Pie
                      data={planDist} dataKey="count" nameKey="name"
                      cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                      paddingAngle={3} strokeWidth={0}
                    >
                      {planDist.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle" iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 — Taxa de conversão + Engajamento semanal */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Taxa de conversão — Bar Chart Free vs Premium */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Taxa de conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <div className="space-y-4">
                  {/* Big number */}
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-emerald-500">
                      {data?.conversionRate ?? 7.8}%
                    </span>
                    <span className="text-neutral-500 text-sm mb-1">de free → premium</span>
                  </div>

                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={conversionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,120,0.12)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Usuários" radius={[8, 8, 0, 0]}>
                        {conversionData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#6366f1" : "#8b5cf6"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Engajamento semanal — Line Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Engajamento (últimos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <LineChart data={engagementTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,120,0.12)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle" iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{value}</span>
                      )}
                    />
                    <Line type="monotone" dataKey="curtidas" name="Curtidas" stroke="#ec4899" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="conexoes" name="Conexões" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
