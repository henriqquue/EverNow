"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Users,
  UserPlus,
  AlertTriangle,
  Shield,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface Stats {
  totalUsers: number;
  newToday: number;
  pendingReports: number;
  pendingVerifications: number;
}

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [mounted]);

  if (!mounted) return null;

  if (loading) {
    return <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-neutral-900 dark:text-white">
          <Shield className="w-7 h-7 text-indigo-500" />
          Painel Administrativo
        </h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          Visão geral e métricas do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <StatsCard
            title="Total de usuários"
            value={stats?.totalUsers ?? 0}
            icon={Users}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCard
            title="Novos hoje"
            value={stats?.newToday ?? 0}
            icon={UserPlus}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatsCard
            title="Denúncias pendentes"
            value={stats?.pendingReports ?? 0}
            icon={AlertTriangle}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatsCard
            title="Verificações pendentes"
            value={stats?.pendingVerifications ?? 0}
            icon={Shield}
          />
        </motion.div>
      </div>
    </div>
  );
}
