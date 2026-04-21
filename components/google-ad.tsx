'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface GoogleAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

export function GoogleAd({ 
  slot, 
  format = 'auto', 
  responsive = true,
  className = "" 
}: GoogleAdProps) {
  const { data: session } = useSession() || {};
  
  // Lógica: Se for Premium, não renderiza NADA
  const isPremium = session?.user?.planSlug && session.user.planSlug !== 'gratuito';

  useEffect(() => {
    if (!isPremium) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error('Erro ao carregar anúncio do Google:', err);
      }
    }
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <div className={`flex justify-center my-4 overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "ca-pub-1234567890"}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
