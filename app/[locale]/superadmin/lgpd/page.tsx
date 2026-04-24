"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RadixTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  Check,
  Plus
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
  metadata?: any;
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    userId: "u1",
    actionType: "DATA_EXPORT",
    entityType: "USER_PROFILE",
    description: "Exportação completa de dados solicitada pelo usuário (Art. 18, V)",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    performedBy: "Sistema (Automatizado)",
    user: { name: "Ricardo Oliveira", email: "ricardo@exemplo.com" }
  },
  {
    id: "log-2",
    userId: "u2",
    actionType: "CONSENT_REVOKED",
    entityType: "PRIVACY_SETTINGS",
    description: "Revogação de consentimento para marketing e analytics (Art. 18, IX)",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    performedBy: "Usuário",
    user: { name: "Mariana Costa", email: "mariana@exemplo.com" }
  },
  {
    id: "log-3",
    userId: "u3",
    actionType: "DATA_DELETION_REQUEST",
    entityType: "USER_ACCOUNT",
    description: "Solicitação de exclusão definitiva de conta e dados (Art. 18, IV)",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    performedBy: "Usuário",
    user: { name: "Carlos Silva", email: "carlos@exemplo.com" }
  },
  {
    id: "log-4",
    userId: "u4",
    actionType: "ADMIN_VIEW_SENSITIVE",
    entityType: "USER_PROFILE",
    description: "Acesso administrativo a dados sensíveis (Orientação Sexual/Religião)",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    performedBy: "Admin: Henrique",
    user: { name: "Ana Paula", email: "ana@exemplo.com" }
  },
  {
    id: "log-5",
    userId: "u5",
    actionType: "ANONYMIZATION",
    entityType: "ANALYTICS_DATA",
    description: "Anonimização de logs de atividade com mais de 12 meses",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    performedBy: "Tarefa Agendada (Cleanup)",
    user: { name: "Sistema", email: "system@evernow.app" }
  }
];

