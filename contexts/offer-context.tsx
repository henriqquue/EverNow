"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Offer,
  Banner,
  TriggerType,
  fetchOffers,
  recordCampaignEvent,
  getFeatureTrigger,
} from "@/lib/offers";
import { OfferModal } from "@/components/offers/offer-modal";
import { OfferBanner } from "@/components/offers/offer-banner";

interface OfferContextType {
  showOffer: (trigger: TriggerType, featureSlug?: string) => Promise<void>;
  activeBanners: Banner[];
  dismissBanner: (bannerId: string) => void;
  refreshOffers: () => Promise<void>;
}

const OfferContext = createContext<OfferContextType | null>(null);

export function useOffers() {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error("useOffers must be used within OfferProvider");
  }
  return context;
}

export function OfferProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() || {};
  const pathname = usePathname();

  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [activeBanners, setActiveBanners] = useState<Banner[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const [currentTrigger, setCurrentTrigger] = useState<TriggerType | null>(null);
  const [currentFeature, setCurrentFeature] = useState<string | undefined>();

  // Carregar banners quando a página muda
  const refreshOffers = useCallback(async () => {
    if (!session?.user) return;

    try {
      const { banners } = await fetchOffers(undefined, undefined, pathname || undefined);
      setActiveBanners(
        banners.filter((b) => !dismissedBanners.has(b.id))
      );
    } catch (error) {
      console.error("Error refreshing offers:", error);
    }
  }, [session, pathname, dismissedBanners]);

  useEffect(() => {
    refreshOffers();
  }, [refreshOffers]);

  // Mostrar oferta baseada em gatilho
  const showOffer = useCallback(async (trigger: TriggerType, featureSlug?: string) => {
    try {
      const { campaigns } = await fetchOffers(trigger, featureSlug, pathname || undefined);

      if (campaigns.length > 0) {
        const offer = campaigns[0]; // Pegar a de maior prioridade
        setCurrentOffer(offer);
        setCurrentTrigger(trigger);
        setCurrentFeature(featureSlug);

        // Registrar visualização
        await recordCampaignEvent(offer.id, "VIEW", {
          trigger,
          featureSlug,
          page: pathname || undefined,
        });
      }
    } catch (error) {
      console.error("Error showing offer:", error);
    }
  }, [pathname]);

  const handleOfferClose = useCallback(async () => {
    if (currentOffer) {
      await recordCampaignEvent(currentOffer.id, "CLOSE", {
        trigger: currentTrigger || undefined,
        featureSlug: currentFeature,
        page: pathname || undefined,
      });
    }
    setCurrentOffer(null);
    setCurrentTrigger(null);
    setCurrentFeature(undefined);
  }, [currentOffer, currentTrigger, currentFeature, pathname]);

  const handleOfferClick = useCallback(async () => {
    if (currentOffer) {
      await recordCampaignEvent(currentOffer.id, "CLICK", {
        trigger: currentTrigger || undefined,
        featureSlug: currentFeature,
        page: pathname || undefined,
      });
    }
  }, [currentOffer, currentTrigger, currentFeature, pathname]);

  const dismissBanner = useCallback((bannerId: string) => {
    setDismissedBanners((prev) => new Set([...prev, bannerId]));
    setActiveBanners((prev) => prev.filter((b) => b.id !== bannerId));
  }, []);

  return (
    <OfferContext.Provider value={{ showOffer, activeBanners, dismissBanner, refreshOffers }}>
      {children}

      {/* Modal de oferta */}
      {currentOffer && currentOffer.displayType === "MODAL" && (
        <OfferModal
          offer={currentOffer}
          onClose={handleOfferClose}
          onClick={handleOfferClick}
        />
      )}

      {/* Banners flutuantes no topo */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        {activeBanners
          .filter((b) => b.position === "top")
          .map((banner) => (
            <div key={banner.id} className="pointer-events-auto">
              <OfferBanner
                banner={banner}
                onDismiss={() => dismissBanner(banner.id)}
              />
            </div>
          ))}
      </div>
    </OfferContext.Provider>
  );
}
