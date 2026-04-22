'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Bell,
  Lock,
  Eye,
  LogOut,
  Mail,
  Shield,
  ToggleLeft,
  ToggleRight,
  Save,
  AlertCircle,
  CheckCircle,
  Database,
} from 'lucide-react';

interface AdminSettings {
  id: string;
  email: string;
  name: string;
  role: string;
  notificationsEmail: boolean;
  notificationsLGPD: boolean;
  notificationsReports: boolean;
  notificationsVerifications: boolean;
  auditLogRetention: number; // days
  enableMFAReminder: boolean;
  showSensitiveData: boolean;
  dashboardRefreshRate: number; // seconds
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [changes, setChanges] = useState<Partial<AdminSettings>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      router.push('/app');
      return;
    }

    // Simular busca de settings (você pode criar uma API real)
    fetchSettings();
  }, [session, router]);

  const fetchSettings = async () => {
    try {
      // TODO: Implementar endpoint /api/admin/settings
      const mockSettings: AdminSettings = {
        id: session?.user?.id || '',
        email: session?.user?.email || '',
        name: session?.user?.name || '',
        role: session?.user?.role || 'ADMIN',
        notificationsEmail: true,
        notificationsLGPD: true,
        notificationsReports: true,
        notificationsVerifications: true,
        auditLogRetention: 90,
        enableMFAReminder: true,
        showSensitiveData: false,
        dashboardRefreshRate: 30,
      };
      setSettings(mockSettings);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof AdminSettings) => {
    if (settings) {
      const newValue = !(settings[key] as any);
      setChanges({ ...changes, [key]: newValue });
      setSettings({ ...settings, [key]: newValue as any });
    }
  };

  const handleNumberChange = (key: keyof AdminSettings, value: number) => {
    setChanges({ ...changes, [key]: value });
    setSettings({ ...settings, [key]: value as any });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Implementar PUT /api/admin/settings
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simular requisição

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setChanges({});

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = session?.user?.role === 'SUPERADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin">
          <Settings className="text-blue-400" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="text-blue-400" size={32} />
            Configurações de Admin
          </h1>
          <p className="text-slate-400">
            Gerencie suas preferências de administrador e configurações de segurança
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-900/30 border border-green-800 text-green-300'
                : 'bg-red-900/30 border border-red-800 text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Usuário Logado</p>
              <p className="text-2xl font-bold text-white">{settings?.name}</p>
              <p className="text-slate-400 text-sm mt-1">{settings?.email}</p>
              <div className="mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isSuperAdmin
                    ? 'bg-purple-900/50 text-purple-300 border border-purple-800'
                    : 'bg-blue-900/50 text-blue-300 border border-blue-800'
                }`}>
                  {isSuperAdmin ? '👑 Super Admin' : '🔧 Admin'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <Shield className="text-green-400 mb-2" size={40} />
              <p className="text-xs text-slate-400">Conta Segura ✓</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="notifications" className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden">
          <TabsList className="w-full justify-start bg-slate-800 border-b border-slate-600 rounded-none flex-wrap">
            <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 rounded-none">
              <Bell size={18} className="mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 rounded-none">
              <Lock size={18} className="mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-blue-600 rounded-none">
              <Eye size={18} className="mr-2" />
              Auditoria
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 rounded-none">
                <Database size={18} className="mr-2" />
                Sistema
              </TabsTrigger>
            )}
          </TabsList>

          <div className="p-6">
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex gap-3 mb-6">
                <Bell className="text-blue-400 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-blue-300">Notificações de Admin</p>
                  <p className="text-sm text-blue-200">
                    Configure como você quer ser notificado sobre eventos importantes do sistema
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white flex items-center gap-2">
                        <Mail size={18} />
                        Notificações por Email
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Receber alertas por email sobre atividades importantes
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('notificationsEmail')}
                      className="focus:outline-none"
                    >
                      {settings?.notificationsEmail ? (
                        <ToggleRight className="text-green-400" size={32} />
                      ) : (
                        <ToggleLeft className="text-slate-500" size={32} />
                      )}
                    </button>
                  </div>
                </div>

                {/* LGPD Notifications */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white flex items-center gap-2">
                        <Shield size={18} />
                        Requisições LGPD
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Ser notificado quando houver novas requisições LGPD pendentes
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('notificationsLGPD')}
                      className="focus:outline-none"
                    >
                      {settings?.notificationsLGPD ? (
                        <ToggleRight className="text-green-400" size={32} />
                      ) : (
                        <ToggleLeft className="text-slate-500" size={32} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Reports Notifications */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white flex items-center gap-2">
                        <AlertCircle size={18} />
                        Relatórios de Usuários
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Ser notificado quando houver novos relatórios de abuso
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('notificationsReports')}
                      className="focus:outline-none"
                    >
                      {settings?.notificationsReports ? (
                        <ToggleRight className="text-green-400" size={32} />
                      ) : (
                        <ToggleLeft className="text-slate-500" size={32} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Verification Notifications */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white flex items-center gap-2">
                        ✓ Verificações de Identidade
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Ser notificado sobre novas verificações de identidade pendentes
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('notificationsVerifications')}
                      className="focus:outline-none"
                    >
                      {settings?.notificationsVerifications ? (
                        <ToggleRight className="text-green-400" size={32} />
                      ) : (
                        <ToggleLeft className="text-slate-500" size={32} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4 flex gap-3 mb-6">
                <Lock className="text-purple-400 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-purple-300">Configurações de Segurança</p>
                  <p className="text-sm text-purple-200">
                    Proteja sua conta de admin com opções de segurança avançadas
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* MFA Reminder */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">Lembrete de 2FA</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Receber lembretes para ativar autenticação de dois fatores
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('enableMFAReminder')}
                      className="focus:outline-none"
                    >
                      {settings?.enableMFAReminder ? (
                        <ToggleRight className="text-green-400" size={32} />
                      ) : (
                        <ToggleLeft className="text-slate-500" size={32} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sensitive Data */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white flex items-center gap-2">
                        <Eye size={18} />
                        Ver Dados Sensíveis
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Permitir visualização de dados sensíveis (documentos, IPs, etc)
                      </p>
                      <p className="text-xs text-red-400 mt-2">
                        ⚠️ Use com cuidado - todos acessos são registrados
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('showSensitiveData')}
                      className="focus:outline-none"
                    >
                      {settings?.showSensitiveData ? (
                        <ToggleRight className="text-red-400" size={32} />
                      ) : (
                        <ToggleLeft className="text-slate-500" size={32} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Change */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">Alterar Senha</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Mude sua senha para manter sua conta segura
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-300"
                    >
                      Alterar
                    </Button>
                  </div>
                </div>

                {/* Logout All Sessions */}
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-red-300">Encerrar Todas as Sessões</p>
                      <p className="text-sm text-red-200 mt-1">
                        Desconectar de todos os dispositivos (exceto este)
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Desconectar
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit" className="space-y-4">
              <div className="bg-cyan-900/20 border border-cyan-800 rounded-lg p-4 flex gap-3 mb-6">
                <Eye className="text-cyan-400 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-cyan-300">Configurações de Auditoria</p>
                  <p className="text-sm text-cyan-200">
                    Configure como os logs de auditoria são armazenados e gerenciados
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Log Retention */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <p className="font-semibold text-white mb-4">⏱️ Retenção de Logs de Auditoria</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="30"
                      max="365"
                      value={settings?.auditLogRetention || 90}
                      onChange={(e) => handleNumberChange('auditLogRetention', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-right">
                      <p className="font-bold text-blue-400 text-xl">{settings?.auditLogRetention}</p>
                      <p className="text-xs text-slate-400">dias</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    Os logs mais antigos serão arquivados automaticamente
                  </p>
                </div>

                {/* Dashboard Refresh */}
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                  <p className="font-semibold text-white mb-4">🔄 Taxa de Atualização do Dashboard</p>
                  <div className="flex items-center gap-4">
                    <select
                      value={settings?.dashboardRefreshRate || 30}
                      onChange={(e) => handleNumberChange('dashboardRefreshRate', parseInt(e.target.value))}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    >
                      <option value="10">10 segundos (Mais atualizado)</option>
                      <option value="30">30 segundos</option>
                      <option value="60">1 minuto</option>
                      <option value="300">5 minutos (Mais econômico)</option>
                    </select>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    Com que frequência o dashboard deve atualizar os dados
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* System Tab (SuperAdmin Only) */}
            {isSuperAdmin && (
              <TabsContent value="system" className="space-y-4">
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 flex gap-3 mb-6">
                  <Database className="text-yellow-400 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-yellow-300">Configurações de Sistema</p>
                    <p className="text-sm text-yellow-200">
                      Apenas Super Admins podem acessar essas configurações
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                    <p className="font-semibold text-white mb-3">🔧 Manutenção do Sistema</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Button variant="outline" className="text-slate-300 justify-center">
                        <Database size={18} className="mr-2" />
                        Limpar Cache
                      </Button>
                      <Button variant="outline" className="text-slate-300 justify-center">
                        📊 Recompilhar Índices
                      </Button>
                      <Button variant="outline" className="text-slate-300 justify-center">
                        🔐 Exportar Backup
                      </Button>
                      <Button variant="outline" className="text-slate-300 justify-center">
                        🗑️ Limpar Logs Antigos
                      </Button>
                    </div>
                  </div>

                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <p className="font-semibold text-red-300 mb-2">⚠️ Ações Perigosas</p>
                    <p className="text-sm text-red-200 mb-4">
                      Essas ações podem afetar a integridade do sistema
                    </p>
                    <Button variant="destructive" disabled className="w-full">
                      🚨 Modo Manutenção (Desativar)
                    </Button>
                  </div>
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Save Button */}
        {Object.keys(changes).length > 0 && (
          <div className="mt-8 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setChanges({});
                fetchSettings();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin mr-2">
                    <Save size={16} />
                  </div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
