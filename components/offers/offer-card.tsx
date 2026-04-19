"use client";

import { motion } from "framer-motion";
import { Crown, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Offer } from "@/lib/offers";
import Link from "next/link";

interface OfferCardProps {
  offer: Offer;
  onClick?: () => void;
}

export function OfferCard({ offer, onClick }: OfferCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
              {offer.discountPercent ? (
                <Gift className="h-6 w-6 text-white" />
              ) : (
                <Crown className="h-6 w-6 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold truncate">{offer.title}</h3>
                {offer.discountPercent && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    {offer.discountPercent}% OFF
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {offer.message}
              </p>

              {offer.offerPlan && offer.discountPercent && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground line-through">
                    R$ {offer.offerPlan.price.toFixed(2)}
                  </span>
                  <span className="font-bold text-green-500">
                    R$ {(offer.offerPlan.price * (1 - offer.discountPercent / 100)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <Link href={offer.ctaUrl} onClick={onClick}>
              <Button size="sm">
                {offer.ctaText}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
