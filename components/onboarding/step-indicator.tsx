'use client';

import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  name: string;
  icon?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  onStepClick?: (index: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  skippedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step indicators - mobile: show only current */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-primary">
          Etapa {currentStep + 1} de {steps.length}
        </span>
        <span className="text-sm text-muted-foreground">
          {steps[currentStep]?.name}
        </span>
      </div>

      {/* Step dots - desktop */}
      <div className="hidden md:flex justify-between mt-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isSkipped = skippedSteps.includes(step.id);
          const isCurrent = index === currentStep;

          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(index)}
              className={cn(
                'flex flex-col items-center group',
                onStepClick && 'cursor-pointer',
                !onStepClick && 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                  isCompleted && 'bg-green-500 text-white',
                  isSkipped && 'bg-yellow-500 text-white',
                  isCurrent && !isCompleted && 'bg-primary text-white ring-4 ring-primary/20',
                  !isCompleted && !isSkipped && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 max-w-[80px] text-center truncate',
                  isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {step.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
