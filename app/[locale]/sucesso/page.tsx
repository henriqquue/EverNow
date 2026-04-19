'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, CheckCircle, Crown, Sparkles, ArrowRight, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trackCommercialEvent } from '@/lib/commercial-events';

function SuccessContent() {
  const searchParams = useSearchParams();
  const planSlug = searchParams.get('plan');

  useEffect(() => {
    trackCommercialEvent({
      eventType: 'checkout_complete',
      planSlug: planSlug || undefined
    });
  }, [planSlug]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-6"
          >
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Assinatura confirmada!
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Parabéns! Sua assinatura Premium foi ativada com sucesso.
            </p>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-3">
                <Crown className="h-8 w-8 text-amber-500" />
                <div className="text-left">
                  <p className="font-semibold text-neutral-900 dark:text-white">Plano Premium</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Todos os recursos desbloqueados</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-left mb-8">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span className="text-neutral-700 dark:text-neutral-300">Likes ilimitados</span>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-indigo-600" />
                <span className="text-neutral-700 dark:text-neutral-300">Ver quem curtiu você</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-indigo-600" />
                <span className="text-neutral-700 dark:text-neutral-300">Mensagens ilimitadas</span>
              </div>
            </div>

            <Link href="/cadastro">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 mb-4"
              >
                Criar minha conta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <p className="text-sm text-neutral-500">
              Enviamos um e-mail de confirmação com os detalhes da sua assinatura.
            </p>
          </motion.div>
        </Card>

        <div className="mt-8 text-center">
          <Link href="/" className="flex items-center justify-center gap-2 text-neutral-600 hover:text-neutral-900">
            <Heart className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold">EverNOW</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SuccessContent />
    </Suspense>
  );
}
