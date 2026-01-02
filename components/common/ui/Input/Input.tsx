'use client';

import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { FiX } from 'react-icons/fi';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
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
      else if (ref && 'current' in ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    };

    // Initialize hasValue logic
    useEffect(() => {
      const val = value !== undefined ? value : innerRef.current?.value ?? '';
      setLiveHasValue(String(val).length > 0);
    }, [value]);

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event bubbling issues

      // Create synthetic event
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;

      props.onChange?.(syntheticEvent);
      onClear?.();

      if (innerRef.current) {
        innerRef.current.value = '';
        innerRef.current.focus();
      }
      setLiveHasValue(false);
    };

    const safeValue = value === undefined ? undefined : value ?? '';
    const shouldShowClear = clearable && !disabled && !isLoading && liveHasValue;

    const inputClasses = clsx(
      'rounded-lg border transition-all duration-200 font-medium w-full',
      'focus:outline-none focus:ring-2 focus:border-transparent',
      'placeholder:text-gray-400 dark:placeholder-gray-500',
      'px-4 py-2.5 text-base',
      leftIcon && 'pl-11',
      shouldShowClear && 'pr-11',
      className,
      error
        ? 'border-red-500 focus:ring-red-500 dark:border-red-600'
        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-blue-500',
      (disabled || isLoading) && 'bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed',
      !(disabled || isLoading) && liveHasValue && 'bg-gray-50 dark:bg-gray-800!',
      !(disabled || isLoading) && !liveHasValue && 'bg-white dark:bg-gray-900',
      !(disabled || isLoading) && 'text-gray-900 dark:text-gray-100'
    );

    return (
      <div className={clsx('relative', fullWidth && 'w-full')}>
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-10">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={setRefs}
          type={type}
          className={inputClasses}
          disabled={disabled || isLoading}
          value={safeValue}
          onChange={(e) => {
            setLiveHasValue(e.currentTarget.value.length > 0);
            props.onChange?.(e);
          }}
          aria-invalid={!!error}
          {...props}
        />
        {shouldShowClear && (
          <button
            type="button"
            onClick={handleClear}
            // THE FIX: Added z-10 to ensure it's clickable above the input's padding area
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label="Clear input"
          >
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
