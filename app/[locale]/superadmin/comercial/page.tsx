"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Crown,
  CreditCard,
  XCircle,
  RefreshCw,
  Eye,
  MousePointer,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface CommercialMetrics {
  period: string;
  startDate: string;
  endDate: string;
  metrics: {
    users: {
      total: number;
      free: number;
      premium: number;
      newInPeriod: number;
    };
    subscriptions: {
      active: number;
      canceled: number;
      expired: number;
      newInPeriod: number;
    };
    conversion: {
      rate: number;
      freeToPayingRatio: string;
    };
    events: {
      upgrades: number;
      downgrades: number;
      cancellations: number;
      reactivations: number;
      renewals: number;
      newSubscriptions: number;
    };
    paywall: {
      views: number;
      clickUpgrade: number;
      closes: number;
      subscribes: number;
      conversionRate: string;
    };
  };
  planDistribution: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    userCount: number;
    percentage: string;
  }>;
  topBlockedFeatures: Array<{
    featureSlug: string;
    count: number;
  }>;
  recentEvents: Array<{
    id: string;
    action: string;
    actionLabel: string;
    user: { id: string; name: string; email: string };
    plan: { name: string; slug: string };
    amount: number | null;
    createdAt: string;
  }>;
  charts: {
    dailyGrowth: Array<{ date: string; users: number; subscribers: number }>;
    dailySubscriptionEvents: Array<{ action: string; label: string; count: number }>;
  };
  campaigns: {
    active: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    overallCtr: string;
    overallCvr: string;
    topCampaigns: Array<{
      id: string;
      name: string;
      displayType: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: string;
      cvr: string;
    }>;
  };
  banners: {
    active: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: string;
  };
  publicEvents: {
    landingVisits: number;
    ctaClicks: number;
    planClicks: number;
    subscribeClicks: number;
    signupStarts: number;
    upgradeStarts: number;
    checkoutViews: number;
    checkoutCompletes: number;
    funnelConversion: string;
  };
}

const FEATURE_LABELS: Record<string, string> = {
  curtidas_por_dia: "Curtidas por dia",
  super_curtidas_por_dia: "Sinais Fortes",
  mensagens_por_dia: "Mensagens",
  filtros_avancados: "Filtros avançados",
  ver_quem_curtiu: "Ver quem curtiu",
  passaporte: "Viagem",
  modo_invisivel: "Modo Discreto",
  boost_perfil: "Impulso de perfil",
};

