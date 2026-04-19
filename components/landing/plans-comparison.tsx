'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Crown, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { trackCommercialEvent } from '@/lib/commercial-events';

interface PlansComparisonProps {
  plans: any[];
  onPlanClick: (location: string) => void;
}

const intervalLabels: Record<string, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  YEARLY: 'Anual'
};

const intervalOrder = ['MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY'];

export default function PlansComparison({ plans, onPlanClick }: PlansComparisonProps) {
  const [selectedInterval, setSelectedInterval] = useState('MONTHLY');

  // Filtrar intervalos disponíveis em todos os planos
  const availableIntervals = intervalOrder.filter(interval =>
    plans.some(plan => plan.planIntervals?.some((i: any) => i.interval === interval && i.isActive))
  );

  const getPrice = (plan: any, interval: string) => {
    const planInterval = plan.planIntervals?.find((i: any) => i.interval === interval && i.isActive);
    return planInterval?.price || plan.monthlyPrice || 0;
  };

  const getDiscount = (plan: any, interval: string) => {
    const planInterval = plan.planIntervals?.find((i: any) => i.interval === interval && i.isActive);
    return planInterval?.discountPercent || 0;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePlanClick = (plan: any) => {
    trackCommercialEvent({
      eventType: 'plan_click',
      planId: plan.id,
      planSlug: plan.slug,
      metadata: { interval: selectedInterval, source: 'landing' }
    });
    onPlanClick(`plan-${plan.slug}`);
  };

  // Agrupar features por módulo para comparação
  const allFeatures: { feature: any; limits: Record<string, any> }[] = [];
  
  plans.forEach(plan => {
    plan.featureLimits?.forEach((fl: any) => {
      const existing = allFeatures.find(f => f.feature.id === fl.feature.id);
      if (existing) {
        existing.limits[plan.id] = fl;
      } else {
        allFeatures.push({
          feature: fl.feature,
          limits: { [plan.id]: fl }
        });
      }
    });
  });

  allFeatures.sort((a, b) => {
    const orderA = Object.values(a.limits)[0]?.comparisonOrder || 0;
    const orderB = Object.values(b.limits)[0]?.comparisonOrder || 0;
    return orderA - orderB;
  });

  const renderFeatureValue = (fl: any) => {
    if (!fl || !fl.enabled) {
      return <X className="h-5 w-5 text-neutral-300" />;
    }
    if (fl.isUnlimited) {
      return <span className="text-green-600 font-medium">Ilimitado</span>;
    }
    if (fl.feature.type === 'BOOLEAN') {
      return <Check className="h-5 w-5 text-green-600" />;
    }
    // Check limitValue first (primary field), fallback to value
    const displayValue = fl.limitValue ?? fl.value;
    if (displayValue !== null && displayValue !== undefined && displayValue > 0) {
      return <span className="font-medium text-neutral-900 dark:text-white">{displayValue}</span>;
    }
    return <Check className="h-5 w-5 text-green-600" />;
  };

  return (
    <div className="space-y-8">
      {/* Seletor de periodicidade */}
      {availableIntervals.length > 1 && (
        <div className="flex justify-center">
          <div className="inline-flex bg-neutral-100 dark:bg-neutral-800 rounded-full p-1">
            {availableIntervals.map(interval => (
              <button
                key={interval}
                onClick={() => setSelectedInterval(interval)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  selectedInterval === interval
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                {intervalLabels[interval]}
                {interval !== 'MONTHLY' && plans.some(p => getDiscount(p, interval) > 0) && (
                  <span className="ml-1 text-green-600 text-xs">(-{Math.max(...plans.map(p => getDiscount(p, interval)))}%)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cards de planos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan, index) => {
          const price = getPrice(plan, selectedInterval);
          const discount = getDiscount(plan, selectedInterval);
          const isHighlighted = plan.isHighlighted;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative p-6 border-2 transition-all hover:shadow-xl',
                isHighlighted
                  ? 'border-rose-500 shadow-lg shadow-rose-500/10 scale-105'
                  : 'border-neutral-200 dark:border-neutral-700'
              )}
            >
              {isHighlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 px-4">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Mais popular
                  </Badge>
                </div>
              )}

              {plan.badge && !isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="px-3">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: plan.highlightColor ? `${plan.highlightColor}20` : '#f3f4f6' }}>
                  {plan.slug === 'gratuito' ? (
                    <Zap className="h-6 w-6" style={{ color: plan.highlightColor || '#6b7280' }} />
                  ) : (
                    <Crown className="h-6 w-6" style={{ color: plan.highlightColor || '#f59e0b' }} />
                  )}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{plan.name}</h3>
                {plan.shortDescription && (
                  <p className="text-sm text-neutral-500 mt-1">{plan.shortDescription}</p>
                )}
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                    {price === 0 ? 'Grátis' : formatPrice(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-neutral-500">/{intervalLabels[selectedInterval].toLowerCase()}</span>
                  )}
                </div>
                {discount > 0 && (
                  <Badge className="mt-2 bg-green-100 text-green-700 border-0">
                    Economia de {discount}%
                  </Badge>
                )}
              </div>

              <Link href={plan.slug === 'gratuito' ? '/cadastro' : `/planos?plan=${plan.slug}`}>
                <Button
                  onClick={() => handlePlanClick(plan)}
                  className={cn(
                    'w-full mb-6',
                    isHighlighted
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600'
                      : ''
                  )}
                  variant={isHighlighted ? 'default' : 'outline'}
                >
                  {plan.slug === 'gratuito' ? 'Comece grátis' : 'Assinar agora'}
                </Button>
              </Link>

              <ul className="space-y-3">
                {plan.featureLimits?.slice(0, 6).map((fl: any) => (
                  <li key={fl.id} className="flex items-center gap-3 text-sm">
                    {fl.enabled ? (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-neutral-300 flex-shrink-0" />
                    )}
                    <span className={cn(
                      fl.enabled ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400'
                    )}>
                      {fl.comparisonLabel || fl.feature.name}
                      {fl.enabled && (fl.limitValue || fl.value) && !fl.isUnlimited && fl.feature.type === 'LIMIT' && (
                        <span className="text-neutral-500"> ({fl.limitValue || fl.value})</span>
                      )}
                      {fl.enabled && fl.isUnlimited && (
                        <span className="text-green-600"> (ilimitado)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Tabela comparativa detalhada */}
      {allFeatures.length > 0 && (
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-8">
            Comparação detalhada
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-4 px-4 text-neutral-600 dark:text-neutral-400 font-medium">
                    Funcionalidade
                  </th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-4">
                      <span className={cn(
                        'font-semibold',
                        plan.isHighlighted ? 'text-rose-600' : 'text-neutral-900 dark:text-white'
                      )}>
                        {plan.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map(({ feature, limits }) => (
                  <tr key={feature.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-4 px-4 text-neutral-700 dark:text-neutral-300">
                      {limits[plans[0]?.id]?.comparisonLabel || feature.name}
                    </td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {renderFeatureValue(limits[plan.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
