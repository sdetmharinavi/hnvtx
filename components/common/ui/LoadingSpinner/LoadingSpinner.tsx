// components/common/ui/LoadingSpinner/LoadingSpinner.tsx
import { cn } from "@/utils/classNames";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "gray";
  className?: string;
  text?: string;
  overlay?: boolean;
}

const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const colorClasses = {
  primary: "text-blue-600 dark:text-blue-400",
  secondary: "text-gray-600 dark:text-gray-400",
  white: "text-white dark:text-white",
  gray: "text-gray-400 dark:text-gray-500",
};

const textSizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  className,
  text,
  overlay = false,
}) => {
  const spinnerContent = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <svg
        className={cn("animate-spin", sizeClasses[size], colorClasses[color])}
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'>
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
        />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>

      {text && (
        <p className={cn("font-medium text-gray-600 dark:text-gray-300", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25 dark:bg-black dark:bg-opacity-40 backdrop-blur-sm'>
        <div className='rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg'>{spinnerContent}</div>
      </div>
    );
  }

  return spinnerContent;
};

// Variants for specific use cases
export const ButtonSpinner: React.FC<{ size?: "xs" | "sm" | "md" }> = ({ size = "sm" }) => (
  <LoadingSpinner size={size} color='primary' className='inline-flex' />
);

export const PageSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className='flex min-h-screen items-center justify-center'>
    <LoadingSpinner size='lg' text={text} />
  </div>
);

export const CardSpinner: React.FC<{ text?: string }> = ({ text }) => (
  <div className='flex items-center justify-center py-12'>
    <LoadingSpinner size='md' text={text} />
  </div>
);

// Loading skeleton components
export const LoadingSkeleton: React.FC<{
  className?: string;
  rows?: number;
}> = ({ className, rows = 1 }) => (
  <div className={cn("animate-pulse space-y-3", className)}>
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className='h-4 rounded bg-gray-200 dark:bg-gray-700'
        style={{
          width: `${Math.random() * 40 + 60}%`,
        }}
      />
    ))}
  </div>
);

export const LoadingCard: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div
    className={cn(
      "animate-pulse rounded-lg border border-gray-200 dark:border-gray-700 p-6",
      className
    )}>
    <div className='space-y-4'>
      <div className='h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700' />
      <div className='space-y-2'>
        <div className='h-4 rounded bg-gray-200 dark:bg-gray-700' />
        <div className='h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700' />
      </div>
      <div className='h-10 w-24 rounded bg-gray-200 dark:bg-gray-700' />
    </div>
  </div>
);

export const BlurLoader: React.FC<{
  className?: string;
}> = ({ className }) => (
  <div className='absolute inset-0 bg-white/70 dark:bg-gray-900/70 z-20 flex items-center justify-center backdrop-blur-sm'>
    <div className='flex items-center space-x-2 text-gray-500'>
      <div className='h-5 w-5 animate-spin rounded-full border-b-2 border-blue-500'></div>
      <span>Refreshing data...</span>
    </div>
  </div>
);
