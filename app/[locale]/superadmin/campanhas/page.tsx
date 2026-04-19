"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Copy,
  Calendar,
  Target,
  Megaphone,
  X,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import { formatDate, cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  title: string;
  message: string;
  ctaText: string;
  ctaUrl: string;
  displayType: string;
  triggers: string[];
  targetFeatures: string[];
  targetPages: string[];
  targetPlan: { id: string; name: string } | null;
  offerPlan: { id: string; name: string } | null;
  discountPercent: number | null;
  discountCode: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  priority: number;
  maxImpressions: number | null;
  maxPerUser: number;
  impressions: number;
  clicks: number;
  conversions: number;
  _count: { events: number };
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
}

const DISPLAY_TYPES = [
  { value: "MODAL", label: "Modal" },
  { value: "BANNER", label: "Banner" },
  { value: "CARD", label: "Card" },
];

const TRIGGERS = [
  { value: "LIMIT_REACHED", label: "Limite atingido" },
  { value: "PREMIUM_FEATURE", label: "Recurso premium" },
  { value: "FILTER_BLOCKED", label: "Filtros bloqueados" },
  { value: "PASSPORT_BLOCKED", label: "Viagem bloqueada" },
  { value: "LIKES_BLOCKED", label: "Curtidas bloqueadas" },
  { value: "MESSAGE_LIMIT", label: "Limite de mensagens" },
  { value: "MANUAL", label: "Manual/Agendada" },
  { value: "PAGE_VIEW", label: "Visualização de página" },
];

const STATUSES = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "SCHEDULED", label: "Agendada" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "PAUSED", label: "Pausada" },
  { value: "ENDED", label: "Encerrada" },
];

const FEATURES = [
  { value: "curtidas_por_dia", label: "Curtidas por dia" },
  { value: "super_curtidas_por_dia", label: "Sinais Fortes" },
  { value: "mensagens_por_dia", label: "Mensagens" },
  { value: "filtros_avancados", label: "Filtros avançados" },
  { value: "ver_quem_curtiu", label: "Ver quem curtiu" },
  { value: "passaporte", label: "Viagem" },
  { value: "modo_invisivel", label: "Modo Discreto" },
  { value: "boost_perfil", label: "Impulso de perfil" },
];

const PAGES = [
  { value: "/app", label: "Dashboard" },
  { value: "/app/descobrir", label: "Descobrir" },
  { value: "/app/matches", label: "Conexões" },
  { value: "/app/conversas", label: "Conversas" },
  { value: "/app/perfil", label: "Perfil" },
  { value: "/app/passaporte", label: "Viagem" },
];

