'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: () => void;
  matchedUser: {
    name: string;
    photo?: string;
  } | null;
  currentUserPhoto?: string;
}

export function MatchModal({
  isOpen,
  onClose,
  onStartChat,
  matchedUser,
  currentUserPhoto
}: MatchModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#8b5cf6', '#7c3aed']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#8b5cf6', '#7c3aed']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  if (!matchedUser) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-indigo-600/90 to-purple-600/90"
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative z-10 text-center"
          >
            {/* Photos */}
            <div className="flex items-center justify-center mb-8">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl -mr-4 z-10"
              >
                <Image
                  src={currentUserPhoto || '/placeholder-avatar.png'}
                  alt="Você"
                  fill
                  className="object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="relative z-20 w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center"
              >
                <Heart className="w-8 h-8 text-indigo-600" fill="currentColor" />
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl -ml-4"
              >
                <Image
                  src={matchedUser.photo || '/placeholder-avatar.png'}
                  alt={matchedUser.name}
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-4xl font-bold text-white mb-2">
                É uma Conexão!
              </h2>
              <p className="text-white/90 text-lg mb-8">
                Você e {matchedUser.name} curtiram um ao outro
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={onStartChat}
                  className="bg-white text-indigo-600 hover:bg-white/90 px-8"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Enviar mensagem
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 px-8"
                  size="lg"
                >
                  Continuar explorando
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
