"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  History,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Star,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loading } from "@/components/ui/loading";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SubscriptionSummary {
  user: {
    id: string;
    name: string;
    email: string;
  };
  subscription: {
    id: string;
    status: string;
    statusLabel: string;
    billingInterval: string;
    intervalLabel: string;
    amount: number;
    startedAt: string;
    expiresAt: string | null;
    canceledAt: string | null;
    isTrial: boolean;
    trialEndsAt: string | null;
    daysRemaining: number | null;
  } | null;
  plan: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    features: Array<{
      name: string;
      slug: string;
      type: string;
      value: number | null;
      isUnlimited: boolean;
      enabled: boolean;
    }>;
    intervals: Array<{
      interval: string;
      price: number;
      discountPrice: number | null;
      discountPercent: number | null;
    }>;
  } | null;
  actions: {
    canCancel: boolean;
    canReactivate: boolean;
    canUpgrade: boolean;
  };
}

interface HistoryItem {
  id: string;
  action: string;
  actionLabel: string;
  plan: {
    id: string;
    name: string;
    slug: string;
  };
  amount: number | null;
  billingInterval?: string | null;
  intervalLabel: string;
  createdAt: string;
}

export default function AssinaturaPage() {
  const t = useTranslations('Subscription');
  const tp = useTranslations('Plans');
  const common = useTranslations('Common');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, historyRes] = await Promise.all([
        fetch("/api/subscription/summary"),
        fetch("/api/subscription/history?limit=10"),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Scroll to history when shown
  useEffect(() => {
    if (showHistory) {
      console.log("Exibindo histórico...");
      const historyElement = document.getElementById("subscription-history-section");
      if (historyElement) {
        historyElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [showHistory]);

  const handleCancel = async () => {
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (res.ok) {
        setShowCancelModal(false);
        setCancelReason("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || t('cancel_error'));
      }
    } catch (error) {
      console.error("Error canceling:", error);
      alert(t('cancel_error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    setActionLoading("reactivate");
    try {
      const res = await fetch("/api/subscription/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || t('reactivate_error'));
      }
    } catch (error) {
      console.error("Error reactivating:", error);
      alert(t('reactivate_error'));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-primary/10 text-primary border-primary/20";
      case "CANCELED":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "EXPIRED":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "TRIAL":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-5 w-5 text-purple-600" />;
      case "CANCELED":
        return <AlertCircle className="h-5 w-5" />;
      case "EXPIRED":
        return <XCircle className="h-5 w-5" />;
      case "TRIAL":
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "UPGRADE":
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case "DOWNGRADE":
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case "CANCEL":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "REACTIVATE":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "RENEW":
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Zap className="h-4 w-4 text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    );
  }

  const isPremium = summary?.plan?.slug !== "gratuito" && (summary?.plan?.price || 0) > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
              {t('title')}
            </h1>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
              {t('subtitle')}
            </p>
          </div>
          <Link href="/app/planos" className="w-full sm:w-auto">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Crown className="h-4 w-4" />
              {t('view_plans')}
            </Button>
          </Link>
        </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={isPremium ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent" : ""}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Plan Info */}
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isPremium ? "bg-primary/10" : "bg-muted"}`}>
                  {isPremium ? (
                    <Crown className="h-8 w-8 text-primary" />
                  ) : (
                    <Star className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {t('current_plan', { name: (tp.has(`plan_${summary?.plan?.slug}_name` as any) ? tp(`plan_${summary?.plan?.slug}_name` as any) : summary?.plan?.name) || '' })}
                    {isPremium && <Badge variant="default">{t('premium')}</Badge>}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {tp.has(`plan_${summary?.plan?.slug}_desc` as any) ? tp(`plan_${summary?.plan?.slug}_desc` as any) : summary?.plan?.description || t('current_plan_desc')}
                  </p>
                  {summary?.subscription && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(summary.subscription.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(summary.subscription.status)}
                          {t(`status_${summary.subscription.status}` as any)}
                        </span>
                      </Badge>
                      {summary.subscription.billingInterval && (
                        <Badge variant="outline">
                          {t(`interval_${summary.subscription.billingInterval}` as any)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col items-start md:items-end gap-3 border-t md:border-none pt-4 md:pt-0">
                <div className="md:text-right">
                  <p className="text-2xl sm:text-3xl font-black">
                    {formatCurrency(summary?.subscription?.amount || summary?.plan?.price || 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t(summary?.subscription?.billingInterval === 'YEARLY' || summary?.plan?.intervals?.some(i => i.interval === 'YEARLY') ? 'price_per_year' : 'price_per_month')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {summary?.actions.canUpgrade && (
                    <Link href="/app/assinatura/trocar">
                      <Button className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {t('upgrade')}
                      </Button>
                    </Link>
                  )}
                  {!summary?.actions.canUpgrade && summary?.actions.canCancel && (
                    <Link href="/app/assinatura/trocar">
                      <Button variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        {t('change_plan')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subscription Details */}
      {summary?.subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('started_at')}</p>
                  <p className="font-medium">
                    {formatDate(summary.subscription.startedAt)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {summary.subscription.status === "CANCELED" ? t('access_until') : t('next_renewal')}
                  </p>
                  <p className="font-medium">
                    {summary.subscription.expiresAt
                      ? formatDate(summary.subscription.expiresAt)
                      : t('no_expiration')}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('days_remaining')}</p>
                  <p className="font-medium">
                    {summary.subscription.daysRemaining !== null
                      ? t('days_remaining_count', { count: summary.subscription.daysRemaining })
                      : t('unlimited')}
                  </p>
                </div>
              </div>

              {/* Progress bar for remaining days */}
              {summary.subscription.daysRemaining !== null && summary.subscription.daysRemaining > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('current_period')}</span>
                    <span className="font-medium">
                      {t('days_remaining_count', { count: summary.subscription.daysRemaining })}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (summary.subscription.daysRemaining / 30) * 100)}
                    className="h-2"
                  />
                </div>
              )}

              {/* Canceled notice */}
              {summary.subscription.status === "CANCELED" && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-500">{t('canceled_notice')}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('canceled_desc', { date: summary.subscription.expiresAt ? formatDate(summary.subscription.expiresAt) : '...' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Features */}
      {summary?.plan?.features && summary.plan.features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {t('features_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {summary.plan.features.map((feature) => (
                  <div
                    key={feature.slug}
                    className={`flex items-center gap-3 p-3 rounded-lg ${feature.enabled ? "bg-primary/5" : "bg-muted/50"
                      }`}
                  >
                    {feature.enabled ? (
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${!feature.enabled && "text-muted-foreground"}`}>
                        {tp.has(`feature_${feature.slug}` as any) ? tp(`feature_${feature.slug}` as any) : feature.name}
                      </p>
                    </div>
                    {feature.enabled && feature.type === "LIMIT" && (
                      <Badge variant="secondary">
                        {feature.isUnlimited ? t('unlimited') : `${feature.value}/dia`}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('actions_title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* History toggle */}
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowHistory(!showHistory)}
            >
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" />
                {t('history')}
              </span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showHistory ? "rotate-90" : ""}`} />
            </Button>

            {/* Cancel button */}
            {summary?.actions.canCancel && (
              <Button
                variant="outline"
                className="w-full justify-between text-destructive hover:text-destructive"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading === "cancel"}
              >
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {t('cancel')}
                </span>
                {actionLoading === "cancel" && <Loading size="sm" />}
              </Button>
            )}

            {/* Reactivate button */}
            {summary?.actions.canReactivate && (
              <Button
                className="w-full justify-between"
                onClick={handleReactivate}
                disabled={actionLoading === "reactivate"}
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {t('reactivate')}
                </span>
                {actionLoading === "reactivate" ? (
                  <Loading size="sm" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            key="subscription-history-card"
            id="subscription-history-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t('history_title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getActionIcon(item.action)}
                          <div>
                            <p className="font-medium">{t(`action_${item.action}` as any)}</p>
                            <p className="text-sm text-muted-foreground">
                              {tp.has(`plan_${item.plan.slug}_name` as any) ? tp(`plan_${item.plan.slug}_name` as any) : item.plan.name} {item.billingInterval && `• ${t(`interval_${item.billingInterval}` as any)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {item.amount !== null && item.amount > 0 && (
                            <p className="font-medium">{formatCurrency(item.amount)}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('no_history')}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card border rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('cancel_modal_title')}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCancelModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm">
                    {t('cancel_modal_desc')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">{t('cancel_reason_label')}</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={t('cancel_reason_placeholder')}
                    className="w-full mt-2 p-3 bg-muted/50 border rounded-lg resize-none h-24"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCancelModal(false)}
                  >
                    {t('keep_subscription')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={actionLoading === "cancel"}
                  >
                    {actionLoading === "cancel" ? (
                      <Loading size="sm" />
                    ) : (
                      t('confirm_cancel')
                    )}
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
