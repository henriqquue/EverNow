"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  Crown,
  Sparkles,
  Check,
  ArrowRight,
  Lock,
  Star,
  Zap
} from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureSlug?: string;
  blockMessage?: string;
  requiredPlan?: string;
  requiredPlanId?: string;
  ctaText?: string;
  reason?: "feature_disabled" | "limit_exceeded";
  limit?: number;
  usage?: number;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  badge?: string;
  popular: boolean;
  features: { name: string; enabled: boolean }[];
}

export function PaywallModal({
  isOpen,
  onClose,
  featureName,
  featureSlug,
  blockMessage,
  requiredPlan = "Premium",
  ctaText = "Fazer Upgrade",
  reason = "feature_disabled",
  limit,
  usage
}: PaywallModalProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Track paywall view
      fetch("/api/paywall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "VIEW",
          featureSlug,
          planRequired: requiredPlan,
          sourcePage: window.location.pathname,
          sourceAction: featureName
        })
      }).catch(console.error);

      // Fetch recommended plan
      fetch("/api/plans?comparison=true")
        .then(res => res.json())
        .then(plans => {
          const recommended = plans.find((p: Plan) => p.popular) || plans[1] || plans[0];
          setPlan(recommended);
        })
        .catch(console.error);
    }
  }, [isOpen, featureSlug, featureName, requiredPlan]);

  const handleUpgrade = () => {
    // Track click
    fetch("/api/paywall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "CLICK_UPGRADE",
        featureSlug,
        planRequired: requiredPlan,
        sourcePage: window.location.pathname
      })
    }).catch(console.error);

    onClose();
    router.push("/app/planos");
  };

  const handleClose = () => {
    // Track close
    fetch("/api/paywall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "CLOSE",
        featureSlug,
        planRequired: requiredPlan,
        sourcePage: window.location.pathname
      })
    }).catch(console.error);

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 text-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-background/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4"
              >
                <Lock className="h-8 w-8 text-primary" />
              </motion.div>

              <h2 className="text-xl font-bold mb-2">
                {reason === "limit_exceeded" ? "Limite Atingido!" : "Recurso Premium"}
              </h2>

              <p className="text-muted-foreground">
                {blockMessage || (
                  reason === "limit_exceeded"
                    ? `Você usou ${usage || 0} de ${limit || 0} ${featureName.toLowerCase()}`
                    : `${featureName} está disponível no plano ${requiredPlan}`
                )}
              </p>
            </div>

            {/* Plan Card */}
            {plan && (
              <div className="p-6 space-y-4">
                <div className="relative bg-gradient-to-br from-primary/5 to-background border border-primary/20 rounded-xl p-4">
                  {plan.badge && (
                    <div className="absolute -top-2.5 left-4">
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3 pt-1">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">{plan.name}</span>
                    </div>
                    <div className="text-right">
                      {plan.discountPrice ? (
                        <>
                          <span className="text-sm text-muted-foreground line-through mr-1">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-xl font-bold text-primary">
                            {formatCurrency(plan.discountPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold">
                          {formatCurrency(plan.price)}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.slice(0, 4).filter(f => f.enabled).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Button
                  className="w-full h-12 text-base"
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={loading}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {ctaText}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 inline mr-1" />
                  Ativação instantânea • Cancele quando quiser
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
