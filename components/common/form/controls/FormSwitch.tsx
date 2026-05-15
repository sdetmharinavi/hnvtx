// components/common/form/controls/FormSwitch.tsx
'use client';

import React from 'react';
import { Control, Controller, FieldValues } from 'react-hook-form';
import { Switch, Label } from '@/components/common/ui';
import { BaseProps, ErrorMessage } from './shared';

interface FormSwitchProps<T extends FieldValues> extends BaseProps<T> {
  control: Control<T>;
  description?: string;
}

export function FormSwitch<T extends FieldValues>({
  name,
  control,
  label,
  error,
  description,
  className,
  helperText,
}: FormSwitchProps<T>) {
  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className='flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'>
            <Switch
              id={name}
              checked={!!field.value}
              onChange={(checked: boolean) => field.onChange(checked)}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${name}-error` : description || helperText ? `${name}-desc` : undefined
              }
            />
            <div className='flex-1'>
              <Label htmlFor={name} className='cursor-pointer font-medium'>
                {label}
              </Label>
              {description && (
                <p id={`${name}-desc`} className='text-sm text-gray-600 dark:text-gray-400 mt-0.5'>
                  {description}
                </p>
              )}
              {!description && helperText && (
                <p id={`${name}-desc`} className='text-sm text-gray-600 dark:text-gray-400 mt-0.5'>
                  {helperText}
                </p>
              )}
            </div>
          </div>
        )}
      />

      {error && (
        <ErrorMessage message={typeof error?.message === 'string' ? error.message : undefined} />
      )}
    </div>
  );
}
