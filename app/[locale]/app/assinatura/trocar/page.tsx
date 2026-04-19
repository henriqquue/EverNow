"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Shield,
  Zap,
  Star,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  badge: string | null;
  highlightColor: string | null;
  isHighlighted: boolean;
  isPopular: boolean;
  planIntervals: Array<{
    id: string;
    interval: string;
    price: number;
    discountPrice: number | null;
    discountPercent: number | null;
    isActive: boolean;
  }>;
  featureLimits: Array<{
    feature: {
      name: string;
      slug: string;
      type: string;
    };
    value: number | null;
    isUnlimited: boolean;
    enabled: boolean;
  }>;
}

interface CurrentSubscription {
  planId: string;
  planName: string;
  planSlug: string;
  status: string;
  amount: number;
  interval: string;
}

const INTERVAL_LABELS: Record<string, string> = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  SEMIANNUAL: "semiannual",
  YEARLY: "yearly",
};

export default function TrocarPlanoPage() {
  const t = useTranslations('Subscription');
  const pt = useTranslations('Plans');
  const common = useTranslations('Common');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedInterval, setSelectedInterval] = useState("MONTHLY");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch("/api/plans?status=ACTIVE"),
        fetch("/api/subscription/summary"),
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.plan && subData.subscription) {
          setCurrentSubscription({
            planId: subData.plan.id,
            planName: subData.plan.name,
            planSlug: subData.plan.slug,
            status: subData.subscription.status,
            amount: subData.subscription.amount,
            interval: subData.subscription.billingInterval,
          });
        } else if (subData.plan) {
          setCurrentSubscription({
            planId: subData.plan.id,
            planName: subData.plan.name,
            planSlug: subData.plan.slug,
            status: "ACTIVE",
            amount: subData.plan.price,
            interval: "MONTHLY",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getChangeType = (targetPlan: Plan): "upgrade" | "downgrade" | "same" => {
    if (!currentSubscription) return "upgrade";
    if (targetPlan.id === currentSubscription.planId) return "same";
    
    const currentPlan = plans.find((p) => p.id === currentSubscription.planId);
    if (!currentPlan) return "upgrade";
    
    return targetPlan.price > currentPlan.price ? "upgrade" : "downgrade";
  };

  const getIntervalPrice = (plan: Plan, interval: string) => {
    const planInterval = plan.planIntervals.find((pi) => pi.interval === interval && pi.isActive);
    if (planInterval) {
      return planInterval.discountPrice || planInterval.price;
    }
    return plan.discountPrice || plan.price;
  };

  const getIntervalDiscount = (plan: Plan, interval: string) => {
    const planInterval = plan.planIntervals.find((pi) => pi.interval === interval && pi.isActive);
    return planInterval?.discountPercent || null;
  };

  const handleSelectPlan = (plan: Plan) => {
    const changeType = getChangeType(plan);
    if (changeType === "same") return;
    
    setSelectedPlan(plan);
    setShowConfirmation(true);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    setError(null);

    const changeType = getChangeType(selectedPlan);
    const endpoint = changeType === "upgrade" 
      ? "/api/subscription/upgrade" 
      : "/api/subscription/downgrade";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          interval: selectedInterval,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('error_processing'));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/app/assinatura");
      }, 2000);
    } catch (err) {
      console.error("Error processing change:", err);
      setError(t('error_connection'));
    } finally {
      setProcessing(false);
    }
  };

  const availableIntervals = selectedPlan?.planIntervals
    .filter((pi) => pi.isActive)
    .map((pi) => pi.interval) || ["MONTHLY"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/assinatura">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('change_plan_title')}</h1>
          <p className="text-muted-foreground">
            {currentSubscription
              ? t('current_plan_label', { name: currentSubscription.planName || "" })
              : t('choose_new_plan')}
          </p>
        </div>
      </div>

      {/* Current Plan Banner */}
      {currentSubscription && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-muted/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t('current_plan_label', { name: currentSubscription.planName || "" })}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(currentSubscription.amount)}/{pt(INTERVAL_LABELS[currentSubscription.interval] || 'monthly').toLowerCase()}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{currentSubscription.status === "ACTIVE" ? t('active') : currentSubscription.status}</Badge>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const changeType = getChangeType(plan);
          const isCurrentPlan = changeType === "same";
          const price = getIntervalPrice(plan, selectedInterval);
          const discount = getIntervalDiscount(plan, selectedInterval);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "relative cursor-pointer transition-all duration-200 h-full",
                  isCurrentPlan
                    ? "border-primary/50 bg-primary/5 cursor-default"
                    : "hover:border-primary/50 hover:shadow-lg",
                  plan.isHighlighted && !isCurrentPlan && "border-primary shadow-lg"
                )}
                onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
              >
                {/* Badge */}
                {(plan.badge || plan.isPopular || isCurrentPlan) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge
                      className={cn(
                        "px-3",
                        isCurrentPlan
                          ? "bg-primary text-primary-foreground"
                          : plan.isPopular
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
                          : ""
                      )}
                    >
                      {isCurrentPlan ? pt('current_plan') : plan.badge || t('popular')}
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6 pt-8">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3",
                        plan.slug === "gratuito" ? "bg-muted" : "bg-primary/10"
                      )}
                    >
                      {plan.slug === "gratuito" ? (
                        <Star className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Crown className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-3xl font-bold">
                        {formatCurrency(price)}
                      </span>
                      <span className="text-muted-foreground mb-1">/{pt('monthly').toLowerCase()}</span>
                    </div>
                    {discount && (
                      <Badge variant="secondary" className="mt-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {t('discount', { percent: discount })}
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {plan.featureLimits.slice(0, 5).map((fl) => (
                      <div
                        key={fl.feature.slug}
                        className="flex items-center gap-2 text-sm"
                      >
                        {fl.enabled ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={!fl.enabled ? "text-muted-foreground" : ""}>
                          {fl.feature.name}
                          {fl.enabled && fl.feature.type === "LIMIT" && (
                            <span className="text-muted-foreground ml-1">
                              ({fl.isUnlimited ? pt('unlimited').toLowerCase() : `${fl.value}/dia`})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {isCurrentPlan ? (
                    <Button disabled className="w-full" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {pt('current_plan')}
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        changeType === "upgrade"
                          ? "bg-gradient-to-r from-primary to-primary/80"
                          : ""
                      )}
                      variant={changeType === "downgrade" ? "outline" : "default"}
                    >
                      {changeType === "upgrade" ? (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          {t('upgrade')}
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 mr-2" />
                          {t('downgrade')}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !processing && setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border rounded-xl p-6 max-w-lg w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {success ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-500 mb-2">{t('success')}</h3>
                  <p className="text-muted-foreground">
                    {t('success_msg', { name: selectedPlan.name || "" })}
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">{t('confirm_change_title')}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowConfirmation(false)}
                      disabled={processing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Change Summary */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">{t('from')}</p>
                        <p className="font-medium">{currentSubscription?.planName}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{t('to')}</p>
                        <p className="font-medium">{selectedPlan.name}</p>
                      </div>
                    </div>

                    {/* Interval Selector */}
                    {availableIntervals.length > 1 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {t('periodicity')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {availableIntervals.map((interval) => {
                            const intervalPrice = getIntervalPrice(selectedPlan, interval);
                            const intervalDiscount = getIntervalDiscount(selectedPlan, interval);
                            
                            return (
                              <button
                                key={interval}
                                type="button"
                                className={cn(
                                  "p-3 rounded-lg border text-left transition-all",
                                  selectedInterval === interval
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                )}
                                onClick={() => setSelectedInterval(interval)}
                              >
                                <p className="font-medium">{pt(INTERVAL_LABELS[interval])}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(intervalPrice)}
                                  {intervalDiscount && (
                                    <span className="text-green-500 ml-1">
                                      -{intervalDiscount}%
                                    </span>
                                  )}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Price Summary */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>{t('value')}:</span>
                        <span className="text-xl font-bold">
                          {formatCurrency(getIntervalPrice(selectedPlan, selectedInterval))}
                          <span className="text-sm text-muted-foreground font-normal">
                            /{pt(INTERVAL_LABELS[selectedInterval] || 'monthly').toLowerCase()}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Change Type Notice */}
                    {getChangeType(selectedPlan) === "downgrade" && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-500">{t('attention')}</p>
                          <p className="text-muted-foreground mt-1">
                            {t('downgrade_warning')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-500">{error}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowConfirmation(false)}
                        disabled={processing}
                      >
                        {t('cancel_btn')}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleConfirm}
                        disabled={processing}
                      >
                        {processing ? (
                          <Loading size="sm" />
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            {t('confirm_change_btn')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
