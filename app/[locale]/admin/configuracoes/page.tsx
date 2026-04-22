"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  RefreshCw, 
  Lock, 
  Mail, 
  Monitor, 
  Save, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AdminSettings {
  notificationsEmail: boolean;
  notificationsLGPD: boolean;
  notificationsReports: boolean;
  notificationsVerifications: boolean;
  auditLogRetention: number;
  enableMFAReminder: boolean;
  showSensitiveData: boolean;
  dashboardRefreshRate: number;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("notifications");
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          setSettings(await res.json());
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary-600" />
            Configurações Administrativas
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Gerencie suas preferências de painel, notificações e segurança de conta.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-gradient-brand text-white font-bold px-8 shadow-lg shadow-primary-500/20"
        >
          {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save className="mr-2" />}
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 size={20} />
          <span className="font-bold">Configurações atualizadas com sucesso!</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <nav className="flex flex-col gap-1">
            <SettingsLink 
              icon={Bell} 
              label="Notificações" 
              active={activeSection === "notifications"} 
              onClick={() => setActiveSection("notifications")} 
            />
            <SettingsLink 
              icon={Monitor} 
              label="Painel & Visualização" 
              active={activeSection === "dashboard"} 
              onClick={() => setActiveSection("dashboard")} 
            />
            <SettingsLink 
              icon={Shield} 
              label="Segurança & Auditoria" 
              active={activeSection === "security"} 
              onClick={() => setActiveSection("security")} 
            />
            <SettingsLink 
              icon={Database} 
              label="Dados & Sistema" 
              active={activeSection === "system"} 
              onClick={() => setActiveSection("system")} 
            />
          </nav>

          <div className="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-2xl border border-primary-100 dark:border-primary-900/30 mt-6">
            <div className="flex gap-2 text-primary-700 dark:text-primary-300 mb-2">
              <Info size={16} />
              <span className="text-[10px] font-black uppercase tracking-wider">Dica de Admin</span>
            </div>
            <p className="text-xs text-primary-600 dark:text-primary-400 leading-relaxed">
              As notificações de LGPD e Denúncias são enviadas em tempo real para garantir a resposta rápida conforme exigido por lei.
            </p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeSection === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-neutral-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell size={20} className="text-primary-600" />
                      Alertas de Sistema
                    </CardTitle>
                    <CardDescription>Escolha quais eventos disparam notificações para você</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <ToggleRow 
                        label="Notificações por E-mail" 
                        description="Receber resumos diários de atividade no email administrativo."
                        checked={settings?.notificationsEmail || false}
                        onChange={(v) => setSettings(s => s ? {...s, notificationsEmail: v} : null)}
                      />
                      <ToggleRow 
                        label="Alertas de LGPD" 
                        description="Notificar imediatamente sobre novas solicitações de dados."
                        checked={settings?.notificationsLGPD || false}
                        onChange={(v) => setSettings(s => s ? {...s, notificationsLGPD: v} : null)}
                      />
                      <ToggleRow 
                        label="Denúncias de Usuários" 
                        description="Receber alertas quando um perfil atingir o limite de denúncias."
                        checked={settings?.notificationsReports || false}
                        onChange={(v) => setSettings(s => s ? {...s, notificationsReports: v} : null)}
                      />
                      <ToggleRow 
                        label="Verificações Pendentes" 
                        description="Avisar quando houver novos documentos para validar."
                        checked={settings?.notificationsVerifications || false}
                        onChange={(v) => setSettings(s => s ? {...s, notificationsVerifications: v} : null)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-neutral-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Monitor size={20} className="text-indigo-600" />
                      Painel & Visualização
                    </CardTitle>
                    <CardDescription>Personalize sua experiência de monitoramento</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-neutral-900">Taxa de Atualização</p>
                          <p className="text-xs text-muted-foreground">Frequência de refresh automático dos gráficos</p>
                        </div>
                        <select 
                          className="bg-muted px-3 py-1.5 rounded-lg text-sm font-bold border-none"
                          value={settings?.dashboardRefreshRate}
                          onChange={(e) => setSettings(s => s ? {...s, dashboardRefreshRate: parseInt(e.target.value)} : null)}
                        >
                          <option value={10}>10 segundos</option>
                          <option value={30}>30 segundos</option>
                          <option value={60}>1 minuto</option>
                          <option value={300}>5 minutos</option>
                        </select>
                      </div>

                      <ToggleRow 
                        label="Exibir Dados Sensíveis" 
                        description="Mostrar e-mails completos e logs brutos por padrão."
                        checked={settings?.showSensitiveData || false}
                        onChange={(v) => setSettings(s => s ? {...s, showSensitiveData: v} : null)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-neutral-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield size={20} className="text-amber-600" />
                      Segurança & Auditoria
                    </CardTitle>
                    <CardDescription>Parâmetros de retenção e proteção de acesso</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-neutral-900">Retenção de Logs</p>
                          <p className="text-xs text-muted-foreground">Dias de histórico mantidos antes da purga automática</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            className="w-20 text-center font-bold"
                            value={settings?.auditLogRetention}
                            onChange={(e) => setSettings(s => s ? {...s, auditLogRetention: parseInt(e.target.value)} : null)}
                          />
                          <span className="text-xs font-bold text-muted-foreground">DIAS</span>
                        </div>
                      </div>

                      <ToggleRow 
                        label="Lembrete de MFA" 
                        description="Solicitar configuração de autenticação em duas etapas mensalmente."
                        checked={settings?.enableMFAReminder || false}
                        onChange={(v) => setSettings(s => s ? {...s, enableMFAReminder: v} : null)}
                      />

                      <div className="pt-4 border-t flex justify-between items-center">
                        <div>
                          <p className="font-bold text-neutral-900">Sessões Ativas</p>
                          <p className="text-xs text-muted-foreground">Você está logado em 2 dispositivos</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-[10px] font-black uppercase">
                          Revogar Todos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === "system" && (
              <motion.div
                key="system"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-neutral-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database size={20} className="text-green-600" />
                      Dados & Sistema
                    </CardTitle>
                    <CardDescription>Visualização de integridade e armazenamento</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-neutral-50 text-center">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Banco de Dados</p>
                        <p className="text-lg font-bold text-green-600"> Saudável</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-neutral-50 text-center">
                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Espaço em Disco</p>
                        <p className="text-lg font-bold text-neutral-900">45%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SettingsLink({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all font-bold text-sm",
        active ? "bg-primary-600 text-white shadow-md shadow-primary-500/20" : "hover:bg-muted text-neutral-600"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </div>
      <ChevronRight size={14} className={active ? "opacity-100" : "opacity-0"} />
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="font-bold text-neutral-900 text-sm leading-none">{label}</p>
        <p className="text-xs text-muted-foreground leading-tight">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
