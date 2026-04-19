'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Heart, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryScore {
  category: string;
  categoryName: string;
  percentage: number;
}

interface CompatibilityBadgeProps {
  overallPercentage: number;
  categoryScores?: CategoryScore[];
  explanation?: string;
  highlights?: string[];
  compact?: boolean;
}

export function CompatibilityBadge({
  overallPercentage,
  categoryScores,
  explanation,
  highlights,
  compact = false,
}: CompatibilityBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br',
            getScoreGradient(overallPercentage)
          )}
        >
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className={cn('text-lg font-bold', getScoreColor(overallPercentage))}>
            {overallPercentage}%
          </p>
          <p className="text-xs text-muted-foreground">compatível</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br',
              getScoreGradient(overallPercentage)
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <p className={cn('text-3xl font-bold', getScoreColor(overallPercentage))}>
              {overallPercentage}%
            </p>
            <p className="text-muted-foreground">Compatibilidade</p>
          </div>
        </div>
        <Sparkles className="w-6 h-6 text-primary" />
      </div>

      {explanation && (
        <p className="text-sm text-muted-foreground mb-4 italic">
          "{explanation}"
        </p>
      )}

      {highlights && highlights.length > 0 && (
        <div className="mb-4 space-y-1">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}

      {categoryScores && categoryScores.length > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-sm font-medium">Por categoria</h4>
          {categoryScores.slice(0, 5).map((cat) => (
            <div key={cat.category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{cat.categoryName}</span>
                <span className={cn('font-medium', getScoreColor(cat.percentage))}>
                  {cat.percentage}%
                </span>
              </div>
              <Progress value={cat.percentage} className="h-1.5" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
