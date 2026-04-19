'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loading } from '@/components/ui/loading';
import { StepIndicator, CategoryStep } from '@/components/onboarding';
import { PROFILE_CATEGORIES } from '@/lib/profile-data';
import { Badge } from '@/components/ui/badge';
import { Heart, Sparkles, CheckCircle, ArrowRight, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface GovernanceInfo {
  fieldKey: string;
  requiredInOnboarding: boolean;
  visibleInOnboarding: boolean;
}

interface OnboardingState {
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  answers: Record<string, string[]>;
  preferences: Record<string, { values: string[]; importance: string }>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations('Onboarding');
  const { data: session, status } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showComplete, setShowComplete] = useState(false);

  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    completedSteps: [],
    skippedSteps: [],
    answers: {},
    preferences: {},
  });
  const [governanceMap, setGovernanceMap] = useState<Record<string, GovernanceInfo>>({});

  const categories = PROFILE_CATEGORIES.map((c) => ({
    id: c.slug,
    name: c.name,
    slug: c.slug,
    description: c.description,
    hasIAm: c.hasIAm,
    hasIWant: c.hasIWant,
  }));

  // Carregar progresso existente e governança
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const [progressRes, answersRes, prefsRes, govRes] = await Promise.all([
          fetch('/api/profile/onboarding'),
          fetch('/api/profile/answers'),
          fetch('/api/profile/preferences'),
          fetch('/api/profile/governance?context=onboarding'),
        ]);

        // Parse governance rules
        if (govRes.ok) {
          const { rules } = await govRes.json();
          const govMap: Record<string, GovernanceInfo> = {};
          for (const r of rules || []) {
            if (r.fieldType === 'category') {
              const slug = r.fieldKey.replace('cat:', '');
              govMap[slug] = {
                fieldKey: r.fieldKey,
                requiredInOnboarding: r.requiredInOnboarding,
                visibleInOnboarding: r.visibleInOnboarding,
              };
            }
          }
          setGovernanceMap(govMap);
        }

        if (progressRes.ok) {
          const { progress } = await progressRes.json();
          if (progress?.isComplete) {
            router.push('/app');
            return;
          }
          if (progress) {
            const stepIndex = categories.findIndex(
              (c) => c.slug === progress.currentStep
            );
            setState((prev) => ({
              ...prev,
              currentStep: stepIndex >= 0 ? stepIndex : 0,
              completedSteps: progress.completedSteps || [],
              skippedSteps: progress.skippedSteps || [],
            }));
            if (progress.completedSteps?.length > 0) {
              setShowIntro(false);
            }
          }
        }

        if (answersRes.ok) {
          const { answers } = await answersRes.json();
          // Transformar para formato simplificado
          const flatAnswers: Record<string, string[]> = {};
          for (const [cat, items] of Object.entries(answers || {})) {
            flatAnswers[cat] = (items as any[]).flatMap((i) => i.values || []);
          }
          setState((prev) => ({ ...prev, answers: flatAnswers }));
        }

        if (prefsRes.ok) {
          const { preferences } = await prefsRes.json();
          const flatPrefs: Record<string, { values: string[]; importance: string }> = {};
          for (const [cat, items] of Object.entries(preferences || {})) {
            const first = (items as any[])[0];
            if (first) {
              flatPrefs[cat] = {
                values: first.values || [],
                importance: first.importance || 'PREFERENCE',
              };
            }
          }
          setState((prev) => ({ ...prev, preferences: flatPrefs }));
        }
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadProgress();
    }
  }, [session, router]);

  // Salvar progresso
  const saveProgress = useCallback(async (completed?: string, skipped?: string, nextStep?: string) => {
    try {
      await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedStep: completed,
          skippedStep: skipped,
          currentStep: nextStep,
        }),
      });
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  }, []);

  // Salvar respostas da categoria atual
  const saveCurrentAnswers = useCallback(async () => {
    const category = categories[state.currentStep];
    if (!category) return;

    const categoryAnswers = state.answers[category.slug] || [];
    const categoryPrefs = state.preferences[category.slug];

    try {
      // Simplificar: salvar como um único optionId baseado no slug da categoria
      if (categoryAnswers.length > 0) {
        await fetch('/api/profile/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: [{
              optionId: `opt_${category.slug}`,
              values: categoryAnswers,
            }],
          }),
        });
      }

      if (categoryPrefs && categoryPrefs.values.length > 0) {
        await fetch('/api/profile/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: [{
              optionId: `opt_${category.slug}`,
              values: categoryPrefs.values,
              importance: categoryPrefs.importance,
            }],
          }),
        });
      }
    } catch (error) {
      console.error('Erro ao salvar respostas:', error);
    }
  }, [state, categories]);

  const handleNext = async () => {
    setSaving(true);
    const category = categories[state.currentStep];

    await saveCurrentAnswers();

    const newCompletedSteps = [...state.completedSteps];
    if (!newCompletedSteps.includes(category.slug)) {
      newCompletedSteps.push(category.slug);
    }

    if (state.currentStep >= categories.length - 1) {
      // Finalizar onboarding
      await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedStep: category.slug,
          isComplete: true,
        }),
      });
      setShowComplete(true);
    } else {
      const nextStep = categories[state.currentStep + 1]?.slug;
      await saveProgress(category.slug, undefined, nextStep);
      setState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        completedSteps: newCompletedSteps,
      }));
    }
    setSaving(false);
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    const category = categories[state.currentStep];

    const newSkippedSteps = [...state.skippedSteps];
    if (!newSkippedSteps.includes(category.slug)) {
      newSkippedSteps.push(category.slug);
    }

    if (state.currentStep >= categories.length - 1) {
      await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skippedStep: category.slug,
          isComplete: true,
        }),
      });
      setShowComplete(true);
    } else {
      const nextStep = categories[state.currentStep + 1]?.slug;
      await saveProgress(undefined, category.slug, nextStep);
      setState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        skippedSteps: newSkippedSteps,
      }));
    }
    setSaving(false);
  };

  const handleAnswersChange = (values: string[]) => {
    const category = categories[state.currentStep];
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [category.slug]: values },
    }));
  };

  const handlePreferencesChange = (prefs: { values: string[]; importance: string }) => {
    const category = categories[state.currentStep];
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [category.slug]: prefs },
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // Tela de conclusão
  if (showComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">
            {t('complete_title')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('complete_desc')}
          </p>
          <Button size="lg" onClick={() => router.push('/app')} className="gap-2">
            {t('complete_btn')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // Tela de introdução
  if (showIntro) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">
            {t('intro_title')}
          </h1>
          <p className="text-muted-foreground mb-4">
            {t('intro_desc')}
          </p>
          <Card className="p-4 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-left">
                <strong>{t('tip')}</strong> {t('intro_tip')}
              </p>
            </div>
          </Card>
          <Button size="lg" onClick={() => setShowIntro(false)} className="gap-2">
            {t('intro_btn')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentCategory = categories[state.currentStep];
  const currentGov = governanceMap[currentCategory?.slug];
  const isCurrentRequired = currentGov?.requiredInOnboarding ?? false;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <StepIndicator
            steps={categories}
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            skippedSteps={state.skippedSteps}
          />
          {/* Required badge */}
          {isCurrentRequired && (
            <div className="flex items-center justify-center mt-3">
              <Badge variant="error" className="text-xs gap-1">
                <Lock className="h-3 w-3" /> {t('required')}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <CategoryStep
            key={currentCategory.slug}
            category={currentCategory}
            answers={state.answers[currentCategory.slug] || []}
            preferences={state.preferences[currentCategory.slug] || { values: [], importance: 'PREFERENCE' }}
            onAnswersChange={handleAnswersChange}
            onPreferencesChange={handlePreferencesChange}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={isCurrentRequired ? undefined : handleSkip}
            isFirst={state.currentStep === 0}
            isLast={state.currentStep === categories.length - 1}
          />
        </AnimatePresence>

        {/* Saving indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4">
            <Card className="p-3 flex items-center gap-2 shadow-lg">
              <Loading size="sm" />
              <span className="text-sm">{t('saving')}</span>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
