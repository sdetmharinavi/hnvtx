import { type ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/classNames';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    className,
    variant = 'default',
    size = 'md',
    hover = false,
    clickable = false,
    onClick,
    padding = 'md',
    rounded = 'lg',
    ...props
  }, ref) => {
    const variantClasses = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/20',
      outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
      elevated: 'bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700',
      ghost: 'bg-transparent dark:bg-transparent'
    };

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };

    const roundedClasses = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl'
    };

    const Component = clickable || onClick ? motion.div : 'div';
    const motionProps = clickable || onClick ? {
      whileHover: hover ? { y: -2, scale: 1.02 } : undefined,
      whileTap: { scale: 0.98 },
      transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    } : {};

    return (
      <Component
        ref={ref}
        className={cn(
          'transition-all duration-200 text-gray-900 dark:text-gray-100',
          variantClasses[variant],
          sizeClasses[size],
          paddingClasses[padding],
          roundedClasses[rounded],
          clickable || onClick ? 'cursor-pointer' : '',
          hover && (clickable || onClick) ? 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 dark:hover:shadow-gray-900/30' : '',
          className
        )}
        onClick={onClick}
        {...motionProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = ({ children, className }: CardHeaderProps) => (
  <div className={cn(
    'border-b border-gray-200 dark:border-gray-700 pb-3 mb-4 text-gray-900 dark:text-gray-100', 
    className
  )}>
    {children}
  </div>
);

const CardBody = ({ children, className }: CardBodyProps) => (
  <div className={cn('flex-1 text-gray-700 dark:text-gray-300', className)}>
    {children}
  </div>
);

const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={cn(
    'border-t border-gray-200 dark:border-gray-700 pt-3 mt-4 text-gray-600 dark:text-gray-400', 
    className
  )}>
    {children}
  </div>
);

export { Card, CardHeader, CardBody, CardFooter };