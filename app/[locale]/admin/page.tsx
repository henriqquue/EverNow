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
import { Link } from "@/navigation";
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

      {/* Painel de Emergência Mobile */}
      <div className="lg:hidden space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            Ações de Emergência
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/moderacao" className="flex flex-col items-center justify-center p-3 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 text-center transition-active active:scale-95">
              <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />
              <span className="text-[10px] font-bold uppercase">Moderar Denúncias</span>
              {stats?.pendingReports && stats.pendingReports > 0 ? (
                <Badge variant="error" className="mt-1 h-4 text-[8px]">{stats.pendingReports}</Badge>
              ) : null}
            </Link>
            <Link href="/admin/usuarios" className="flex flex-col items-center justify-center p-3 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 text-center transition-active active:scale-95">
              <Shield className="w-5 h-5 text-indigo-500 mb-1" />
              <span className="text-[10px] font-bold uppercase">Verificações</span>
              {stats?.pendingVerifications && stats.pendingVerifications > 0 ? (
                <Badge variant="default" className="mt-1 h-4 text-[8px] bg-indigo-500">{stats.pendingVerifications}</Badge>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
