// components/common/form/controls/FormSearchableSelect.tsx
'use client';

import React from 'react';
import { Control, Controller, FieldValues } from 'react-hook-form';
import { SearchableSelect, Option } from '@/components/common/ui/select/SearchableSelect';
import { BaseProps, EnhancedLabel, ErrorMessage, HelperText } from './shared';

interface FormSearchableSelectProps<T extends FieldValues> extends BaseProps<T> {
  control: Control<T>;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  serverSide?: boolean;
  onSearch?: (term: string) => void;
  isLoading?: boolean;
}

export function FormSearchableSelect<T extends FieldValues>({
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
}: FormSearchableSelectProps<T>) {
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
          <SearchableSelect
            {...props}
            value={(field.value as string) ?? ''}
            onChange={(value) => field.onChange(value === '' ? '' : value)}
            options={options}
            error={!!error}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
          />
        )}
      />

      {error && (
        <ErrorMessage message={typeof error?.message === 'string' ? error.message : undefined} />
      )}
      {!error && helperText && <HelperText text={helperText} />}
    </div>
  );
}
