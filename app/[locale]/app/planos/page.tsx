"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Crown,
  Check,
  X,
  Sparkles,
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
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          interval: selectedInterval
        })
      });

      if (res.ok) {
        setCurrentPlanId(planId);
        // Show success and redirect
        setTimeout(() => router.push("/app"), 1500);
      }
    } catch (err) {
      console.error("Error subscribing:", err);
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
      return <X className="h-5 w-5 text-muted-foreground" />;
    }

    if (feature.type === "BOOLEAN") {
      return <Check className="h-5 w-5 text-primary" />;
    }

    if (feature.unlimited || feature.value === -1) {
      return <span className="text-primary font-medium">{t('unlimited')}</span>;
    }

    return <span className="font-medium">{feature.value}</span>;
  };

  if (loading) {
    return <Loading text={t('loading')} />;
  }

  // Get all unique features for comparison table
  const allFeatures = plans.reduce((acc, plan) => {
    plan.features.forEach(f => {
      if (!acc.find(af => af.slug === f.slug)) {
        acc.push(f);
      }
    });
    return acc;
  }, [] as PlanFeature[]);

  return (
    <div className="space-y-8 pb-12">
      <div className="pt-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <Crown className="w-7 h-7 text-purple-600" />
          {t('title')}
        </h1>
        <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Interval Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >
        <div className="inline-flex items-center bg-muted rounded-lg p-1">
          {["MONTHLY", "YEARLY"].map((interval) => (
            <button
              key={interval}
              onClick={() => setSelectedInterval(interval)}
              className={cn(
                "px-6 py-2 rounded-md text-sm font-medium transition-all relative",
                selectedInterval === interval
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(INTERVAL_LABELS[interval])}
              {interval === "YEARLY" && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded">
                  -20%
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Plans Grid */}
      <div className={cn(
        "grid gap-6 mx-auto",
        plans.length === 1 ? "max-w-md" :
          plans.length === 2 ? "max-w-4xl md:grid-cols-2" :
            "max-w-5xl md:grid-cols-2 lg:grid-cols-3"
      )}>
        {plans.map((plan, index) => {
          const prices = getIntervalPrice(plan);
          const isCurrentPlan = plan.id === currentPlanId;
          const isFree = plan.price === 0;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="relative"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="premium" className="px-3">
                    <Star className="h-3 w-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <Card
                className={cn(
                  "relative overflow-hidden h-full transition-all flex flex-col",
                  plan.isHighlighted && "border-primary border-2 shadow-lg",
                  isCurrentPlan && "ring-2 ring-primary"
                )}
              >

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2">
                    {plan.popular && <Crown className="h-5 w-5 text-yellow-500" />}
                    <CardTitle className="text-xl">
                      {t.has(`plan_${plan.slug}_name` as any) ? t(`plan_${plan.slug}_name` as any) : plan.name}
                    </CardTitle>
                  </div>
                  {(plan.shortDescription || t.has(`plan_${plan.slug}_desc` as any)) && (
                    <p className="text-sm text-muted-foreground">
                      {t.has(`plan_${plan.slug}_desc` as any) ? t(`plan_${plan.slug}_desc` as any) : plan.shortDescription}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-6 flex-1 flex flex-col">
                  {/* Price */}
                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      {prices.discountPrice ? (
                        <>
                          <span className="text-2xl text-muted-foreground line-through">
                            {formatCurrency(prices.price)}
                          </span>
                          <span className="text-4xl font-bold text-primary">
                            {formatCurrency(prices.discountPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold">
                          {isFree ? t('free_plan') : formatCurrency(prices.price)}
                        </span>
                      )}
                      {!isFree && (
                        <span className="text-muted-foreground">
                          {st(INTERVAL_SUFFIX[selectedInterval])}
                        </span>
                      )}
                    </div>

                    {prices.discountPercent && (
                      <Badge variant="secondary" className="mt-2">
                        <Zap className="h-3 w-3 mr-1" />
                        {t('save', { percent: prices.discountPercent })}
                      </Badge>
                    )}

                    {plan.hasTrial && plan.trialDays && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {t('free_trial', { days: plan.trialDays })}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.slice(0, 7).map((feature) => (
                      <li key={feature.slug} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {feature.enabled ? (
                            <Check className="h-5 w-5 text-primary" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </div>
                        <span className={cn(
                          "text-sm",
                          !feature.enabled && "text-muted-foreground"
                        )}>
                          {t.has(`feature_${feature.slug}` as any) ? t(`feature_${feature.slug}` as any) : feature.name}
                          {feature.enabled && feature.type === "LIMIT" && !feature.unlimited && feature.value && (
                            <span className="text-muted-foreground"> ({feature.value})</span>
                          )}
                          {feature.enabled && feature.unlimited && (
                            <span className="text-primary font-medium"> ({t('unlimited').toLowerCase()})</span>
                          )}
                        </span>
                      </li>
                    ))}
                    {plan.features.length > 7 && (
                      <li className="text-sm text-muted-foreground text-center">
                        {t('more_features', { count: plan.features.length - 7 })}
                      </li>
                    )}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className="w-full mt-auto"
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
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      {allFeatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-center mb-6">{t('comparison_title')}</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-medium">{t('feature')}</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="text-center py-4 px-4 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        {plan.popular && <Crown className="h-4 w-4 text-yellow-500" />}
                        {t.has(`plan_${plan.slug}_name` as any) ? t(`plan_${plan.slug}_name` as any) : plan.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, idx) => (
                  <tr key={feature.slug} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="py-3 px-4 text-sm">
                      {t.has(`feature_${feature.slug}` as any) ? t(`feature_${feature.slug}` as any) : feature.name}
                    </td>
                    {plans.map(plan => {
                      const planFeature = plan.features.find(f => f.slug === feature.slug);
                      return (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {planFeature ? renderFeatureValue(planFeature) : (
                            <X className="h-5 w-5 text-muted-foreground mx-auto" />
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('secure_payment')}
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {t('instant_activation')}
        </div>
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          {t('cancel_anytime')}
        </div>
      </motion.div>
    </div>
  );
}
