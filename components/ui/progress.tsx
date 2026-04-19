"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const colorClasses = {
  primary: "bg-gradient-brand",
  secondary: "bg-secondary-500",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

export function Progress({
  value,
  max = 100,
  showLabel = false,
  size = "md",
  color = "primary",
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Progresso
          </span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", colorClasses[color])}
        />
      </div>
    </div>
  );
}
