import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface StatProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  isLoading?: boolean;
}

export const StatCard: React.FC<StatProps> = ({
  value,
  label,
  icon,
  color = 'default',
  isLoading = false,
}) => {
  const statColors = {
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
    default: 'text-gray-900 dark:text-white',
  };

  const borderColors = {
    primary: 'border-blue-200 dark:border-blue-700',
    success: 'border-green-200 dark:border-green-700',
    warning: 'border-yellow-200 dark:border-yellow-700',
    danger: 'border-red-200 dark:border-red-700',
    default: 'border-gray-200 dark:border-gray-700',
  };

  const bgColors = {
    primary: 'bg-blue-50 dark:bg-blue-900/20',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'bg-red-50 dark:bg-red-900/20',
    default: 'bg-white dark:bg-gray-900',
  };

  return (
    <div
      className={cn(
        // MOBILE OPTIMIZATION: Reduced padding from p-4 to p-3 on mobile
        'rounded-lg border p-3 sm:p-4 flex items-start gap-3 sm:gap-4',
        borderColors[color],
        bgColors[color]
      )}
    >
      {/* Hide icon on very small screens if needed, or keep small */}
      {icon && <div className={`shrink-0 text-xl sm:text-2xl ${statColors[color]}`}>{icon}</div>}
      <div className="min-w-0">
        {/* min-w-0 prevents truncation issues in grid */}
        <div className={`text-xl sm:text-2xl font-bold truncate ${statColors[color]}`}>
          {isLoading ? (
            <div className="h-6 w-12 sm:h-8 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          ) : (
            value
          )}
        </div>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate" title={label}>
          {label}
        </div>
      </div>
    </div>
  );
};
