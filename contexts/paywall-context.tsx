"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { PaywallModal } from "@/components/paywall/paywall-modal";

interface PaywallData {
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

interface PaywallContextType {
  showPaywall: (data: PaywallData) => void;
  hidePaywall: () => void;
  checkFeature: (featureSlug: string, currentUsage?: number) => Promise<{
    allowed: boolean;
    unlimited?: boolean;
    limit?: number;
    remaining?: number;
  }>;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [paywallData, setPaywallData] = useState<PaywallData | null>(null);

  const showPaywall = useCallback((data: PaywallData) => {
    setPaywallData(data);
    setIsOpen(true);
  }, []);

  const hidePaywall = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setPaywallData(null), 300);
  }, []);

  const checkFeature = useCallback(async (featureSlug: string, currentUsage: number = 0) => {
    try {
      const res = await fetch("/api/features/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureSlug, currentUsage })
      });

      if (!res.ok) {
        throw new Error("Failed to check feature");
      }

      const data = await res.json();

      if (!data.allowed) {
        showPaywall({
          featureName: featureSlug.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          featureSlug,
          blockMessage: data.blockMessage,
          requiredPlan: data.requiredPlan,
          requiredPlanId: data.requiredPlanId,
          ctaText: data.ctaText,
          reason: data.reason,
          limit: data.limit,
          usage: currentUsage
        });
      }

      return {
        allowed: data.allowed,
        unlimited: data.unlimited,
        limit: data.limit,
        remaining: data.remaining
      };
    } catch (err) {
      console.error("Error checking feature:", err);
      return { allowed: true }; // Fail open
    }
  }, [showPaywall]);

  return (
    <PaywallContext.Provider value={{ showPaywall, hidePaywall, checkFeature }}>
      {children}
      <PaywallModal
        isOpen={isOpen}
        onClose={hidePaywall}
        featureName={paywallData?.featureName || ""}
        featureSlug={paywallData?.featureSlug}
        blockMessage={paywallData?.blockMessage}
        requiredPlan={paywallData?.requiredPlan}
        requiredPlanId={paywallData?.requiredPlanId}
        ctaText={paywallData?.ctaText}
        reason={paywallData?.reason}
        limit={paywallData?.limit}
        usage={paywallData?.usage}
      />
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (context === undefined) {
    throw new Error("usePaywall must be used within a PaywallProvider");
  }
  return context;
}
