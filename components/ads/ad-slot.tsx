'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAdSessionId, incrementSessionImpressions, updateLastAdShownTime, getLastAdShownTime } from '@/lib/ads';

interface AdData {
  showAd: boolean;
  type?: 'internal' | 'adsense';
  adType?: string;
  campaign?: {
    id: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText: string;
    ctaUrl: string;
    backgroundColor?: string;
    textColor?: string;
  };
  adsense?: {
    publisherId: string;
    slotId: string;
  };
  zone?: {
    id: string;
    slug: string;
    width?: number;
    height?: number;
  };
  reason?: string;
}

interface AdSlotProps {
  zone: string;
  className?: string;
  variant?: 'banner' | 'card' | 'interstitial';
  minTimeBetween?: number; // seconds
}

export function AdSlot({ zone, className = '', variant = 'banner', minTimeBetween = 30 }: AdSlotProps) {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const [adData, setAdData] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const fetchAd = useCallback(async () => {
    try {
      // Check minimum time between ads
      const lastShown = getLastAdShownTime();
      const timeSinceLastAd = (Date.now() - lastShown) / 1000;
      if (timeSinceLastAd < minTimeBetween) {
        setAdData({ showAd: false, reason: 'cooldown' });
        setLoading(false);
        return;
      }

      const sessionId = getAdSessionId();
      const response = await fetch(
        `/api/ads?zone=${zone}&page=${encodeURIComponent(pathname)}&sessionId=${sessionId}`
      );
      const data = await response.json();
      setAdData(data);

      // Record impression if ad is shown
      if (data.showAd && data.zone) {
        recordImpression(data);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
      setAdData({ showAd: false });
    } finally {
      setLoading(false);
    }
  }, [zone, pathname, minTimeBetween]);

  const recordImpression = async (data: AdData) => {
    try {
      await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'impression',
          zoneId: data.zone?.id,
          campaignId: data.campaign?.id,
          adType: data.adType,
          page: pathname,
          sessionId: getAdSessionId(),
        }),
      });
      incrementSessionImpressions();
      updateLastAdShownTime();
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  };

  const recordClick = async () => {
    if (!adData?.zone) return;

    try {
      await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'click',
          zoneId: adData.zone.id,
          campaignId: adData.campaign?.id,
          adType: adData.adType,
          targetUrl: adData.campaign?.ctaUrl,
          page: pathname,
          sessionId: getAdSessionId(),
        }),
      });
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  useEffect(() => {
    fetchAd();
  }, [fetchAd]);

  if (loading || !adData?.showAd || dismissed) {
    return null;
  }

  // Google AdSense placeholder
  if (adData.type === 'adsense' && adData.adsense) {
    return (
      <div 
        className={`ad-slot adsense ${className}`}
        style={{ 
          width: adData.zone?.width || 320, 
          height: adData.zone?.height || 250 
        }}
      >
        {/* Google AdSense would be loaded here */}
        <div className="bg-muted flex items-center justify-center text-xs text-muted-foreground">
          Anúncio
        </div>
      </div>
    );
  }

  // Internal ad - Banner variant
  if (variant === 'banner' && adData.campaign) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative ${className}`}
      >
        <div 
          className="relative overflow-hidden rounded-lg"
          style={{ 
            backgroundColor: adData.campaign.backgroundColor || '#f5f5f5',
            color: adData.campaign.textColor || '#333',
          }}
        >
          <Link 
            href={adData.campaign.ctaUrl}
            onClick={recordClick}
            className="flex items-center gap-4 p-3 hover:opacity-90 transition-opacity"
          >
            {adData.campaign.imageUrl && (
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={adData.campaign.imageUrl}
                  alt={adData.campaign.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{adData.campaign.title}</p>
              {adData.campaign.subtitle && (
                <p className="text-xs opacity-80 truncate">{adData.campaign.subtitle}</p>
              )}
            </div>
            <Button size="sm" variant="secondary" className="flex-shrink-0">
              {adData.campaign.ctaText}
            </Button>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">Anúncio</p>
      </motion.div>
    );
  }

  // Internal ad - Card variant
  if (variant === 'card' && adData.campaign) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <Card
          className="overflow-hidden"
          style={{ 
            backgroundColor: adData.campaign.backgroundColor,
            color: adData.campaign.textColor,
          }}
        >
          {adData.campaign.imageUrl && (
            <div className="relative aspect-video">
              <Image
                src={adData.campaign.imageUrl}
                alt={adData.campaign.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h4 className="font-semibold mb-1">{adData.campaign.title}</h4>
            {adData.campaign.subtitle && (
              <p className="text-sm opacity-80 mb-3">{adData.campaign.subtitle}</p>
            )}
            <Link href={adData.campaign.ctaUrl} onClick={recordClick}>
              <Button className="w-full" size="sm">
                {adData.campaign.ctaText}
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="text-[10px] text-muted-foreground text-center pb-2">Patrocinado</p>
        </Card>
      </motion.div>
    );
  }

  // Interstitial variant
  if (variant === 'interstitial' && adData.campaign) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="relative max-w-md w-full bg-background rounded-xl overflow-hidden shadow-2xl"
          style={{ 
            backgroundColor: adData.campaign.backgroundColor,
            color: adData.campaign.textColor,
          }}
        >
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {adData.campaign.imageUrl && (
            <div className="relative aspect-video">
              <Image
                src={adData.campaign.imageUrl}
                alt={adData.campaign.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">{adData.campaign.title}</h3>
            {adData.campaign.subtitle && (
              <p className="text-sm opacity-80 mb-4">{adData.campaign.subtitle}</p>
            )}
            <Link href={adData.campaign.ctaUrl} onClick={recordClick}>
              <Button size="lg" className="w-full">
                {adData.campaign.ctaText}
              </Button>
            </Link>
            <p className="text-xs opacity-60 mt-4">Anúncio</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return null;
}
