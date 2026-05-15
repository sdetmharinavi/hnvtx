// components/common/form/controls/FormIPAddressInput.tsx
'use client';

import React from 'react';
import { Control, Controller, FieldValues } from 'react-hook-form';
import IPAddressInput from '@/components/common/form/IPAddressInput';
import { BaseProps, EnhancedLabel, ErrorMessage, HelperText } from './shared';

interface FormIPAddressInputProps<T extends FieldValues> extends BaseProps<T> {
  control: Control<T>;
  placeholder?: string;
  allowIPv4?: boolean;
  allowIPv6?: boolean;
}

export function FormIPAddressInput<T extends FieldValues>({
  name,
  control,
  label,
  error,
  className,
  labelClassName,
  helperText,
  tooltip,
  ...props
}: FormIPAddressInputProps<T>) {
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

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <IPAddressInput
            {...props}
            value={field.value || ''}
            onChange={field.onChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          />
        )}
      />

      {error && (
        <ErrorMessage
          message={typeof error?.message === 'string' ? error.message : 'Invalid input'}
        />
      )}
      {!error && helperText && <HelperText text={helperText} />}
    </div>
  );
}
