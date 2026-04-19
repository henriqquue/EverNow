// Utilitário para registrar eventos comerciais

let sessionId: string | null = null;

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  if (!sessionId) {
    sessionId = localStorage.getItem('everNowSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('everNowSessionId', sessionId);
    }
  }
  return sessionId;
}

function getUTMParams(): { source?: string; medium?: string; campaign?: string } {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined
  };
}

export type CommercialEventType = 
  | 'landing_visit'
  | 'cta_click'
  | 'plan_click'
  | 'subscribe_click'
  | 'signup_start'
  | 'upgrade_start'
  | 'checkout_view'
  | 'checkout_complete'
  | 'plan_compare_view'
  | 'faq_expand'
  | 'testimonial_view';

export interface CommercialEventData {
  eventType: CommercialEventType;
  page?: string;
  planId?: string;
  planSlug?: string;
  metadata?: Record<string, any>;
}

export async function trackCommercialEvent(data: CommercialEventData): Promise<void> {
  try {
    const utmParams = getUTMParams();
    
    await fetch('/api/commercial-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        sessionId: getSessionId(),
        page: data.page || (typeof window !== 'undefined' ? window.location.pathname : ''),
        ...utmParams
      })
    });
  } catch (error) {
    console.error('Error tracking commercial event:', error);
  }
}
