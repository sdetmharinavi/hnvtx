import React, { forwardRef, useId, useState, useEffect } from 'react';
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
  clearable?: boolean;
  onClear?: () => void;
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
      clearable = false,
      onClear,
      value,
      defaultValue,
      onChange,
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
    
    // File inputs cannot be controlled via value attribute
    const isFileInput = type === 'file';
    
    // Track internal value for clearable functionality
    const [internalValue, setInternalValue] = useState(
      isFileInput ? '' : (value || defaultValue || '')
    );
    // Track if a file is selected (for file inputs)
    const [hasFile, setHasFile] = useState(false);
    
    // Update internal value when external value changes
    useEffect(() => {
      if (isFileInput) return; // file inputs remain uncontrolled
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value, isFileInput]);
    
    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isFileInput) {
        setHasFile(Boolean(e.target.files && e.target.files.length > 0));
      } else {
        const newValue = e.target.value;
        setInternalValue(newValue);
      }
      if (onChange) {
        onChange(e);
      }
    };
    
    // Handle clear action
    const handleClear = () => {
      if (isFileInput) {
        // Clear selected file by setting input's value to empty string
        if (ref && 'current' in ref && ref.current) {
          try {
            ref.current.value = '';
          } catch {}
          setHasFile(false);
          // Optionally notify change to consumers
          if (onChange) {
            const syntheticEvent = {
              target: { value: '' },
              currentTarget: { value: '' },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
          ref.current.focus();
        }
      } else {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        
        setInternalValue('');
        
        if (onChange) {
          onChange(syntheticEvent);
        }
        
        if (onClear) {
          onClear();
        }
        
        // Focus the input after clearing
        if (ref && 'current' in ref && ref.current) {
          ref.current.focus();
        }
      }
    };
    
    // Check if we should show the clear button
    const shouldShowClear = clearable && !disabled && !isLoading && (
      isFileInput ? hasFile : String(internalValue).length > 0
    );
    
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
      
      // Size styles with adjusted padding for multiple right icons
      size === 'sm' && [
        'px-3 py-1.5 text-sm',
        leftIcon && 'pl-9',
        // Adjust right padding based on what's showing on the right
        (shouldShowClear && (rightIcon || isLoading)) && 'pr-16',
        (shouldShowClear && !(rightIcon || isLoading)) && 'pr-9',
        (!shouldShowClear && (rightIcon || isLoading)) && 'pr-9',
      ],
      size === 'md' && [
        'px-4 py-2.5 text-base',
        leftIcon && 'pl-11',
        // Adjust right padding based on what's showing on the right
        (shouldShowClear && (rightIcon || isLoading)) && 'pr-20',
        (shouldShowClear && !(rightIcon || isLoading)) && 'pr-11',
        (!shouldShowClear && (rightIcon || isLoading)) && 'pr-11',
      ],
      size === 'lg' && [
        'px-5 py-3 text-lg',
        leftIcon && 'pl-13',
        // Adjust right padding based on what's showing on the right
        (shouldShowClear && (rightIcon || isLoading)) && 'pr-24',
        (shouldShowClear && !(rightIcon || isLoading)) && 'pr-13',
        (!shouldShowClear && (rightIcon || isLoading)) && 'pr-13',
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
      rightSecondary: {
        sm: 'right-8',
        md: 'right-10',
        lg: 'right-12',
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
      shouldShowClear ? iconPositionClasses.rightSecondary[size] : iconPositionClasses.right[size],
      error ? 'text-red-400' : 'text-gray-400'
    );

    const clearIconClasses = clsx(
      'absolute top-1/2 -translate-y-1/2 flex items-center justify-center',
      'cursor-pointer pointer-events-auto transition-colors duration-200',
      'hover:text-gray-600 rounded-full p-0.5',
      iconSizeClasses[size],
      iconPositionClasses.right[size],
      error ? 'text-red-400 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'
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

    // Clear icon SVG
    const ClearIcon = () => (
      <svg
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
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
            value={isFileInput ? undefined : (value !== undefined ? value : internalValue)}
            onChange={handleChange}
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
          
          {shouldShowClear && (
            <button
              type="button"
              className={clearIconClasses}
              onClick={handleClear}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <ClearIcon />
            </button>
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