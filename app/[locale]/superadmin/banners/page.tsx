"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/ui/loading";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Banner {
  id: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string | null;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  position: string;
  pages: string[];
  dismissible: boolean;
  targetPlan: { id: string; name: string } | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  dismissals: number;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
}

const POSITIONS = [
  { value: "top", label: "Topo da página" },
  { value: "bottom", label: "Rodapé da página" },
  { value: "inline", label: "Inline (dentro do conteúdo)" },
];

const PAGES = [
  { value: "/app", label: "Dashboard" },
  { value: "/app/descobrir", label: "Descobrir" },
  { value: "/app/matches", label: "Conexões" },
  { value: "/app/conversas", label: "Conversas" },
  { value: "/app/perfil", label: "Perfil" },
  { value: "/app/passaporte", label: "Viagem" },
  { value: "/app/planos", label: "Planos" },
];

const DEFAULT_BANNER = {
  name: "",
  slug: "",
  title: "",
  subtitle: "",
  ctaText: "Saiba mais",
  ctaUrl: "/app/planos",
  imageUrl: "",
  backgroundColor: "#7c3aed",
  textColor: "#ffffff",
  position: "top",
  pages: [] as string[],
  dismissible: true,
  targetPlanId: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  priority: 0,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_BANNER);

  const [itemToDelete, setItemToDelete] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bannersRes, plansRes] = await Promise.all([
        fetch("/api/superadmin/banners"),
        fetch("/api/superadmin/plans"),
      ]);

      if (bannersRes.ok) {
        const data = await bannersRes.json();
        setBanners(data.banners);
      }
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const openEditor = (banner?: Banner) => {
    if (banner) {
      setEditingId(banner.id);
      setFormData({
        name: banner.name,
        slug: banner.slug,
        title: banner.title,
        subtitle: banner.subtitle || "",
        ctaText: banner.ctaText,
        ctaUrl: banner.ctaUrl,
        imageUrl: banner.imageUrl || "",
        backgroundColor: banner.backgroundColor || "#7c3aed",
        textColor: banner.textColor || "#ffffff",
        position: banner.position,
        pages: banner.pages,
        dismissible: banner.dismissible,
        targetPlanId: banner.targetPlan?.id || "",
        startsAt: banner.startsAt?.split("T")[0] || "",
        endsAt: banner.endsAt?.split("T")[0] || "",
        isActive: banner.isActive,
        priority: banner.priority,
      });
    } else {
      setEditingId(null);
      setFormData(DEFAULT_BANNER);
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/superadmin/banners/${editingId}`
        : "/api/superadmin/banners";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          targetPlanId: formData.targetPlanId || null,
          startsAt: formData.startsAt || null,
          endsAt: formData.endsAt || null,
          imageUrl: formData.imageUrl || null,
        }),
      });

      if (res.ok) {
        setShowEditor(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error saving banner:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (banner: Banner) => {
    setItemToDelete(banner);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/superadmin/banners/${itemToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Banner excluído com sucesso");
        fetchData();
        setItemToDelete(null);
      } else {
        toast.error("Erro ao excluir banner");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Erro de conexão");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/superadmin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...banner, isActive: !banner.isActive }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Error toggling banner:", error);
    }
  };

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
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
          <h1 className="text-2xl font-bold">Banners Promocionais</h1>
          <p className="text-muted-foreground">Gerencie banners de promoção e ofertas</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Banner
        </Button>
      </div>

      {/* Lista de banners */}
      <div className="grid gap-4">
        {banners.map((banner) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Preview do banner */}
                  <div
                    className="w-64 h-16 rounded-lg flex items-center justify-between px-4 flex-shrink-0"
                    style={{
                      backgroundColor: banner.backgroundColor || "#7c3aed",
                      color: banner.textColor || "#ffffff",
                    }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{banner.title}</p>
                      {banner.subtitle && (
                        <p className="text-xs opacity-80 truncate">{banner.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded flex-shrink-0">
                      {banner.ctaText}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{banner.name}</h3>
                      <Badge variant={banner.isActive ? "default" : "secondary"}>
                        {banner.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline">
                        {POSITIONS.find((p) => p.value === banner.position)?.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {banner.pages.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {PAGES.find((pg) => pg.value === p)?.label || p}
                        </Badge>
                      ))}
                      {banner.pages.length === 0 && (
                        <span className="text-xs text-muted-foreground">Todas as páginas</span>
                      )}
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <p className="text-xl font-bold">{banner.impressions}</p>
                      <p className="text-xs text-muted-foreground">Impressões</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{banner.clicks}</p>
                      <p className="text-xs text-muted-foreground">Cliques</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-primary">
                        {banner.impressions > 0
                          ? ((banner.clicks / banner.impressions) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">CTR</p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(banner)}
                    >
                      {banner.isActive ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditor(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(banner)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {banners.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold mb-2">Nenhum banner encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro banner promocional
              </p>
              <Button onClick={() => openEditor()}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Banner
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
              className="bg-card border rounded-xl w-full max-w-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold">
                  {editingId ? "Editar Banner" : "Novo Banner"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Preview */}
                <div>
                  <Label className="mb-2 block">Pré-visualização</Label>
                  <div
                    className="w-full py-3 px-4 rounded-lg flex items-center justify-between"
                    style={{
                      backgroundColor: formData.backgroundColor,
                      color: formData.textColor,
                    }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{formData.title || "Título do banner"}</p>
                      {formData.subtitle && (
                        <p className="text-sm opacity-80">{formData.subtitle}</p>
                      )}
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded text-sm flex-shrink-0">
                      {formData.ctaText}
                    </span>
                  </div>
                </div>

                {/* Nome e slug */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do banner</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      placeholder="Ex: Promoção Premium"
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

                {/* Conteúdo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Texto principal do banner"
                    />
                  </div>
                  <div>
                    <Label>Subtítulo (opcional)</Label>
                    <Input
                      value={formData.subtitle}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitle: e.target.value })
                      }
                      placeholder="Texto secundário"
                    />
                  </div>
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

                {/* Cores */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Cor de fundo</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundColor: e.target.value })
                        }
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={formData.backgroundColor}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundColor: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Cor do texto</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.textColor}
                        onChange={(e) =>
                          setFormData({ ...formData, textColor: e.target.value })
                        }
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={formData.textColor}
                        onChange={(e) =>
                          setFormData({ ...formData, textColor: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Posição e configurações */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Posição</Label>
                    <Select
                      value={formData.position}
                      onChange={(v) =>
                        setFormData({ ...formData, position: v })
                      }
                      options={POSITIONS}
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
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={formData.dismissible}
                        onCheckedChange={(v) =>
                          setFormData({ ...formData, dismissible: v })
                        }
                      />
                      <span className="text-sm">Pode fechar</span>
                    </label>
                  </div>
                </div>

                {/* Páginas */}
                <div>
                  <Label className="mb-2 block">Páginas onde aparece</Label>
                  <div className="flex flex-wrap gap-2">
                    {PAGES.map((p) => (
                      <Badge
                        key={p.value}
                        variant={formData.pages.includes(p.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            pages: toggleArrayItem(formData.pages, p.value),
                          })
                        }
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para mostrar em todas as páginas
                  </p>
                </div>

                {/* Plano alvo */}
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

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) =>
                      setFormData({ ...formData, isActive: v })
                    }
                  />
                  <Label>Banner ativo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Banner"}
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
        title="Excluir Banner?"
        description={`Tem certeza que deseja excluir o banner "${itemToDelete?.name}"?\nEsta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isLoading={isDeleting}
      />
    </div>
  );
}
