'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Heart, Crown, Zap, Check, X, ArrowRight, ArrowLeft,
  Shield, Sparkles, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { trackCommercialEvent } from '@/lib/commercial-events';

interface PlansPageProps {
  plans: any[];
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

export default function PlansPage({ plans }: PlansPageProps) {
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get('plan');
  const [selectedInterval, setSelectedInterval] = useState('MONTHLY');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(preselectedPlan);

  useEffect(() => {
    trackCommercialEvent({ eventType: 'plan_compare_view', page: '/planos' });
  }, []);

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

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan.slug);
    trackCommercialEvent({
      eventType: 'plan_click',
      planId: plan.id,
      planSlug: plan.slug,
      metadata: { interval: selectedInterval, source: 'plans_page' }
    });
  };

  const handleProceedToCheckout = () => {
    const plan = plans.find(p => p.slug === selectedPlan);
    if (plan) {
      trackCommercialEvent({
        eventType: 'subscribe_click',
        planId: plan.id,
        planSlug: plan.slug,
        metadata: { interval: selectedInterval }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Ever</span>
              <span className="text-neutral-900 dark:text-white">NOW</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/cadastro">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white mb-8">
            <ArrowLeft className="h-4 w-4" />
            Voltar para a página inicial
          </Link>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
              <Crown className="h-4 w-4 mr-2" />
              Escolha seu plano
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Encontre o plano perfeito para você
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Comece grátis ou desbloqueie recursos premium para maximizar suas chances de encontrar alguém especial.
            </p>
          </motion.div>

          {/* Interval selector */}
          {availableIntervals.length > 1 && (
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-neutral-100 dark:bg-neutral-800 rounded-full p-1">
                {availableIntervals.map(interval => (
                  <button
                    key={interval}
                    onClick={() => setSelectedInterval(interval)}
                    className={cn(
                      'px-5 py-2.5 rounded-full text-sm font-medium transition-all',
                      selectedInterval === interval
                        ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    )}
                  >
                    {intervalLabels[interval]}
                    {interval !== 'MONTHLY' && plans.some(p => getDiscount(p, interval) > 0) && (
                      <span className="ml-1 text-primary text-xs">(-{Math.max(...plans.map(p => getDiscount(p, interval)))}%)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className={cn(
            "grid gap-6 mx-auto",
            plans.length === 1 ? "max-w-md" :
              plans.length === 2 ? "max-w-4xl md:grid-cols-2" :
                "max-w-5xl md:grid-cols-2 lg:grid-cols-3"
          )}>
            {plans.map((plan) => {
              const price = getPrice(plan, selectedInterval);
              const discount = getDiscount(plan, selectedInterval);
              const isHighlighted = plan.isHighlighted;
              const isSelected = selectedPlan === plan.slug;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    onClick={() => handleSelectPlan(plan)}
                    className={cn(
                      'relative p-6 cursor-pointer transition-all border-2 flex flex-col h-full',
                      isSelected
                        ? 'border-indigo-600 shadow-xl shadow-indigo-600/10'
                        : isHighlighted
                          ? 'border-indigo-200 shadow-lg'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300',
                      isHighlighted && 'scale-105'
                    )}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge variant="premium" className="px-4 shadow-lg border-0">
                          <Star className="h-3 w-3 mr-1" fill="white" />
                          Mais popular
                        </Badge>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div
                        className="h-14 w-14 rounded-xl mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: plan.highlightColor ? `${plan.highlightColor}20` : '#f3f4f6' }}
                      >
                        {plan.slug === 'gratuito' ? (
                          <Zap className="h-7 w-7" style={{ color: plan.highlightColor || '#6b7280' }} />
                        ) : (
                          <Crown className="h-7 w-7" style={{ color: plan.highlightColor || '#f59e0b' }} />
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{plan.name}</h2>
                      {plan.shortDescription && (
                        <p className="text-neutral-500 mt-1">{plan.shortDescription}</p>
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
                        <Badge className="mt-2 bg-primary/10 text-primary border-0">
                          Economia de {discount}%
                        </Badge>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.featureLimits?.slice(0, 6).map((fl: any) => (
                        <li key={fl.id} className="flex items-center gap-3 text-sm">
                          {fl.enabled ? (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-neutral-300 flex-shrink-0" />
                          )}
                          <span className={cn(
                            fl.enabled ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400'
                          )}>
                            {fl.comparisonLabel || fl.feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelected) handleSelectPlan(plan);
                      }}
                      disabled={isSelected}
                      className={cn(
                        'w-full mt-auto',
                        isSelected || isHighlighted
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                          : ''
                      )}
                      variant={isSelected || isHighlighted ? 'default' : 'outline'}
                    >
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Continue button */}
          {selectedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 text-center"
            >
              <Link
                href={selectedPlan === 'gratuito' ? '/cadastro' : `/checkout?plan=${selectedPlan}&interval=${selectedInterval}`}
                onClick={handleProceedToCheckout}
              >
                <Button
                  size="lg"
                  className="text-lg px-10 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-full shadow-xl shadow-indigo-600/25"
                >
                  {selectedPlan === 'gratuito' ? 'Criar conta gratuita' : 'Continuar para pagamento'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Features comparison */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-8">
              Comparação detalhada
            </h2>
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-neutral-600 dark:text-neutral-400">
                        Funcionalidade
                      </th>
                      {plans.map(plan => (
                        <th key={plan.id} className="text-center py-4 px-6">
                          <span className={cn(
                            'font-semibold',
                            plan.isHighlighted ? 'text-indigo-600' : 'text-neutral-900 dark:text-white'
                          )}>
                            {plan.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plans[0]?.featureLimits?.map((fl: any, index: number) => (
                      <tr key={fl.id} className={cn(
                        'border-t border-neutral-100 dark:border-neutral-700',
                        index % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50/50 dark:bg-neutral-800/50'
                      )}>
                        <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300">
                          {fl.comparisonLabel || fl.feature.name}
                        </td>
                        {plans.map(plan => {
                          const planFl = plan.featureLimits?.find((pfl: any) => pfl.feature.id === fl.feature.id);
                          return (
                            <td key={plan.id} className="text-center py-4 px-6">
                              {!planFl || !planFl.enabled ? (
                                <X className="h-5 w-5 text-neutral-300 mx-auto" />
                              ) : planFl.isUnlimited ? (
                                <span className="text-primary font-medium">Ilimitado</span>
                              ) : planFl.feature.type === 'BOOLEAN' ? (
                                <Check className="h-5 w-5 text-primary mx-auto" />
                              ) : (planFl.limitValue || planFl.value) ? (
                                <span className="font-medium text-neutral-900 dark:text-white">{planFl.limitValue || planFl.value}</span>
                              ) : (
                                <Check className="h-5 w-5 text-primary mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Guarantee */}
          <div className="mt-16 text-center">
            <Card className="inline-flex items-center gap-4 p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Shield className="h-10 w-10 text-green-600" />
              <div className="text-left">
                <p className="font-semibold text-neutral-900 dark:text-white">Garantia de 7 dias</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Cancele a qualquer momento e receba reembolso total.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold">EverNOW</span>
          </div>
          <p className="text-sm text-neutral-500">
            © 2026 EverNOW. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
