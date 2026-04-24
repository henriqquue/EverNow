"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  delay?: number;
}

const colorClasses = {
  primary: "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400",
  secondary: "bg-secondary-100 text-secondary-600 dark:bg-secondary-900 dark:text-secondary-400",
  success: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
  error: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
};

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 1500;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString("pt-BR")}{suffix}
    </span>
  );
}

export function StatsCard({
  title,
  value,
  suffix,
  prefix,
  icon: Icon,
  trend,
  color = "primary",
  delay = 0,
}: StatsCardProps) {
  const isNumeric = typeof value === 'number';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1 sm:space-y-2">
              <p className="text-[8px] xs:text-[10px] sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-1 uppercase tracking-wider">
                {title}
              </p>
              <p className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                {isNumeric ? (
                  <AnimatedNumber value={value as number} prefix={prefix} suffix={suffix} />
                ) : (
                  <span>{prefix}{value}{suffix}</span>
                )}
              </p>
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-[10px] sm:text-sm font-medium",
                    trend.positive ? "text-success" : "text-error"
                  )}
                >
                  <span>{trend.positive ? "+" : ""}{trend.value}%</span>
                  <span className="hidden sm:inline text-neutral-500">vs mês anterior</span>
                </div>
              )}
            </div>
            <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl", colorClasses[color])}>
              <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
