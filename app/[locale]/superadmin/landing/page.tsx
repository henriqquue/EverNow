'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Plus, Trash2, Edit, Eye, ChevronDown, ChevronUp,
  Settings, FileText, MessageSquare, HelpCircle, X, Image,
  Type, LayoutGrid, RefreshCw, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loading } from '@/components/ui/loading';
import { RadixTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function LandingCMSPage() {
  const [activeTab, setActiveTab] = useState('sections');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [sections, setSections] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);

  // Editor states
  const [editingSection, setEditingSection] = useState<any>(null);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sectionsRes, faqsRes, testimonialsRes, settingsRes] = await Promise.all([
        fetch('/api/superadmin/cms/sections'),
        fetch('/api/superadmin/cms/faqs'),
        fetch('/api/superadmin/cms/testimonials'),
        fetch('/api/superadmin/cms/settings')
      ]);

      if (sectionsRes.ok) setSections(await sectionsRes.json());
      if (faqsRes.ok) setFaqs(await faqsRes.json());
      if (testimonialsRes.ok) setTestimonials(await testimonialsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (error) {
      console.error('Error fetching CMS data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Section handlers
  const saveSection = async (section: any) => {
    setSaving(true);
    try {
      const isNew = !section.id;
      const url = isNew ? '/api/superadmin/cms/sections' : `/api/superadmin/cms/sections/${section.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(section)
      });

      if (res.ok) {
        await fetchData();
        setEditingSection(null);
      }
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta seção?')) return;
    try {
      await fetch(`/api/superadmin/cms/sections/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  // FAQ handlers
  const saveFaq = async (faq: any) => {
    setSaving(true);
    try {
      const isNew = !faq.id;
      const url = isNew ? '/api/superadmin/cms/faqs' : `/api/superadmin/cms/faqs/${faq.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faq)
      });

      if (res.ok) {
        await fetchData();
        setEditingFaq(null);
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;
    try {
      await fetch(`/api/superadmin/cms/faqs/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
    }
  };

  // Testimonial handlers
  const saveTestimonial = async (testimonial: any) => {
    setSaving(true);
    try {
      const isNew = !testimonial.id;
      const url = isNew ? '/api/superadmin/cms/testimonials' : `/api/superadmin/cms/testimonials/${testimonial.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimonial)
      });

      if (res.ok) {
        await fetchData();
        setEditingTestimonial(null);
      }
    } catch (error) {
      console.error('Error saving testimonial:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este depoimento?')) return;
    try {
      await fetch(`/api/superadmin/cms/testimonials/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
    }
  };

  // Settings handlers
  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/superadmin/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => {
      const existing = prev.find(s => s.key === key);
      if (existing) {
        return prev.map(s => s.key === key ? { ...s, value } : s);
      }
      return [...prev, { key, value, label: key, type: 'text', group: 'general' }];
    });
  };

  const getSetting = (key: string) => {
    return settings.find(s => s.key === key)?.value || '';
  };

  if (loading) return <Loading text="Carregando CMS..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">CMS da Landing Page</h1>
          <p className="text-neutral-500">Gerencie o conteúdo da página inicial</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <a href="/" target="_blank">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Landing
            </Button>
          </a>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="sections"><LayoutGrid className="h-4 w-4 mr-2" />Seções</TabsTrigger>
          <TabsTrigger value="faqs"><HelpCircle className="h-4 w-4 mr-2" />FAQ</TabsTrigger>
          <TabsTrigger value="testimonials"><MessageSquare className="h-4 w-4 mr-2" />Depoimentos</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Config</TabsTrigger>
        </TabsList>

        {/* Sections Tab */}
        <TabsContent value="sections" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Seções da Landing</CardTitle>
              <Button onClick={() => setEditingSection({ key: '', name: '', title: '', subtitle: '', isActive: true, order: sections.length })}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Seção
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sections.length === 0 ? (
                  <p className="text-center text-neutral-500 py-8">Nenhuma seção cadastrada. O sistema usará conteúdo padrão.</p>
                ) : (
                  sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-neutral-500 font-mono w-8">{section.order}</div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">{section.name}</p>
                          <p className="text-sm text-neutral-500">{section.key}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={section.isActive ? 'default' : 'secondary'}>
                          {section.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => setEditingSection(section)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faqs" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Perguntas Frequentes</CardTitle>
              <Button onClick={() => setEditingFaq({ question: '', answer: '', category: 'geral', isActive: true, order: faqs.length })}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Pergunta
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {faqs.length === 0 ? (
                  <p className="text-center text-neutral-500 py-8">Nenhuma FAQ cadastrada. O sistema usará perguntas padrão.</p>
                ) : (
                  faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                    >
                      <div className="flex-1 mr-4">
                        <p className="font-medium text-neutral-900 dark:text-white line-clamp-1">{faq.question}</p>
                        <p className="text-sm text-neutral-500 line-clamp-1">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={faq.isActive ? 'default' : 'secondary'}>
                          {faq.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => setEditingFaq(faq)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteFaq(faq.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Depoimentos</CardTitle>
              <Button onClick={() => setEditingTestimonial({ name: '', age: null, city: '', content: '', rating: 5, isActive: true, order: testimonials.length })}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Depoimento
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {testimonials.length === 0 ? (
                  <p className="text-center text-neutral-500 py-8 col-span-2">Nenhum depoimento cadastrado. O sistema usará depoimentos padrão.</p>
                ) : (
                  testimonials.map((testimonial) => (
                    <Card key={testimonial.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {testimonial.name}{testimonial.age ? `, ${testimonial.age}` : ''}
                          </p>
                          {testimonial.city && (
                            <p className="text-sm text-neutral-500">{testimonial.city}</p>
                          )}
                        </div>
                        <Badge variant={testimonial.isActive ? 'default' : 'secondary'}>
                          {testimonial.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
                        "{testimonial.content}"
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < testimonial.rating ? 'text-amber-400' : 'text-neutral-300'}>★</span>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingTestimonial(testimonial)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteTestimonial(testimonial.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Configurações Gerais</CardTitle>
              <Button onClick={saveSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SEO */}
              <div>
                <h3 className="text-lg font-semibold mb-4">SEO</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Meta Title</Label>
                    <Input
                      value={getSetting('meta_title')}
                      onChange={(e) => updateSetting('meta_title', e.target.value)}
                      placeholder="EverNOW - Encontre sua conexão perfeita"
                    />
                  </div>
                  <div>
                    <Label>Meta Description</Label>
                    <Input
                      value={getSetting('meta_description')}
                      onChange={(e) => updateSetting('meta_description', e.target.value)}
                      placeholder="Plataforma de relacionamento com compatibilidade real e privacidade forte."
                    />
                  </div>
                </div>
              </div>

              {/* Hero */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Hero</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Título Principal</Label>
                    <Input
                      value={getSetting('hero_title')}
                      onChange={(e) => updateSetting('hero_title', e.target.value)}
                      placeholder="Encontre quem combina com você"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input
                      value={getSetting('hero_description')}
                      onChange={(e) => updateSetting('hero_description', e.target.value)}
                      placeholder="Relacionamento sério ou encontro imediato..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CTA Primário</Label>
                      <Input
                        value={getSetting('hero_cta_primary')}
                        onChange={(e) => updateSetting('hero_cta_primary', e.target.value)}
                        placeholder="Comece agora"
                      />
                    </div>
                    <div>
                      <Label>CTA Secundário</Label>
                      <Input
                        value={getSetting('hero_cta_secondary')}
                        onChange={(e) => updateSetting('hero_cta_secondary', e.target.value)}
                        placeholder="Já tenho conta"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposta de Valor */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Proposta de Valor</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={getSetting('value_title')}
                      onChange={(e) => updateSetting('value_title', e.target.value)}
                      placeholder="Por que EverNOW?"
                    />
                  </div>
                  <div>
                    <Label>Subtítulo</Label>
                    <Input
                      value={getSetting('value_subtitle')}
                      onChange={(e) => updateSetting('value_subtitle', e.target.value)}
                      placeholder="Uma nova forma de encontrar conexões verdadeiras"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section Editor Modal */}
      <AnimatePresence>
        {editingSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingSection(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{editingSection.id ? 'Editar Seção' : 'Nova Seção'}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setEditingSection(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Chave (key)</Label>
                      <Input
                        value={editingSection.key}
                        onChange={(e) => setEditingSection({ ...editingSection, key: e.target.value })}
                        placeholder="hero_section"
                      />
                    </div>
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={editingSection.name}
                        onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                        placeholder="Hero Principal"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Título</Label>
                    <Input
                      value={editingSection.title || ''}
                      onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Subtítulo</Label>
                    <Input
                      value={editingSection.subtitle || ''}
                      onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ordem</Label>
                      <Input
                        type="number"
                        value={editingSection.order}
                        onChange={(e) => setEditingSection({ ...editingSection, order: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        checked={editingSection.isActive}
                        onCheckedChange={(checked) => setEditingSection({ ...editingSection, isActive: checked })}
                      />
                      <Label>Ativo</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingSection(null)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={() => saveSection(editingSection)} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ Editor Modal */}
      <AnimatePresence>
        {editingFaq && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingFaq(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{editingFaq.id ? 'Editar FAQ' : 'Nova Pergunta'}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setEditingFaq(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Pergunta</Label>
                    <Input
                      value={editingFaq.question}
                      onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Resposta</Label>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 dark:border-neutral-700"
                      value={editingFaq.answer}
                      onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Input
                        value={editingFaq.category || ''}
                        onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                        placeholder="geral"
                      />
                    </div>
                    <div>
                      <Label>Ordem</Label>
                      <Input
                        type="number"
                        value={editingFaq.order}
                        onChange={(e) => setEditingFaq({ ...editingFaq, order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingFaq.isActive}
                      onCheckedChange={(checked) => setEditingFaq({ ...editingFaq, isActive: checked })}
                    />
                    <Label>Ativo</Label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingFaq(null)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={() => saveFaq(editingFaq)} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testimonial Editor Modal */}
      <AnimatePresence>
        {editingTestimonial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingTestimonial(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{editingTestimonial.id ? 'Editar Depoimento' : 'Novo Depoimento'}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setEditingTestimonial(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={editingTestimonial.name}
                        onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Idade</Label>
                      <Input
                        type="number"
                        value={editingTestimonial.age || ''}
                        onChange={(e) => setEditingTestimonial({ ...editingTestimonial, age: parseInt(e.target.value) || null })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={editingTestimonial.city || ''}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Depoimento</Label>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 border rounded-md bg-white dark:bg-neutral-800 dark:border-neutral-700"
                      value={editingTestimonial.content}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Avaliação (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={editingTestimonial.rating}
                        onChange={(e) => setEditingTestimonial({ ...editingTestimonial, rating: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Ordem</Label>
                      <Input
                        type="number"
                        value={editingTestimonial.order}
                        onChange={(e) => setEditingTestimonial({ ...editingTestimonial, order: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingTestimonial.isActive}
                      onCheckedChange={(checked) => setEditingTestimonial({ ...editingTestimonial, isActive: checked })}
                    />
                    <Label>Ativo</Label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingTestimonial(null)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={() => saveTestimonial(editingTestimonial)} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
