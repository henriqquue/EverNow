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
  Info,
  Server,
  Zap,
  Globe,
  HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SuperAdminSettings {
  // Admin Personal
  notificationsEmail: boolean;
  notificationsLGPD: boolean;
  notificationsReports: boolean;
  notificationsVerifications: boolean;
  auditLogRetention: number;
  enableMFAReminder: boolean;
  showSensitiveData: boolean;
  dashboardRefreshRate: number;
  
  // System Global (SuperAdmin Only)
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  emailVerificationRequired: boolean;
  defaultDiscoveryRange: number;
  systemVersion: string;
}

export default function SuperAdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("status");
  const [settings, setSettings] = useState<SuperAdminSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          // Mix with mock system global settings
          setSettings({
            ...data,
            maintenanceMode: false,
            allowNewRegistrations: true,
            emailVerificationRequired: true,
            defaultDiscoveryRange: 50,
            systemVersion: "2.4.12-rev002"
          });
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
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-indigo-600" />
            Configurações Globais do Sistema
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Painel de controle centralizado para parâmetros do EverNOW e preferências de SuperAdmin.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold border-neutral-200">
            <RefreshCw className="mr-2 w-4 h-4" /> Limpar Cache
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-gradient-brand text-white font-bold px-8 shadow-lg shadow-primary-500/20"
          >
            {saving ? <RefreshCw className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3"
        >
          <CheckCircle2 size={20} />
          <span className="font-bold">Configurações globais atualizadas com sucesso!</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <nav className="flex flex-col gap-1">
            <SettingsLink 
              icon={Server} 
              label="Status do Sistema" 
              active={activeSection === "status"} 
              onClick={() => setActiveSection("status")}
            />
            <SettingsLink 
              icon={Globe} 
              label="Discovery & Global" 
              active={activeSection === "discovery"} 
              onClick={() => setActiveSection("discovery")}
            />
            <SettingsLink 
              icon={Bell} 
              label="Notificações" 
              active={activeSection === "notifications"} 
              onClick={() => setActiveSection("notifications")}
            />
            <SettingsLink 
              icon={Shield} 
              label="Segurança & Auditoria" 
              active={activeSection === "security"} 
              onClick={() => setActiveSection("security")}
            />
            <SettingsLink 
              icon={Zap} 
              label="Performance" 
              active={activeSection === "performance"} 
              onClick={() => setActiveSection("performance")}
            />
          </nav>

          <Card className="mt-8 bg-neutral-900 text-white border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <HardDrive size={80} />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Versão Atual</p>
              <p className="text-xl font-black mb-4">{settings?.systemVersion}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                SISTEMA OPERACIONAL
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeSection === "status" && (
              <motion.div
                key="status"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-neutral-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Server size={20} className="text-red-600" />
                      Controle de Instância
                    </CardTitle>
                    <CardDescription>Gerencie o estado operacional da plataforma</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <ToggleRow 
                        label="Modo Manutenção" 
                        description="Bloqueia o acesso de usuários comuns. Apenas admins podem logar."
                        checked={settings?.maintenanceMode || false}
                        onChange={(v) => setSettings(s => s ? {...s, maintenanceMode: v} : null)}
                        variant="danger"
                      />
                      <ToggleRow 
                        label="Novos Registros" 
                        description="Permitir que novos usuários criem contas no sistema."
                        checked={settings?.allowNewRegistrations || false}
                        onChange={(v) => setSettings(s => s ? {...s, allowNewRegistrations: v} : null)}
                      />
                      <ToggleRow 
                        label="Exigir Verificação de E-mail" 
                        description="Usuários só podem usar o App após confirmar o e-mail."
                        checked={settings?.emailVerificationRequired || false}
                        onChange={(v) => setSettings(s => s ? {...s, emailVerificationRequired: v} : null)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === "discovery" && (
              <motion.div
                key="discovery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-neutral-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe size={20} className="text-indigo-600" />
                      Discovery & Localização
                    </CardTitle>
                    <CardDescription>Configurações padrão para o motor de descoberta</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-neutral-900">Raio de Descoberta Padrão</p>
                          <p className="text-xs text-muted-foreground">Distância inicial para novos usuários (em Km)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min="5" 
                            max="200" 
                            step="5"
                            className="w-32 accent-indigo-600"
                            value={settings?.defaultDiscoveryRange}
                            onChange={(e) => setSettings(s => s ? {...s, defaultDiscoveryRange: parseInt(e.target.value)} : null)}
                          />
                          <span className="text-sm font-black text-indigo-600 w-10 text-right">{settings?.defaultDiscoveryRange}Km</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

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
                      <Monitor size={20} className="text-primary-600" />
                      Preferências do SuperAdmin
                    </CardTitle>
                    <CardDescription>Suas configurações pessoais para este painel</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <ToggleRow 
                        label="Alertas de LGPD" 
                        checked={settings?.notificationsLGPD || false}
                        onChange={(v) => setSettings(s => s ? {...s, notificationsLGPD: v} : null)}
                      />
                      <ToggleRow 
                        label="Exibir Dados Sensíveis" 
                        checked={settings?.showSensitiveData || false}
                        onChange={(v) => setSettings(s => s ? {...s, showSensitiveData: v} : null)}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="font-bold text-neutral-900">Taxa de Atualização do Dashboard</p>
                      </div>
                      <select 
                        className="bg-muted px-3 py-1.5 rounded-lg text-sm font-bold border-none"
                        value={settings?.dashboardRefreshRate}
                        onChange={(e) => setSettings(s => s ? {...s, dashboardRefreshRate: parseInt(e.target.value)} : null)}
                      >
                        <option value={10}>10s</option>
                        <option value={30}>30s</option>
                        <option value={60}>1m</option>
                      </select>
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
                      Segurança do Núcleo
                    </CardTitle>
                    <CardDescription>Parâmetros críticos de proteção de dados</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground italic">Seção restrita a SuperAdmins de nível 1.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === "performance" && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-neutral-100 shadow-sm overflow-hidden">
                  <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap size={20} className="text-yellow-500" />
                      Otimização & Cache
                    </CardTitle>
                    <CardDescription>Gerenciamento de recursos de servidor</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                     <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold">
                       Reconstruir Índices de Busca
                     </Button>
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
        active ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "hover:bg-muted text-neutral-600"
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

function ToggleRow({ label, description, checked, onChange, variant = "default" }: { label: string, description?: string, checked: boolean, onChange: (v: boolean) => void, variant?: "default" | "danger" }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className={cn("font-bold text-sm leading-none", variant === "danger" ? "text-red-600" : "text-neutral-900")}>{label}</p>
        {description && <p className="text-xs text-muted-foreground leading-tight max-w-[300px]">{description}</p>}
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onChange} 
        className={cn(variant === "danger" && "data-[state=checked]:bg-red-600")}
      />
    </div>
  );
}
