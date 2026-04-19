"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  Clock,
  Loader2,
  History,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReportItem {
  id: string;
  reason: string;
  description: string | null;
  evidence: string[];
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  reported: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
    verificationStatus?: string | null;
    status?: string | null;
  };
  resolvedBy?: { name: string } | null;
  resolvedAt?: string | null;
}

interface VerificationItem {
  id: string;
  type: string;
  status: string;
  photoUrl: string | null;
  socialLink: string | null;
  reviewerNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { id: string; name: string; email: string };
  reviewedBy?: { name: string } | null;
}

interface ModerationItem {
  id: string;
  actionType: string;
  reason: string;
  notes: string | null;
  suspendedUntil: string | null;
  createdAt: string;
  targetUser: { name: string; email: string };
  moderator: { name: string };
}

const reasonLabels: Record<string, string> = {
  FAKE_PROFILE: "Perfil falso",
  INAPPROPRIATE_CONTENT: "Conteúdo inapropriado",
  HARASSMENT: "Assédio",
  SPAM: "Spam",
  SCAM: "Golpe/Fraude",
  UNDERAGE: "Menor de idade",
  HATE_SPEECH: "Discurso de ódio",
  OTHER: "Outro",
};

const statusLabels: Record<string, { label: string; variant: "warning" | "success" | "info" | "error" | "secondary" }> = {
  PENDING: { label: "Pendente", variant: "warning" },
  REVIEWING: { label: "Em análise", variant: "info" },
  RESOLVED: { label: "Resolvido", variant: "success" },
  DISMISSED: { label: "Descartado", variant: "secondary" },
  VERIFIED: { label: "Aprovado", variant: "success" },
  REJECTED: { label: "Rejeitado", variant: "error" },
  UNVERIFIED: { label: "Não verificado", variant: "secondary" },
};

const actionLabels: Record<string, string> = {
  WARNING: "Aviso",
  TEMP_SUSPENSION: "Suspensão temporária",
  PERMANENT_BAN: "Banimento permanente",
  CONTENT_REMOVAL: "Remoção de conteúdo",
  REPORT_RESOLVED: "Denúncia resolvida",
  REPORT_DISMISSED: "Denúncia descartada",
  VERIFICATION_APPROVED: "Verificação aprovada",
  VERIFICATION_REJECTED: "Verificação rejeitada",
  TRUST_SCORE_ADJUSTMENT: "Ajuste de confiança",
};

