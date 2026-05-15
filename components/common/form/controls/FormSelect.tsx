// components/common/form/controls/FormSelect.tsx
'use client';

import React from 'react';
import { Control, Controller, FieldValues } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/ui/select/Select';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { BaseProps, EnhancedLabel, ErrorMessage, HelperText } from './shared';

interface FormSelectProps<T extends FieldValues> extends BaseProps<T> {
  control: Control<T>;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  options,
  error,
  className,
  labelClassName,
  helperText,
  tooltip,
  ...props
}: FormSelectProps<T>) {
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
          <Select
            {...props}
            value={(field.value as string) ?? ''}
            onValueChange={(value) => field.onChange(value)}
          >
            <SelectTrigger
              className='w-full'
              aria-invalid={!!error}
              aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
            >
              <SelectValue placeholder={props.placeholder ?? 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {error && (
        <ErrorMessage message={typeof error?.message === 'string' ? error.message : undefined} />
      )}
      {!error && helperText && <HelperText text={helperText} />}
    </div>
  );
}
