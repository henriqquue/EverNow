// Tipos e utilitários para o sistema de ofertas

export type TriggerType =
  | "LIMIT_REACHED"
  | "PREMIUM_FEATURE"
  | "FILTER_BLOCKED"
  | "PASSPORT_BLOCKED"
  | "LIKES_BLOCKED"
  | "MESSAGE_LIMIT"
  | "MANUAL"
  | "PAGE_VIEW";

export type DisplayType = "MODAL" | "BANNER" | "CARD";

export interface Offer {
  id: string;
  title: string;
  message: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  displayType: DisplayType;
  discountPercent?: number;
  discountCode?: string;
  offerPlan?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  position: string;
  dismissible: boolean;
}

export interface OffersResponse {
  campaigns: Offer[];
  banners: Banner[];
}

// Mapear features para triggers
export function getFeatureTrigger(featureSlug: string): TriggerType {
  switch (featureSlug) {
    case "filtros_avancados":
      return "FILTER_BLOCKED";
    case "passaporte":
      return "PASSPORT_BLOCKED";
    case "ver_quem_curtiu":
      return "LIKES_BLOCKED";
    case "mensagens_por_dia":
      return "MESSAGE_LIMIT";
    case "curtidas_por_dia":
    case "super_curtidas_por_dia":
      return "LIMIT_REACHED";
    default:
      return "PREMIUM_FEATURE";
  }
}

// Buscar ofertas do servidor
export async function fetchOffers(
  trigger?: TriggerType,
  featureSlug?: string,
  page?: string
): Promise<OffersResponse> {
  const params = new URLSearchParams();
  if (trigger) params.append("trigger", trigger);
  if (featureSlug) params.append("feature", featureSlug);
  if (page) params.append("page", page);

  const res = await fetch(`/api/offers?${params}`);
  if (!res.ok) {
    return { campaigns: [], banners: [] };
  }
  return res.json();
}

// Registrar evento de campanha
export async function recordCampaignEvent(
  campaignId: string,
  eventType: "VIEW" | "CLICK" | "CLOSE" | "CONVERT",
  options?: {
    trigger?: TriggerType;
    featureSlug?: string;
    page?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        eventType,
        ...options,
      }),
    });
  } catch (error) {
    console.error("Error recording campaign event:", error);
  }
}
