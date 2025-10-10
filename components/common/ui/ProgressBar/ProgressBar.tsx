// src/components/common/ProgressBar/ProgressBar.tsx
import { motion } from 'framer-motion';
import { cn } from '@/utils/classNames';
import { type ReactNode } from 'react';

// Common types
export type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const sizeClasses = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const variantClasses: Record<Variant, string> = {
  default: 'bg-blue-500 dark:bg-blue-400',
  success: 'bg-green-500 dark:bg-green-400',
  warning: 'bg-yellow-500 dark:bg-yellow-400',
  danger: 'bg-red-500 dark:bg-red-400',
  info: 'bg-cyan-500 dark:bg-cyan-400',
};

const backgroundClasses: Record<Variant, string> = {
  default: 'bg-blue-100 dark:bg-blue-900',
  success: 'bg-green-100 dark:bg-green-900',
  warning: 'bg-yellow-100 dark:bg-yellow-900',
  danger: 'bg-red-100 dark:bg-red-900',
  info: 'bg-cyan-100 dark:bg-cyan-900',
};

// Linear ProgressBar
interface ProgressBarProps {
  value: number;
  max?: number;
  size?: keyof typeof sizeClasses;
  variant?: Variant;
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  striped?: boolean;
  className?: string;
  barClassName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  showPercentage = true,
  animated = true,
  striped = false,
  className,
  barClassName,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || showPercentage) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {showLabel && <span className="font-medium text-gray-700 dark:text-gray-200">{label || 'Progress'}</span>}
          {showPercentage && <span className="text-gray-600 dark:text-gray-300">{Math.round(percentage)}%</span>}
        </div>
      )}

      <div className={cn('overflow-hidden rounded-full', sizeClasses[size], backgroundClasses[variant])}>
        <motion.div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-in-out',
            variantClasses[variant],
            striped && 'bg-stripes',
            striped && animated && 'animate-stripes',
            barClassName
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' as const }}
        />
      </div>
    </div>
  );
};

// Stacked Progress Bars
interface StackedProgressBarProps {
  segments: { value: number; variant?: Variant }[];
  max?: number;
  size?: keyof typeof sizeClasses;
  animated?: boolean;
  className?: string;
}

export const StackedProgressBar: React.FC<StackedProgressBarProps> = ({
  segments,
  max = 100,
  size = 'md',
  animated = true,
  className,
}) => {
  return (
    <div className={cn('flex w-full overflow-hidden rounded-full', sizeClasses[size], className)}>
      {segments.map((seg, idx) => {
        const width = `${(seg.value / max) * 100}%`;
        const color = variantClasses[seg.variant || 'default'];
        return (
          <motion.div
            key={idx}
            className={cn('h-full', color)}
            initial={{ width: 0 }}
            animate={{ width }}
            transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' as const }}
          />
        );
      })}
    </div>
  );
};

// Step Progress Bar with icons
interface StepProgressProps {
  steps: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: ReactNode;
  }>;
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={cn('flex', isHorizontal ? 'items-center space-x-4' : 'flex-col space-y-4', className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div key={step.id} className={cn('flex items-center', isHorizontal ? 'flex-row' : 'flex-col')}>
            <div className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  isCompleted && 'bg-green-500 text-white',
                  isActive && 'bg-blue-500 text-white',
                  isUpcoming && 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                )}
              >
                {step.icon || (isCompleted ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                ))}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    isHorizontal ? 'h-0.5 w-12' : 'h-12 w-0.5',
                    isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>
            <div className={cn('ml-3', !isHorizontal && 'ml-0 mt-2')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  isActive && 'text-blue-600 dark:text-blue-400',
                  isCompleted && 'text-green-600 dark:text-green-400',
                  isUpcoming && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {step.label}
              </p>
              {step.description && <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
