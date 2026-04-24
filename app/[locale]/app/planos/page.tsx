"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Crown,
  Check,
  X,
  Star,
  Zap,
  Shield,
  Heart,
  ArrowRight,
  Calendar
} from "lucide-react";

interface PlanFeature {
  name: string;
  slug: string;
  type: string;
  value: number | null;
  unlimited: boolean;
  enabled: boolean;
}

interface PlanInterval {
  interval: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  badge?: string;
  highlightColor?: string;
  popular: boolean;
  isHighlighted: boolean;
  hasTrial: boolean;
  trialDays?: number;
  intervals: PlanInterval[];
  features: PlanFeature[];
}

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "monthly",
  YEARLY: "yearly"
};

const INTERVAL_SUFFIX: Record<string, string> = {
  MONTHLY: "price_per_month",
  YEARLY: "price_per_year"
};

export default function PlansPage() {
  const { data: session } = useSession();
  const t = useTranslations('Plans');
  const st = useTranslations('Subscription');
  const common = useTranslations('Common');
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState("MONTHLY");
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch("/api/plans?comparison=true"),
          fetch("/api/subscription")
        ]);

        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data);
        }

        if (subRes.ok) {
          const subData = await subRes.json();
          setCurrentPlanId(subData.subscription?.planId || subData.plan?.id);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (planId === currentPlanId) return;

    setSubscribing(planId);
    try {
      // Create checkout session
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: planId,
          type: "SUBSCRIPTION",
          interval: selectedInterval,
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to the mock checkout page
        if (data.url) {
          router.push(data.url);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Erro ao iniciar checkout");
      }
    } catch (err) {
      console.error("Error subscribing:", err);
      alert("Erro ao conectar com o serviço de pagamentos");
    } finally {
      setSubscribing(null);
    }
  };

  const getIntervalPrice = (plan: Plan) => {
    const interval = plan.intervals.find(i => i.interval === selectedInterval);
    if (interval) {
      return {
        price: interval.price,
        discountPrice: interval.discountPrice,
        discountPercent: interval.discountPercent
      };
    }
    return {
      price: plan.price,
      discountPrice: plan.discountPrice,
      discountPercent: undefined
    };
  };

  const renderFeatureValue = (feature: PlanFeature) => {
    if (!feature.enabled) {
      return <X className="h-4 w-4 text-muted-foreground mx-auto" />;
    }
    if (feature.type === "BOOLEAN") {
      return <Check className="h-4 w-4 text-primary mx-auto" />;
    }
    if (feature.unlimited || feature.value === -1) {
      return <span className="text-primary font-medium text-xs">{t('unlimited')}</span>;
    }
    return <span className="font-medium text-xs">{feature.value}</span>;
  };

  if (loading) {
    return <Loading text={t('loading')} />;
  }

  const allFeatures = plans.reduce((acc, plan) => {
    plan.features.forEach(f => {
      if (!acc.find(af => af.slug === f.slug)) {
        acc.push(f);
      }
    });
    return acc;
  }, [] as PlanFeature[]);

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 flex-shrink-0" />
          {t('title')}
        </h1>
        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Interval Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-muted rounded-lg p-1">
          {["MONTHLY", "YEARLY"].map((interval) => (
            <button
              key={interval}
              onClick={() => setSelectedInterval(interval)}
              className={cn(
                "px-4 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-all relative",
                selectedInterval === interval
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(INTERVAL_LABELS[interval])}
              {interval === "YEARLY" && (
                <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-primary text-white text-[9px] font-bold rounded">
                  -20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Coupon Section */}
      <div className="w-full max-w-md mx-auto">
        <div className="bg-muted/50 p-3 sm:p-4 rounded-2xl border border-dashed border-muted-foreground/20">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
            {st('have_coupon')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError(null);
                setCouponSuccess(null);
              }}
              placeholder="EX: EVERNOW20"
              className="flex-1 min-w-0 bg-background border rounded-xl px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl shrink-0 px-4 font-bold"
              onClick={() => {
                if (couponCode.length > 3) {
                  setCouponSuccess("Cupom aplicado!");
                } else {
                  setCouponError("Código inválido");
                }
              }}
            >
              Aplicar
            </Button>
          </div>
          {couponError && <p className="text-[10px] text-destructive mt-1 font-medium">{couponError}</p>}
          {couponSuccess && <p className="text-[10px] text-green-600 mt-1 font-medium">{couponSuccess}</p>}
        </div>
      </div>

      {/* Plans Grid — always single column on mobile */}
      <div className={cn(
        "grid grid-cols-1 gap-4",
        plans.length >= 2 && "sm:grid-cols-2",
        plans.length >= 3 && "lg:grid-cols-3"
      )}>
        {plans.map((plan, index) => {
          const prices = getIntervalPrice(plan);
          const isCurrentPlan = plan.id === currentPlanId;
          const isFree = plan.price === 0;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="relative"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                  <Badge variant="premium" className="px-3">
                    <Star className="h-3 w-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <Card className={cn(
                "relative h-full flex flex-col overflow-hidden",
                plan.badge && "mt-3",
                plan.isHighlighted && "border-primary border-2 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30",
                isCurrentPlan && "ring-2 ring-primary"
              )}>

                {/* Plan Name & Description */}
                <div className="text-center px-4 pt-5 pb-3">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {plan.popular && <Crown className="h-4 w-4 text-yellow-500" />}
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                      {t.has(`plan_${plan.slug}_name` as any) ? t(`plan_${plan.slug}_name` as any) : plan.name}
                    </h3>
                  </div>
                  {(plan.shortDescription || t.has(`plan_${plan.slug}_desc` as any)) && (
                    <p className="text-xs text-muted-foreground">
                      {t.has(`plan_${plan.slug}_desc` as any) ? t(`plan_${plan.slug}_desc` as any) : plan.shortDescription}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-center px-4 pb-4">
                  {prices.discountPrice ? (
                    <>
                      <p className="text-sm text-muted-foreground line-through">
                        {formatCurrency(prices.price)}
                      </p>
                      <p className="text-3xl sm:text-4xl font-black text-indigo-600 leading-tight">
                        {formatCurrency(prices.discountPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {st(INTERVAL_SUFFIX[selectedInterval])}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white leading-tight">
                        {isFree ? t('free_plan') : formatCurrency(prices.price)}
                      </p>
                      {!isFree && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {st(INTERVAL_SUFFIX[selectedInterval])}
                        </p>
                      )}
                    </>
                  )}

                  {prices.discountPercent && (
                    <Badge variant="secondary" className="mt-2">
                      <Zap className="h-3 w-3 mr-1" />
                      {t('save', { percent: prices.discountPercent })}
                    </Badge>
                  )}

                  {plan.hasTrial && plan.trialDays && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {t('free_trial', { days: plan.trialDays })}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-neutral-100 dark:border-neutral-800 mb-3" />

                {/* Features */}
                <div className="flex-1 px-4 pb-4">
                  <ul className="space-y-2">
                    {plan.features.slice(0, 7).map((feature) => (
                      <li key={feature.slug} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 mt-0.5">
                          {feature.enabled ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <span className={cn(
                          "text-xs sm:text-sm leading-snug",
                          !feature.enabled && "text-muted-foreground"
                        )}>
                          {t.has(`feature_${feature.slug}` as any) ? t(`feature_${feature.slug}` as any) : feature.name}
                          {feature.enabled && feature.type === "LIMIT" && !feature.unlimited && feature.value && (
                            <span className="text-muted-foreground font-bold"> ({feature.value})</span>
                          )}
                          {feature.enabled && feature.unlimited && (
                            <span className="text-primary font-bold"> ({t('unlimited').toLowerCase()})</span>
                          )}
                        </span>
                      </li>
                    ))}
                    {plan.features.length > 7 && (
                      <li className="text-xs text-muted-foreground text-center pt-1">
                        + {t('more_features', { count: plan.features.length - 7 })}
                      </li>
                    )}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="px-4 pb-5">
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plan.isHighlighted ? "default" : "outline"}
                    disabled={isCurrentPlan || subscribing === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {subscribing === plan.id ? (
                      t('processing')
                    ) : isCurrentPlan ? (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        {t('current_plan')}
                      </>
                    ) : isFree ? (
                      t('free_plan')
                    ) : (
                      <>
                        {currentPlanId && plan.price > (plans.find(p => p.id === currentPlanId)?.price || 0)
                          ? t('upgrade_now')
                          : t('subscribe_now')
                        }
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Table */}
      {allFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-base sm:text-2xl font-bold text-center mb-4">{t('comparison_title')}</h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full border-collapse min-w-[280px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-xs sm:text-sm font-medium">{t('feature')}</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-3 px-2 text-xs sm:text-sm font-medium">
                      <div className="flex items-center justify-center gap-1">
                        {plan.popular && <Crown className="h-3 w-3 text-yellow-500" />}
                        <span>{t.has(`plan_${plan.slug}_name` as any) ? t(`plan_${plan.slug}_name` as any) : plan.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, idx) => (
                  <tr key={feature.slug} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="py-2 px-2 text-xs sm:text-sm">
                      {t.has(`feature_${feature.slug}` as any) ? t(`feature_${feature.slug}` as any) : feature.name}
                    </td>
                    {plans.map(plan => {
                      const planFeature = plan.features.find(f => f.slug === feature.slug);
                      return (
                        <td key={plan.id} className="text-center py-2 px-2">
                          {planFeature ? renderFeatureValue(planFeature) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4" />
          {t('secure_payment')}
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4" />
          {t('instant_activation')}
        </div>
        <div className="flex items-center gap-1.5">
          <Heart className="h-4 w-4" />
          {t('cancel_anytime')}
        </div>
      </div>
    </div>
  );
}
