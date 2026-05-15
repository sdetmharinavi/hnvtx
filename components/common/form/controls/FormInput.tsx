// components/common/form/controls/FormInput.tsx
'use client';

import React, { useState } from 'react';
import { UseFormRegister, FieldValues } from 'react-hook-form';
import { Input } from '@/components/common/ui/Input';
import { BaseProps, EnhancedLabel, ErrorMessage, HelperText } from './shared';

interface FormInputProps<T extends FieldValues>
  extends BaseProps<T>, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'size'> {
  register: UseFormRegister<T>;
  treatAsNumber?: boolean;
  icon?: React.ReactNode;
  showCharCount?: boolean;
  maxLength?: number;
}

export function FormInput<T extends FieldValues>({
  name,
  register,
  label,
  error,
  type = 'text',
  className,
  labelClassName,
  treatAsNumber = false,
  helperText,
  tooltip,
  icon,
  showCharCount = false,
  maxLength,
  ...props
}: FormInputProps<T>) {
  const isNumber = type === 'number' || treatAsNumber;
  const [charCount, setCharCount] = useState(0);

  return (
    <div className={className}>
      <EnhancedLabel
        htmlFor={name}
        required={props.required}
        className={labelClassName}
        tooltip={tooltip}>
        {label}
      </EnhancedLabel>

      <div className='relative'>
        {icon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none'>
            {icon}
          </div>
        )}
        <Input
          id={name}
          type={type}
          error={typeof error?.message === 'string' ? error.message : undefined}
          className={icon ? 'pl-10' : ''}
          {...props}
          {...register(name, {
            setValueAs: (v) => {
              // THE FIX: Return null instead of undefined to properly clear DB fields
              // and prevent Postgres numeric empty string errors.
              if (v === '' || v === null || v === undefined) {
                return null;
              }
              if (isNumber) {
                const n = Number(v);
                return isNaN(n) ? v : n;
              }
              if (type === 'date') {
                return v ? new Date(v) : null;
              }
              return v;
            },
            onChange: (e) => {
              if (showCharCount) {
                setCharCount(e.target.value.length);
              }
              props.onChange?.(e);
            },
          })}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        />
        {showCharCount && maxLength && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 pointer-events-none'>
            {charCount}/{maxLength}
          </div>
        )}
      </div>

      {error && (
        <ErrorMessage message={typeof error?.message === 'string' ? error.message : undefined} />
      )}
      {!error && helperText && <HelperText text={helperText} />}
    </div>
  );
}
