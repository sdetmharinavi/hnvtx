"use client";

import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
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
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const innerRef = useRef<HTMLInputElement | null>(null);
    const [liveHasValue, setLiveHasValue] = useState<boolean>(false);

    // Merge forwarded ref with local ref
    const setRefs = (el: HTMLInputElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref && 'current' in ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    };

    // Initialize hasValue on mount and when value/defaultValue changes
    useEffect(() => {
      const dv = (props as { defaultValue?: string | number })?.defaultValue;
      const raw = value ?? dv ?? innerRef.current?.value ?? '';
      setLiveHasValue(String(raw).length > 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, (props as { defaultValue?: string | number })?.defaultValue]);

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
    
    const shouldShowClear = clearable && !disabled && !isLoading && (String((value as any) || '').length > 0 || liveHasValue);
    const defaultValue = (props as { defaultValue?: string | number })?.defaultValue;
    const rawVal = value ?? defaultValue ?? '';
    const hasValue = liveHasValue || String(rawVal).length > 0;

    const inputClasses = clsx(
      'rounded-lg border transition-all duration-200 font-medium w-full',
      'focus:outline-none focus:ring-2 focus:border-transparent',
      'placeholder:text-gray-400 dark:placeholder-gray-500',
      'px-4 py-2.5 text-base', // Standard size
      leftIcon && 'pl-11',
      shouldShowClear && 'pr-11',
      // Place external classes earlier so our bg utilities later will override
      className,
      error ? 'border-red-500 focus:ring-red-500 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-blue-500',
      // Disabled style
      (disabled || isLoading) && 'bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed',
      // Active background: apply bg-gray-100 in normal mode and dark:bg-gray-800 in dark mode when input has value
      !(disabled || isLoading) && hasValue && 'bg-gray-50 dark:bg-gray-800!',
      // Default background when no value
      !(disabled || isLoading) && !hasValue && 'bg-white dark:bg-gray-900',
      // Text colors
      !(disabled || isLoading) && 'text-gray-900 dark:text-gray-100'
    );
    
    return (
      <div className={clsx('relative', fullWidth && 'w-full')}>
        {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">{leftIcon}</div>}
        <input
          id={inputId}
          ref={setRefs}
          type={type}
          className={inputClasses}
          disabled={disabled || isLoading}
          value={value as any}
          onChange={(e) => {
            setLiveHasValue(e.currentTarget.value.length > 0);
            props.onChange?.(e);
          }}
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