import React, { forwardRef, useId } from 'react';
import { clsx } from 'clsx';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      variant = 'default',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled,
      required = false,
      fullWidth = true,
      id,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    // Use React's useId hook for better SSR support and uniqueness
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperTextId = `${inputId}-helper`;
    
    // Build aria-describedby dynamically
    const describedBy = [
      ariaDescribedBy,
      error ? errorId : null,
      helperText && !error ? helperTextId : null,
    ].filter(Boolean).join(' ') || undefined;

    const containerClasses = clsx(
      fullWidth ? 'w-full' : 'inline-block'
    );

    const inputClasses = clsx(
      // Base styles
      'rounded-lg border transition-all duration-200 font-medium',
      'focus:outline-none focus:ring-2 focus:border-transparent',
      'placeholder:text-gray-400',
      
      // Width
      fullWidth ? 'w-full' : 'min-w-0',
      
      // Variant styles
      variant === 'default' && [
        'border-gray-300 bg-white',
        'hover:border-gray-400',
        'focus:ring-blue-500',
      ],
      variant === 'filled' && [
        'border-gray-200 bg-gray-50',
        'hover:bg-gray-100 hover:border-gray-300',
        'focus:bg-white focus:ring-blue-500',
      ],
      variant === 'outlined' && [
        'border-2 border-gray-300 bg-white',
        'hover:border-gray-400',
        'focus:ring-blue-500',
      ],
      
      // Size styles
      size === 'sm' && [
        'px-3 py-1.5 text-sm',
        leftIcon && 'pl-9',
        (rightIcon || isLoading) && 'pr-9',
      ],
      size === 'md' && [
        'px-4 py-2.5 text-base',
        leftIcon && 'pl-11',
        (rightIcon || isLoading) && 'pr-11',
      ],
      size === 'lg' && [
        'px-5 py-3 text-lg',
        leftIcon && 'pl-13',
        (rightIcon || isLoading) && 'pr-13',
      ],
      
      // State styles
      error && [
        'border-red-500 focus:ring-red-500',
        variant === 'filled' && 'bg-red-50',
      ],
      
      // Disabled styles
      (disabled || isLoading) && [
        'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200',
        'hover:border-gray-200 hover:bg-gray-50',
      ],
      
      className
    );

    const iconBaseClasses = 'absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none';
    
    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5', 
      lg: 'w-6 h-6',
    };

    const iconPositionClasses = {
      left: {
        sm: 'left-2.5',
        md: 'left-3',
        lg: 'left-4',
      },
      right: {
        sm: 'right-2.5',
        md: 'right-3', 
        lg: 'right-4',
      },
    };

    const leftIconClasses = clsx(
      iconBaseClasses,
      iconSizeClasses[size],
      iconPositionClasses.left[size],
      error ? 'text-red-400' : 'text-gray-400'
    );

    const rightIconClasses = clsx(
      iconBaseClasses,
      iconSizeClasses[size],
      iconPositionClasses.right[size],
      error ? 'text-red-400' : 'text-gray-400'
    );

    const LoadingSpinner = () => (
      <div className={clsx(
        'animate-spin rounded-full border-2 border-gray-300',
        size === 'sm' && 'h-3 w-3 border-t-blue-500',
        size === 'md' && 'h-4 w-4 border-t-blue-500',
        size === 'lg' && 'h-5 w-5 border-t-blue-500',
        error && 'border-t-red-500'
      )} />
    );

    return (
      <div className={containerClasses}>
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              'block text-sm font-medium mb-1.5',
              error ? 'text-red-700' : 'text-gray-700'
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={leftIconClasses} aria-hidden="true">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={inputClasses}
            disabled={disabled || isLoading}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            {...props}
          />
          
          {rightIcon && !isLoading && (
            <div className={rightIconClasses} aria-hidden="true">
              {rightIcon}
            </div>
          )}
          
          {isLoading && (
            <div className={rightIconClasses} aria-hidden="true">
              <LoadingSpinner />
            </div>
          )}
        </div>
        
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={helperTextId}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;