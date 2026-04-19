"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Plus,
  Edit,
  Trash2,
  Crown,
  Check,
  Star,
  Users,
  Copy,
  X,
  Save,
  Settings,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface PlanInterval {
  id?: string;
  interval: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  isActive: boolean;
  isDefault?: boolean;
  bestOffer?: boolean;
  billingLabel?: string;
}

interface FeatureLimit {
  id?: string;
  featureId: string;
  feature: {
    id: string;
    name: string;
    slug: string;
    type: string;
    module: { name: string };
  };
  limitValue: number;
  unlimited: boolean;
  enabled: boolean;
  isVisibleLocked: boolean;
  blockMessage?: string;
  ctaText?: string;
  upgradeUrl?: string;
  limitMode?: string;
  warningThreshold?: number | null;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  discountPrice?: number;
  badge?: string;
  highlightColor?: string;
  status: string;
  order: number;
  popular: boolean;
  isHighlighted: boolean;
  showOnLanding: boolean;
  showInComparison: boolean;
  hasTrial: boolean;
  trialDays?: number;
  internalNotes?: string;
  planIntervals: PlanInterval[];
  featureLimits: FeatureLimit[];
  _count?: { users: number; subscriptions: number };
}

interface Module {
  id: string;
  name: string;
  slug: string;
  features: { id: string; name: string; slug: string; type: string }[];
}

