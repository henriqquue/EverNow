"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
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
} from "lucide-react";
import { motion } from "framer-motion";

export default function MetricasPage() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Métricas
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Análise detalhada do sistema
          </p>
        </div>
        <Select
          options={[
            { value: "7d", label: "Últimos 7 dias" },
            { value: "30d", label: "Últimos 30 dias" },
            { value: "90d", label: "Últimos 90 dias" },
            { value: "365d", label: "Último ano" },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
          Usuários
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Novos cadastros" value={456} icon={Users} color="success" delay={0} />
          <StatsCard title="Usuários ativos" value={892} icon={Activity} color="primary" delay={0.1} />
          <StatsCard title="Taxa de retenção" value={78} suffix="%" icon={TrendingUp} color="secondary" delay={0.2} />
          <StatsCard title="Novos assinantes" value={34} icon={Crown} color="warning" delay={0.3} />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
          Engajamento
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Curtidas enviadas" value={12450} icon={Heart} color="error" delay={0.4} />
          <StatsCard title="Conexões geradas" value={1230} icon={Heart} color="primary" delay={0.5} />
          <StatsCard title="Mensagens enviadas" value={45600} icon={MessageCircle} color="secondary" delay={0.6} />
          <StatsCard title="Perfis visualizados" value={89000} icon={Eye} color="success" delay={0.7} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-500" />
                Cadastros por dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-neutral-400">Gráfico (em desenvolvimento)</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-500" />
                Taxa de conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-neutral-400">Gráfico (em desenvolvimento)</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
