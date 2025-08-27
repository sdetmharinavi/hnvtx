"use client";

import React, { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { FiX } from 'react-icons/fi';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  leftIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      error,
      leftIcon,
      isLoading = false,
      disabled,
      fullWidth = true,
      clearable = false,
      onClear,
      id,
      value, // Keep value in props to be passed by react-hook-form
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    // Handle clear action
    const handleClear = () => {
      // Create a synthetic event that react-hook-form can understand
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      
      // If an onChange is passed from register, call it with an empty value
      props.onChange?.(syntheticEvent);
      
      onClear?.();
      
      // Focus the input
      if (ref && 'current' in ref && ref.current) {
        ref.current.focus();
      }
    };
    
    const shouldShowClear = clearable && !disabled && !isLoading && (String(value || '').length > 0);

    const inputClasses = clsx(
      'rounded-lg border transition-all duration-200 font-medium w-full',
      'focus:outline-none focus:ring-2 focus:border-transparent',
      'placeholder:text-gray-400 dark:placeholder-gray-500',
      'px-4 py-2.5 text-base', // Standard size
      leftIcon && 'pl-11',
      shouldShowClear && 'pr-11',
      error ? 'border-red-500 focus:ring-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-blue-500',
      (disabled || isLoading) && 'bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed',
      className
    );
    
    return (
      <div className={clsx('relative', fullWidth && 'w-full')}>
        {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">{leftIcon}</div>}
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={inputClasses}
          disabled={disabled || isLoading}
          value={value} // Directly use the value from props
          aria-invalid={!!error}
          {...props}
        />
        {shouldShowClear && (
          <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <FiX />
          </button>
        )}
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;