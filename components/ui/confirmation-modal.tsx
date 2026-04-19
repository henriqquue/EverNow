"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Trash2, Info, CheckCircle2, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning" | "info" | "success";
  isLoading?: boolean;
}

const variantStyles = {
  destructive: {
    icon: Trash2,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    confirmBtn: "destructive",
    shadow: "shadow-red-500/20",
  },
  warning: {
    icon: AlertCircle,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    confirmBtn: "default",
    shadow: "shadow-amber-500/20",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    confirmBtn: "default",
    shadow: "shadow-blue-500/20",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    confirmBtn: "default",
    shadow: "shadow-emerald-500/20",
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "destructive",
  isLoading = false,
}: ConfirmationModalProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isLoading && onClose()}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative z-[101] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6", styles.iconBg)}>
                <Icon className={cn("h-8 w-8", styles.iconColor)} />
              </div>
              
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {title}
              </h3>
              
              <p className="text-neutral-500 dark:text-neutral-400 mb-8 whitespace-pre-line">
                {description}
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelLabel}
                </Button>
                <Button 
                  variant={styles.confirmBtn as any}
                  className={cn("flex-1 rounded-xl h-12 shadow-lg", styles.shadow)}
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    confirmLabel
                  )}
                </Button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