export default function ModeracaoPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("reports");

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsFilter, setReportsFilter] = useState("PENDING");

  // Verifications state
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifPage, setVerifPage] = useState(1);
  const [verifTotal, setVerifTotal] = useState(0);
  const [verifFilter, setVerifFilter] = useState("PENDING");
  const [error, setError] = useState<string | null>(null);

  // Moderation history state
  const [history, setHistory] = useState<ModerationItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Action dialogs
  const [actionReport, setActionReport] = useState<ReportItem | null>(null);
  const [actionVerif, setActionVerif] = useState<VerificationItem | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionType, setActionType] = useState<string>("");
  const [actionSaving, setActionSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports?page=${reportsPage}&status=${reportsFilter}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao carregar denúncias');
      }
      const data = await res.json();
      setReports(data.reports || []);
      setReportsTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally { setReportsLoading(false); }
  }, [reportsPage, reportsFilter]);

  // Fetch verifications
  const fetchVerifications = useCallback(async () => {
    setVerifLoading(true);
    try {
      const res = await fetch(`/api/admin/verification?page=${verifPage}&status=${verifFilter}`);
      const data = await res.json();
      setVerifications(data.requests || []);
      setVerifTotal(data.total || 0);
    } catch { /* empty */ } finally { setVerifLoading(false); }
  }, [verifPage, verifFilter]);

  // Fetch moderation history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/moderation?limit=50');
      const data = await res.json();
      setHistory(data.actions || []);
    } catch { /* empty */ } finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (activeTab === "reports") fetchReports();
    else if (activeTab === "verifications") fetchVerifications();
    else if (activeTab === "history") fetchHistory();
  }, [mounted, activeTab, fetchReports, fetchVerifications, fetchHistory]);

  // Report actions
  const handleReportAction = async (action: "RESOLVED" | "DISMISSED") => {
    if (!actionReport) return;
    setActionSaving(true);
    try {
      const body: Record<string, string> = {
        reportId: actionReport.id,
        action,
        notes: actionNotes,
      };
      if (action === "RESOLVED" && actionType) body.moderationAction = actionType;
      if (actionReason) body.reason = actionReason;
      const res = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setActionReport(null);
        setActionNotes("");
        setActionType("");
        setActionReason("");
        fetchReports();
      }
    } catch { /* empty */ } finally { setActionSaving(false); }
  };

  // Verification actions
  const handleVerifAction = async (action: "approve" | "reject") => {
    if (!actionVerif) return;
    setActionSaving(true);
    try {
      const body: Record<string, string> = {
        requestId: actionVerif.id,
        action,
        notes: actionNotes,
      };
      if (action === "reject" && actionReason) body.rejectionReason = actionReason;
      const res = await fetch('/api/admin/verification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setActionVerif(null);
        setActionNotes("");
        setActionReason("");
        fetchVerifications();
      }
    } catch { /* empty */ } finally { setActionSaving(false); }
  };

  if (!mounted) return null;

  const totalReportsPages = Math.ceil(reportsTotal / 20);
  const totalVerifPages = Math.ceil(verifTotal / 20);

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-neutral-900 dark:text-white">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
          Moderação
        </h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          Gerencie denúncias, verificações e ações de moderação
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "reports", label: "Denúncias", icon: <AlertTriangle className="h-4 w-4" /> },
          { id: "verifications", label: "Verificações", icon: <Shield className="h-4 w-4" /> },
          { id: "history", label: "Histórico", icon: <History className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ===== REPORTS TAB ===== */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {["PENDING", "REVIEWING", "RESOLVED", "DISMISSED"].map((s) => (
              <Button
                key={s}
                variant={reportsFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => { setReportsFilter(s); setReportsPage(1); }}
              >
                {statusLabels[s]?.label || s}
              </Button>
            ))}
          </div>

          {reportsLoading ? (
            <div className="py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : error ? (
            <div className="py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-red-600">Erro ao carregar dados</p>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchReports()}>Tentar novamente</Button>
            </div>
          ) : reports.length === 0 ? (
            <EmptyState icon={CheckCircle} title="Nenhuma denúncia" description={`Nenhuma denúncia com status ${statusLabels[reportsFilter]?.label || reportsFilter}.`} />
          ) : (
            reports.map((report, index) => (
              <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        {/* Reported user avatar + info */}
                        <div className="flex items-start gap-4">
                          {/* Avatar with photo or fallback */}
                          <div className="relative flex-shrink-0">
                            {report.reported?.photoUrl ? (
                              <img
                                src={report.reported.photoUrl}
                                alt={report.reported?.name ?? 'Usuário'}
                                className="h-14 w-14 rounded-full object-cover border-2 border-red-200 dark:border-red-800"
                              />
                            ) : (
                              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 flex items-center justify-center border-2 border-red-200 dark:border-red-800">
                                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                  {report.reported?.name?.charAt(0)?.toUpperCase() ?? '?'}
                                </span>
                              </div>
                            )}
                            {/* Status dot */}
                            {report.reported?.status === 'SUSPENDED' && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center" title="Conta suspensa">
                                <XCircle className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            {/* Reported user name + verification */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-neutral-900 dark:text-white truncate">
                                {report.reported?.name ?? 'Usuário removido'}
                              </p>
                              {report.reported?.verificationStatus === 'VERIFIED' && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                                  <Shield className="h-3 w-3" /> Verificado
                                </span>
                              )}
                              {report.reported?.status === 'SUSPENDED' && (
                                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
                                  Suspenso
                                </span>
                              )}
                            </div>
                            {report.reported?.email && (
                              <p className="text-xs text-neutral-400 truncate">{report.reported.email}</p>
                            )}

                            {/* Divider */}
                            <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                              {/* Reason */}
                              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                {reasonLabels[report.reason] || report.reason}
                              </p>
                              <p className="text-xs text-neutral-400 mt-0.5">Denunciado por: <span className="text-neutral-500">{report.reporter?.name ?? 'Desconhecido'}</span></p>
                            </div>

                            {report.description && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-300 bg-muted/50 p-2 rounded">{report.description}</p>
                            )}
                            {report.evidence.length > 0 && (
                              <p className="text-xs text-muted-foreground">📎 {report.evidence.length} evidência(s) anexada(s)</p>
                            )}
                            <p className="text-xs text-neutral-400">{new Date(report.createdAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={statusLabels[report.status]?.variant || "secondary"}>
                            {statusLabels[report.status]?.label || report.status}
                          </Badge>
                        </div>
                      </div>
                      {report.adminNotes && (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{report.adminNotes}</span>
                        </div>
                      )}
                      {(report.status === "PENDING" || report.status === "REVIEWING") && (
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => { setActionReport(report); setActionNotes(""); setActionType(""); setActionReason(""); }}>
                            <Eye className="h-4 w-4 mr-1" /> Analisar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
          {/* Pagination */}
          {totalReportsPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button variant="outline" size="sm" disabled={reportsPage <= 1} onClick={() => setReportsPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{reportsPage} / {totalReportsPages}</span>
              <Button variant="outline" size="sm" disabled={reportsPage >= totalReportsPages} onClick={() => setReportsPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ===== VERIFICATIONS TAB ===== */}
      {activeTab === "verifications" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["PENDING", "VERIFIED", "REJECTED"].map((s) => (
              <Button
                key={s}
                variant={verifFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => { setVerifFilter(s); setVerifPage(1); }}
              >
                {statusLabels[s]?.label || s}
              </Button>
            ))}
          </div>

          {verifLoading ? (
            <div className="py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : verifications.length === 0 ? (
            <EmptyState icon={CheckCircle} title="Nenhuma verificação" description={`Nenhuma verificação com status ${statusLabels[verifFilter]?.label || verifFilter}.`} />
          ) : (
            verifications.map((v, index) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar name={v.user.name} size="lg" />
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-white">{v.user.name}</p>
                            <p className="text-sm text-neutral-500">{v.user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="info">{v.type === "PHOTO" ? "Foto" : v.type === "DOCUMENT" ? "Documento" : "Social"}</Badge>
                              <Badge variant={statusLabels[v.status]?.variant || "secondary"}>
                                {statusLabels[v.status]?.label || v.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1">{new Date(v.createdAt).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        {v.status === "PENDING" && (
                          <div className="flex items-center gap-2">
                            <Button variant="success" size="sm" onClick={() => { setActionVerif(v); setActionNotes(""); setActionReason(""); }}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Analisar
                            </Button>
                          </div>
                        )}
                      </div>
                      {v.photoUrl && (
                        <div className="text-sm"><a href={v.photoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-500 underline">Ver foto de verificação</a></div>
                      )}
                      {v.socialLink && (
                        <div className="text-sm"><a href={v.socialLink} target="_blank" rel="noopener noreferrer" className="text-primary-500 underline">Ver perfil social</a></div>
                      )}
                      {v.reviewerNotes && (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded"><MessageSquare className="h-4 w-4 inline mr-1" />{v.reviewerNotes}</div>
                      )}
                      {v.rejectionReason && (
                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded"><XCircle className="h-4 w-4 inline mr-1" />{v.rejectionReason}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
          {totalVerifPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button variant="outline" size="sm" disabled={verifPage <= 1} onClick={() => setVerifPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">{verifPage} / {totalVerifPages}</span>
              <Button variant="outline" size="sm" disabled={verifPage >= totalVerifPages} onClick={() => setVerifPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : history.length === 0 ? (
            <EmptyState icon={History} title="Nenhuma ação registrada" description="O histórico de ações de moderação aparecerá aqui." />
          ) : (
            history.map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{actionLabels[item.actionType] || item.actionType}</Badge>
                          <span className="text-sm font-medium">{item.targetUser.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.reason}</p>
                        {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                        {item.suspendedUntil && (
                          <p className="text-xs text-amber-600">Suspensão até: {new Date(item.suspendedUntil).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <p>Por: {item.moderator.name}</p>
                        <p>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ===== REPORT ACTION DIALOG ===== */}
      <AnimatePresence>
        {actionReport && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setActionReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">Analisar denúncia</h3>
              {/* Reported user mini-card */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-neutral-200 dark:border-neutral-700">
                {actionReport.reported?.photoUrl ? (
                  <img
                    src={actionReport.reported.photoUrl}
                    alt={actionReport.reported?.name ?? 'Usuário'}
                    className="h-10 w-10 rounded-full object-cover border border-red-200 dark:border-red-800 flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {actionReport.reported?.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">{actionReport.reported?.name ?? 'Usuário removido'}</p>
                  {actionReport.reported?.email && <p className="text-xs text-neutral-400 truncate">{actionReport.reported.email}</p>}
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Motivo:</strong> {reasonLabels[actionReport.reason] || actionReport.reason}</p>
                {actionReport.description && <p><strong>Descrição:</strong> {actionReport.description}</p>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Ação de moderação (opcional)</label>
                <select
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background p-2 text-sm"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                >
                  <option value="">Nenhuma ação adicional</option>
                  <option value="WARNING">Aviso ao usuário</option>
                  <option value="TEMP_SUSPENSION">Suspensão temporária</option>
                  <option value="PERMANENT_BAN">Banimento permanente</option>
                  <option value="CONTENT_REMOVAL">Remoção de conteúdo</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Notas do moderador</label>
                <textarea
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background p-2 text-sm min-h-[80px]"
                  placeholder="Notas internas sobre a decisão..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setActionReport(null)} disabled={actionSaving}>Cancelar</Button>
                <Button variant="secondary" onClick={() => handleReportAction("DISMISSED")} disabled={actionSaving}>
                  {actionSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                  Descartar
                </Button>
                <Button variant="success" onClick={() => handleReportAction("RESOLVED")} disabled={actionSaving}>
                  {actionSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Resolver
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== VERIFICATION ACTION DIALOG ===== */}
      <AnimatePresence>
        {actionVerif && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setActionVerif(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">Analisar verificação</h3>
              <div className="text-sm space-y-1">
                <p><strong>Usuário:</strong> {actionVerif.user.name} ({actionVerif.user.email})</p>
                <p><strong>Tipo:</strong> {actionVerif.type === "PHOTO" ? "Foto" : actionVerif.type === "DOCUMENT" ? "Documento" : "Social"}</p>
              </div>
              {actionVerif.photoUrl && (
                <a href={actionVerif.photoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 underline block">Ver foto de verificação →</a>
              )}
              {actionVerif.socialLink && (
                <a href={actionVerif.socialLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 underline block">Ver perfil social →</a>
              )}
              <div>
                <label className="text-sm font-medium block mb-1">Notas do moderador</label>
                <textarea
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background p-2 text-sm min-h-[80px]"
                  placeholder="Notas sobre a análise..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Motivo da rejeição (se aplicável)</label>
                <input
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background p-2 text-sm"
                  placeholder="Ex: Foto borrada, documento ilegível..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setActionVerif(null)} disabled={actionSaving}>Cancelar</Button>
                <Button variant="destructive" onClick={() => handleVerifAction("reject")} disabled={actionSaving}>
                  {actionSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                  Rejeitar
                </Button>
                <Button variant="success" onClick={() => handleVerifAction("approve")} disabled={actionSaving}>
                  {actionSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Aprovar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