export default function ComercialDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CommercialMetrics | null>(null);
  const [period, setPeriod] = useState("30d");
  const [planFilter, setPlanFilter] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (planFilter) params.append("planId", planFilter);
      
      const res = await fetch(`/api/superadmin/metrics/commercial?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  }, [period, planFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "UPGRADE":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "DOWNGRADE":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "CANCEL":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "REACTIVATE":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "SUBSCRIBE":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "UPGRADE":
        return <TrendingUp className="h-4 w-4" />;
      case "DOWNGRADE":
        return <TrendingDown className="h-4 w-4" />;
      case "CANCEL":
        return <XCircle className="h-4 w-4" />;
      case "REACTIVATE":
        return <RefreshCw className="h-4 w-4" />;
      case "SUBSCRIBE":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Erro ao carregar métricas</p>
      </div>
    );
  }

  const maxGrowthUsers = Math.max(...(data?.charts?.dailyGrowth || []).map((d) => d?.users || 0), 1);
  const maxGrowthSubs = Math.max(...(data?.charts?.dailyGrowth || []).map((d) => d?.subscribers || 0), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Comercial</h1>
          <p className="text-muted-foreground">
            Métricas de monetização e conversão
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onChange={setPeriod}
            options={[
              { value: "7d", label: "Últimos 7 dias" },
              { value: "30d", label: "Últimos 30 dias" },
              { value: "90d", label: "Últimos 90 dias" },
              { value: "365d", label: "Último ano" },
            ]}
            className="w-[160px]"
          />
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-3xl font-bold">{data?.metrics?.users?.total || 0}</p>
                  <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3" />
                    +{data?.metrics?.users?.newInPeriod || 0} no período
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assinantes Ativos</p>
                  <p className="text-3xl font-bold">{data?.metrics?.subscriptions?.active || 0}</p>
                  <p className="text-sm text-green-500 flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3" />
                    +{data?.metrics?.subscriptions?.newInPeriod || 0} novos
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <Crown className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-3xl font-bold">{data?.metrics?.conversion?.rate || 0}%</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ratio: {data?.metrics?.conversion?.freeToPayingRatio || "0:0"}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cancelamentos</p>
                  <p className="text-3xl font-bold">{data?.metrics?.events?.cancellations || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data?.metrics?.subscriptions?.canceled || 0} totais
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico de crescimento + Distribuição por plano */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de crescimento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Crescimento de Usuários e Assinantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Legenda */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>Usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Assinantes</span>
                  </div>
                </div>

                {/* Gráfico de barras simples */}
                <div className="h-64 flex items-end gap-1">
                  {(data?.charts?.dailyGrowth || []).slice(-15).map((day, i) => {
                    const usersHeight = (day.users / maxGrowthUsers) * 100;
                    const subsHeight = (day.subscribers / maxGrowthSubs) * 100;
                    const date = new Date(day.date);
                    const label = `${date.getDate()}/${date.getMonth() + 1}`;

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end h-48">
                          <div
                            className="flex-1 bg-blue-500/80 rounded-t transition-all hover:bg-blue-500"
                            style={{ height: `${usersHeight}%`, minHeight: "4px" }}
                            title={`${day.users} usuários`}
                          />
                          <div
                            className="flex-1 bg-green-500/80 rounded-t transition-all hover:bg-green-500"
                            style={{ height: `${subsHeight}%`, minHeight: "4px" }}
                            title={`${day.subscribers} assinantes`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">{data?.metrics?.users?.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Total de usuários</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{data?.metrics?.users?.premium || 0}</p>
                    <p className="text-sm text-muted-foreground">Assinantes premium</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribuição por plano */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribuição por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.planDistribution || []).map((plan, i) => {
                  const colors = [
                    "bg-gray-500",
                    "bg-primary",
                    "bg-green-500",
                    "bg-blue-500",
                  ];
                  const color = colors[i % colors.length];

                  return (
                    <div key={plan.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded", color)} />
                          <span className="font-medium">{plan.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {plan.userCount} ({plan.percentage}%)
                        </span>
                      </div>
                      <Progress
                        value={parseFloat(plan.percentage || "0")}
                        className="h-2"
                      />
                    </div>
                  );
                })}

                {/* Plano mais popular */}
                {(data?.planDistribution || []).length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Plano mais popular</p>
                    <p className="font-bold text-lg">
                      {data?.planDistribution?.reduce((a, b) =>
                        (a?.userCount || 0) > (b?.userCount || 0) ? a : b
                      )?.name || "Nenhum"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Eventos de assinatura + Métricas de Paywall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eventos de assinatura */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Eventos de Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg text-center">
                  <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{data.metrics.events.upgrades}</p>
                  <p className="text-sm text-muted-foreground">Upgrades</p>
                </div>
                <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg text-center">
                  <TrendingDown className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{data.metrics.events.downgrades}</p>
                  <p className="text-sm text-muted-foreground">Downgrades</p>
                </div>
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg text-center">
                  <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{data.metrics.events.cancellations}</p>
                  <p className="text-sm text-muted-foreground">Cancelamentos</p>
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg text-center">
                  <RefreshCw className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{data.metrics.events.reactivations}</p>
                  <p className="text-sm text-muted-foreground">Reativações</p>
                </div>
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg text-center">
                  <CreditCard className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{data.metrics.events.newSubscriptions}</p>
                  <p className="text-sm text-muted-foreground">Novas Assinat.</p>
                </div>
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-center">
                  <RefreshCw className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{data.metrics.events.renewals}</p>
                  <p className="text-sm text-muted-foreground">Renovações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Métricas de Paywall */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Métricas de Paywall
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Funil de conversão */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span>Visualizações</span>
                    </div>
                    <span className="font-bold">{data.metrics.paywall.views}</span>
                  </div>
                  <Progress value={100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-purple-500" />
                      <span>Cliques em Upgrade</span>
                    </div>
                    <span className="font-bold">{data.metrics.paywall.clickUpgrade}</span>
                  </div>
                  <Progress
                    value={data.metrics.paywall.views > 0
                      ? (data.metrics.paywall.clickUpgrade / data.metrics.paywall.views) * 100
                      : 0}
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-500" />
                      <span>Conversões</span>
                    </div>
                    <span className="font-bold">{data.metrics.paywall.subscribes}</span>
                  </div>
                  <Progress
                    value={data.metrics.paywall.views > 0
                      ? (data.metrics.paywall.subscribes / data.metrics.paywall.views) * 100
                      : 0}
                    className="h-2"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Taxa de conversão</span>
                    <span className="text-xl font-bold text-green-500">
                      {data.metrics.paywall.conversionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Campanhas e Banners */}
      {data.campaigns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Métricas de Campanhas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Campanhas Comerciais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{data.campaigns.active}</p>
                    <p className="text-xs text-muted-foreground">Ativas</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{data.campaigns.totalConversions}</p>
                    <p className="text-xs text-muted-foreground">Conversões</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{data.campaigns.overallCvr}%</p>
                    <p className="text-xs text-muted-foreground">Taxa CVR</p>
                  </div>
                </div>

                {data.campaigns.topCampaigns.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Top Campanhas</p>
                    {data.campaigns.topCampaigns.map((campaign, i) => (
                      <div key={campaign.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                          <span className="text-sm">{campaign.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span>{campaign.conversions} conv.</span>
                          <Badge variant="secondary">{campaign.cvr}% CVR</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma campanha ativa
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Métricas de Banners */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Banners Promocionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold">{data.banners.active}</p>
                    <p className="text-sm text-muted-foreground">Banners Ativos</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-primary">{data.banners.ctr}%</p>
                    <p className="text-sm text-muted-foreground">Taxa de Clique</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-lg font-bold">{data.banners.totalImpressions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Impressões totais</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-lg font-bold">{data.banners.totalClicks.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Cliques totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Funil de Eventos Públicos */}
      {data.publicEvents && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Funil de Conversão Público
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.publicEvents.landingVisits}</p>
                  <p className="text-xs text-muted-foreground">Visitas Landing</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{data.publicEvents.ctaClicks}</p>
                  <p className="text-xs text-muted-foreground">Cliques CTA</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">{data.publicEvents.planClicks}</p>
                  <p className="text-xs text-muted-foreground">Cliques Planos</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-cyan-600">{data.publicEvents.signupStarts}</p>
                  <p className="text-xs text-muted-foreground">Início Cadastro</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-teal-600">{data.publicEvents.subscribeClicks}</p>
                  <p className="text-xs text-muted-foreground">Cliques Assinar</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{data.publicEvents.checkoutViews}</p>
                  <p className="text-xs text-muted-foreground">Views Checkout</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{data.publicEvents.checkoutCompletes}</p>
                  <p className="text-xs text-muted-foreground">Conversões</p>
                </div>
                <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-2xl font-bold text-green-600">{data.publicEvents.funnelConversion}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Features mais bloqueadas + Eventos recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Features mais bloqueadas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Features Premium Mais Tentadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topBlockedFeatures.length > 0 ? (
                <div className="space-y-3">
                  {data.topBlockedFeatures.map((feature, i) => (
                    <div key={feature.featureSlug} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                        <span>{FEATURE_LABELS[feature.featureSlug || ""] || feature.featureSlug}</span>
                      </div>
                      <Badge variant="secondary">{feature.count} tentativas</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado de paywall ainda
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Eventos recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Eventos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentEvents.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {data.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          getActionColor(event.action)
                        )}>
                          {getActionIcon(event.action)}
                        </div>
                        <div>
                          <p className="font-medium">{event.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.actionLabel} • {event.plan.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {event.amount !== null && event.amount > 0 && (
                          <p className="font-medium">{formatCurrency(event.amount)}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDate(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum evento de assinatura ainda
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Links to Ads & Coupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <motion.a
          href="/superadmin/anuncios"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="block"
        >
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Sistema de Anúncios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Gerencie zonas de anúncios, campanhas internas e integração com Google AdSense.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary">
                Acessar configurações <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </motion.a>

        <motion.a
          href="/superadmin/cupons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
          className="block"
        >
          <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Cupons de Desconto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Crie e gerencie cupons promocionais, veja métricas de uso e conversão.
              </p>
              <div className="flex items-center gap-2 text-sm text-primary">
                Gerenciar cupons <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </motion.a>
      </div>
    </div>
  );
}
