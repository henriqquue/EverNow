'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { REPORT_REASON_OPTIONS } from '@/lib/filter-options';
import { cn } from '@/lib/utils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => void;
  userName?: string;
}

export function ReportModal({ isOpen, onClose, onSubmit, userName }: ReportModalProps) {
  const t = useTranslations('Chat');
  const common = useTranslations('Common');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    await onSubmit(selectedReason, description);
    setIsSubmitting(false);
    setSelectedReason('');
    setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-[10%] max-w-md mx-auto bg-background rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <div className="flex items-center gap-2 text-red-500">
                <Flag className="w-5 h-5" />
                <h2 className="text-lg font-semibold">{t('report_title')}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {userName && (
                <p className="text-sm text-muted-foreground mb-4">
                  {t('report_user', { name: userName })}
                </p>
              )}

              <p className="text-sm font-medium mb-3">{t('report_reason')}</p>
              <div className="space-y-2 mb-4">
                {REPORT_REASON_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedReason(option.value)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg border transition-all',
                      selectedReason === option.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-950'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    {t.has(`reason_${option.value}` as any) ? t(`reason_${option.value}` as any) : option.label}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">{t('description_label')}</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('description_placeholder')}
                  className="w-full min-h-[100px] px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-300">
                  {t('report_warning')}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={onClose} className="flex-1">
                {common('cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                {isSubmitting ? t('sending') : t('report')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
