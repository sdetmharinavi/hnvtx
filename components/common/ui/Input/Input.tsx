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
      placeholder = ' ', // Default to a spacer to trigger :placeholder-shown natively when empty
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const innerRef = useRef<HTMLInputElement | null>(null);

    // Track clear button visibility
    const [showClearBtn, setShowClearBtn] = useState(false);

    // Merge forwarded ref with local ref
    const setRefs = (el: HTMLInputElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref && 'current' in ref)
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
    };

    // Calculate clear button visibility
    const syncClearButton = () => {
      const val = value !== undefined ? value : (innerRef.current?.value ?? '');
      setShowClearBtn(!!clearable && !disabled && !isLoading && String(val).length > 0);
    };

    useEffect(() => {
      syncClearButton();
    }, [value, clearable, disabled, isLoading]);

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

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
      setShowClearBtn(false);
    };

    // Guarantee a valid non-empty placeholder for :placeholder-shown support
    const finalPlaceholder = placeholder && placeholder.trim() !== '' ? placeholder : ' ';

    const inputClasses = clsx(
      'rounded-lg border transition-all duration-200 font-medium w-full',
      'focus:outline-none focus:ring-2 focus:border-transparent',
      'placeholder:text-gray-400 dark:placeholder-gray-500',
      'px-4 py-2.5 text-base',
      leftIcon && 'pl-11',
      showClearBtn && 'pr-11',
      className,
      error
        ? 'border-red-500 focus:ring-red-500 dark:border-red-600'
        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:ring-blue-500',

      // Pure CSS Background States
      // Base state is filled (has text). When empty (placeholder is shown), change to white/gray-900.
      'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
      'placeholder-shown:bg-white dark:placeholder-shown:bg-gray-900',

      // Disabled / Loading state overrides
      (disabled || isLoading) && 'bg-gray-100! dark:bg-gray-900! text-gray-500! cursor-not-allowed',
    );

    return (
      <div className={clsx('relative', fullWidth && 'w-full')}>
        {leftIcon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 z-10'>
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={setRefs}
          type={type}
          className={inputClasses}
          disabled={disabled || isLoading}
          value={value === undefined ? undefined : (value ?? '')}
          placeholder={finalPlaceholder}
          onChange={(e) => {
            setShowClearBtn(!!clearable && !disabled && !isLoading && e.currentTarget.value.length > 0);
            props.onChange?.(e);
          }}
          aria-invalid={!!error}
          {...props}
        />
        {showClearBtn && (
          <button
            type='button'
            onClick={handleClear}
            onMouseDown={(e) => e.preventDefault()}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10 cursor-pointer pointer-events-auto'
            aria-label='Clear input'
          >
            <FiX />
          </button>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