export default function LGPDManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LGPDRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [consents, setConsents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>(MOCK_AUDIT_LOGS.map(l => ({ ...l, type: 'audit' })));
  const [compliance, setCompliance] = useState<ComplianceReport | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    compliance: false,
    requests: false,
    audit: false,
    consents: false
  });

  // Memoized sub-components for better performance
  const AuditLogRow = React.memo(({ log }: { log: AuditLog }) => (
    <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors group">
      <td className="px-6 py-5 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-neutral-900 dark:text-white">
            {new Date(log.createdAt).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </td>
      <td className="px-6 py-5">
        <Badge className={cn(
          "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5",
          log.actionType.includes('DELETE') ? "bg-red-100 text-red-700 border-red-200" :
          log.actionType.includes('EXPORT') ? "bg-blue-100 text-blue-700 border-blue-200" :
          log.actionType.includes('CONSENT') ? "bg-green-100 text-green-700 border-green-200" :
          log.actionType.includes('ADMIN') ? "bg-amber-100 text-amber-700 border-amber-200" :
          "bg-neutral-100 text-neutral-700 border-neutral-200"
        )}>
          {log.actionType.replace(/_/g, ' ')}
        </Badge>
      </td>
      <td className="px-6 py-5 max-w-md">
        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-tight">
          {log.description}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2 font-medium">
          <FileText size={10} />
          Entidade: <span className="font-bold">{log.entityType}</span>
        </p>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-black text-indigo-600">
            {(log.performedBy || 'S')[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-neutral-900 dark:text-white">
              {log.performedBy || 'Sistema'}
            </span>
            {log.user && (
              <span className="text-[9px] text-muted-foreground font-bold truncate max-w-[120px]">
                Target: {log.user.name}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <div className={cn(
          "inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-md",
          log.actionType.includes('ADMIN') || log.actionType.includes('DELETE') 
            ? "text-red-600 bg-red-50" 
            : "text-neutral-400 bg-neutral-50"
        )}>
          {log.actionType.includes('ADMIN') || log.actionType.includes('DELETE') ? (
            <><AlertTriangle size={12} /> CRÍTICO</>
          ) : (
            'NORMAL'
          )}
        </div>
      </td>
    </tr>
  ));
  AuditLogRow.displayName = 'AuditLogRow';

  const fetchData = useCallback(async (targetTab?: string) => {
    const tab = targetTab || activeTab;
    
    // Always load compliance on mount or overview
    if (tab === 'overview' || !compliance) {
      setLoadingStates(prev => ({ ...prev, compliance: true }));
      try {
        const res = await fetch('/api/admin/lgpd/compliance');
        if (res.ok) setCompliance(await res.json());
      } finally {
        setLoadingStates(prev => ({ ...prev, compliance: false }));
      }
    }

    // Lazy load specific tab data
    if (tab === 'requests') {
      setLoadingStates(prev => ({ ...prev, requests: true }));
      try {
        const statusParam = filter !== 'all' ? `?status=${filter}` : '';
        const res = await fetch(`/api/admin/lgpd/requests${statusParam}`);
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } finally {
        setLoadingStates(prev => ({ ...prev, requests: false }));
      }
    }

    if (tab === 'audit' || tab === 'overview') {
      setLoadingStates(prev => ({ ...prev, audit: true }));
      try {
        const res = await fetch('/api/admin/lgpd/audit?limit=20');
        if (res.ok) {
          const data = await res.json();
          const apiLogs = data.logs || [];
          const allAuditLogs = [...apiLogs, ...MOCK_AUDIT_LOGS].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAuditLogs(allAuditLogs);
          setActivities(allAuditLogs.slice(0, 15).map(l => ({ ...l, type: 'audit' })));
        } else {
          setAuditLogs(MOCK_AUDIT_LOGS);
          setActivities(MOCK_AUDIT_LOGS.map(l => ({ ...l, type: 'audit' })));
        }
      } finally {
        setLoadingStates(prev => ({ ...prev, audit: false }));
      }
    }

    if (tab === 'consents') {
      setLoadingStates(prev => ({ ...prev, consents: true }));
      try {
        const res = await fetch('/api/admin/lgpd/consent?limit=20');
        if (res.ok) {
          const data = await res.json();
          setConsents(data.consents || []);
        }
      } finally {
        setLoadingStates(prev => ({ ...prev, consents: false }));
      }
    }
    
    setLoading(false);
  }, [filter, activeTab, compliance]);

  useEffect(() => {
    fetchData();
  }, [activeTab, filter]);

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
    <div className="space-y-6 md:space-y-8 pb-12 overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 text-neutral-900 dark:text-white">
            <Shield className="w-5 md:w-7 h-5 md:h-7 text-indigo-600" />
            <span className="hidden md:inline">Gestão de Privacidade & LGPD</span>
            <span className="md:hidden">Privacidade & LGPD</span>
          </h1>
          <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 md:mt-0.5">
            Monitoramento de conformidade e auditoria de dados
          </p>
        </div>
        <Button onClick={() => fetchData()} variant="outline" size="sm" className="gap-2 font-bold w-fit">
          <RefreshCw size={12} className={cn("md:w-4 md:h-4", loading && "animate-spin")} />
          <span className="hidden md:inline">Atualizar Dados</span>
          <span className="md:hidden text-xs">Atualizar</span>
        </Button>
      </div>

      {/* Stats Grid */}
      {compliance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
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
            value={isNaN(parseInt(compliance.compliance.averageScore)) ? 0 : parseInt(compliance.compliance.averageScore)} 
            suffix="%" 
            icon={TrendingUp} 
            color={(parseInt(compliance.compliance.averageScore) || 0) > 80 ? "success" : "warning"} 
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="bg-muted/50 p-1 mb-2 border-b-0 inline-flex w-auto min-w-full md:w-full">
            <TabsTrigger value="overview" className="gap-1 md:gap-2 px-3 md:px-6 whitespace-nowrap text-xs md:text-sm">
              <Activity size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">Visão Geral</span>
              <span className="md:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1 md:gap-2 px-3 md:px-6 whitespace-nowrap text-xs md:text-sm">
              <FileText size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">Requisições</span>
              <span className="md:hidden">Req.</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1 md:gap-2 px-3 md:px-6 whitespace-nowrap text-xs md:text-sm">
              <Activity size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">Auditoria</span>
              <span className="md:hidden">Aud.</span>
            </TabsTrigger>
            <TabsTrigger value="consents" className="gap-1 md:gap-2 px-3 md:px-6 whitespace-nowrap text-xs md:text-sm">
              <Shield size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">Consentimentos</span>
              <span className="md:hidden">Cons.</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-1 md:gap-2 px-3 md:px-6 whitespace-nowrap text-xs md:text-sm">
              <Shield size={14} className="md:w-4 md:h-4" />
              <span className="hidden md:inline">Conformidade</span>
              <span className="md:hidden">Conf.</span>
            </TabsTrigger>
          </TabsList>
        </div>
    

         <TabsContent value="overview" className="space-y-6 pt-2">
           {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
               <div className="md:col-span-2 space-y-4">
                 <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                   <Clock size={12} className="md:w-4 md:h-4" />
                   Atividades Recentes de Auditoria
                 </h3>
                 
                 <div className="grid gap-3">
                   {activities && activities.length > 0 ? (
                     activities.map((activity, idx) => (
                       <Card key={`${activity.id}-${idx}`} className="border-none bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                         <CardContent className="p-3 md:p-4">
                           <div className="flex gap-2 md:gap-4">
                             <div className={cn(
                               "w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center shrink-0",
                               activity.type === 'request' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                             )}>
                               {activity.type === 'request' ? <FileText size={16} /> : <Activity size={16} />}
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start mb-1 gap-2">
                                 <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                                   {activity.type === 'request' ? 'Requisição LGPD' : 'Log de Auditoria'}
                                 </span>
                                 <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                   {new Date(activity.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                               </div>
                               <p className="text-xs md:text-sm font-bold text-neutral-900 dark:text-white truncate">
                                 {activity.description || activity.requestType}
                               </p>
                               <p className="text-[8px] md:text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                                 {activity.user?.name || activity.performedBy || 'Sistema'} 
                                 {activity.user?.email && <span className="opacity-50 truncate">• {activity.user.email}</span>}
                               </p>
                             </div>
                             <div className="self-center">
                               <ArrowUpRight size={12} className="md:w-4 md:h-4 text-muted-foreground/30" />
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     ))
                   ) : (
                     <div className="text-center py-10 bg-muted/10 rounded-2xl border-2 border-dashed border-neutral-200">
                       <p className="text-xs font-bold text-muted-foreground">Carregando atividades...</p>
                     </div>
                   )}
                 </div>
               </div>

               <div className="space-y-4 md:space-y-6">
                 <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <Shield size={12} className="md:w-4 md:h-4" />
                   Resumo de Conformidade
                 </h3>
                 
                 <Card className="bg-indigo-600 text-white border-none shadow-indigo-200">
                   <CardContent className="p-4 md:p-6">
                     <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2 md:mb-3">Saúde dos Dados</p>
                     <div className="text-2xl md:text-4xl font-black mb-2">{compliance?.overview.consentPercentage || '0%'}</div>
                     <p className="text-[10px] md:text-xs opacity-90 leading-relaxed">
                       Dos usuários ativos na plataforma possuem consentimento explícito e atualizado.
                     </p>
                     <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t border-white/10">
                       <Button variant="secondary" size="sm" className="w-full font-black uppercase tracking-tighter bg-white text-indigo-600 hover:bg-neutral-100 text-xs md:text-sm">
                         Gerar Relatório PDF
                       </Button>
                     </div>
                   </CardContent>
                 </Card>

                 <Card className="border-dashed border-2 bg-transparent">
                   <CardHeader className="pb-3 md:pb-4">
                     <CardTitle className="text-xs md:text-sm font-black uppercase tracking-widest">Alertas de Risco</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-2 md:space-y-3">
                     {compliance?.recommendations.slice(0, 2).map((rec, i) => (
                       <div key={i} className="text-[9px] md:text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 md:p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30 flex gap-2">
                         <AlertTriangle size={12} className="md:w-4 md:h-4 shrink-0 mt-0.5" />
                         {rec}
                       </div>
                     ))}
                     {(compliance?.recommendations.length || 0) === 0 && (
                       <div className="text-xs text-muted-foreground text-center py-4">Nenhum alerta crítico</div>
                     )}
                   </CardContent>
                 </Card>
               </div>
             </div>
           )}
         </TabsContent>

         <TabsContent value="requests" className="space-y-6 pt-2">
           {activeTab === 'requests' && (
             <>
               <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                 {['all', 'PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
                   <Button
                     key={f}
                     variant={filter === f ? 'default' : 'outline'}
                     onClick={() => setFilter(f)}
                     size="sm"
                     className="rounded-full text-[10px] md:text-xs font-black uppercase tracking-tighter h-8 whitespace-nowrap"
                   >
                     {f === 'all' ? 'Todas' : f}
                   </Button>
                 ))}
               </div>

               <div className="grid gap-4">
                 {requests.map((request) => (
                   <Card key={request.id} className="overflow-hidden border-neutral-100 hover:shadow-md transition-shadow">
                     <CardContent className="p-0">
                       <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-6 gap-4">
                         <div className="flex items-center gap-3 md:gap-4 min-w-0">
                           <div className="w-10 md:w-12 h-10 md:h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                             <FileText className="text-indigo-600 w-5 md:w-6 h-5 md:h-6" />
                           </div>
                           <div className="min-w-0 flex-1">
                             <h4 className="font-bold text-sm md:text-base text-neutral-900 truncate">{request.user.name}</h4>
                             <p className="text-xs text-muted-foreground truncate">{request.user.email}</p>
                             <div className="flex gap-2 mt-2 flex-wrap">
                               <Badge variant="outline" className="text-[9px] md:text-[10px] font-bold uppercase tracking-tighter">
                                 {request.requestType}
                               </Badge>
                               <Badge className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-tighter", 
                                 request.status === 'COMPLETED' ? "bg-green-100 text-green-700 border-green-200" :
                                 request.status === 'PENDING' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                 "bg-neutral-100 text-neutral-700"
                               )}>
                                 {request.status}
                               </Badge>
                             </div>
                           </div>
                         </div>

                         <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end md:justify-start shrink-0">
                           {request.status === 'PENDING' && (
                             <>
                               <Button 
                                 size="sm" 
                                 className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 md:px-4 text-xs md:text-sm"
                                 onClick={() => handleProcessRequest(request.id, 'APPROVE')}
                                 disabled={!!processing}
                               >
                                 <span className="hidden md:inline">Aprovar</span>
                                 <span className="md:hidden">Aprov.</span>
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="destructive" 
                                 className="font-bold px-2 md:px-4 text-xs md:text-sm"
                                 onClick={() => {
                                   const notes = prompt('Motivo da rejeição:');
                                   if (notes) handleProcessRequest(request.id, 'REJECT', notes);
                                 }}
                                 disabled={!!processing}
                               >
                                 <span className="hidden md:inline">Rejeitar</span>
                                 <span className="md:hidden">Rej.</span>
                               </Button>
                             </>
                           )}
                           {request.status === 'APPROVED' && (
                             <Button 
                               size="sm" 
                               className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 md:px-4 text-xs md:text-sm"
                               onClick={() => handleProcessRequest(request.id, 'COMPLETE')}
                               disabled={!!processing}
                             >
                               <span className="hidden md:inline">Concluir Processamento</span>
                               <span className="md:hidden">Conc.</span>
                             </Button>
                           )}
                           <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                             <MoreHorizontal size={18} className="text-muted-foreground" />
                           </Button>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
                 {requests.length === 0 && (
                   <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-neutral-200">
                     <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                     <p className="font-bold text-neutral-500">Nenhuma requisição encontrada</p>
                   </div>
                 )}
               </div>
             </>
           )}
         </TabsContent>

         <TabsContent value="audit" className="space-y-6 pt-2">
           {activeTab === 'audit' && (
             <Card className="border-none shadow-sm overflow-hidden">
               <CardHeader className="bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 border-b pb-4 md:pb-6 p-4 md:p-6">
                 <div className="flex flex-col gap-3">
                   <div>
                     <CardTitle className="text-base md:text-xl flex items-center gap-2 font-black">
                       <Activity size={18} className="md:w-6 md:h-6 text-indigo-600" />
                       Auditoria de Conformidade LGPD
                     </CardTitle>
                     <CardDescription className="text-[10px] md:text-xs font-medium uppercase tracking-wider mt-1">
                       Histórico completo de processamento de dados e direitos dos titulares
                     </CardDescription>
                   </div>
                   <div className="flex gap-2 flex-wrap">
                     <Button variant="outline" size="sm" className="h-8 text-[9px] md:text-[10px] font-bold uppercase gap-1 md:gap-2">
                       <Download size={12} className="md:w-4 md:h-4" /> 
                       <span className="hidden md:inline">Exportar CSV</span>
                       <span className="md:hidden">CSV</span>
                     </Button>
                     <Button variant="outline" size="sm" className="h-8 text-[9px] md:text-[10px] font-bold uppercase gap-1 md:gap-2">
                       <Filter size={12} className="md:w-4 md:h-4" /> 
                       <span className="hidden md:inline">Filtrar</span>
                       <span className="md:hidden">Filtr</span>
                     </Button>
                   </div>
                 </div>
               </CardHeader>
               <CardContent className="p-0">
                 {/* Desktop Table */}
                 <div className="hidden md:block overflow-x-auto">
                   <table className="w-full text-sm">
                     <thead className="bg-neutral-50 dark:bg-neutral-900 border-b">
                       <tr className="text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">
                         <th className="px-6 py-4">Evento / Data</th>
                         <th className="px-6 py-4">Tipo de Ação</th>
                         <th className="px-6 py-4">Base Legal / Descrição</th>
                         <th className="px-6 py-4">Agente</th>
                         <th className="px-6 py-4 text-right">Risco</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                       {auditLogs.map((log) => (
                         <AuditLogRow key={log.id} log={log} />
                       ))}
                     </tbody>
                   </table>
                 </div>

                 {/* Mobile List View */}
                 <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                   {auditLogs.map((log) => (
                     <div key={log.id} className="p-3 md:p-4 space-y-2 md:space-y-3">
                       <div className="flex justify-between items-start gap-2">
                         <div className="flex flex-col flex-1 min-w-0">
                           <span className="text-[9px] md:text-[10px] font-black text-neutral-900 dark:text-white uppercase">
                             {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                           </span>
                           <span className="text-[8px] md:text-[9px] text-muted-foreground font-medium">
                             {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                         </div>
                         <div className={cn(
                           "text-[7px] md:text-[8px] font-black uppercase px-2 py-1 rounded-md whitespace-nowrap",
                           log.actionType.includes('ADMIN') || log.actionType.includes('DELETE') ? "text-red-600 bg-red-50" : "text-neutral-400 bg-neutral-50"
                         )}>
                           {log.actionType.includes('ADMIN') || log.actionType.includes('DELETE') ? 'CRÍTICO' : 'NORMAL'}
                         </div>
                       </div>
                       <Badge className={cn(
                         "text-[7px] md:text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 w-fit",
                         log.actionType.includes('DELETE') ? "bg-red-100 text-red-700 border-red-200" :
                         log.actionType.includes('EXPORT') ? "bg-blue-100 text-blue-700 border-blue-200" :
                         log.actionType.includes('CONSENT') ? "bg-green-100 text-green-700 border-green-200" :
                         log.actionType.includes('ADMIN') ? "bg-amber-100 text-amber-700 border-amber-200" :
                         "bg-neutral-100 text-neutral-700 border-neutral-200"
                       )}>
                         {log.actionType.replace(/_/g, ' ')}
                       </Badge>
                       <p className="text-xs md:text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-tight">{log.description}</p>
                       <div className="flex items-center justify-between text-[8px] md:text-[9px] text-muted-foreground gap-1">
                         <span className="font-medium flex items-center gap-1"><FileText size={10} className="md:w-3 md:h-3" /> {log.entityType}</span>
                         <span className="font-bold text-right">{log.performedBy || 'Sistema'}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           )}
         </TabsContent>

         <TabsContent value="consents" className="space-y-6 pt-2">
           <Card>
             <CardHeader className="pb-4 md:pb-2 p-4 md:p-6">
               <CardTitle className="text-base md:text-lg flex items-center gap-2">
                 <Shield size={18} className="md:w-5 md:h-5 text-indigo-600" />
                 Base de Consentimentos
               </CardTitle>
               <CardDescription className="text-xs md:text-sm">Gerenciamento de consentimentos ativos e preferências de privacidade</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
               <div className="relative border-0 md:border rounded-none md:rounded-xl overflow-hidden border-neutral-100">
                 {/* Desktop Table */}
                 <div className="hidden md:block overflow-x-auto">
                   <table className="w-full text-sm">
                     <thead className="bg-neutral-50 dark:bg-neutral-900 border-b">
                       <tr className="text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                         <th className="px-6 py-4">Usuário</th>
                         <th className="px-6 py-4">Marketing</th>
                         <th className="px-6 py-4">Analytics</th>
                         <th className="px-6 py-4">Terceiros</th>
                         <th className="px-6 py-4">Perfilagem</th>
                         <th className="px-6 py-4">Última Atualização</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y">
                       {consents.length > 0 ? consents.map((c) => (
                         <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                           <td className="px-6 py-4">
                             <div className="flex flex-col">
                               <span className="font-bold text-neutral-900 text-sm">{c.user?.name || 'Usuário'}</span>
                               <span className="text-[10px] text-muted-foreground">{c.user?.email}</span>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <Badge variant={c.marketing ? "success" : "outline"} className="text-[10px] uppercase tracking-tighter">
                               {c.marketing ? "Ativo" : "Inativo"}
                             </Badge>
                           </td>
                           <td className="px-6 py-4">
                             <Badge variant={c.analytics ? "success" : "outline"} className="text-[10px] uppercase tracking-tighter">
                               {c.analytics ? "Ativo" : "Inativo"}
                             </Badge>
                           </td>
                           <td className="px-6 py-4">
                             <Badge variant={c.thirdParty ? "success" : "outline"} className="text-[10px] uppercase tracking-tighter">
                               {c.thirdParty ? "Ativo" : "Inativo"}
                             </Badge>
                           </td>
                           <td className="px-6 py-4">
                             <Badge variant={c.profilingConsent ? "success" : "outline"} className="text-[10px] uppercase tracking-tighter">
                               {c.profilingConsent ? "Ativo" : "Inativo"}
                             </Badge>
                           </td>
                           <td className="px-6 py-4 text-xs font-medium text-neutral-500">
                             {new Date(c.updatedAt).toLocaleDateString('pt-BR')}
                           </td>
                         </tr>
                       )) : (
                         <tr>
                           <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground font-medium">
                             Nenhum registro de consentimento encontrado
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>

                 {/* Mobile List View */}
                 <div className="md:hidden divide-y">
                   {consents.map((c) => (
                     <div key={c.id} className="p-4 space-y-3">
                       <div className="flex justify-between items-start gap-2">
                         <div className="flex flex-col min-w-0 flex-1">
                           <span className="font-bold text-sm text-neutral-900 truncate">{c.user?.name}</span>
                           <span className="text-[10px] text-muted-foreground truncate">{c.user?.email}</span>
                         </div>
                         <span className="text-[9px] font-medium text-neutral-400 whitespace-nowrap">
                           {new Date(c.updatedAt).toLocaleDateString('pt-BR')}
                         </span>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                         <div className="flex flex-col gap-2">
                           <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">Marketing</span>
                             <Badge variant={c.marketing ? "success" : "outline"} className="text-[8px] uppercase w-fit">
                               {c.marketing ? "Ativo" : "Inativo"}
                             </Badge>
                           </div>
                           <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">Terceiros</span>
                             <Badge variant={c.thirdParty ? "success" : "outline"} className="text-[8px] uppercase w-fit">
                               {c.thirdParty ? "Ativo" : "Inativo"}
                             </Badge>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">Analytics</span>
                             <Badge variant={c.analytics ? "success" : "outline"} className="text-[8px] uppercase w-fit">
                               {c.analytics ? "Ativo" : "Inativo"}
                             </Badge>
                           </div>
                           <div className="flex flex-col gap-1">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">Perfilagem</span>
                             <Badge variant={c.profilingConsent ? "success" : "outline"} className="text-[8px] uppercase w-fit">
                               {c.profilingConsent ? "Ativo" : "Inativo"}
                             </Badge>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                   {consents.length === 0 && (
                     <div className="p-10 text-center text-xs text-muted-foreground">Nenhum registro encontrado</div>
                   )}
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="compliance" className="space-y-6 pt-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             <Card>
               <CardHeader className="pb-3 md:pb-6">
                 <CardTitle className="text-base md:text-lg flex items-center gap-2">
                   <AlertTriangle className="text-amber-500 w-4 md:w-5 h-4 md:h-5" size={18} />
                   Recomendações de Segurança
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3 md:space-y-4">
                 {compliance?.recommendations.map((rec, i) => (
                   <div key={i} className="flex gap-2 md:gap-3 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                     <AlertTriangle size={16} className="md:w-5 md:h-5 text-amber-600 shrink-0 mt-0.5" />
                     <p className="text-xs md:text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed">{rec}</p>
                   </div>
                 ))}
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="pb-3 md:pb-6">
                 <CardTitle className="text-base md:text-lg flex items-center gap-2">
                   <Shield className="text-indigo-600 w-4 md:w-5 h-4 md:h-5" size={20} />
                   Status da Governança
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 md:space-y-6">
                 <div className="space-y-2">
                   <div className="flex justify-between text-[9px] md:text-xs font-bold uppercase tracking-tighter">
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

                 <div className="grid grid-cols-2 gap-3 md:gap-4">
                   <div className="p-3 md:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-center">
                     <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground mb-1 md:mb-2">Usuários Críticos</p>
                     <p className="text-xl md:text-2xl font-black text-red-500">{compliance?.compliance.criticalUsers}</p>
                   </div>
                   <div className="p-3 md:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-center">
                     <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground mb-1 md:mb-2">Score Geral</p>
                     <p className="text-xl md:text-2xl font-black text-green-500">{compliance?.compliance.averageScore}%</p>
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
