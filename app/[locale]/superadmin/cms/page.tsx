"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CmsBlock {
  id: string;
  key: string;
  title: string;
  content: string;
  type: string;
  status: string;
  order: number;
}

export default function CmsPage() {
  const [mounted, setMounted] = useState(false);
  const [blocks, setBlocks] = useState<CmsBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CmsBlock | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/cms/blocks');
      if (res.ok) setBlocks(await res.json());
    } catch (e) {
      console.error('Erro ao buscar blocos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) fetchBlocks();
  }, [mounted, fetchBlocks]);

  const openNew = () => {
    setIsNew(true);
    setEditing({ id: '', key: '', title: '', content: '', type: 'TEXT', status: 'ACTIVE', order: blocks.length });
  };

  const openEdit = (block: CmsBlock) => {
    setIsNew(false);
    setEditing({ ...block });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch('/api/superadmin/cms/blocks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      if (res.ok) {
        setEditing(null);
        fetchBlocks();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar');
      }
    } catch (e) {
      console.error('Erro ao salvar bloco:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este bloco?')) return;
    try {
      const res = await fetch(`/api/superadmin/cms/blocks?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchBlocks();
    } catch (e) {
      console.error('Erro ao remover bloco:', e);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">CMS</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Gerencie os conteúdos da landing page e textos do sistema
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo bloco
        </Button>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-primary-200 dark:border-primary-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{isNew ? 'Novo Bloco' : 'Editar Bloco'}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Título"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                  <Input
                    label="Chave (única)"
                    value={editing.key}
                    onChange={(e) => setEditing({ ...editing, key: e.target.value })}
                    disabled={!isNew}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label="Tipo"
                    options={[
                      { value: 'TEXT', label: 'Texto' },
                      { value: 'HTML', label: 'HTML' },
                      { value: 'MARKDOWN', label: 'Markdown' },
                    ]}
                    value={editing.type}
                    onChange={(v) => setEditing({ ...editing, type: v })}
                  />
                  <Select
                    label="Status"
                    options={[
                      { value: 'ACTIVE', label: 'Ativo' },
                      { value: 'INACTIVE', label: 'Inativo' },
                    ]}
                    value={editing.status}
                    onChange={(v) => setEditing({ ...editing, status: v })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Conteúdo</label>
                  <Textarea
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    rows={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving || !editing.key || !editing.title}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocks List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : blocks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            Nenhum bloco CMS cadastrado. Clique em &ldquo;Novo bloco&rdquo; para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{block.title}</h3>
                        <p className="text-sm text-neutral-500">Chave: {block.key}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={block.type === "HTML" ? "secondary" : "default"}>{block.type}</Badge>
                      <Badge variant={block.status === "ACTIVE" ? "success" : "warning"}>
                        {block.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(block)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(block.id)}>
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
