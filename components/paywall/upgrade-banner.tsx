"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Crown, ArrowRight, Sparkles, Zap } from "lucide-react";

interface UpgradeBannerProps {
  title?: string;
  description?: string;
  ctaText?: string;
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export function UpgradeBanner({
  title = "Desbloqueie todos os recursos",
  description = "Faça upgrade para o Premium e aproveite recursos ilimitados",
  ctaText = "Fazer Upgrade",
  variant = "default",
  className
}: UpgradeBannerProps) {
  const router = useRouter();

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center justify-between gap-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <Button size="sm" onClick={() => router.push("/app/planos")}>
          <Sparkles className="h-3 w-3 mr-1" />
          {ctaText}
        </Button>
      </motion.div>
    );
  }

  if (variant === "inline") {
    return (
      <button
        onClick={() => router.push("/app/planos")}
        className={cn(
          "inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium transition-colors",
          className
        )}
      >
        <Crown className="h-3 w-3" />
        {ctaText}
        <ArrowRight className="h-3 w-3" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6",
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-primary/20">
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>

        <Button
          size="lg"
          className="flex-shrink-0"
          onClick={() => router.push("/app/planos")}
        >
          <Zap className="h-4 w-4 mr-2" />
          {ctaText}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