const DEFAULT_CAMPAIGN = {
  name: "",
  slug: "",
  description: "",
  title: "",
  message: "",
  ctaText: "Fazer upgrade",
  ctaUrl: "/app/planos",
  displayType: "MODAL",
  triggers: [] as string[],
  targetFeatures: [] as string[],
  targetPages: [] as string[],
  targetPlanId: "",
  offerPlanId: "",
  discountPercent: null as number | null,
  discountCode: "",
  startsAt: "",
  endsAt: "",
  status: "DRAFT",
  priority: 0,
  maxImpressions: null as number | null,
  maxPerUser: 3,
};

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_CAMPAIGN);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const [campaignsRes, plansRes] = await Promise.all([
        fetch(`/api/superadmin/campaigns${params}`),
        fetch("/api/superadmin/plans"),
      ]);

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns);
      }
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const openEditor = (campaign?: Campaign) => {
    if (campaign) {
      setEditingId(campaign.id);
      setFormData({
        name: campaign.name,
        slug: campaign.slug,
        description: campaign.description || "",
        title: campaign.title,
        message: campaign.message,
        ctaText: campaign.ctaText,
        ctaUrl: campaign.ctaUrl,
        displayType: campaign.displayType,
        triggers: campaign.triggers,
        targetFeatures: campaign.targetFeatures,
        targetPages: campaign.targetPages,
        targetPlanId: campaign.targetPlan?.id || "",
        offerPlanId: campaign.offerPlan?.id || "",
        discountPercent: campaign.discountPercent,
        discountCode: campaign.discountCode || "",
        startsAt: campaign.startsAt?.split("T")[0] || "",
        endsAt: campaign.endsAt?.split("T")[0] || "",
        status: campaign.status,
        priority: campaign.priority,
        maxImpressions: campaign.maxImpressions,
        maxPerUser: campaign.maxPerUser,
      });
    } else {
      setEditingId(null);
      setFormData(DEFAULT_CAMPAIGN);
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/superadmin/campaigns/${editingId}`
        : "/api/superadmin/campaigns";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetPlanId: formData.targetPlanId || null,
          offerPlanId: formData.offerPlanId || null,
          discountPercent: formData.discountPercent || null,
          discountCode: formData.discountCode || null,
          startsAt: formData.startsAt || null,
          endsAt: formData.endsAt || null,
          maxImpressions: formData.maxImpressions || null,
        }),
      });

      if (res.ok) {
        setShowEditor(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return;

    try {
      const res = await fetch(`/api/superadmin/campaigns/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/superadmin/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...campaign, status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "PAUSED":
        return <Badge variant="secondary">Pausada</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Rascunho</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-blue-500">Agendada</Badge>;
      case "ENDED":
        return <Badge variant="error">Encerrada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campanhas Comerciais</h1>
          <p className="text-muted-foreground">Gerencie ofertas e promoções automáticas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "", label: "Todos os status" },
              ...STATUSES,
            ]}
            className="w-[160px]"
          />
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Lista de campanhas */}
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Megaphone className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                        <Badge variant="outline">{campaign.displayType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {campaign.title}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {campaign.triggers.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {TRIGGERS.find((tr) => tr.value === t)?.label || t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <p className="text-2xl font-bold">{campaign.impressions}</p>
                      <p className="text-xs text-muted-foreground">Impressões</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{campaign.clicks}</p>
                      <p className="text-xs text-muted-foreground">Cliques</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{campaign.conversions}</p>
                      <p className="text-xs text-muted-foreground">Conversões</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {campaign.impressions > 0
                          ? ((campaign.conversions / campaign.impressions) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">CVR</p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(campaign)}
                    >
                      {campaign.status === "ACTIVE" ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditor(campaign)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira campanha para começar
              </p>
              <Button onClick={() => openEditor()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Campanha
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border rounded-xl w-full max-w-3xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold">
                  {editingId ? "Editar Campanha" : "Nova Campanha"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Informações básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da campanha</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      placeholder="Ex: Promoção de Verão"
                    />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Título e mensagem */}
                <div>
                  <Label>Título da oferta</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Ex: Desbloqueie recursos premium!"
                  />
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <textarea
                    className="w-full h-20 px-3 py-2 border rounded-lg bg-background resize-none"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Descrição da oferta..."
                  />
                </div>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Texto do botão</Label>
                    <Input
                      value={formData.ctaText}
                      onChange={(e) =>
                        setFormData({ ...formData, ctaText: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>URL do botão</Label>
                    <Input
                      value={formData.ctaUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, ctaUrl: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Tipo e status */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo de exibição</Label>
                    <Select
                      value={formData.displayType}
                      onChange={(v) =>
                        setFormData({ ...formData, displayType: v })
                      }
                      options={DISPLAY_TYPES}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onChange={(v) =>
                        setFormData({ ...formData, status: v })
                      }
                      options={STATUSES}
                    />
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                {/* Gatilhos */}
                <div>
                  <Label className="mb-2 block">Gatilhos (quando exibir)</Label>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map((t) => (
                      <Badge
                        key={t.value}
                        variant={formData.triggers.includes(t.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            triggers: toggleArrayItem(formData.triggers, t.value),
                          })
                        }
                      >
                        {t.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features alvo */}
                <div>
                  <Label className="mb-2 block">Features alvo (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {FEATURES.map((f) => (
                      <Badge
                        key={f.value}
                        variant={formData.targetFeatures.includes(f.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetFeatures: toggleArrayItem(formData.targetFeatures, f.value),
                          })
                        }
                      >
                        {f.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Páginas alvo */}
                <div>
                  <Label className="mb-2 block">Páginas onde aparece (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {PAGES.map((p) => (
                      <Badge
                        key={p.value}
                        variant={formData.targetPages.includes(p.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetPages: toggleArrayItem(formData.targetPages, p.value),
                          })
                        }
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Planos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mostrar para plano (opcional)</Label>
                    <Select
                      value={formData.targetPlanId}
                      onChange={(v) =>
                        setFormData({ ...formData, targetPlanId: v })
                      }
                      options={[
                        { value: "", label: "Todos os planos" },
                        ...plans.map((p) => ({ value: p.id, label: p.name })),
                      ]}
                    />
                  </div>
                  <div>
                    <Label>Promover plano</Label>
                    <Select
                      value={formData.offerPlanId}
                      onChange={(v) =>
                        setFormData({ ...formData, offerPlanId: v })
                      }
                      options={[
                        { value: "", label: "Nenhum" },
                        ...plans.map((p) => ({ value: p.id, label: p.name })),
                      ]}
                    />
                  </div>
                </div>

                {/* Desconto */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      value={formData.discountPercent || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPercent: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="Ex: 20"
                    />
                  </div>
                  <div>
                    <Label>Código promocional</Label>
                    <Input
                      value={formData.discountCode}
                      onChange={(e) =>
                        setFormData({ ...formData, discountCode: e.target.value })
                      }
                      placeholder="Ex: VERAO2024"
                    />
                  </div>
                </div>

                {/* Período */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de início</Label>
                    <Input
                      type="date"
                      value={formData.startsAt}
                      onChange={(e) =>
                        setFormData({ ...formData, startsAt: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Data de término</Label>
                    <Input
                      type="date"
                      value={formData.endsAt}
                      onChange={(e) =>
                        setFormData({ ...formData, endsAt: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Limites */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Máx. impressões totais</Label>
                    <Input
                      type="number"
                      value={formData.maxImpressions || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxImpressions: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>
                  <div>
                    <Label>Máx. por usuário</Label>
                    <Input
                      type="number"
                      value={formData.maxPerUser}
                      onChange={(e) =>
                        setFormData({ ...formData, maxPerUser: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Campanha"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
