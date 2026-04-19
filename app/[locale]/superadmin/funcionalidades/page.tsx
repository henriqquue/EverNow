"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Zap,
  Plus,
  Edit,
  Search,
  X,
  Save,
  Trash2,
  AlertCircle,
  Infinity,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlanLimit {
  id: string;
  planId: string;
  limitValue: number | null;
  unlimited: boolean;
  enabled: boolean;
  isVisibleLocked: boolean;
  limitMode: string;
  warningThreshold: number | null;
  plan: { id: string; name: string; slug: string; order: number };
}

interface FeatureData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  defaultLimit: number | null;
  resetPeriod: string;
  showInComparison: boolean;
  comparisonOrder: number;
  comparisonLabel: string | null;
  module: { id: string; name: string; slug: string };
  featureLimits: PlanLimit[];
}

interface ModuleOption {
  id: string;
  name: string;
  slug: string;
}

const RESET_PERIOD_LABELS: Record<string, string> = {
  DAILY: "Diário",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  NEVER: "Nunca",
};

const FEATURE_TYPE_OPTIONS = [
  { value: "BOOLEAN", label: "Boolean" },
  { value: "LIMIT", label: "Limite" },
  { value: "UNLIMITED", label: "Ilimitado" },
];

const RESET_OPTIONS = [
  { value: "NEVER", label: "Nunca" },
  { value: "DAILY", label: "Diário" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensal" },
];

export default function FuncionalidadesPage() {
  const [mounted, setMounted] = useState(false);
  const [features, setFeatures] = useState<FeatureData[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [showEditor, setShowEditor] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureData | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState<FeatureData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    moduleId: "",
    type: "BOOLEAN",
    defaultLimit: 0,
    resetPeriod: "NEVER",
    showInComparison: true,
    comparisonOrder: 0,
    comparisonLabel: "",
  });

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/features");
      if (res.ok) {
        const data = await res.json();
        setFeatures(data);
      }
    } catch (err) {
      console.error("Error fetching features:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/modules");
      if (res.ok) {
        const data = await res.json();
        setModules(data.map((m: ModuleOption) => ({ id: m.id, name: m.name, slug: m.slug })));
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchFeatures();
    fetchModules();
  }, [fetchFeatures, fetchModules]);

  // Get unique plan names across all features for table columns
  const allPlans = features.reduce<{ id: string; name: string; slug: string; order: number }[]>(
    (acc, f) => {
      f.featureLimits.forEach((fl) => {
        if (!acc.find((p) => p.id === fl.plan.id)) {
          acc.push(fl.plan);
        }
      });
      return acc;
    },
    []
  ).sort((a, b) => a.order - b.order);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      moduleId: modules[0]?.id || "",
      type: "BOOLEAN",
      defaultLimit: 0,
      resetPeriod: "NEVER",
      showInComparison: true,
      comparisonOrder: 0,
      comparisonLabel: "",
    });
    setEditingFeature(null);
    setError(null);
  };

  const openEditor = (feature?: FeatureData) => {
    if (feature) {
      setEditingFeature(feature);
      setFormData({
        name: feature.name,
        slug: feature.slug,
        description: feature.description || "",
        moduleId: feature.module.id,
        type: feature.type,
        defaultLimit: feature.defaultLimit || 0,
        resetPeriod: feature.resetPeriod,
        showInComparison: feature.showInComparison,
        comparisonOrder: feature.comparisonOrder,
        comparisonLabel: feature.comparisonLabel || "",
      });
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug || !formData.moduleId) {
      setError("Nome, slug e módulo são obrigatórios");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const url = editingFeature
        ? `/api/superadmin/features/${editingFeature.id}`
        : "/api/superadmin/features";
      const method = editingFeature ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar funcionalidade");
      }

      await fetchFeatures();
      setShowEditor(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (feature: FeatureData) => {
    setItemToDelete(feature);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/superadmin/features/${itemToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir funcionalidade");
        return;
      }
      toast.success("Funcionalidade excluída com sucesso");
      await fetchFeatures();
      setItemToDelete(null);
    } catch (err) {
      console.error("Error deleting feature:", err);
      toast.error("Erro de conexão");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFeatures = features.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.slug.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === "all" || f.module.id === moduleFilter;
    return matchSearch && matchModule;
  });

  // Group by module for display
  const groupedFeatures = filteredFeatures.reduce<Record<string, FeatureData[]>>((acc, f) => {
    const key = f.module.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  if (!mounted) return null;

  if (loading) {
    return <Loading text="Carregando funcionalidades..." />;
  }

  const renderLimitCell = (feature: FeatureData, planId: string) => {
    const fl = feature.featureLimits.find((l) => l.plan.id === planId);
    if (!fl) {
      return <span className="text-neutral-400">—</span>;
    }

    if (!fl.enabled) {
      if (fl.isVisibleLocked) {
        return (
          <Badge variant="warning" className="text-xs">
            <Lock className="h-3 w-3 mr-1" /> Bloqueado
          </Badge>
        );
      }
      return <Badge variant="error" className="text-xs">Desabilitado</Badge>;
    }

    if (feature.type === "BOOLEAN") {
      return <Badge variant="success" className="text-xs">Sim</Badge>;
    }

    if (fl.unlimited) {
      return (
        <Badge variant="success" className="text-xs">
          <Infinity className="h-3 w-3 mr-1" /> Ilimitado
        </Badge>
      );
    }

    return (
      <span className="font-medium">
        {fl.limitValue || 0}
        {fl.limitMode === "SOFT" && (
          <span className="text-xs text-amber-500 ml-1" title="Limite flexível">≈</span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Funcionalidades
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Gerencie as funcionalidades e limites por plano ({features.length} funcionalidades)
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4 mr-2" /> Nova Funcionalidade
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar funcionalidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              value={moduleFilter}
              onChange={setModuleFilter}
              options={[
                { value: "all", label: "Todos os módulos" },
                ...modules.map((m) => ({ value: m.id, label: m.name })),
              ]}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Matrix Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {Object.entries(groupedFeatures).map(([moduleName, moduleFeatures]) => (
          <Card key={moduleName} className="mb-4">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary-600" />
                  {moduleName}
                  <Badge variant="secondary" className="text-xs">{moduleFeatures.length}</Badge>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Funcionalidade</TableHead>
                      <TableHead className="w-20">Tipo</TableHead>
                      <TableHead className="w-20">Reset</TableHead>
                      {allPlans.map((plan) => (
                        <TableHead key={plan.id} className="text-center min-w-[100px]">
                          {plan.name}
                        </TableHead>
                      ))}
                      <TableHead className="text-right w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moduleFeatures.map((feature) => (
                      <TableRow key={feature.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white text-sm">
                              {feature.name}
                              {!feature.showInComparison && (
                                <span className="text-xs text-muted-foreground ml-1" title="Oculto na comparação">👁‍🗨</span>
                              )}
                            </p>
                            <p className="text-xs text-neutral-500">{feature.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              feature.type === "LIMIT"
                                ? "info"
                                : feature.type === "UNLIMITED"
                                ? "success"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {feature.type === "LIMIT" ? "Limite" : feature.type === "UNLIMITED" ? "Ilimitado" : "Bool"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {RESET_PERIOD_LABELS[feature.resetPeriod] || feature.resetPeriod}
                          </span>
                        </TableCell>
                        {allPlans.map((plan) => (
                          <TableCell key={plan.id} className="text-center">
                            {renderLimitCell(feature, plan.id)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditor(feature)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(feature)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredFeatures.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma funcionalidade encontrada</h3>
            <p className="text-muted-foreground mb-4">Crie a primeira funcionalidade para começar.</p>
            <Button onClick={() => openEditor()}>
              <Plus className="h-4 w-4 mr-2" /> Criar Funcionalidade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Feature Editor Modal */}
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
              className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {editingFeature ? "Editar Funcionalidade" : "Nova Funcionalidade"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          name,
                          slug: editingFeature ? prev.slug : generateSlug(name),
                        }));
                      }}
                      placeholder="Ex: Curtidas por dia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug *</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="Ex: curtidas_por_dia"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Módulo *</Label>
                  <Select
                    value={formData.moduleId}
                    onChange={(val) => setFormData((prev) => ({ ...prev, moduleId: val }))}
                    options={modules.map((m) => ({ value: m.id, label: m.name }))}
                    placeholder="Selecione o módulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da funcionalidade..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={formData.type}
                      onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
                      options={FEATURE_TYPE_OPTIONS}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período de Reset</Label>
                    <Select
                      value={formData.resetPeriod}
                      onChange={(val) => setFormData((prev) => ({ ...prev, resetPeriod: val }))}
                      options={RESET_OPTIONS}
                    />
                  </div>
                </div>

                {formData.type === "LIMIT" && (
                  <div className="space-y-2">
                    <Label>Limite Padrão</Label>
                    <Input
                      type="number"
                      value={formData.defaultLimit}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, defaultLimit: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                )}

                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Comparação de Planos</h4>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.showInComparison}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, showInComparison: checked }))
                      }
                    />
                    <Label>Mostrar na comparação de planos</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Label na Comparação</Label>
                      <Input
                        value={formData.comparisonLabel}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, comparisonLabel: e.target.value }))
                        }
                        placeholder="Label customizada"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ordem na Comparação</Label>
                      <Input
                        type="number"
                        value={formData.comparisonOrder}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, comparisonOrder: parseInt(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingFeature ? "Salvar Alterações" : "Criar Funcionalidade"}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir Funcionalidade?"
        description={`Tem certeza que deseja excluir a funcionalidade "${itemToDelete?.name}"?\nEsta ação pode impactar os planos vinculados.`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
      />
    </div>
  );
}
