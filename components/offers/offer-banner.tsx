"use client";

import { motion } from "framer-motion";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/lib/offers";
import Link from "next/link";

interface OfferBannerProps {
  banner: Banner;
  onDismiss: () => void;
}

export function OfferBanner({ banner, onDismiss }: OfferBannerProps) {
  const bgStyle = banner.backgroundColor
    ? { backgroundColor: banner.backgroundColor }
    : undefined;
  const textStyle = banner.textColor ? { color: banner.textColor } : undefined;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white py-3 px-4"
      style={bgStyle}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Sparkles className="h-5 w-5 flex-shrink-0" style={textStyle} />
          <div className="min-w-0" style={textStyle}>
            <p className="font-semibold truncate">{banner.title}</p>
            {banner.subtitle && (
              <p className="text-sm opacity-90 truncate">{banner.subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={banner.ctaUrl}>
            <Button
              size="sm"
              variant="secondary"
              className="whitespace-nowrap"
            >
              {banner.ctaText}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>

          {banner.dismissible && (
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4" style={textStyle} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
