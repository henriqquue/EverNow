"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import {
  UserCog,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Star,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GovernanceRule {
  id: string;
  fieldKey: string;
  fieldType: string;
  label: string;
  description: string | null;
  icon: string | null;
  isRequired: boolean;
  requiredInOnboarding: boolean;
  requiredBeforeDiscovery: boolean;
  visibleInOnboarding: boolean;
  visibleInProfileEdit: boolean;
  visibleInProfileCard: boolean;
  visibleInFullProfile: boolean;
  defaultPublicVisible: boolean;
  userCanToggleVisibility: boolean;
  hiddenByDefault: boolean;
  premiumOnly: boolean;
  verifiedOnly: boolean;
  affectsCompatibility: boolean;
  affectsDiscoveryRanking: boolean;
  isActive: boolean;
  displayOrder: number;
  group: string | null;
}

const GROUP_LABELS: Record<string, string> = {
  basico: "Básico",
  profissional: "Profissional",
  midia: "Mídia",
  categorias: "Categorias de Perfil",
};

export default function PerfilGovernancaPage() {
  const [mounted, setMounted] = useState(false);
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/superadmin/profile-governance");
      if (!res.ok) throw new Error("Falha ao carregar regras");
      const data = await res.json();
      setRules(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) fetchRules();
  }, [mounted, fetchRules]);

  const updateRule = (id: string, field: keyof GovernanceRule, value: boolean | number | string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    setHasChanges(true);
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/superadmin/profile-governance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao salvar");
      }
      setSuccess("Regras salvas com sucesso!");
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const groups = ["all", ...Array.from(new Set(rules.map((r) => r.group || "outros")))];
  const filteredRules =
    filterGroup === "all"
      ? rules
      : rules.filter((r) => (r.group || "outros") === filterGroup);

  const sortedRules = [...filteredRules].sort((a, b) => a.displayOrder - b.displayOrder);

  if (!mounted || loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            Governança de Perfil
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure quais campos são obrigatórios, onde aparecem e quem pode controlá-los.
          </p>
        </div>
        <Button
          onClick={saveAll}
          disabled={saving || !hasChanges}
          className="bg-gradient-brand text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {groups.map((g) => (
          <Button
            key={g}
            variant={filterGroup === g ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterGroup(g)}
          >
            {g === "all" ? "Todos" : GROUP_LABELS[g] || g}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{rules.length}</div>
            <div className="text-xs text-muted-foreground">Total de campos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">
              {rules.filter((r) => r.isRequired).length}
            </div>
            <div className="text-xs text-muted-foreground">Obrigatórios</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {rules.filter((r) => r.userCanToggleVisibility).length}
            </div>
            <div className="text-xs text-muted-foreground">Usuário pode controlar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {rules.filter((r) => r.premiumOnly).length}
            </div>
            <div className="text-xs text-muted-foreground">Premium Only</div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedRules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card
                className={`transition-all ${
                  !rule.isActive ? "opacity-60" : ""
                }`}
              >
                <CardContent className="p-0">
                  {/* Collapsed row */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpandedId(expandedId === rule.id ? null : rule.id)
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{rule.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {rule.fieldType === "category" ? "Categoria" : "Campo"}
                        </Badge>
                        {rule.isRequired && (
                          <Badge variant="error" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" /> Obrigatório
                          </Badge>
                        )}
                        {rule.premiumOnly && (
                          <Badge variant="warning" className="text-xs">
                            <Star className="h-3 w-3 mr-1" /> Premium
                          </Badge>
                        )}
                        {!rule.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <code className="bg-muted px-1 rounded">{rule.fieldKey}</code>
                        {rule.group && (
                          <span className="ml-2">
                            Grupo: {GROUP_LABELS[rule.group] || rule.group}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick toggles */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <Switch
                          checked={rule.defaultPublicVisible}
                          onCheckedChange={(v) => updateRule(rule.id, "defaultPublicVisible", v)}
                        />
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(v) => updateRule(rule.id, "isActive", v)}
                        />
                      </div>
                      {expandedId === rule.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === rule.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="p-4 space-y-5">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Label</label>
                            <Input
                              value={rule.label}
                              onChange={(e) => updateRule(rule.id, "label", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Ordem</label>
                            <Input
                              type="number"
                              value={rule.displayOrder}
                              onChange={(e) => updateRule(rule.id, "displayOrder", parseInt(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Grupo</label>
                            <Input
                              value={rule.group || ""}
                              onChange={(e) => updateRule(rule.id, "group", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        {/* Requirements Section */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-red-500" /> Requisitos
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <SwitchRow
                              label="Obrigatório"
                              description="Campo deve ser preenchido"
                              checked={rule.isRequired}
                              onChange={(v) => updateRule(rule.id, "isRequired", v)}
                            />
                            <SwitchRow
                              label="Obrigatório no Onboarding"
                              description="Bloqueia avanço no onboarding"
                              checked={rule.requiredInOnboarding}
                              onChange={(v) => updateRule(rule.id, "requiredInOnboarding", v)}
                            />
                            <SwitchRow
                              label="Obrigatório para Descoberta"
                              description="Necessário antes de aparecer"
                              checked={rule.requiredBeforeDiscovery}
                              onChange={(v) => updateRule(rule.id, "requiredBeforeDiscovery", v)}
                            />
                          </div>
                        </div>

                        {/* Visibility Contexts */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-500" /> Visibilidade por Contexto
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <SwitchRow
                              label="Onboarding"
                              checked={rule.visibleInOnboarding}
                              onChange={(v) => updateRule(rule.id, "visibleInOnboarding", v)}
                            />
                            <SwitchRow
                              label="Edição de Perfil"
                              checked={rule.visibleInProfileEdit}
                              onChange={(v) => updateRule(rule.id, "visibleInProfileEdit", v)}
                            />
                            <SwitchRow
                              label="Card (Descoberta)"
                              checked={rule.visibleInProfileCard}
                              onChange={(v) => updateRule(rule.id, "visibleInProfileCard", v)}
                            />
                            <SwitchRow
                              label="Perfil Completo"
                              checked={rule.visibleInFullProfile}
                              onChange={(v) => updateRule(rule.id, "visibleInFullProfile", v)}
                            />
                          </div>
                        </div>

                        {/* Public Visibility */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <EyeOff className="h-4 w-4 text-purple-500" /> Controle de Visibilidade Pública
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <SwitchRow
                              label="Visível por padrão"
                              description="Público a menos que o usuário oculte"
                              checked={rule.defaultPublicVisible}
                              onChange={(v) => updateRule(rule.id, "defaultPublicVisible", v)}
                            />
                            <SwitchRow
                              label="Usuário pode controlar"
                              description="Permite mostrar/ocultar nas configurações"
                              checked={rule.userCanToggleVisibility}
                              onChange={(v) => updateRule(rule.id, "userCanToggleVisibility", v)}
                            />
                            <SwitchRow
                              label="Oculto por padrão"
                              description="Oculto a menos que o usuário opte"
                              checked={rule.hiddenByDefault}
                              onChange={(v) => updateRule(rule.id, "hiddenByDefault", v)}
                            />
                          </div>
                        </div>

                        {/* Access & Ranking */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" /> Acesso e Ranking
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <SwitchRow
                              label="Premium Only"
                              checked={rule.premiumOnly}
                              onChange={(v) => updateRule(rule.id, "premiumOnly", v)}
                            />
                            <SwitchRow
                              label="Apenas Confirmados"
                              checked={rule.verifiedOnly}
                              onChange={(v) => updateRule(rule.id, "verifiedOnly", v)}
                            />
                            <SwitchRow
                              label="Afeta Compatibilidade"
                              checked={rule.affectsCompatibility}
                              onChange={(v) => updateRule(rule.id, "affectsCompatibility", v)}
                            />
                            <SwitchRow
                              label="Afeta Ranking"
                              checked={rule.affectsDiscoveryRanking}
                              onChange={(v) => updateRule(rule.id, "affectsDiscoveryRanking", v)}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating save bar */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <Button
            onClick={saveAll}
            disabled={saving}
            size="lg"
            className="bg-gradient-brand text-white shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      )}
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );
}
