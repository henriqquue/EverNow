'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IMPORTANCE_LEVELS } from '@/lib/profile-data';

interface ImportanceSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ImportanceSelector({ value, onChange }: ImportanceSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Qual a importância dessa preferência?
      </label>
      <div className="flex flex-wrap gap-2">
        {IMPORTANCE_LEVELS.map((level) => (
          <motion.button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              'border-2',
              value === level.value
                ? getImportanceColors(level.value).active
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            {level.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function getImportanceColors(value: string): { active: string } {
  switch (value) {
    case 'INDIFFERENT':
      return { active: 'border-gray-400 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    case 'PREFERENCE':
      return { active: 'border-blue-500 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' };
    case 'VERY_IMPORTANT':
      return { active: 'border-purple-500 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' };
    case 'ESSENTIAL':
      return { active: 'border-red-500 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' };
    default:
      return { active: 'border-primary bg-primary/10 text-primary' };
  }
}
