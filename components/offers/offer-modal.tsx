"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Sparkles, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Offer } from "@/lib/offers";
import Link from "next/link";

interface OfferModalProps {
  offer: Offer;
  onClose: () => void;
  onClick: () => void;
}

export function OfferModal({ offer, onClose, onClick }: OfferModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com gradiente */}
          <div className="relative bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-indigo-600/10 p-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              {offer.discountPercent ? (
                <Gift className="h-8 w-8 text-white" />
              ) : (
                <Crown className="h-8 w-8 text-white" />
              )}
            </motion.div>

            {offer.discountPercent && (
              <Badge className="bg-green-500 text-white mb-2">
                {offer.discountPercent}% OFF
              </Badge>
            )}

            <h2 className="text-2xl font-bold mb-2">{offer.title}</h2>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <p className="text-muted-foreground text-center mb-6">
              {offer.message}
            </p>

            {offer.offerPlan && (
              <div className="bg-muted/50 rounded-xl p-4 mb-6 text-center">
                <p className="text-sm text-muted-foreground">Plano ofertado</p>
                <p className="text-xl font-bold">{offer.offerPlan.name}</p>
                {offer.discountPercent ? (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-muted-foreground line-through">
                      R$ {offer.offerPlan.price.toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-green-500">
                      R$ {(offer.offerPlan.price * (1 - offer.discountPercent / 100)).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    R$ {offer.offerPlan.price.toFixed(2)}/mês
                  </p>
                )}
              </div>
            )}

            {offer.discountCode && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6 text-center">
                <p className="text-xs text-muted-foreground mb-1">Código promocional</p>
                <p className="font-mono font-bold text-lg">{offer.discountCode}</p>
              </div>
            )}

            <div className="space-y-3">
              <Link href={offer.ctaUrl} onClick={onClick}>
                <Button className="w-full" size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {offer.ctaText}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Agora não
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
