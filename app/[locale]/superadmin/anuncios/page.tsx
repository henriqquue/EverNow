'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Grid3x3,
  Settings,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  Play,
  Pause,
  Globe,
  MousePointer,
  DollarSign,
  TrendingUp,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { RadixTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import { StatsCard } from '@/components/ui/stats-card';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';
import { getAdTypeDisplayName, getZoneTypeDisplayName } from '@/lib/ads';
import { formatCurrency } from '@/lib/utils';

type AdZone = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  isActive: boolean;
  priority: number;
  width?: number;
  height?: number;
  adsenseSlot?: string;
  totalImpressions: number;
  totalClicks: number;
};

type AdCampaign = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  adType: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText: string;
  ctaUrl: string;
  backgroundColor?: string;
  textColor?: string;
  targetPlanSlugs: string[];
  startsAt?: string;
  endsAt?: string;
  status: string;
  priority: number;
  maxImpressions?: number;
  maxPerUser: number;
  maxPerDay?: number;
  impressions: number;
  clicks: number;
  conversions: number;
  zones: Array<{ zone: AdZone }>;
};

type GlobalSettings = {
  id: string;
  adsenseEnabled: boolean;
  adsensePublisherId?: string;
  maxConsecutiveAds: number;
  cooldownAfterAction: number;
  blockedPages: string[];
  estimatedCpm: number;
};

type PlanSettings = {
  id?: string;
  planId: string;
  adsEnabled: boolean;
  adsFrequency: number;
  adsPerSession: number;
  adsPerDay: number;
  minTimeBetween: number;
  allowedZones: string[];
};

