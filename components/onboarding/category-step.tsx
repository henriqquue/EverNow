'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptionSelector } from './option-selector';
import { ImportanceSelector } from './importance-selector';
import { RadixTabs as Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PROFILE_OPTIONS, type CategorySlug } from '@/lib/profile-data';
import { ArrowLeft, ArrowRight, SkipForward, User, Search } from 'lucide-react';

interface CategoryStepProps {
  category: {
    slug: string;
    name: string;
    description?: string;
    hasIAm: boolean;
    hasIWant: boolean;
  };
  answers: string[];
  preferences: { values: string[]; importance: string };
  onAnswersChange: (values: string[]) => void;
  onPreferencesChange: (prefs: { values: string[]; importance: string }) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function CategoryStep({
  category,
  answers,
  preferences,
  onAnswersChange,
  onPreferencesChange,
  onNext,
  onBack,
  onSkip,
  isFirst,
  isLast,
}: CategoryStepProps) {
  const [activeTab, setActiveTab] = useState<'iam' | 'iwant'>('iam');
  const options = PROFILE_OPTIONS[category.slug as CategorySlug] || [];

  // Para categorias que só tem EU SOU ou só tem EU QUERO
  const showTabs = category.hasIAm && category.hasIWant;

  // Transformar opções para o componente
  const transformedOptions = options.map((opt) => ({
    name: opt.name,
    slug: opt.slug,
    icon: opt.icon,
    children: opt.children?.map((c) => ({
      name: c.name,
      slug: c.slug,
    })),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {category.name}
        </h2>
        {category.description && (
          <p className="text-muted-foreground mt-2">{category.description}</p>
        )}
      </div>

      {/* Content */}
      <Card className="p-6">
        {showTabs ? (
          <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'iam' | 'iwant')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="iam" className="gap-2">
                <User className="w-4 h-4" />
                Eu sou
              </TabsTrigger>
              <TabsTrigger value="iwant" className="gap-2">
                <Search className="w-4 h-4" />
                Eu quero
              </TabsTrigger>
            </TabsList>

            <TabsContent value="iam" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecione as opções que descrevem você
              </p>
              <OptionSelector
                options={transformedOptions}
                selected={answers}
                onSelect={onAnswersChange}
                multiple={true}
                showSearch={options.length > 10}
              />
            </TabsContent>

            <TabsContent value="iwant" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecione as opções que você busca em alguém
              </p>
              <OptionSelector
                options={transformedOptions}
                selected={preferences.values}
                onSelect={(values) =>
                  onPreferencesChange({ ...preferences, values })
                }
                multiple={true}
                showSearch={options.length > 10}
              />
              {preferences.values.length > 0 && (
                <div className="pt-4 border-t">
                  <ImportanceSelector
                    value={preferences.importance}
                    onChange={(importance) =>
                      onPreferencesChange({ ...preferences, importance })
                    }
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : category.hasIAm ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Selecione as opções que descrevem você
            </p>
            <OptionSelector
              options={transformedOptions}
              selected={answers}
              onSelect={onAnswersChange}
              multiple={true}
              showSearch={options.length > 10}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Selecione as opções que você busca
            </p>
            <OptionSelector
              options={transformedOptions}
              selected={preferences.values}
              onSelect={(values) =>
                onPreferencesChange({ ...preferences, values })
              }
              multiple={true}
              showSearch={options.length > 10}
            />
          </div>
        )}
      </Card>

      {/* Motivation message */}
      <p className="text-center text-sm text-muted-foreground italic">
        “Você investe alguns minutos agora para não perder tempo depois recebendo pessoas fora do perfil que busca.”
      </p>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isFirst}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {onSkip && (
          <Button variant="ghost" onClick={onSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Pular
          </Button>
        )}

        <Button onClick={onNext} className="gap-2">
          {isLast ? 'Concluir' : 'Próximo'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
