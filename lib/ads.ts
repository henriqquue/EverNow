// Ads system utilities

import { AdType, AdZoneType } from '@prisma/client';

// Default ad zones configuration
export const DEFAULT_AD_ZONES = [
  {
    name: 'Feed de Descoberta',
    slug: 'discovery_feed',
    type: 'DISCOVERY_FEED' as AdZoneType,
    description: 'Anúncios entre perfis no feed de descoberta',
    width: 320,
    height: 250,
  },
  {
    name: 'Lista de Conexões',
    slug: 'matches_list',
    type: 'MATCHES_LIST' as AdZoneType,
    description: 'Anúncios na lista de conexões',
    width: 320,
    height: 100,
  },
  {
    name: 'Cards de Perfil',
    slug: 'profile_cards',
    type: 'PROFILE_CARDS' as AdZoneType,
    description: 'Anúncios ao lado dos cards de perfil',
    width: 300,
    height: 250,
  },
  {
    name: 'Entre Perfis',
    slug: 'between_profiles',
    type: 'BETWEEN_PROFILES' as AdZoneType,
    description: 'Anúncios intercalados entre perfis',
    width: 300,
    height: 250,
  },
  {
    name: 'Resultados Vazios',
    slug: 'empty_results',
    type: 'EMPTY_RESULTS' as AdZoneType,
    description: 'Anúncios quando não há resultados',
    width: 320,
    height: 250,
  },
  {
    name: 'Landing Page',
    slug: 'landing_page',
    type: 'LANDING_PAGE' as AdZoneType,
    description: 'Anúncios na landing page',
    width: 728,
    height: 90,
  },
  {
    name: 'Lista de Conversas',
    slug: 'chat_list',
    type: 'CHAT_LIST' as AdZoneType,
    description: 'Anúncios na lista de conversas',
    width: 320,
    height: 100,
  },
  {
    name: 'Barra Lateral',
    slug: 'sidebar',
    type: 'SIDEBAR' as AdZoneType,
    description: 'Anúncios na barra lateral',
    width: 300,
    height: 600,
  },
];

// Default plan ad settings
export const DEFAULT_PLAN_AD_SETTINGS = {
  gratuito: {
    adsEnabled: true,
    adsFrequency: 5,
    adsPerSession: 10,
    adsPerDay: 50,
    minTimeBetween: 30,
    allowedZones: ['discovery_feed', 'matches_list', 'between_profiles', 'empty_results', 'chat_list'],
  },
  premium: {
    adsEnabled: false,
    adsFrequency: 0,
    adsPerSession: 0,
    adsPerDay: 0,
    minTimeBetween: 0,
    allowedZones: [],
  },
};

// Blocked pages for ads (UX protection)
export const BLOCKED_PAGES = [
  '/app/chat',
  '/app/conversa',
  '/checkout',
  '/pagamento',
  '/assinatura',
  '/app/perfil/editar',
  '/onboarding',
  '/cadastro',
  '/login',
];

// Session storage keys
export const AD_SESSION_KEY = 'evernow_ads_session';
export const AD_IMPRESSIONS_KEY = 'evernow_ads_impressions';
export const AD_LAST_SHOWN_KEY = 'evernow_ads_last_shown';

// Get or create ad session ID
export function getAdSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(AD_SESSION_KEY);
  if (!sessionId) {
    sessionId = `ads_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem(AD_SESSION_KEY, sessionId);
  }
  return sessionId;
}

// Track session impressions
export function getSessionImpressions(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(sessionStorage.getItem(AD_IMPRESSIONS_KEY) || '0', 10);
}

export function incrementSessionImpressions(): void {
  if (typeof window === 'undefined') return;
  const current = getSessionImpressions();
  sessionStorage.setItem(AD_IMPRESSIONS_KEY, String(current + 1));
}

// Check last ad shown time
export function getLastAdShownTime(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(sessionStorage.getItem(AD_LAST_SHOWN_KEY) || '0', 10);
}

export function updateLastAdShownTime(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AD_LAST_SHOWN_KEY, String(Date.now()));
}

// Check if ads are allowed on current page
export function isPageAllowedForAds(pathname: string): boolean {
  return !BLOCKED_PAGES.some(blocked => pathname.startsWith(blocked));
}

// Get ad type display name
export function getAdTypeDisplayName(type: AdType): string {
  const names: Record<AdType, string> = {
    GOOGLE_ADSENSE: 'Google AdSense',
    INTERNAL_BANNER: 'Banner Interno',
    INTERNAL_CARD: 'Card Nativo',
    INTERNAL_INTERSTITIAL: 'Intersticial',
  };
  return names[type] || type;
}

// Get zone type display name
export function getZoneTypeDisplayName(type: AdZoneType): string {
  const names: Record<AdZoneType, string> = {
    DISCOVERY_FEED: 'Feed de Descoberta',
    MATCHES_LIST: 'Lista de Conexões',
    PROFILE_CARDS: 'Cards de Perfil',
    BETWEEN_PROFILES: 'Entre Perfis',
    EMPTY_RESULTS: 'Resultados Vazios',
    LANDING_PAGE: 'Landing Page',
    CHAT_LIST: 'Lista de Conversas',
    SIDEBAR: 'Barra Lateral',
  };
  return names[type] || type;
}