type AdMetrics = {
  summary: {
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    estimatedRevenue: number;
  };
  zoneMetrics: Array<{
    zoneId: string;
    zoneName: string;
    zoneSlug: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  topCampaigns: Array<{
    id: string;
    name: string;
    impressions: number;
    clicks: number;
    ctr: number;
    status: string;
  }>;
};

export default function AdsManagementPage() {
  const [activeTab, setActiveTab] = useState('zones');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [zones, setZones] = useState<AdZone[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [planSettings, setPlanSettings] = useState<PlanSettings[]>([]);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [metrics, setMetrics] = useState<AdMetrics | null>(null);
  
  const [editingZone, setEditingZone] = useState<AdZone | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [showZoneEditor, setShowZoneEditor] = useState(false);
  const [showCampaignEditor, setShowCampaignEditor] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState<{ type: 'zone' | 'campaign', id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [metricsPeriod, setMetricsPeriod] = useState('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [zonesRes, campaignsRes, settingsRes, metricsRes] = await Promise.all([
        fetch('/api/superadmin/ads/zones'),
        fetch('/api/superadmin/ads/campaigns'),
        fetch('/api/superadmin/ads/settings'),
        fetch(`/api/superadmin/ads/metrics?period=${metricsPeriod}`),
      ]);
      
      if (zonesRes.ok) setZones(await zonesRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setGlobalSettings(data.globalSettings);
        setPlanSettings(data.planSettings);
        setPlans(data.plans);
      }
      if (metricsRes.ok) setMetrics(await metricsRes.json());
    } catch (error) {
      console.error('Error fetching ads data:', error);
    } finally {
      setLoading(false);
    }
  }, [metricsPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveZone = async (zone: Partial<AdZone>) => {
    setSaving(true);
    try {
      const method = zone.id ? 'PUT' : 'POST';
      const response = await fetch('/api/superadmin/ads/zones', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zone),
      });
      if (response.ok) {
        fetchData();
        setShowZoneEditor(false);
        setEditingZone(null);
      }
    } catch (error) {
      console.error('Error saving zone:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteZone = (zone: AdZone) => {
    setItemToDelete({ type: 'zone', id: zone.id, name: zone.name });
  };

  const saveCampaign = async (campaign: Partial<AdCampaign> & { zoneIds?: string[] }) => {
    setSaving(true);
    try {
      const method = campaign.id ? 'PUT' : 'POST';
      const response = await fetch('/api/superadmin/ads/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });
      if (response.ok) {
        fetchData();
        setShowCampaignEditor(false);
        setEditingCampaign(null);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCampaign = (campaign: AdCampaign) => {
    setItemToDelete({ type: 'campaign', id: campaign.id, name: campaign.name });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const endpoint = itemToDelete.type === 'zone' ? 'zones' : 'campaigns';
      const response = await fetch(`/api/superadmin/ads/${endpoint}?id=${itemToDelete.id}`, { method: 'DELETE' });
      
      if (response.ok) {
        toast.success(`${itemToDelete.type === 'zone' ? 'Zona' : 'Campanha'} excluída com sucesso`);
        fetchData();
        setItemToDelete(null);
      } else {
        toast.error('Erro ao excluir item');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro de conexão ao excluir');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCampaignStatus = async (campaign: AdCampaign) => {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await saveCampaign({ id: campaign.id, status: newStatus });
  };

  const saveGlobalSettings = async () => {
    if (!globalSettings) return;
    setSaving(true);
    try {
      await fetch('/api/superadmin/ads/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const savePlanAdSettings = async (settings: PlanSettings) => {
    setSaving(true);
    try {
      await fetch('/api/superadmin/ads/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      fetchData();
    } catch (error) {
      console.error('Error saving plan settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      ENDED: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-7 h-7" />
            Gerenciamento de Anúncios
          </h1>
          <p className="text-muted-foreground">Configure zonas, campanhas e métricas de anúncios</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="zones"><Grid3x3 className="w-4 h-4 mr-2" /> Zonas</TabsTrigger>
          <TabsTrigger value="campaigns"><Megaphone className="w-4 h-4 mr-2" /> Campanhas</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" /> Configurações</TabsTrigger>
          <TabsTrigger value="metrics"><BarChart3 className="w-4 h-4 mr-2" /> Métricas</TabsTrigger>
        </TabsList>

        {/* ZONAS TAB */}
        <TabsContent value="zones" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingZone(null); setShowZoneEditor(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Zona
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map(zone => (
              <Card key={zone.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                      {zone.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{zone.slug}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {zone.description || getZoneTypeDisplayName(zone.type as any)}
                  </p>
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{zone.totalImpressions.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MousePointer className="w-4 h-4" />
                      <span>{zone.totalClicks.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingZone(zone); setShowZoneEditor(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteZone(zone)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CAMPANHAS TAB */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingCampaign(null); setShowCampaignEditor(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Nova Campanha
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map(campaign => (
              <Card key={campaign.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{campaign.title}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <Badge variant="outline">{getAdTypeDisplayName(campaign.adType as any)}</Badge>
                    <span>{campaign.impressions.toLocaleString()} imp.</span>
                    <span>{campaign.clicks} cliques</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleCampaignStatus(campaign)}>
                      {campaign.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingCampaign(campaign); setShowCampaignEditor(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteCampaign(campaign)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CONFIGURAÇÕES TAB */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" /> Google AdSense
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ativar AdSense</Label>
                  <p className="text-sm text-muted-foreground">Exibir anúncios do Google AdSense</p>
                </div>
                <Switch
                  checked={globalSettings?.adsenseEnabled || false}
                  onCheckedChange={(checked) => setGlobalSettings(prev => prev ? { ...prev, adsenseEnabled: checked } : null)}
                />
              </div>
              <div>
                <Label>Publisher ID</Label>
                <Input
                  placeholder="ca-pub-XXXXXXXXXXXXX"
                  value={globalSettings?.adsensePublisherId || ''}
                  onChange={(e) => setGlobalSettings(prev => prev ? { ...prev, adsensePublisherId: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>CPM Estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={globalSettings?.estimatedCpm || 1}
                  onChange={(e) => setGlobalSettings(prev => prev ? { ...prev, estimatedCpm: parseFloat(e.target.value) } : null)}
                />
              </div>
              <Button onClick={saveGlobalSettings} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {plans.map(plan => {
                  const settings = planSettings.find(s => s.planId === plan.id) || {
                    planId: plan.id,
                    adsEnabled: plan.slug === 'gratuito',
                    adsFrequency: 5,
                    adsPerSession: 10,
                    adsPerDay: 50,
                    minTimeBetween: 30,
                    allowedZones: [],
                  };

                  return (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">{plan.name}</h4>
                        <Switch
                          checked={settings.adsEnabled}
                          onCheckedChange={(checked) => {
                            savePlanAdSettings({ ...settings, adsEnabled: checked });
                          }}
                        />
                      </div>
                      {settings.adsEnabled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Frequência (a cada X itens)</Label>
                            <Input
                              type="number"
                              value={settings.adsFrequency}
                              onChange={(e) => savePlanAdSettings({ ...settings, adsFrequency: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label>Máx por sessão</Label>
                            <Input
                              type="number"
                              value={settings.adsPerSession}
                              onChange={(e) => savePlanAdSettings({ ...settings, adsPerSession: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MÉTRICAS TAB */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="flex justify-end">
            <Select
              value={metricsPeriod}
              onChange={setMetricsPeriod}
              options={[
                { value: '7d', label: 'Últimos 7 dias' },
                { value: '30d', label: 'Últimos 30 dias' },
                { value: '90d', label: 'Últimos 90 dias' },
              ]}
              className="w-40"
            />
          </div>

          {metrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard title="Impressões" value={metrics.summary.totalImpressions.toLocaleString()} icon={Eye} />
                <StatsCard title="Cliques" value={metrics.summary.totalClicks.toLocaleString()} icon={MousePointer} />
                <StatsCard title="CTR" value={`${metrics.summary.ctr}%`} icon={TrendingUp} />
                <StatsCard title="Receita Estimada" value={formatCurrency(metrics.summary.estimatedRevenue)} icon={DollarSign} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Desempenho por Zona</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.zoneMetrics.map(zone => (
                        <div key={zone.zoneId} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{zone.zoneName}</p>
                            <p className="text-sm text-muted-foreground">{zone.impressions.toLocaleString()} impressões</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{zone.ctr}% CTR</p>
                            <p className="text-sm text-muted-foreground">{zone.clicks} cliques</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Campanhas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.topCampaigns.map(campaign => (
                        <div key={campaign.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <Badge variant="outline" className="text-xs">{campaign.status}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{campaign.ctr}% CTR</p>
                            <p className="text-sm text-muted-foreground">{campaign.impressions.toLocaleString()} imp.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Zone Editor Modal */}
      <AnimatePresence>
        {showZoneEditor && (
          <ZoneEditorModal
            zone={editingZone}
            onSave={saveZone}
            onClose={() => { setShowZoneEditor(false); setEditingZone(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Campaign Editor Modal */}
      <AnimatePresence>
        {showCampaignEditor && (
          <CampaignEditorModal
            campaign={editingCampaign}
            zones={zones}
            plans={plans}
            onSave={saveCampaign}
            onClose={() => { setShowCampaignEditor(false); setEditingCampaign(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={itemToDelete?.type === 'zone' ? 'Excluir Zona?' : 'Excluir Campanha?'}
        description={`Tem certeza que deseja excluir "${itemToDelete?.name}"?\nEsta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
      />
    </div>
  );
}

function ZoneEditorModal({ zone, onSave, onClose, saving }: {
  zone: AdZone | null;
  onSave: (zone: Partial<AdZone>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<AdZone>>(zone || {
    name: '', slug: '', type: 'DISCOVERY_FEED', description: '', isActive: true, priority: 0, width: 320, height: 250, adsenseSlot: '',
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{zone ? 'Editar Zona' : 'Nova Zona'}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={formData.name || ''} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, slug: prev.slug || generateSlug(e.target.value) }))} placeholder="Feed de Descoberta" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={formData.slug || ''} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="discovery_feed" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={formData.type} onChange={(value) => setFormData(prev => ({ ...prev, type: value }))} options={[
              { value: 'DISCOVERY_FEED', label: 'Feed de Descoberta' },
              { value: 'MATCHES_LIST', label: 'Lista de Matches' },
              { value: 'BETWEEN_PROFILES', label: 'Entre Perfis' },
              { value: 'EMPTY_RESULTS', label: 'Resultados Vazios' },
              { value: 'LANDING_PAGE', label: 'Landing Page' },
              { value: 'CHAT_LIST', label: 'Lista de Conversas' },
              { value: 'SIDEBAR', label: 'Barra Lateral' },
            ]} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Largura (px)</Label><Input type="number" value={formData.width || ''} onChange={(e) => setFormData(prev => ({ ...prev, width: parseInt(e.target.value) }))} /></div>
            <div><Label>Altura (px)</Label><Input type="number" value={formData.height || ''} onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) }))} /></div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Ativa</Label>
            <Switch checked={formData.isActive ?? true} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))} />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(formData)} disabled={saving}>{saving ? <Loading size="sm" /> : <Save className="w-4 h-4 mr-2" />}Salvar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CampaignEditorModal({ campaign, zones, plans, onSave, onClose, saving }: {
  campaign: AdCampaign | null;
  zones: AdZone[];
  plans: Array<{ id: string; name: string; slug: string }>;
  onSave: (campaign: Partial<AdCampaign> & { zoneIds?: string[] }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<AdCampaign> & { zoneIds: string[] }>(campaign ? {
    ...campaign, zoneIds: campaign.zones?.map(z => z.zone.id) || [],
  } : {
    name: '', slug: '', adType: 'INTERNAL_BANNER', title: '', subtitle: '', imageUrl: '', ctaText: 'Saiba mais', ctaUrl: '/app/planos',
    backgroundColor: '#f5f5f5', textColor: '#333333', targetPlanSlugs: ['gratuito'], status: 'DRAFT', priority: 0, maxPerUser: 5, zoneIds: [],
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const toggleZone = (zoneId: string) => {
    setFormData(prev => ({ ...prev, zoneIds: prev.zoneIds.includes(zoneId) ? prev.zoneIds.filter(id => id !== zoneId) : [...prev.zoneIds, zoneId] }));
  };

  const togglePlan = (planSlug: string) => {
    setFormData(prev => ({ ...prev, targetPlanSlugs: (prev.targetPlanSlugs || []).includes(planSlug) ? (prev.targetPlanSlugs || []).filter(s => s !== planSlug) : [...(prev.targetPlanSlugs || []), planSlug] }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{campaign ? 'Editar Campanha' : 'Nova Campanha'}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Nome</Label><Input value={formData.name || ''} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, slug: prev.slug || generateSlug(e.target.value) }))} placeholder="Campanha Premium" /></div>
            <div><Label>Slug</Label><Input value={formData.slug || ''} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} /></div>
          </div>
          <div><Label>Título</Label><Input value={formData.title || ''} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="Seja Premium hoje!" /></div>
          <div><Label>Subtítulo</Label><Input value={formData.subtitle || ''} onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Texto CTA</Label><Input value={formData.ctaText || ''} onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))} /></div>
            <div><Label>URL CTA</Label><Input value={formData.ctaUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, ctaUrl: e.target.value }))} /></div>
          </div>
          <div><Label>URL da Imagem</Label><Input value={formData.imageUrl || ''} onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))} /></div>
          <div><Label>Tipo</Label><Select value={formData.adType} onChange={(value) => setFormData(prev => ({ ...prev, adType: value }))} options={[
            { value: 'INTERNAL_BANNER', label: 'Banner' },
            { value: 'INTERNAL_CARD', label: 'Card Nativo' },
            { value: 'INTERNAL_INTERSTITIAL', label: 'Intersticial' },
          ]} /></div>
          <div><Label>Status</Label><Select value={formData.status} onChange={(value) => setFormData(prev => ({ ...prev, status: value }))} options={[
            { value: 'DRAFT', label: 'Rascunho' },
            { value: 'ACTIVE', label: 'Ativa' },
            { value: 'PAUSED', label: 'Pausada' },
          ]} /></div>
          <div>
            <Label className="mb-2 block">Zonas</Label>
            <div className="flex flex-wrap gap-2">
              {zones.map(zone => (
                <Badge key={zone.id} variant={formData.zoneIds.includes(zone.id) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleZone(zone.id)}>
                  {formData.zoneIds.includes(zone.id) && <Check className="w-3 h-3 mr-1" />}{zone.name}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Planos Alvo</Label>
            <div className="flex flex-wrap gap-2">
              {plans.map(plan => (
                <Badge key={plan.id} variant={(formData.targetPlanSlugs || []).includes(plan.slug) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => togglePlan(plan.slug)}>
                  {(formData.targetPlanSlugs || []).includes(plan.slug) && <Check className="w-3 h-3 mr-1" />}{plan.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(formData)} disabled={saving}>{saving ? <Loading size="sm" /> : <Save className="w-4 h-4 mr-2" />}Salvar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
