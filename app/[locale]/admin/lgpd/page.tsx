'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  Calendar,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';

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
}

export default function LGPDManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<LGPDRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [compliance, setCompliance] = useState<ComplianceReport | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LGPDRequest | null>(null);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      router.push('/app');
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh a cada 30s
    return () => clearInterval(interval);
  }, [session, router, filter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch requests
      const requestsRes = await fetch(`/api/admin/lgpd/requests?status=${filter}`);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setRequests(data.requests || []);
      }

      // Fetch compliance
      const complianceRes = await fetch('/api/admin/lgpd/compliance');
      if (complianceRes.ok) {
        const data = await complianceRes.json();
        setCompliance(data);
      }

      // Fetch audit logs
      const auditRes = await fetch('/api/admin/lgpd/audit?limit=20');
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching LGPD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: string, notes = '') => {
    try {
      setProcessing(requestId);
      const response = await fetch(`/api/admin/lgpd/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      if (response.ok) {
        alert(`Requisição ${action.toLowerCase()} com sucesso`);
        fetchData();
        setSelectedRequest(null);
        setRejectionNotes('');
      } else {
        alert('Erro ao processar requisição');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      alert('Erro ao processar requisição');
    } finally {
      setProcessing(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      PENDING: <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm flex items-center gap-1"><Clock size={14} /> Pendente</span>,
      APPROVED: <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1"><Clock size={14} /> Aprovado</span>,
      IN_PROGRESS: <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Processando</span>,
      COMPLETED: <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1"><CheckCircle size={14} /> Concluído</span>,
      REJECTED: <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm flex items-center gap-1"><XCircle size={14} /> Rejeitado</span>,
    };
    return badges[status] || status;
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DATA_EXPORT: '📥 Exportação de Dados',
      DATA_ANONYMIZATION: '🔒 Anonimização',
      DATA_DELETION: '🗑️ Exclusão de Dados',
      DATA_RECTIFICATION: '✏️ Retificação de Dados',
      DATA_PORTABILITY: '📦 Portabilidade de Dados',
      CONSENT_WITHDRAWAL: '⛔ Retirada de Consentimento',
      PROCESSING_OBJECTION: '🚫 Objeção ao Processamento',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="text-blue-400" size={32} />
            Gerenciamento LGPD
          </h1>
          <p className="text-slate-400">
            Gerenciar requisições LGPD, consentimentos e conformidade de dados
          </p>
        </div>

        {/* Compliance Overview */}
        {compliance && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">👥 Total de Usuários</p>
                  <p className="text-2xl font-bold text-white">{compliance.overview.totalUsers}</p>
                </div>
                <Users className="text-blue-400 opacity-50" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">✅ Taxa de Consentimento</p>
                  <p className="text-2xl font-bold text-green-400">{compliance.overview.consentPercentage}</p>
                </div>
                <CheckCircle className="text-green-400 opacity-50" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">📋 Requisições LGPD</p>
                  <p className="text-2xl font-bold text-purple-400">{compliance.lgpdRequests.total}</p>
                  <p className="text-xs text-slate-500 mt-1">{compliance.lgpdRequests.last30Days} últimos 30 dias</p>
                </div>
                <FileText className="text-purple-400 opacity-50" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">📊 Pontuação de Conformidade</p>
                  <p className={`text-2xl font-bold ${parseInt(compliance.compliance.averageScore) >= 80 ? 'text-green-400' : parseInt(compliance.compliance.averageScore) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {compliance.compliance.averageScore}%
                  </p>
                </div>
                <TrendingUp className="opacity-50" size={32} color={parseInt(compliance.compliance.averageScore) >= 80 ? '#4ade80' : parseInt(compliance.compliance.averageScore) >= 60 ? '#facc15' : '#f87171'} />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="requests" className="bg-slate-700/50 backdrop-blur border border-slate-600 rounded-lg overflow-hidden">
          <TabsList className="w-full justify-start bg-slate-800 border-b border-slate-600 rounded-none">
            <TabsTrigger value="requests" className="data-[state=active]:bg-blue-600 rounded-none">
              <FileText size={18} className="mr-2" />
              Requisições ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-blue-600 rounded-none">
              <Activity size={18} className="mr-2" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-blue-600 rounded-none">
              <Shield size={18} className="mr-2" />
              Conformidade
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            {/* Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  Todas
                </Button>
                <Button
                  variant={filter === 'PENDING' ? 'default' : 'outline'}
                  onClick={() => setFilter('PENDING')}
                  size="sm"
                >
                  Pendentes
                </Button>
                <Button
                  variant={filter === 'APPROVED' ? 'default' : 'outline'}
                  onClick={() => setFilter('APPROVED')}
                  size="sm"
                >
                  Aprovadas
                </Button>
                <Button
                  variant={filter === 'IN_PROGRESS' ? 'default' : 'outline'}
                  onClick={() => setFilter('IN_PROGRESS')}
                  size="sm"
                >
                  Em Processamento
                </Button>
                <Button
                  variant={filter === 'COMPLETED' ? 'default' : 'outline'}
                  onClick={() => setFilter('COMPLETED')}
                  size="sm"
                >
                  Concluídas
                </Button>
              </div>

              <div className="space-y-3">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                      className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{request.user.name}</p>
                          <p className="text-sm text-slate-400">{request.user.email}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">
                              {getRequestTypeLabel(request.requestType)}
                            </span>
                            {getStatusBadge(request.status)}
                            <span className="text-xs text-slate-500">
                              {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedRequest?.id === request.id && (
                        <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                          {request.reason && (
                            <div>
                              <p className="text-xs text-slate-400 mb-1">Motivo:</p>
                              <p className="text-sm text-slate-300">{request.reason}</p>
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap pt-2">
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleProcessRequest(request.id, 'APPROVE');
                                  }}
                                  disabled={processing === request.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {processing === request.id ? <Loader2 size={16} className="animate-spin mr-1" /> : '✓'}
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const notes = prompt('Motivo da rejeição:');
                                    if (notes) handleProcessRequest(request.id, 'REJECT', notes);
                                  }}
                                  disabled={processing === request.id}
                                >
                                  ✗ Rejeitar
                                </Button>
                              </>
                            )}
                            {request.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProcessRequest(request.id, 'COMPLETE');
                                }}
                                disabled={processing === request.id}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {processing === request.id ? <Loader2 size={16} className="animate-spin mr-1" /> : '⚙️'}
                                Processar
                              </Button>
                            )}
                            {request.status === 'COMPLETED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-slate-300"
                              >
                                <Download size={16} className="mr-1" />
                                Baixar
                              </Button>
                            )}
                          </div>

                          <div className="bg-slate-700/30 rounded p-2 text-xs text-slate-400">
                            ID: <code className="bg-slate-900 px-1 rounded">{request.id}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400">Nenhuma requisição encontrada</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit" className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex gap-3 mb-4">
                <Activity className="text-blue-400 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-blue-300">Log de Auditoria</p>
                  <p className="text-sm text-blue-200">Últimas ações registradas no sistema (20 últimas)</p>
                </div>
              </div>

              <div className="space-y-2">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <div key={log.id} className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium">{log.actionType}</p>
                          <p className="text-slate-400">{log.description}</p>
                          <div className="flex gap-2 mt-2 text-xs text-slate-500">
                            <span>📦 {log.entityType}</span>
                            <span>🧑 {log.performedBy || 'Sistema'}</span>
                            <span>📅 {new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">Nenhum log encontrado</p>
                )}
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              {compliance && (
                <div className="space-y-4">
                  {/* Recomendações */}
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-yellow-400" />
                      Recomendações
                    </h3>
                    <div className="space-y-2">
                      {compliance.recommendations.length > 0 ? (
                        compliance.recommendations.map((rec, idx) => (
                          <div key={idx} className="text-sm text-yellow-300 flex gap-2 p-2 bg-yellow-900/20 rounded border border-yellow-800/50">
                            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-green-400 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Nenhuma recomendação crítica
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-2">📊 Requisições Últimos 30 Dias</p>
                      <p className="text-3xl font-bold text-white">{compliance.lgpdRequests.last30Days}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-2">⚠️ Usuários em Risco</p>
                      <p className="text-3xl font-bold text-red-400">{compliance.compliance.criticalUsers}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                      <p className="text-slate-400 text-sm mb-2">✅ Taxa de Resposta</p>
                      <p className="text-3xl font-bold text-green-400">{compliance.overview.consentPercentage}</p>
                    </div>
                  </div>

                  {/* Breakdown by Type */}
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-3">Requisições por Tipo</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(compliance.lgpdRequests.byType).map(([type, count]) => (
                        <div key={type} className="bg-slate-700/50 rounded p-2 text-center">
                          <p className="text-xs text-slate-400">{type}</p>
                          <p className="text-xl font-bold text-white">{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
