'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Heart, Crown, ArrowLeft, CreditCard, Lock, Check, Shield,
  Sparkles, Tag, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { trackCommercialEvent } from '@/lib/commercial-events';

const intervalLabels: Record<string, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  YEARLY: 'Anual'
};

interface CouponData {
  id: string;
  code: string;
  name: string;
  type: string;
  discountPercent?: number;
  discountAmount?: number;
  trialDays?: number;
}

interface CouponDiscount {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountDescription: string;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession() || {};
  const planSlug = searchParams.get('plan');
  const interval = searchParams.get('interval') || 'MONTHLY';
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<CouponDiscount | null>(null);

  useEffect(() => {
    trackCommercialEvent({ eventType: 'checkout_view', page: '/checkout', planSlug: planSlug || undefined });
    
    const fetchPlan = async () => {
      if (!planSlug) {
        router.replace('/planos');
        return;
      }

      try {
        const res = await fetch(`/api/plans/${planSlug}`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data);
        } else {
          router.replace('/planos');
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
        router.replace('/planos');
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planSlug, router]);

  const getPrice = () => {
    if (!plan) return 0;
    const planInterval = plan.planIntervals?.find((i: any) => i.interval === interval && i.isActive);
    return planInterval?.price || plan.monthlyPrice || 0;
  };

  const getDiscount = () => {
    if (!plan) return 0;
    const planInterval = plan.planIntervals?.find((i: any) => i.interval === interval && i.isActive);
    return planInterval?.discountPercent || 0;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setValidatingCoupon(true);
    setCouponError('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          planSlug,
          billingInterval: interval,
          amount: getPrice(),
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponDiscount(data.discount);
        setCouponError('');
      } else {
        setCouponError(data.error || 'Cupom inválido');
        setAppliedCoupon(null);
        setCouponDiscount(null);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Erro ao validar cupom');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(null);
    setPromoCode('');
    setCouponError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    trackCommercialEvent({
      eventType: 'subscribe_click',
      planId: plan?.id,
      planSlug: plan?.slug,
      metadata: { interval, couponCode: appliedCoupon?.code }
    });

    // If coupon applied, create redemption record
    if (appliedCoupon && session?.user?.id) {
      try {
        await fetch('/api/coupons/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            couponId: appliedCoupon.id,
            planSlug,
            billingInterval: interval,
            amount: getPrice(),
            complete: true,
          }),
        });
      } catch (error) {
        console.error('Error redeeming coupon:', error);
      }
    }

    // Simulação - em produção, integraria com gateway de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    router.push('/sucesso?plan=' + planSlug);
  };

  if (loading) {
    return <Loading fullScreen text="Carregando..." />;
  }

  if (!plan) {
    return null;
  }

  const price = getPrice();
  const discount = getDiscount();
  const finalPrice = couponDiscount ? couponDiscount.finalAmount : price;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Ever</span>
              <span className="text-neutral-900 dark:text-white">NOW</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Lock className="h-4 w-4" />
            Pagamento seguro
          </div>
        </div>
      </header>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/planos" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Voltar para planos
          </Link>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                    Finalizar assinatura
                  </h1>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal info */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Informações pessoais</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Nome completo</Label>
                          <Input placeholder="João Silva" required />
                        </div>
                        <div>
                          <Label>E-mail</Label>
                          <Input type="email" placeholder="joao@email.com" required />
                        </div>
                      </div>
                    </div>

                    {/* Payment */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Dados do cartão
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <Label>Número do cartão</Label>
                          <Input placeholder="0000 0000 0000 0000" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Validade</Label>
                            <Input placeholder="MM/AA" required />
                          </div>
                          <div>
                            <Label>CVV</Label>
                            <Input placeholder="123" required />
                          </div>
                        </div>
                        <div>
                          <Label>Nome no cartão</Label>
                          <Input placeholder="JOAO SILVA" required />
                        </div>
                      </div>
                    </div>

                    {/* Promo code */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Código promocional
                      </h2>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div>
                            <p className="font-semibold text-green-700 dark:text-green-300">
                              {appliedCoupon.code}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              {couponDiscount?.discountDescription}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeCoupon}
                            className="text-green-700 hover:text-green-900"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Input
                              value={promoCode}
                              onChange={(e) => {
                                setPromoCode(e.target.value.toUpperCase());
                                setCouponError('');
                              }}
                              placeholder="Digite seu código"
                              className="uppercase"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleApplyPromo}
                              disabled={validatingCoupon || !promoCode}
                            >
                              {validatingCoupon ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Aplicar'
                              )}
                            </Button>
                          </div>
                          {couponError && (
                            <p className="text-sm text-red-600 mt-2">{couponError}</p>
                          )}
                        </>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      disabled={processing}
                    >
                      {processing ? (
                        <>Processando...</>
                      ) : (
                        <>Assinar por {formatPrice(finalPrice)}/{intervalLabels[interval].toLowerCase()}</>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                      <Shield className="h-4 w-4" />
                      Pagamento 100% seguro e criptografado
                    </div>
                  </form>
                </Card>
              </motion.div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 sticky top-24">
                  <h2 className="text-lg font-semibold mb-4">Resumo do pedido</h2>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center">
                      <Crown className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">{plan.name}</p>
                      <p className="text-sm text-neutral-500">{intervalLabels[interval]}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Plano {plan.name}</span>
                      <span>{formatPrice(price)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto periodicidade</span>
                        <span>-{discount}%</span>
                      </div>
                    )}
                    {appliedCoupon && couponDiscount && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {appliedCoupon.code}
                        </span>
                        <span>-{formatPrice(couponDiscount.discountAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-indigo-600">{formatPrice(finalPrice)}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Cobrança {intervalLabels[interval].toLowerCase()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Incluso no plano:</p>
                    {plan.featureLimits?.slice(0, 4).map((fl: any) => (
                      fl.enabled && (
                        <div key={fl.id} className="flex items-center gap-2 text-sm text-neutral-600">
                          <Check className="h-4 w-4 text-green-600" />
                          {fl.comparisonLabel || fl.feature.name}
                        </div>
                      )
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">Garantia de 7 dias</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Se não gostar, devolvemos seu dinheiro.
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Carregando..." />}>
      <CheckoutContent />
    </Suspense>
  );
}
