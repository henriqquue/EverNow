"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCard } from "@/components/ui/stats-card";
import {
  CreditCard,
  Search,
  Eye,
  Crown,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDate, formatCurrency, getStatusDisplayName, getStatusColor } from "@/lib/utils";

interface Sub {
  id: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  plan: string;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  amount: number;
}

export default function AssinaturasPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subscriptions, setSubscriptions] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ active: 0, revenue: 0, churnRate: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/superadmin/subscriptions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(Array.isArray(data?.subscriptions) ? data.subscriptions : []);
        setTotalPages(data?.totalPages || 1);
        setStats(data?.stats || { active: 0, revenue: 0, churnRate: 0 });
      }
    } catch (e) {
      console.error('Erro ao buscar assinaturas:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (mounted) fetchSubs();
  }, [mounted, fetchSubs]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Assinaturas</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Gerencie as assinaturas dos usuários</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Assinaturas ativas" value={stats?.active || 0} icon={Crown} color="primary" delay={0} />
        <StatsCard title="Receita recorrente" value={stats?.revenue || 0} prefix="R$ " icon={CreditCard} color="success" delay={0.1} />
        <StatsCard title="Churn rate" value={stats?.churnRate || 0} suffix="%" icon={TrendingUp} color="warning" delay={0.2} />
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select
            options={[
              { value: "", label: "Todos os status" },
              { value: "ACTIVE", label: "Ativo" },
              { value: "CANCELED", label: "Cancelado" },
              { value: "EXPIRED", label: "Expirado" },
              { value: "SUSPENDED", label: "Suspenso" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                        Nenhuma assinatura encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    (subscriptions || []).map((sub) => (
                      <TableRow key={sub?.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={sub?.user?.name || 'U'} size="sm" />
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-white">{sub?.user?.name || 'Sem nome'}</p>
                              <p className="text-sm text-neutral-500">{sub?.user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="premium">{sub?.plan || 'Nenhum'}</Badge></TableCell>
                        <TableCell><Badge className={getStatusColor(sub?.status)}>{getStatusDisplayName(sub?.status)}</Badge></TableCell>
                        <TableCell className="text-neutral-500">{sub?.startedAt ? formatDate(sub.startedAt) : '—'}</TableCell>
                        <TableCell className="text-neutral-500">{sub?.expiresAt ? formatDate(sub.expiresAt) : '—'}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(sub?.amount || 0)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-sm text-neutral-500">Página {page} de {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
