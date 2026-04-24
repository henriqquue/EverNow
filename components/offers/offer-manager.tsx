'use client';

import { useState, useEffect } from 'react';
import { usePathname } from '@/navigation';
import { useSession } from 'next-auth/react';
import { fetchOffers, recordCampaignEvent, type Offer, type Banner } from '@/lib/offers';
import { OfferBanner } from './offer-banner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Sparkles, ArrowRight, Gift } from 'lucide-react';
import { useRouter } from '@/navigation';

export function OfferManager() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [offers, setOffers] = useState<{ campaigns: Offer[]; banners: Banner[] }>({
    campaigns: [],
    banners: [],
  });
  const [activeModal, setActiveModal] = useState<Offer | null>(null);
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      const loadOffers = async () => {
        // Extract page key from pathname
        const pageKey = pathname.split('/').pop() || 'dashboard';
        const data = await fetchOffers(undefined, undefined, pageKey);
        setOffers(data);

        // Show first modal campaign if available
        const modalOffer = data.campaigns.find(c => c.displayType === 'MODAL');
        if (modalOffer) {
          setActiveModal(modalOffer);
          recordCampaignEvent(modalOffer.id, 'VIEW', { page: pageKey });
        }

        // Record views for banners
        data.banners.forEach(b => {
          recordCampaignEvent(b.id, 'VIEW', { page: pageKey });
        });
      };

      loadOffers();
    }
  }, [pathname, status]);

  const handleDismissModal = () => {
    if (activeModal) {
      recordCampaignEvent(activeModal.id, 'CLOSE');
      setActiveModal(null);
    }
  };

  const handleBannerDismiss = (bannerId: string) => {
    recordCampaignEvent(bannerId, 'CLOSE');
    setDismissedBanners(prev => [...prev, bannerId]);
  };

  const handleAction = (offerId: string, url: string) => {
    recordCampaignEvent(offerId, 'CLICK');
    router.push(url as any);
    setActiveModal(null);
  };

  if (status !== 'authenticated') return null;

  const visibleBanners = offers.banners.filter(b => !dismissedBanners.includes(b.id));

  return (
    <>
      {/* Top Banner Area - Changed to sticky to push content and avoid overlap */}
      <div className="sticky top-16 left-0 right-0 z-40 flex flex-col gap-2 p-2 pointer-events-none w-full">
        <AnimatePresence>
          {visibleBanners.filter(b => b.position === 'top').map(banner => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pointer-events-auto"
            >
              <OfferBanner banner={banner} onDismiss={() => handleBannerDismiss(banner.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Campaign Modal */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden bg-card border rounded-3xl shadow-2xl"
            >
              {/* Close Button */}
              <button 
                onClick={handleDismissModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image Header */}
              {activeModal.imageUrl ? (
                <div className="relative h-48 w-full">
                  <img 
                    src={activeModal.imageUrl} 
                    alt={activeModal.title} 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                </div>
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white/50" />
                </div>
              )}

              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-primary/10 text-primary">
                  {activeModal.discountPercent ? <Gift className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                </div>
                
                <h2 className="text-3xl font-black mb-4 tracking-tight leading-tight">
                  {activeModal.title}
                </h2>
                
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  {activeModal.message}
                </p>

                {activeModal.discountPercent && (
                  <div className="mb-8 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      -{activeModal.discountPercent}% OFF
                    </span>
                    {activeModal.discountCode && (
                      <div className="mt-1 text-sm font-mono bg-background px-3 py-1 rounded inline-block">
                        {activeModal.discountCode}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Button 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                    onClick={() => handleAction(activeModal.id, activeModal.ctaUrl)}
                  >
                    {activeModal.ctaText}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-12 text-muted-foreground"
                    onClick={handleDismissModal}
                  >
                    Agora não
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Floating Area */}
      <div className="fixed bottom-20 left-0 right-0 z-40 flex flex-col gap-2 px-4 pointer-events-none lg:left-64 lg:bottom-4">
        <AnimatePresence>
          {visibleBanners.filter(b => b.position === 'bottom').map(banner => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="pointer-events-auto"
            >
              <OfferBanner banner={banner} onDismiss={() => handleBannerDismiss(banner.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
