// src/components/common/ProgressBar/ProgressBar.tsx
import { motion } from 'framer-motion';
import { cn } from '@/utils/classNames';

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