const INTERVAL_LABELS: Record<string, string> = {
  DAILY: "Diário",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  YEARLY: "Anual"
};

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planToArchive, setPlanToArchive] = useState<Plan | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    shortDescription: "",
    longDescription: "",
    price: 0,
    discountPrice: undefined as number | undefined,
    badge: "",
    highlightColor: "#6366f1",
    order: 0,
    popular: false,
    isHighlighted: false,
    showOnLanding: true,
    showInComparison: true,
    hasTrial: false,
    trialDays: 7,
    internalNotes: "",
    intervals: [
      { interval: "DAILY", price: 0, discountPrice: undefined, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
      { interval: "WEEKLY", price: 0, discountPrice: undefined, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
      { interval: "BIWEEKLY", price: 0, discountPrice: undefined, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
      { interval: "MONTHLY", price: 0, discountPrice: undefined, isActive: true, isDefault: true, bestOffer: false, billingLabel: "" },
      { interval: "QUARTERLY", price: 0, discountPrice: undefined, discountPercent: 10, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
      { interval: "SEMIANNUAL", price: 0, discountPrice: undefined, discountPercent: 15, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
      { interval: "YEARLY", price: 0, discountPrice: undefined, discountPercent: 20, isActive: true, isDefault: false, bestOffer: true, billingLabel: "" }
    ] as PlanInterval[],
    features: [] as { featureId: string; limitValue: number; unlimited: boolean; enabled: boolean; isVisibleLocked: boolean; limitMode: string; warningThreshold: number | null; blockMessage: string; ctaText: string; upgradeUrl: string }[]
  });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/plans?includeStats=true");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/modules");
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchModules();
  }, [fetchPlans, fetchModules]);

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      shortDescription: "",
      longDescription: "",
      price: 0,
      discountPrice: undefined,
      badge: "",
      highlightColor: "#6366f1",
      order: plans.length,
      popular: false,
      isHighlighted: false,
      showOnLanding: true,
      showInComparison: true,
      hasTrial: false,
      trialDays: 7,
      internalNotes: "",
      intervals: [
        { interval: "DAILY", price: 0, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
        { interval: "WEEKLY", price: 0, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
        { interval: "BIWEEKLY", price: 0, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
        { interval: "MONTHLY", price: 0, isActive: true, isDefault: true, bestOffer: false, billingLabel: "" },
        { interval: "QUARTERLY", price: 0, discountPercent: 10, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
        { interval: "SEMIANNUAL", price: 0, discountPercent: 15, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
        { interval: "YEARLY", price: 0, discountPercent: 20, isActive: true, isDefault: false, bestOffer: true, billingLabel: "" }
      ],
      features: []
    });
    setEditingPlan(null);
    setError(null);
  };

  const openEditor = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        slug: plan.slug,
        shortDescription: plan.shortDescription || "",
        longDescription: plan.longDescription || "",
        price: plan.price,
        discountPrice: plan.discountPrice,
        badge: plan.badge || "",
        highlightColor: plan.highlightColor || "#6366f1",
        order: plan.order,
        popular: plan.popular,
        isHighlighted: plan.isHighlighted,
        showOnLanding: plan.showOnLanding,
        showInComparison: plan.showInComparison,
        hasTrial: plan.hasTrial,
        trialDays: plan.trialDays || 7,
        internalNotes: plan.internalNotes || "",
        intervals: plan.planIntervals.length > 0 
          ? [
              "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "YEARLY"
            ].map(intervalType => {
              const existing = plan.planIntervals.find(i => i.interval === intervalType);
              return existing ? {
                interval: existing.interval,
                price: existing.price,
                discountPrice: existing.discountPrice,
                discountPercent: existing.discountPercent,
                isActive: existing.isActive,
                isDefault: (existing as PlanInterval).isDefault || false,
                bestOffer: (existing as PlanInterval).bestOffer || false,
                billingLabel: (existing as PlanInterval).billingLabel || "",
              } : {
                interval: intervalType,
                price: intervalType === "MONTHLY" ? plan.price : plan.price * (
                  intervalType === "DAILY" ? 0.1 :
                  intervalType === "WEEKLY" ? 0.3 :
                  intervalType === "BIWEEKLY" ? 0.5 :
                  intervalType === "QUARTERLY" ? 2.5 :
                  intervalType === "SEMIANNUAL" ? 5 :
                  10
                ),
                discountPercent: ["QUARTERLY", "SEMIANNUAL", "YEARLY"].includes(intervalType) 
                  ? (intervalType === "QUARTERLY" ? 10 : intervalType === "SEMIANNUAL" ? 15 : 20)
                  : undefined,
                isActive: false,
                isDefault: false,
                bestOffer: false,
                billingLabel: "",
              };
            })
          : [
              { interval: "DAILY", price: 0, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
              { interval: "WEEKLY", price: 0, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
              { interval: "BIWEEKLY", price: 0, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
              { interval: "MONTHLY", price: plan.price, isActive: true, isDefault: true, bestOffer: false, billingLabel: "" },
              { interval: "QUARTERLY", price: plan.price * 2.5, discountPercent: 10, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
              { interval: "SEMIANNUAL", price: plan.price * 5, discountPercent: 15, isActive: false, isDefault: false, bestOffer: false, billingLabel: "" },
              { interval: "YEARLY", price: plan.price * 10, discountPercent: 20, isActive: true, isDefault: false, bestOffer: true, billingLabel: "" }
            ],
        features: plan.featureLimits.map(fl => ({
          featureId: fl.featureId,
          limitValue: fl.limitValue,
          unlimited: fl.unlimited,
          enabled: fl.enabled,
          isVisibleLocked: fl.isVisibleLocked,
          limitMode: fl.limitMode || "HARD",
          warningThreshold: fl.warningThreshold ?? null,
          blockMessage: fl.blockMessage || "",
          ctaText: fl.ctaText || "",
          upgradeUrl: fl.upgradeUrl || "",
        }))
      });
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const url = editingPlan 
        ? `/api/superadmin/plans/${editingPlan.id}` 
        : "/api/superadmin/plans";
      
      const method = editingPlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar plano");
      }

      // Update intervals separately if editing
      if (editingPlan) {
        await fetch(`/api/superadmin/plans/${editingPlan.id}/intervals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intervals: formData.intervals })
        });

        if (formData.features.length > 0) {
          await fetch(`/api/superadmin/plans/${editingPlan.id}/features`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ features: formData.features })
          });
        }
      }

      await fetchPlans();
      setShowEditor(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/superadmin/plans/${plan.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (res.ok) {
        await fetchPlans();
      }
    } catch (err) {
      console.error("Error duplicating plan:", err);
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    try {
      const newStatus = plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await fetch(`/api/superadmin/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchPlans();
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleDelete = (plan: Plan) => {
    setPlanToArchive(plan);
  };

  const confirmArchive = async () => {
    if (!planToArchive) return;
    
    setArchiving(true);
    try {
      const res = await fetch(`/api/superadmin/plans/${planToArchive.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao arquivar plano");
        return;
      }

      toast.success("Plano arquivado com sucesso!");
      await fetchPlans();
      setPlanToArchive(null);
    } catch (err) {
      console.error("Error deleting plan:", err);
    } finally {
      setArchiving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (loading) {
    return <Loading text="Carregando planos..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar planos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select 
          value={statusFilter} 
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "Todos" },
            { value: "ACTIVE", label: "Ativos" },
            { value: "INACTIVE", label: "Inativos" },
            { value: "ARCHIVED", label: "Arquivados" }
          ]}
          className="w-40"
        />
      </div>

      <div className={cn(
        "grid gap-6",
        filteredPlans.length === 1 ? "max-w-md" :
        filteredPlans.length === 2 ? "max-w-4xl md:grid-cols-2" :
        "md:grid-cols-2 lg:grid-cols-3"
      )}>
        {filteredPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex"
          >
            <Card className={cn("relative w-full flex flex-col transition-all", plan.isHighlighted && "border-primary border-2 shadow-lg")}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="premium" className="px-3">
                    <Star className="h-3 w-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.popular && (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      )}
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      slug: {plan.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={plan.status === "ACTIVE" ? "default" : "secondary"}>
                      {plan.status === "ACTIVE" ? "Ativo" : plan.status === "INACTIVE" ? "Inativo" : "Arquivado"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {formatCurrency(plan.discountPrice || plan.price)}
                    </span>
                    {plan.discountPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(plan.price)}
                      </span>
                    )}
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {plan.popular && (
                    <Badge variant="secondary" className="mt-1">
                      <Star className="h-3 w-3 mr-1" />
                      Mais popular
                    </Badge>
                  )}
                </div>

                {plan.planIntervals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plan.planIntervals.filter(i => i.isActive).map(interval => (
                      <Badge key={interval.interval} variant="outline" className="text-xs">
                        {INTERVAL_LABELS[interval.interval]}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {plan._count?.users || 0} usuários
                </div>

                {plan.featureLimits.length > 0 && (
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium">Principais funcionalidades:</p>
                    <ul className="space-y-1">
                      {plan.featureLimits.slice(0, 5).map((fl) => (
                        <li key={fl.featureId} className="text-sm flex items-center gap-2">
                          <Check className={cn("h-4 w-4", fl.enabled ? "text-primary" : "text-muted-foreground")} />
                          <span className={fl.enabled ? "" : "text-muted-foreground line-through"}>
                            {fl.feature.name}
                            {fl.unlimited ? " (ilimitado)" : fl.limitValue ? ` (${fl.limitValue})` : ""}
                          </span>
                        </li>
                      ))}
                      {plan.featureLimits.length > 5 && (
                        <li className="text-sm text-muted-foreground">
                          +{plan.featureLimits.length - 5} mais...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-4 mt-auto">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditor(plan)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(plan)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleStatus(plan)}
                    className={plan.status === "ACTIVE" ? "" : "text-green-600"}
                  >
                    {plan.status === "ACTIVE" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(plan)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Plan Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {editingPlan ? "Editar Plano" : "Novo Plano"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                  </div>
                )}

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            name,
                            slug: editingPlan ? prev.slug : generateSlug(name)
                          }));
                        }}
                        placeholder="Ex: Premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug *</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="Ex: premium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição Curta</Label>
                    <Input
                      value={formData.shortDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                      placeholder="Uma frase resumindo o plano"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição Longa</Label>
                    <Textarea
                      value={formData.longDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                      placeholder="Descrição detalhada do plano, benefícios, etc."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preço Base (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço Promocional (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.discountPrice || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          discountPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Badge</Label>
                      <Input
                        value={formData.badge}
                        onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                        placeholder="Ex: Mais Popular"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cor de Destaque</Label>
                      <Input
                        type="color"
                        value={formData.highlightColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, highlightColor: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ordem</Label>
                      <Input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dias de Trial</Label>
                      <Input
                        type="number"
                        value={formData.trialDays}
                        onChange={(e) => setFormData(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 7 }))}
                        disabled={!formData.hasTrial}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.popular}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, popular: checked }))}
                      />
                      <Label>Popular</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isHighlighted}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isHighlighted: checked }))}
                      />
                      <Label>Destacado</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showOnLanding}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnLanding: checked }))}
                      />
                      <Label>Mostrar na Landing</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.showInComparison}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showInComparison: checked }))}
                      />
                      <Label>Mostrar na Comparação</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.hasTrial}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasTrial: checked }))}
                      />
                      <Label>Tem Trial</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notas Internas (visível apenas para administradores)</Label>
                    <Textarea
                      value={formData.internalNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                      placeholder="Notas internas sobre o plano..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Intervals */}
                <div className="space-y-4">
                  <h3 className="font-medium">Periodicidades</h3>
                  <div className="space-y-3">
                    {formData.intervals.map((interval, idx) => (
                      <div key={interval.interval} className={`p-3 border rounded-lg space-y-2 ${interval.isActive ? "border-primary/30 bg-primary/5" : "opacity-60"}`}>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={interval.isActive}
                            onCheckedChange={(checked) => {
                              const newIntervals = [...formData.intervals];
                              newIntervals[idx].isActive = checked;
                              setFormData(prev => ({ ...prev, intervals: newIntervals }));
                            }}
                          />
                          <span className="w-24 font-medium text-sm">{INTERVAL_LABELS[interval.interval]}</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28"
                            placeholder="Preço"
                            value={interval.price}
                            onChange={(e) => {
                              const newIntervals = [...formData.intervals];
                              newIntervals[idx].price = parseFloat(e.target.value) || 0;
                              setFormData(prev => ({ ...prev, intervals: newIntervals }));
                            }}
                          />
                          <Input
                            type="number"
                            className="w-20"
                            placeholder="% desc"
                            value={interval.discountPercent || ""}
                            onChange={(e) => {
                              const newIntervals = [...formData.intervals];
                              newIntervals[idx].discountPercent = parseInt(e.target.value) || undefined;
                              setFormData(prev => ({ ...prev, intervals: newIntervals }));
                            }}
                          />
                        </div>
                        {interval.isActive && (
                          <div className="flex items-center gap-4 pl-14">
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={interval.isDefault || false}
                                onCheckedChange={(checked) => {
                                  const newIntervals = [...formData.intervals];
                                  if (checked) {
                                    newIntervals.forEach(i => i.isDefault = false);
                                  }
                                  newIntervals[idx].isDefault = checked;
                                  setFormData(prev => ({ ...prev, intervals: newIntervals }));
                                }}
                              />
                              <Label className="text-xs">Padrão</Label>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={interval.bestOffer || false}
                                onCheckedChange={(checked) => {
                                  const newIntervals = [...formData.intervals];
                                  newIntervals[idx].bestOffer = checked;
                                  setFormData(prev => ({ ...prev, intervals: newIntervals }));
                                }}
                              />
                              <Label className="text-xs">Melhor Oferta</Label>
                            </div>
                            <Input
                              className="w-36 text-xs"
                              placeholder="Label de cobrança"
                              value={interval.billingLabel || ""}
                              onChange={(e) => {
                                const newIntervals = [...formData.intervals];
                                newIntervals[idx].billingLabel = e.target.value;
                                setFormData(prev => ({ ...prev, intervals: newIntervals }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features (only when editing) */}
                {editingPlan && modules.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Funcionalidades por Módulo</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure as funcionalidades disponíveis neste plano.
                    </p>
                    {modules.map(mod => (
                      <div key={mod.id} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">{mod.name}</h4>
                        {mod.features.map(feature => {
                          const defaults = {
                            featureId: feature.id,
                            limitValue: 0,
                            unlimited: false,
                            enabled: false,
                            isVisibleLocked: false,
                            limitMode: "HARD",
                            warningThreshold: null as number | null,
                            blockMessage: "",
                            ctaText: "",
                            upgradeUrl: "",
                          };
                          const featureConfig = formData.features.find(f => f.featureId === feature.id) || defaults;
                          const featureIdx = formData.features.findIndex(f => f.featureId === feature.id);

                          const updateFeature = (updates: Partial<typeof defaults>) => {
                            const newFeatures = [...formData.features];
                            if (featureIdx >= 0) {
                              newFeatures[featureIdx] = { ...newFeatures[featureIdx], ...updates };
                            } else {
                              newFeatures.push({ ...featureConfig, ...updates });
                            }
                            setFormData(prev => ({ ...prev, features: newFeatures }));
                          };

                          return (
                            <div key={feature.id} className="p-3 bg-muted/50 rounded space-y-2">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={featureConfig.enabled}
                                  onCheckedChange={(checked) => updateFeature({ enabled: checked })}
                                />
                                <span className="flex-1 text-sm font-medium">{feature.name}</span>
                                {feature.type === "LIMIT" && (
                                  <>
                                    <Input
                                      type="number"
                                      className="w-20"
                                      placeholder="Limite"
                                      value={featureConfig.limitValue || ""}
                                      onChange={(e) => updateFeature({ limitValue: parseInt(e.target.value) || 0 })}
                                      disabled={featureConfig.unlimited}
                                    />
                                    <div className="flex items-center gap-1">
                                      <Switch
                                        checked={featureConfig.unlimited}
                                        onCheckedChange={(checked) => updateFeature({ unlimited: checked })}
                                      />
                                      <span className="text-xs">∞</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              {/* Advanced config row */}
                              {featureConfig.enabled && (
                                <div className="flex flex-wrap items-center gap-2 pl-12 text-xs">
                                  {feature.type === "LIMIT" && (
                                    <>
                                      <Select
                                        value={featureConfig.limitMode || "HARD"}
                                        onChange={(val) => updateFeature({ limitMode: val })}
                                        options={[
                                          { value: "HARD", label: "Hard" },
                                          { value: "SOFT", label: "Soft" }
                                        ]}
                                        className="w-24 text-xs"
                                      />
                                      <Input
                                        type="number"
                                        className="w-20 text-xs"
                                        placeholder="Aviso em"
                                        title="Threshold de aviso (ex: 8 de 10)"
                                        value={featureConfig.warningThreshold ?? ""}
                                        onChange={(e) => updateFeature({ warningThreshold: e.target.value ? parseInt(e.target.value) : null })}
                                      />
                                    </>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Switch
                                      checked={featureConfig.isVisibleLocked}
                                      onCheckedChange={(checked) => updateFeature({ isVisibleLocked: checked })}
                                    />
                                    <span className="text-xs text-muted-foreground">Visível bloqueado</span>
                                  </div>
                                </div>
                              )}
                              {featureConfig.enabled && featureConfig.isVisibleLocked && (
                                <div className="flex flex-wrap gap-2 pl-12">
                                  <Input
                                    className="flex-1 min-w-[120px] text-xs"
                                    placeholder="Mensagem de bloqueio"
                                    value={featureConfig.blockMessage || ""}
                                    onChange={(e) => updateFeature({ blockMessage: e.target.value })}
                                  />
                                  <Input
                                    className="w-28 text-xs"
                                    placeholder="CTA texto"
                                    value={featureConfig.ctaText || ""}
                                    onChange={(e) => updateFeature({ ctaText: e.target.value })}
                                  />
                                  <Input
                                    className="w-36 text-xs"
                                    placeholder="URL de upgrade"
                                    value={featureConfig.upgradeUrl || ""}
                                    onChange={(e) => updateFeature({ upgradeUrl: e.target.value })}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>Salvando...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingPlan ? "Salvar Alterações" : "Criar Plano"}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!planToArchive}
        onClose={() => setPlanToArchive(null)}
        onConfirm={confirmArchive}
        title="Arquivar Plano?"
        description={`Você está prestes a arquivar o plano "${planToArchive?.name}".\nEle deixará de estar disponível para novas assinaturas, mas assinantes atuais não serão afetados.`}
        confirmLabel="Sim, arquivar"
        isLoading={archiving}
      />
    </div>
  );
}
