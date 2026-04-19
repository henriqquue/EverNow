'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Copy,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { RadixTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import { StatsCard } from '@/components/ui/stats-card';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';
import { getCouponTypeDisplayName, getCouponStatusColor, generateCouponCode } from '@/lib/coupons';
import { formatCurrency, formatDate } from '@/lib/utils';

type Coupon = {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'EXTENDED_TRIAL' | 'FIRST_PAYMENT_FREE';
  discountPercent?: number;
  discountAmount?: number;
  trialDays?: number;
  applicablePlans: string[];
  applicableIntervals: string[];
  minAmount?: number;
  maxUses?: number;
  maxUsesPerUser: number;
  currentUses: number;
  startsAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  _count?: { redemptions: number };
};

type CouponMetrics = {
  summary: {
    totalRedemptions: number;
    completedRedemptions: number;
    conversionRate: number;
    totalDiscount: number;
    revenueGenerated: number;
    activeCoupons: number;
  };
  topCoupons: Array<{
    couponId: string;
    code: string;
    name: string;
    redemptions: number;
    totalDiscount: number;
    revenueGenerated: number;
  }>;
};

export default function CouponsManagementPage() {
  const [activeTab, setActiveTab] = useState('coupons');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [metrics, setMetrics] = useState<CouponMetrics | null>(null);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [metricsPeriod, setMetricsPeriod] = useState('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsRes, metricsRes, plansRes] = await Promise.all([
        fetch(`/api/superadmin/coupons?status=${statusFilter}`),
        fetch(`/api/superadmin/coupons/metrics?period=${metricsPeriod}`),
        fetch('/api/superadmin/plans'),
      ]);
      
      if (couponsRes.ok) setCoupons(await couponsRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.map((p: any) => ({ id: p.id, name: p.name, slug: p.slug })));
      }
    } catch (error) {
      console.error('Error fetching coupons data:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, metricsPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveCoupon = async (coupon: Partial<Coupon>) => {
    setSaving(true);
    try {
      const method = coupon.id ? 'PUT' : 'POST';
      const response = await fetch('/api/superadmin/coupons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coupon),
      });
      if (response.ok) {
        toast.success('Cupom salvo com sucesso');
        fetchData();
        setShowEditor(false);
        setEditingCoupon(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar cupom');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = (coupon: Coupon) => {
    setItemToDelete(coupon);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/superadmin/coupons?id=${itemToDelete.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Cupom excluído com sucesso');
        fetchData();
        setItemToDelete(null);
      } else {
        toast.error('Erro ao excluir cupom');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Erro de conexão');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await saveCoupon({ id: coupon.id, status: newStatus });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const filteredCoupons = coupons.filter(coupon => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return coupon.code.toLowerCase().includes(query) || coupon.name.toLowerCase().includes(query);
    }
    return true;
  });

  const getDiscountDisplay = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'PERCENTAGE': return `${coupon.discountPercent}% off`;
      case 'FIXED_AMOUNT': return formatCurrency(coupon.discountAmount || 0) + ' off';
      case 'EXTENDED_TRIAL': return `${coupon.trialDays} dias grátis`;
      case 'FIRST_PAYMENT_FREE': return '1º pagamento grátis';
      default: return '-';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loading size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-7 h-7" />
            Gestão de Cupons
          </h1>
          <p className="text-muted-foreground">Crie e gerencie cupons de desconto</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="coupons"><Ticket className="w-4 h-4 mr-2" /> Cupons</TabsTrigger>
          <TabsTrigger value="metrics"><BarChart3 className="w-4 h-4 mr-2" /> Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Input placeholder="Buscar cupom..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64" />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'ACTIVE', label: 'Ativos' },
                  { value: 'INACTIVE', label: 'Inativos' },
                  { value: 'EXPIRED', label: 'Expirados' },
                ]}
                className="w-40"
              />
            </div>
            <Button onClick={() => { setEditingCoupon(null); setShowEditor(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Novo Cupom
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoupons.map(coupon => (
              <Card key={coupon.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded font-mono font-bold">{coupon.code}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyCode(coupon.code)}><Copy className="w-3 h-3" /></Button>
                    </div>
                    <Badge className={getCouponStatusColor(coupon.status)}>{coupon.status}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{coupon.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span>{getCouponTypeDisplayName(coupon.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Desconto:</span>
                      <span className="font-semibold text-green-600">{getDiscountDisplay(coupon)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usos:</span>
                      <span>{coupon.currentUses}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</span>
                    </div>
                    {coupon.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expira:</span>
                        <span>{formatDate(coupon.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => toggleCouponStatus(coupon)}>
                      {coupon.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingCoupon(coupon); setShowEditor(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteCoupon(coupon)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCoupons.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cupom encontrado</p>
            </div>
          )}
        </TabsContent>

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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatsCard title="Cupons Ativos" value={metrics.summary.activeCoupons} icon={Ticket} />
                <StatsCard title="Resgates" value={metrics.summary.totalRedemptions} icon={Users} />
                <StatsCard title="Finalizados" value={metrics.summary.completedRedemptions} icon={Check} />
                <StatsCard title="Conversão" value={`${metrics.summary.conversionRate}%`} icon={TrendingUp} />
                <StatsCard title="Desconto Total" value={formatCurrency(metrics.summary.totalDiscount)} icon={DollarSign} />
                <StatsCard title="Receita Gerada" value={formatCurrency(metrics.summary.revenueGenerated)} icon={DollarSign} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cupons Mais Usados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topCoupons.map((coupon, index) => (
                      <div key={coupon.couponId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                          <div>
                            <code className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-sm">{coupon.code}</code>
                            <p className="text-sm text-muted-foreground">{coupon.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{coupon.redemptions} resgates</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(coupon.revenueGenerated)} receita</p>
                        </div>
                      </div>
                    ))}
                    {metrics.topCoupons.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Nenhum dado de cupons no período</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {showEditor && (
          <CouponEditorModal
            coupon={editingCoupon}
            plans={plans}
            onSave={saveCoupon}
            onClose={() => { setShowEditor(false); setEditingCoupon(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Cupom?"
        description={`Tem certeza que deseja excluir o cupom "${itemToDelete?.code}"?\nEsta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
      />
    </div>
  );
}

function CouponEditorModal({ coupon, plans, onSave, onClose, saving }: {
  coupon: Coupon | null;
  plans: Array<{ id: string; name: string; slug: string }>;
  onSave: (coupon: Partial<Coupon>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Coupon>>(coupon || {
    code: generateCouponCode(),
    name: '',
    description: '',
    type: 'PERCENTAGE',
    discountPercent: 10,
    applicablePlans: [],
    applicableIntervals: [],
    maxUsesPerUser: 1,
    status: 'ACTIVE',
  });

  const regenerateCode = () => {
    setFormData(prev => ({ ...prev, code: generateCouponCode() }));
  };

  const togglePlan = (planSlug: string) => {
    setFormData(prev => ({
      ...prev,
      applicablePlans: (prev.applicablePlans || []).includes(planSlug)
        ? (prev.applicablePlans || []).filter(s => s !== planSlug)
        : [...(prev.applicablePlans || []), planSlug],
    }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-background rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{coupon ? 'Editar Cupom' : 'Novo Cupom'}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <Label>Código</Label>
            <div className="flex gap-2">
              <Input value={formData.code || ''} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))} className="font-mono" />
              <Button variant="outline" onClick={regenerateCode}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>
          <div><Label>Nome</Label><Input value={formData.name || ''} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Promoção de Lançamento" /></div>
          <div>
            <Label>Tipo de Desconto</Label>
            <Select
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value as Coupon['type'] }))}
              options={[
                { value: 'PERCENTAGE', label: 'Percentual' },
                { value: 'FIXED_AMOUNT', label: 'Valor Fixo' },
                { value: 'EXTENDED_TRIAL', label: 'Trial Estendido' },
                { value: 'FIRST_PAYMENT_FREE', label: '1º Pagamento Grátis' },
              ]}
            />
          </div>
          {formData.type === 'PERCENTAGE' && (
            <div><Label>Percentual (%)</Label><Input type="number" min={1} max={100} value={formData.discountPercent || ''} onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseInt(e.target.value) }))} /></div>
          )}
          {formData.type === 'FIXED_AMOUNT' && (
            <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={formData.discountAmount || ''} onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) }))} /></div>
          )}
          {formData.type === 'EXTENDED_TRIAL' && (
            <div><Label>Dias de Trial</Label><Input type="number" min={1} value={formData.trialDays || ''} onChange={(e) => setFormData(prev => ({ ...prev, trialDays: parseInt(e.target.value) }))} /></div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Máximo de Usos</Label><Input type="number" value={formData.maxUses || ''} onChange={(e) => setFormData(prev => ({ ...prev, maxUses: parseInt(e.target.value) || undefined }))} placeholder="Ilimitado" /></div>
            <div><Label>Máx por Usuário</Label><Input type="number" min={1} value={formData.maxUsesPerUser || 1} onChange={(e) => setFormData(prev => ({ ...prev, maxUsesPerUser: parseInt(e.target.value) }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Início</Label><Input type="date" value={formData.startsAt ? formData.startsAt.split('T')[0] : ''} onChange={(e) => setFormData(prev => ({ ...prev, startsAt: e.target.value }))} /></div>
            <div><Label>Expiração</Label><Input type="date" value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''} onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value || undefined }))} /></div>
          </div>
          <div>
            <Label className="mb-2 block">Planos Aplicáveis (vazio = todos)</Label>
            <div className="flex flex-wrap gap-2">
              {plans.map(plan => (
                <Badge key={plan.id} variant={(formData.applicablePlans || []).includes(plan.slug) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => togglePlan(plan.slug)}>
                  {(formData.applicablePlans || []).includes(plan.slug) && <Check className="w-3 h-3 mr-1" />}{plan.name}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value as Coupon['status'] }))}
              options={[
                { value: 'ACTIVE', label: 'Ativo' },
                { value: 'INACTIVE', label: 'Inativo' },
              ]}
            />
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
