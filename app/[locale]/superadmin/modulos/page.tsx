"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { toast } from "sonner";
import {
  Puzzle,
  Plus,
  Settings,
  X,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Feature {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: string;
  order: number;
  features: Feature[];
}

export default function ModulosPage() {
  const [mounted, setMounted] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState<Module | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    order: 0,
    status: "ACTIVE" as string,
  });

  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/modules");
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchModules();
  }, [fetchModules]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
  };

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", icon: "", order: modules.length, status: "ACTIVE" });
    setEditingModule(null);
    setError(null);
  };

  const openEditor = (mod?: Module) => {
    if (mod) {
      setEditingModule(mod);
      setFormData({
        name: mod.name,
        slug: mod.slug,
        description: mod.description || "",
        icon: mod.icon || "",
        order: mod.order,
        status: mod.status,
      });
    } else {
      resetForm();
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      setError("Nome e slug são obrigatórios");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const url = editingModule
        ? `/api/superadmin/modules/${editingModule.id}`
        : "/api/superadmin/modules";
      const method = editingModule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar módulo");
      }

      await fetchModules();
      setShowEditor(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (mod: Module) => {
    try {
      const newStatus = mod.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await fetch(`/api/superadmin/modules/${mod.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchModules();
    } catch (err) {
      console.error("Error toggling module status:", err);
    }
  };

  const handleDelete = (mod: Module) => {
    setItemToDelete(mod);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/superadmin/modules/${itemToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir módulo");
        return;
      }
      toast.success("Módulo excluído com sucesso");
      await fetchModules();
      setItemToDelete(null);
    } catch (err) {
      console.error("Error deleting module:", err);
      toast.error("Erro de conexão");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return <Loading text="Carregando módulos..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Módulos
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Gerencie os módulos do sistema ({modules.length} módulos)
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4 mr-2" /> Novo Módulo
        </Button>
      </div>

      {/* Modules Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, index) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <Puzzle className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={mod.status === "ACTIVE" ? "success" : "warning"}>
                      {mod.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{mod.order}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">
                  {mod.name}
                </h3>
                <p className="text-sm text-neutral-500 mb-1">/{mod.slug}</p>
                {mod.description && (
                  <p className="text-xs text-neutral-400 mb-3 line-clamp-2">{mod.description}</p>
                )}

                {/* Features preview */}
                <div className="mb-4">
                  <button
                    className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 transition-colors"
                    onClick={() => setExpandedId(expandedId === mod.id ? null : mod.id)}
                  >
                    {mod.features.length} funcionalidade{mod.features.length !== 1 ? "s" : ""}
                    {expandedId === mod.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  <AnimatePresence>
                    {expandedId === mod.id && mod.features.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-2 space-y-1">
                          {mod.features.map((f) => (
                            <li key={f.id} className="text-xs flex items-center gap-2 text-neutral-500">
                              <Badge variant={f.type === "LIMIT" ? "info" : f.type === "UNLIMITED" ? "success" : "secondary"} className="text-[10px] px-1 py-0">
                                {f.type === "LIMIT" ? "Limite" : f.type === "UNLIMITED" ? "Ilimitado" : "Bool"}
                              </Badge>
                              {f.name}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditor(mod)}>
                    <Settings className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(mod)}
                    className={mod.status === "ACTIVE" ? "" : "text-green-600"}
                  >
                    {mod.status === "ACTIVE" ? <X className="h-4 w-4" /> : <span className="text-xs">Ativar</span>}
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(mod)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {modules.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Puzzle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum módulo cadastrado</h3>
            <p className="text-muted-foreground mb-4">Crie o primeiro módulo para organizar as funcionalidades.</p>
            <Button onClick={() => openEditor()}>
              <Plus className="h-4 w-4 mr-2" /> Criar Módulo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Module Editor Modal */}
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
              className="bg-background rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Puzzle className="h-5 w-5" />
                  {editingModule ? "Editar Módulo" : "Novo Módulo"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
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
                          slug: editingModule ? prev.slug : generateSlug(name),
                        }));
                      }}
                      placeholder="Ex: Conexões"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug *</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="Ex: conexoes"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do módulo..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ícone (nome Lucide)</Label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                      placeholder="Ex: Heart, Search, Globe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                {editingModule && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.status === "ACTIVE"}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, status: checked ? "ACTIVE" : "INACTIVE" }))
                      }
                    />
                    <Label>Módulo ativo</Label>
                  </div>
                )}
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
                      {editingModule ? "Salvar Alterações" : "Criar Módulo"}
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
        title="Excluir Módulo?"
        description={`Tem certeza que deseja excluir o módulo "${itemToDelete?.name}"?${itemToDelete && itemToDelete.features.length > 0 ? "\n\nO módulo possui funcionalidades vinculadas e será desativado em vez de excluído permanentemente." : "\nEsta ação não pode ser desfeita."}`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
      />
    </div>
  );
}
