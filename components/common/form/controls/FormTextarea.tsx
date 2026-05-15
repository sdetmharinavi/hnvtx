// components/common/form/controls/FormTextarea.tsx
'use client';

import React, { useState } from 'react';
import { Control, Controller, UseFormRegister, FieldValues } from 'react-hook-form';
import { Textarea } from '@/components/common/ui/textarea/Textarea';
import { BaseProps, EnhancedLabel, ErrorMessage, HelperText } from './shared';

interface FormTextareaProps<T extends FieldValues>
  extends
    BaseProps<T>,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'value' | 'onChange'> {
  register?: UseFormRegister<T>;
  control?: Control<T>;
  showCharCount?: boolean;
  autoResize?: boolean;
  maxLength?: number;
}

export function FormTextarea<T extends FieldValues>({
  name,
  control,
  label,
  error,
  className,
  labelClassName,
  helperText,
  tooltip,
  showCharCount = false,
  autoResize = false,
  maxLength,
  ...props
}: FormTextareaProps<T>) {
  const [charCount, setCharCount] = useState(0);

  return (
    <div className={className}>
      <EnhancedLabel
        htmlFor={name}
        required={props.required}
        className={labelClassName}
        tooltip={tooltip}
      >
        {label}
      </EnhancedLabel>

      {control ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const handleChange = (_e: React.ChangeEvent<HTMLTextAreaElement>, val: string) => {
              if (showCharCount) {
                setCharCount(val.length);
              }
              if (autoResize && _e.target) {
                _e.target.style.height = 'auto';
                _e.target.style.height = `${_e.target.scrollHeight}px`;
              }
              field.onChange(val);
            };

            return (
              <div className='relative'>
                <Textarea
                  id={name}
                  value={(field.value as string) ?? ''}
                  onChange={handleChange}
                  onBlur={field.onBlur}
                  error={!!error}
                  errorMessage={typeof error?.message === 'string' ? error.message : undefined}
                  maxLength={maxLength}
                  {...props}
                  aria-invalid={!!error}
                  aria-describedby={
                    error ? `${name}-error` : helperText ? `${name}-helper` : undefined
                  }
                />
                {showCharCount && maxLength && (
                  <div className='absolute right-3 bottom-3 text-xs text-gray-400 dark:text-gray-500 pointer-events-none bg-white dark:bg-gray-900 px-1 rounded'>
                    {charCount}/{maxLength}
                  </div>
                )}
              </div>
            );
          }}
        />
      ) : (
        <Textarea
          id={name}
          error={!!error}
          errorMessage={typeof error?.message === 'string' ? error.message : undefined}
          maxLength={maxLength}
          {...props}
        />
      )}

      {error && (
        <ErrorMessage message={typeof error?.message === 'string' ? error.message : undefined} />
      )}
      {!error && helperText && <HelperText text={helperText} />}
    </div>
  );
}
