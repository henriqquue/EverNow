"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  User,
  Camera,
  Save,
  Plus,
  Sparkles,
  Briefcase,
  MapPin,
  GraduationCap,
  Languages,
  Info,
  Check,
  ChevronsUpDown,
  Trash2,
  X,
  ChevronRight
} from "lucide-react";

const COMMON_LANGUAGES = [
  "Alemão", "Árabe", "Coreano", "Espanhol", "Francês",
  "Inglês", "Italiano", "Japonês", "Libras", "Mandarim",
  "Português", "Russo"
];

import { motion, AnimatePresence } from "framer-motion";
import { PROFILE_CATEGORIES } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const t = useTranslations('Profile');
  const tCat = useTranslations('ProfileCategories');
  const common = useTranslations('Common');
  
  const OPTION_NAME_TO_SLUG: Record<string, string> = {
    "Relacionamento sério": "relacionamento-serio", "Namoro": "namoro", "Date": "date", "Casual": "casual", "Amizade": "amizade", "Ainda não sei": "ainda-nao-sei",
    "Magro": "magro", "Atlético": "atletico", "Musculoso": "musculoso", "Corpo médio": "corpo-medio", "Curvilíneo": "curvilineo", "Plus size": "plus-size",
    "Não tenho filhos": "sem-filhos", "Tenho filhos": "com-filhos", "Quero filhos": "quer-filhos", "Não quero filhos": "nao-quer-filhos", "Aceito alguém com filhos": "aceita-filhos",
    "Católico": "catolico", "Evangélico": "evangelico", "Espírita": "espirita", "Agnóstico": "agnostico", "Ateu": "ateu", "Outro": "outro",
    "Sedentário": "sedentario", "Moderado": "moderado", "Atleta": "atleta", "Academia": "academia", "Caseiro": "caseiro", "Vida noturna": "vida-noturna", "Viajar": "viajar",
    "Não fumo": "nao-fumo", "Fumo": "fumo", "Não bebo": "nao-bebo", "Bebo socialmente": "bebo-socialmente", "Vegetariano": "vegetariano", "Vegano": "vegano",
    "Rock": "rock", "Pop": "pop", "MPB": "mpb", "Sertanejo": "sertanejo", "Eletrônica": "eletronica", "Hip Hop": "hip-hop", "Gospel": "gospel",
    "Tenho cachorro": "tenho-cachorro", "Tenho gato": "tenho-gato", "Amo animais": "amo-animais", "Prefiro sem animais": "prefiro-sem",
    "Café": "cafe", "Restaurante": "restaurante", "Bar": "bar", "Cinema": "cinema", "Caminhada": "caminhada", "Viagem": "viagem"
  };

  const LANGUAGE_KEYS: Record<string, string> = {
    "Alemão": "de", "Árabe": "ar", "Coreano": "ko", "Espanhol": "es", "Francês": "fr",
    "Inglês": "en", "Italiano": "it", "Japonês": "ja", "Libras": "libras", "Mandarim": "zh",
    "Português": "pt", "Russo": "ru"
  };

  const tLang = useTranslations('Languages');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState<Record<number, boolean>>({});


  // Estados para Localização (Estático)
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Estados para Categorias (Tinder-like)
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [userAnswersMap, setUserAnswersMap] = useState<Record<string, boolean>>({});
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [tempAnswersMap, setTempAnswersMap] = useState<Record<string, boolean>>({});
  const [savingCategory, setSavingCategory] = useState(false);

  // Estados para "Sugerir Melhorias"
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  // Estado unificado com todas as seções: Básica, Profissional e Localização
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    work: "",
    education: "",
    city: "",
    state: "",
    country: "",
    languages: [] as string[],
    birthDate: "",
    gender: "",
    lookingFor: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`/api/profile/${session.user.id}`);
        if (res.ok) {
          const { profile: p } = await res.json();
          setProfile(p);
          setFormData({
            name: p.name || "",
            bio: p.bio || "",
            work: p.work || "",
            education: p.education || "",
            city: p.city || "",
            state: p.state || "",
            country: p.country || "",
            languages: Array.isArray(p.languages) ? p.languages : [],
            birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : "",
            gender: p.gender || "",
            lookingFor: p.lookingFor || ""
          });
        }
      } finally {
        setLoading(false);
      }
    };

    const loadCategoriesAndAnswers = async () => {
      try {
        const [catsRes, ansRes] = await Promise.all([
          fetch('/api/profile/categories'),
          fetch('/api/profile/answers')
        ]);
        if (catsRes.ok) {
          const { categories } = await catsRes.json();
          setDbCategories(categories);
        }
        if (ansRes.ok) {
          const { answers } = await ansRes.json();
          const map: Record<string, boolean> = {};
          Object.values(answers).forEach((catAnswers: any) => {
            catAnswers.forEach((ans: any) => {
              map[ans.optionId] = true;
            });
          });
          setUserAnswersMap(map);
        }
      } catch (err) {
        console.error('Erro ao carregar categorias e respostas:', err);
      }
    };

    loadProfile();
    loadCategoriesAndAnswers();
  }, [session]);


  const [languagesOpen, setLanguagesOpen] = useState(false);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setPhotoLoading(prev => ({ ...prev, [index]: true }));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("index", index.toString());

    try {
      const res = await fetch("/api/profile/photo", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev: any) => {
          const newPhotos = [...(prev?.photos || ["", "", "", "", "", ""])];
          newPhotos[index] = data.url;
          return { ...prev, photos: newPhotos };
        });
        setSaveMsg(t('photo_updated'));
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Erro upload:", errData);
        setSaveMsg(`${common('error')}: ${errData?.details || errData?.error || "Falha no servidor"}`);
      }
    } catch (err: any) {
      console.error("Erro fatal upload:", err);
      setSaveMsg(`${common('error')}: ${err.message}`);
    } finally {
      setPhotoLoading(prev => ({ ...prev, [index]: false }));
      setTimeout(() => setSaveMsg(null), 5000);
    }
  };


  const onDeletePhoto = async (index: number) => {
    if (!session?.user?.id) return;

    setPhotoLoading(prev => ({ ...prev, [index]: true }));
    try {
      const res = await fetch(`/api/profile/photo?index=${index}`, { method: "DELETE" });
      if (res.ok) {
        setProfile((prev: any) => {
          const newPhotos = [...(prev?.photos || ["", "", "", "", "", ""])];
          newPhotos[index] = "";
          return { ...prev, photos: newPhotos };
        });
        setSaveMsg(t('photo_removed'));

        const profRes = await fetch(`/api/profile/${session?.user?.id}`);
        if (profRes.ok) {
          const { profile: p } = await profRes.json();
          setProfile(p);
        }
      }
    } catch (err) {
      console.error("Erro ao deletar foto:", err);
    } finally {
      setPhotoLoading(prev => ({ ...prev, [index]: false }));
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${session?.user?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photos: profile?.photos || [] }),
      });

      if (res.ok) {
        setSaveMsg(t('save_success'));
        const profRes = await fetch(`/api/profile/${session?.user?.id}`);
        if (profRes.ok) {
          const { profile: p } = await profRes.json();
          setProfile(p);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaveMsg(`${common('error')}: ${errData?.details || errData?.error || common('unknown_error')}`);
      }
    } catch (err: any) {
      setSaveMsg(`${common('error')}: ${err?.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const openCategoryModal = (catSlug: string) => {
    const cat = dbCategories.find(c => c.slug === catSlug);
    if (!cat) return;
    setEditingCategory(cat);
    setTempAnswersMap({ ...userAnswersMap });
  };

  const toggleOption = (optionId: string, isMultiple: boolean) => {
    setTempAnswersMap(prev => {
      const next = { ...prev };
      if (!isMultiple) {
        editingCategory.options.forEach((opt: any) => {
          if (opt.id !== optionId) delete next[opt.id];
        });
      }
      if (next[optionId]) {
        delete next[optionId];
      } else {
        next[optionId] = true;
      }
      return next;
    });
  };

  const saveCategoryAnswers = async () => {
    if (!editingCategory) return;
    setSavingCategory(true);
    try {
      const payloadAnswers = Object.keys(tempAnswersMap).map(optId => ({ optionId: optId }));
      const res = await fetch("/api/profile/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payloadAnswers })
      });

      if (res.ok) {
        setUserAnswersMap(tempAnswersMap);
        setEditingCategory(null);
        setSaveMsg(t('category_updated'));
        const profRes = await fetch(`/api/profile/${session?.user?.id}`);
        if (profRes.ok) {
          const { profile: p } = await profRes.json();
          setProfile(p);
        }
      }
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
    } finally {
      setSavingCategory(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const getSelectedOptionNames = (catSlug: string) => {
    const cat = dbCategories.find(c => c.slug === catSlug);
    if (!cat) return [];
    return cat.options
      .filter((opt: any) => userAnswersMap[opt.id])
      .map((opt: any) => opt.name);
  };

  const getSuggestions = () => {
    const suggestions = [];
    if (!profile?.photos || profile.photos.length === 0) {
      suggestions.push({ id: 'photos', text: t('suggestion_photos'), action: t('action_add_photo') });
    }
    if (!formData.bio || formData.bio.trim() === '') {
      suggestions.push({ id: 'bio', text: t('suggestion_bio'), action: t('action_write_bio') });
    }
    if (!formData.city || !formData.state) {
      suggestions.push({ id: 'location', text: t('suggestion_location'), action: t('action_add_location') });
    }
    if (!formData.work || formData.work.trim() === '') {
      suggestions.push({ id: 'work', text: t('suggestion_work'), action: t('action_fill_work') });
    }
    if (formData.languages.length === 0) {
      suggestions.push({ id: 'languages', text: t('suggestion_languages'), action: t('action_add_languages') });
    }

    if (!formData.birthDate) {
      suggestions.push({ id: 'birthDate', text: t('suggestion_birthdate'), action: t('action_fill_date') });
    }
    if (!formData.gender) {
      suggestions.push({ id: 'gender', text: t('suggestion_gender'), action: t('action_fill_gender') });
    }
    if (!formData.lookingFor) {
      suggestions.push({ id: 'lookingFor', text: t('suggestion_looking_for'), action: t('action_fill_looking') });
    }

    const visibleCategories = dbCategories.filter(cat =>
      cat.options.length > 0 &&
      !['basico', 'intencao', 'profissao'].includes(cat.slug)
    );

    const categoriesAnsweredCount = visibleCategories.filter(cat =>
      cat.options.some((opt: any) => userAnswersMap[opt.id])
    ).length;

    if (categoriesAnsweredCount < visibleCategories.length && visibleCategories.length > 0) {
      const missing = visibleCategories.length - categoriesAnsweredCount;
      suggestions.push({
        id: 'categories',
        text: t('suggestion_categories', { count: missing }),
        action: t('action_complete_all')
      });
    }

    return suggestions;
  };

  const handleSuggestionAction = (id: string) => {
    setSuggestionsOpen(false);
    setTimeout(() => {
      const element = document.getElementById(`section-${id}`);
      if (element) {
        const offset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-4', 'rounded-xl', 'transition-all', 'duration-500');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-4');
        }, 2500);
      }
    }, 300);
  };

  if (loading) return <div className="p-10 text-center"><Loading /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 pb-24">

      {/* HEADER PRINCIPAL */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            <User className="w-7 h-7 text-purple-600" />
            {t('title')}
          </h1>
          <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-md"
          onClick={() => setSuggestionsOpen(true)}
        >
          <Sparkles size={16} /> {t('suggest_improvements')}
        </Button>
      </div>

      {/* SEÇÃO 1: GESTÃO DE FOTOS */}
      <div className="space-y-6" id="section-photos">
        <div className="flex justify-center">
          <label className="relative cursor-pointer group">
            <div className="w-36 h-36 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 flex items-center justify-center relative">
              {photoLoading[0] ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loading size="sm" />
                </div>
              ) : null}
              {profile?.photos?.[0] ? (
                <img src={profile.photos[0]} className="w-full h-full object-cover" alt={t('photo_main')} />
              ) : (
                <User size={54} className="text-gray-300" />
              )}
            </div>
            <input type="file" className="hidden" onChange={(e) => onUpload(e, 0)} accept="image/*" disabled={photoLoading[0]} />
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <div className="flex gap-2">
                <Camera className="text-white" />
                {profile?.photos?.[0] && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeletePhoto(0); }}
                    className="p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </label>
        </div>

        <Card className="border-none shadow-sm bg-gray-50/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Camera size={16} className="text-indigo-600" /> {t('photo_gallery')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <label key={i} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-white overflow-hidden group transition-all relative">
                {photoLoading[i] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                    <Loading size="sm" />
                  </div>
                )}
                {profile?.photos?.[i] ? (
                  <div className="relative w-full h-full group/photo">
                    <img src={profile.photos[i]} className="w-full h-full object-cover" alt={`${t('photo_alt')} ${i}`} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeletePhoto(i); }}
                        className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <Plus className="text-gray-300 group-hover:text-indigo-400" />
                )}

                <input type="file" className="hidden" onChange={(e) => onUpload(e, i)} accept="image/*" disabled={photoLoading[i]} />
              </label>

            ))}
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 2: PROGRESSO E CATEGORIAS */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-none shadow-sm bg-indigo-50/30">
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-end text-sm font-bold">
              <span className="text-indigo-900">{t('profile_strength')}</span>
              <span className="text-indigo-600">{profile?.profileComplete || 0}%</span>
            </div>
            <Progress value={profile?.profileComplete || 0} className="h-2 bg-indigo-100" />
            <p className="text-[11px] text-indigo-700/70 leading-tight">
              {t('profile_strength_desc')}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm" id="section-categories">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info size={16} className="text-gray-400" /> {t('categories')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROFILE_CATEGORIES.filter(c => c.slug !== 'basico' && c.slug !== 'intencao' && c.slug !== 'profissao').map(cat => {
              const selectedNames = getSelectedOptionNames(cat.slug);
              return (
                <div
                  key={cat.slug}
                  onClick={() => openCategoryModal(cat.slug)}
                  className="p-2 border rounded-lg bg-white text-center cursor-pointer hover:border-indigo-400 hover:shadow-sm transition-all"
                >
                  <p className="text-[10px] font-bold truncate mb-1">
                    {tCat.has(`cat_${cat.slug}` as any) ? tCat(`cat_${cat.slug}` as any) : cat.name}
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {selectedNames.length > 0 ? (
                      selectedNames.slice(0, 2).map((name: string) => {
                        const optionSlug = OPTION_NAME_TO_SLUG[name];
                        const translatedLabel = optionSlug && tCat.has(`opt_${optionSlug}` as any) ? tCat(`opt_${optionSlug}` as any) : name;
                        return (
                          <Badge key={name} variant="default" className="text-[8px] h-4 font-normal px-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                            {translatedLabel}
                          </Badge>
                        );
                      })
                    ) : (
                      <Badge variant="secondary" className="text-[8px] h-4">{t('empty')}</Badge>
                    )}
                    {selectedNames.length > 2 && (
                      <span className="text-[8px] text-gray-500 font-medium pt-0.5">+{selectedNames.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: FORMULÁRIO - INFORMAÇÕES BÁSICAS */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User size={18} className="text-indigo-600" /> {t('basic_info')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{t('display_name')}</label>
              <Input placeholder={t('display_name')} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5" id="section-birthDate">
              <label className="text-xs font-medium text-gray-500">{t('birth_date')}</label>
              <Input type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5" id="section-gender">
              <label className="text-xs font-medium text-gray-500">{t('gender')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">{t('select')}</option>
                <option value="MALE">{t('gender_male')}</option>
                <option value="FEMALE">{t('gender_female')}</option>
                <option value="OTHER">{t('gender_other')}</option>
                <option value="PREFER_NOT_SAY">{t('gender_prefer_not_say')}</option>
              </select>
            </div>
            <div className="space-y-1.5" id="section-lookingFor">
              <label className="text-xs font-medium text-gray-500">{t('looking_for')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                value={formData.lookingFor}
                onChange={e => setFormData({ ...formData, lookingFor: e.target.value })}
              >
                <option value="">{t('select')}</option>
                <option value="SERIOUS">{t('looking_serious')}</option>
                <option value="CASUAL">{t('looking_casual')}</option>
                <option value="FRIENDSHIP">{t('looking_friendship')}</option>
                <option value="OPEN">{t('looking_open')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5" id="section-bio">
            <label className="text-xs font-medium text-gray-500">{t('bio')}</label>
            <textarea
              className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 min-h-[80px]"
              placeholder={t('bio_placeholder')}
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5" id="section-work">
              <label className="text-xs font-medium text-gray-500">{t('work')}</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  className="pl-10"
                  placeholder={t('work_placeholder')}
                  value={formData.work}
                  onChange={e => setFormData({ ...formData, work: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{t('education')}</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  className="pl-10"
                  placeholder={t('education_placeholder')}
                  value={formData.education}
                  onChange={e => setFormData({ ...formData, education: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5" id="section-languages">
            <label className="text-xs font-medium text-gray-500">{t('languages')}</label>
            <Popover open={languagesOpen} onOpenChange={setLanguagesOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal hover:bg-indigo-50/50">
                  <div className="flex gap-1 flex-wrap">
                    {formData.languages.length > 0 ? (
                      formData.languages.map(lang => (
                        <Badge key={lang} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1">
                          {tLang.has(LANGUAGE_KEYS[lang] as any) ? tLang(LANGUAGE_KEYS[lang] as any) : lang}
                          <X size={10} className="cursor-pointer" onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
                          }} />
                        </Badge>
                      ))
                    ) : t('languages_placeholder')}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-white" align="start">
                <Command>
                  <CommandInput placeholder={t('search_languages')} />
                  <CommandList>
                    <CommandEmpty>{t('no_languages_found')}</CommandEmpty>
                    <CommandGroup>
                      {COMMON_LANGUAGES.map((lang) => (
                        <CommandItem
                          key={lang}
                          value={lang}
                          onSelect={() => {
                            const newLangs = formData.languages.includes(lang)
                              ? formData.languages.filter(l => l !== lang)
                              : [...formData.languages, lang];
                            setFormData({ ...formData, languages: newLangs });
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", formData.languages.includes(lang) ? "opacity-100" : "opacity-0")} />
                          {tLang.has(LANGUAGE_KEYS[lang] as any) ? tLang(LANGUAGE_KEYS[lang] as any) : lang}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 5: FORMULÁRIO - LOCALIZAÇÃO */}
      <Card className="border-none shadow-sm" id="section-location">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MapPin size={18} className="text-indigo-600" /> {t('location')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{t('city_placeholder')}</label>
              <Input
                placeholder={t('city_placeholder')}
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{t('country')}</label>
              <Input
                placeholder={t('country_placeholder')}
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-400">{t('city_select_hint')}</p>
        </CardContent>
      </Card>

      {/* BARRA DE AÇÕES FIXA NO RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t flex justify-end items-center gap-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <AnimatePresence>
          {saveMsg && (
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "text-sm font-bold flex items-center gap-1",
                saveMsg.toLowerCase().includes("erro") ? "text-red-600" : "text-green-600"
              )}
            >
              {saveMsg.toLowerCase().includes("erro") ? <X size={14} /> : <Check size={14} />}
              {saveMsg}
            </motion.span>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 px-10 font-bold transition-all active:scale-95"
          >
            {saving ? <Loading size="sm" /> : (
              <span className="flex items-center gap-2">
                <Save size={16} /> {common('save')}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* MODAL DE CATEGORIA */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 pb-2 text-left bg-gray-50/50">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-950">
              {editingCategory?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {editingCategory?.description || t('category_modal_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {editingCategory?.options?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editingCategory.options.map((opt: any) => {
                  const isSelected = !!tempAnswersMap[opt.id];
                  const optionSlug = OPTION_NAME_TO_SLUG[opt.name];
                  const translatedOpt = optionSlug && tCat.has(`opt_${optionSlug}` as any) ? tCat(`opt_${optionSlug}` as any) : opt.name;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt.id, opt.isMultiple)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 active:scale-95",
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                      )}
                    >
                      {translatedOpt}
                    </button>
                  );
                })}
              </div>
            ) : <p className="text-center text-gray-400 py-10">{t('no_options')}</p>}
          </div>

          <DialogFooter className="p-4 bg-gray-50/50 border-t">
            <Button variant="ghost" onClick={() => setEditingCategory(null)} disabled={savingCategory}>{common('cancel')}</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8"
              onClick={saveCategoryAnswers}
              disabled={savingCategory}
            >
              {savingCategory ? <Loading size="sm" /> : common('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE SUGESTÕES */}
      <Dialog open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              {t('suggestions_title')}
            </DialogTitle>
            <DialogDescription className="text-indigo-100/80">
              {t('suggestions_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {getSuggestions().length > 0 ? (
              getSuggestions().map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSuggestionAction(s.id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-indigo-50 bg-indigo-50/30 hover:bg-indigo-50 transition-colors cursor-pointer group"
                >
                  <p className="text-sm font-medium text-indigo-900 group-hover:text-indigo-700">{s.text}</p>
                  <ChevronRight size={16} className="text-indigo-300 group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="text-green-600 w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-gray-600">{t('profile_perfect')}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
