"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { Loading } from "@/components/ui/loading";
import {
  AlertTriangle,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Users,
  Shield,
  Activity,
  TrendingUp,
  Search,
  Filter,
  ArrowUpRight,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LGPDRequest {
  id: string;
  userId: string;
  requestType: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  approvedBy?: { name: string };
  reason?: string;
}

interface ComplianceReport {
  overview: {
    totalUsers: number;
    usersWithConsent: number;
    consentPercentage: string;
  };
  lgpdRequests: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    last30Days: number;
  };
  compliance: {
    averageScore: string;
    criticalUsers: number;
  };
  recommendations: string[];
}

interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  description: string;
  createdAt: string;
  performedBy?: string;
  user?: { name: string; email: string };
}

export default function LGPDManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LGPDRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [compliance, setCompliance] = useState<ComplianceReport | null>(null);
  const [activeTab, setActiveTab] = useState("requests");
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [requestsRes, complianceRes, auditRes] = await Promise.all([
        fetch(`/api/admin/lgpd/requests?status=${filter}`),
        fetch('/api/admin/lgpd/compliance'),
        fetch('/api/admin/lgpd/audit?limit=20')
      ]);

      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data.requests || []);
      }

      if (complianceRes.ok) {
        setCompliance(await complianceRes.json());
      }

      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching LGPD data:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProcessRequest = async (requestId: string, action: string, notes = '') => {
    try {
      setProcessing(requestId);
      const response = await fetch(`/api/admin/lgpd/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error processing request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      case 'APPROVED': return 'secondary';
      default: return 'primary';
    }
  };

  if (loading && !compliance) return <Loading fullScreen />;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-neutral-900 dark:text-white">
            <Shield className="w-7 h-7 text-indigo-600" />
            Gestão de Privacidade & LGPD
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Monitoramento de conformidade e auditoria de dados
          </p>
        </div>
        <Button onClick={() => fetchData()} variant="outline" size="sm" className="gap-2 font-bold">
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          Atualizar Dados
        </Button>
      </div>

      {/* Stats Grid */}
      {compliance && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total de Usuários" 
            value={compliance.overview.totalUsers} 
            icon={Users} 
            color="primary" 
          />
          <StatsCard 
            title="Taxa de Consentimento" 
            value={parseFloat(compliance.overview.consentPercentage)} 
            suffix="%" 
            icon={CheckCircle} 
            color="success" 
          />
          <StatsCard 
            title="Requisições Ativas" 
            value={compliance.lgpdRequests.total} 
            icon={FileText} 
            color="secondary" 
          />
          <StatsCard 
            title="Compliance Score" 
            value={parseInt(compliance.compliance.averageScore)} 
            suffix="%" 
            icon={TrendingUp} 
            color={parseInt(compliance.compliance.averageScore) > 80 ? "success" : "warning"} 
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-6">
          <TabsTrigger value="requests" className="gap-2 px-6">
            <FileText size={16} />
            Requisições
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2 px-6">
            <Activity size={16} />
            Auditoria (Log)
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2 px-6">
            <Shield size={16} />
            Conformidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                size="sm"
                className="rounded-full text-[10px] font-black uppercase tracking-tighter h-8"
              >
                {f === 'all' ? 'Todas' : f}
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="overflow-hidden border-neutral-100 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <FileText className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-neutral-900">{request.user.name}</h4>
                        <p className="text-xs text-muted-foreground">{request.user.email}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">
                            {request.requestType}
                          </Badge>
                          <Badge className={cn("text-[10px] font-black uppercase tracking-tighter", 
                            request.status === 'COMPLETED' ? "bg-green-100 text-green-700 border-green-200" :
                            request.status === 'PENDING' ? "bg-amber-100 text-amber-700 border-amber-200" :
                            "bg-neutral-100 text-neutral-700"
                          )}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {request.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-4"
                            onClick={() => handleProcessRequest(request.id, 'APPROVE')}
                            disabled={!!processing}
                          >
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="font-bold px-4"
                            onClick={() => {
                              const notes = prompt('Motivo da rejeição:');
                              if (notes) handleProcessRequest(request.id, 'REJECT', notes);
                            }}
                            disabled={!!processing}
                          >
                            Rejeitar
                          </Button>
                        </>
                      )}
                      {request.status === 'APPROVED' && (
                        <Button 
                          size="sm" 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4"
                          onClick={() => handleProcessRequest(request.id, 'COMPLETE')}
                          disabled={!!processing}
                        >
                          Concluir Processamento
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={20} className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="font-bold text-neutral-500">Nenhuma requisição encontrada</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity size={20} className="text-indigo-600" />
                Logs de Auditoria Recentes
              </CardTitle>
              <CardDescription>Rastreamento completo de ações administrativas e de sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4">Ação</th>
                      <th className="px-6 py-4">Descrição</th>
                      <th className="px-6 py-4">Executor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-neutral-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter border-indigo-200 text-indigo-700">
                            {log.actionType}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-neutral-700 font-medium">{log.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold">
                              {(log.performedBy || 'S')[0]}
                            </div>
                            <span className="font-bold text-neutral-900">{log.performedBy || 'Sistema'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={20} />
                  Recomendações de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {compliance?.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="text-indigo-600" size={20} />
                  Status da Governança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                    <span>Consentimento dos Usuários</span>
                    <span className="text-indigo-600">{compliance?.overview.consentPercentage}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: compliance?.overview.consentPercentage }}
                      className="h-full bg-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Usuários Críticos</p>
                    <p className="text-2xl font-black text-red-500">{compliance?.compliance.criticalUsers}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-center">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Score Geral</p>
                    <p className="text-2xl font-black text-green-500">{compliance?.compliance.averageScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
