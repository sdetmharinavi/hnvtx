// src/components/common/Button/Button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { cn } from '@/utils/classNames';
import { ButtonSpinner } from '../LoadingSpinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  isdropdown?: boolean;
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
  warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 disabled:bg-yellow-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:text-gray-400 disabled:border-gray-200',
};

const sizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  xl: 'px-6 py-3 text-lg',
};

const roundedOptions = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = 'md',
      disabled,
      isdropdown,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
          // Variant styles
          variants[variant],
          // Size styles
          sizes[size],
          // Rounded styles
          roundedOptions[rounded],
          // Full width
          fullWidth && 'w-full',
          // Disabled cursor
          isDisabled && 'cursor-not-allowed',
          // Custom className
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <ButtonSpinner
            size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'sm'}
          />
        )}

        {/* Left icon */}
        {!loading && leftIcon && (
          <span className="mr-2 flex items-center">
            {leftIcon}
          </span>
        )}

        {/* Button content */}
        <span>
          {loading && loadingText ? loadingText : children}
        </span>

        {/* Right icon or dropdown indicator */}
        {!loading && (rightIcon || isdropdown) && (
          <span className="ml-2 flex items-center">
            {rightIcon || <FiChevronDown className="h-4 w-4" />}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Icon button variant
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  label?: string; // For accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 'md', className, ...props }, ref) => {
    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(
          'aspect-square p-0!',
          className
        )}
        aria-label={label}
        {...props}
      >
        <span className={iconSizes[size]}>
          {icon}
        </span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button group component
interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  attached?: boolean;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  attached = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        attached && orientation === 'horizontal' && '[&>*:not(:first-child)]:ml-0 [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none *:border-r-0 [&>*:last-child]:border-r',
        attached && orientation === 'vertical' && '[&>*:not(:first-child)]:mt-0 [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none *:border-b-0 [&>*:last-child]:border-b',
        !attached && orientation === 'horizontal' && 'space-x-2',
        !attached && orientation === 'vertical' && 'space-y-2',
        className
      )}
    >
      {children}
    </div>
  );
};

// Floating Action Button
interface FABProps extends Omit<ButtonProps, 'size' | 'variant'> {
  size?: 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon?: React.ReactNode;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  size = 'lg',
  position = 'bottom-right',
  icon,
  children,
  className,
  ...props
}) => {
  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  const fabSizes = {
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
  };

  return (
    <Button
      variant="primary"
      rounded="full"
      className={cn(
        positions[position],
        fabSizes[size],
        'shadow-lg hover:shadow-xl z-50 p-0!',
        className
      )}
      {...props}
    >
      {icon || children}
    </Button>
  );
};

// Specialized exam buttons
export const SubmitButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="success" {...props} />
);

export const CancelButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
);

export const DeleteButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
);

export const NextButton: React.FC<Omit<ButtonProps, 'variant' | 'rightIcon'>> = (props) => (
  <Button
    variant="primary"
    rightIcon={
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    }
    {...props}
  />
);

export const PreviousButton: React.FC<Omit<ButtonProps, 'variant' | 'leftIcon'>> = (props) => (
  <Button
    variant="secondary"
    leftIcon={
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    }
    {...props}
  />
);