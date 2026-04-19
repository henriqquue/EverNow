"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  verificationStatus: string;
  plan: { name: string; slug: string } | null;
  userPhotos: Array<{ url: string }>;
}

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "error" | "secondary" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  SUSPENDED: { label: "Suspenso", variant: "error" },
  INACTIVE: { label: "Inativo", variant: "secondary" },
};

export default function UsuariosPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), status: statusFilter });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => {
    if (mounted) fetchUsers();
  }, [mounted, fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => { setPage(1); fetchUsers(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  if (!mounted) return null;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-neutral-900 dark:text-white">
          <Users className="w-7 h-7 text-indigo-500" />
          Usuários
        </h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          Gerenciar usuários da plataforma ({total} total)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s === "ALL" ? "Todos" : statusMap[s]?.label || s}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Tente alterar os filtros de busca." />
      ) : (
        <div className="space-y-3">
          {users.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={user.userPhotos[0]?.url} name={user.name || user.email} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{user.name || 'Sem nome'}</p>
                        {user.verificationStatus === 'VERIFIED' && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={statusMap[user.status]?.variant || "secondary"}>
                        {statusMap[user.status]?.label || user.status}
                      </Badge>
                      {user.plan && (
                        <Badge variant="outline">{user.plan.name}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-right flex-shrink-0 hidden sm:block">
                      <p>Criado: {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                      {user.lastLoginAt && <p>Último login: {new Date(user.lastLoginAt).toLocaleDateString('pt-BR')}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
