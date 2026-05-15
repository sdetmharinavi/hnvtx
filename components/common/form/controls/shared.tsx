// components/common/form/controls/shared.tsx
import React, { useState } from 'react';
import { FieldError, FieldErrorsImpl, Merge, Path, FieldValues } from 'react-hook-form';
import { Label } from '@/components/common/ui/label/Label';

export type BaseProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl> | undefined;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  helperText?: string;
  tooltip?: string;
};

export const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <p
      className='mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5'
      role='alert'
    >
      <svg
        className='w-4 h-4 mt-0.5 shrink-0'
        fill='currentColor'
        viewBox='0 0 20 20'
        aria-hidden='true'
      >
        <path
          fillRule='evenodd'
          d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
          clipRule='evenodd'
        />
      </svg>
      <span>{message}</span>
    </p>
  );
};

export const HelperText = ({ text }: { text?: string }) => {
  if (!text) return null;
  return (
    <p className='mt-1.5 text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1.5'>
      <svg
        className='w-4 h-4 mt-0.5 shrink-0'
        fill='currentColor'
        viewBox='0 0 20 20'
        aria-hidden='true'
      >
        <path
          fillRule='evenodd'
          d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
          clipRule='evenodd'
        />
      </svg>
      <span>{text}</span>
    </p>
  );
};

export const EnhancedLabel = ({
  htmlFor,
  required,
  children,
  className,
  tooltip,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className='flex items-center gap-1.5 mb-1.5'>
      <Label htmlFor={htmlFor} required={required} className={className}>
        {children}
      </Label>
      {tooltip && (
        <div className='relative group'>
          <button
            type='button'
            className='text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors'
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label='More information'
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z'
                clipRule='evenodd'
              />
            </svg>
          </button>
          {showTooltip && (
            <div
              className='absolute left-0 top-full mt-1 z-10 w-64 p-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg dark:bg-gray-700'
              role='tooltip'
            >
              {tooltip}
              <div className='absolute bottom-full left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 -mb-1' />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
