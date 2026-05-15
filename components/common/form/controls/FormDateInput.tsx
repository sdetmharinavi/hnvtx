// components/common/form/controls/FormDateInput.tsx
'use client';

import React, { forwardRef } from 'react';
import { Control, Controller, FieldValues, Path, PathValue } from 'react-hook-form';
import DatePickerLib, { DatePickerProps } from 'react-datepicker';
import { BaseProps, EnhancedLabel, ErrorMessage, HelperText } from './shared';

const DatePicker = DatePickerLib as unknown as React.ComponentType<Record<string, unknown>>;

type SingleDatePickerProps = Omit<
  DatePickerProps,
  | 'selected'
  | 'onChange'
  | 'customInput'
  | 'onBlur'
  | 'onSelect'
  | 'selectsRange'
  | 'selectsMultiple'
  | 'startDate'
  | 'endDate'
  | 'value'
>;

export interface FormDateInputProps<T extends FieldValues>
  extends
    BaseProps<T>,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'size'> {
  control: Control<T>;
  pickerProps?: Partial<SingleDatePickerProps> & { showTimeSelect?: boolean };
  minDate?: Date;
  maxDate?: Date;
}

const DateTextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { errorText?: string }
>(({ className, errorText, ...rest }, ref) => {
  return (
    <div className='relative'>
      <input
        ref={ref}
        {...rest}
        className={[
          'w-full rounded-lg border bg-white text-gray-900',
          'dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700',
          'px-10 py-2.5 outline-none',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'transition-all duration-200',
          errorText
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600',
          'hover:border-gray-400 dark:hover:border-gray-500',
          'min-h-[44px]',
          className ?? '',
        ].join(' ')}
        readOnly
      />
      <svg
        className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
      >
        <rect x='3' y='4' width='18' height='18' rx='2' />
        <line x1='16' y1='2' x2='16' y2='6' />
        <line x1='8' y1='2' x2='8' y2='6' />
        <line x1='3' y1='10' x2='21' y2='10' />
      </svg>
    </div>
  );
});
DateTextInput.displayName = 'DateTextInput';

export function FormDateInput<T extends FieldValues>({
  name,
  control,
  label,
  error,
  className,
  labelClassName,
  pickerProps,
  required,
  helperText,
  tooltip,
  minDate,
  maxDate,
  ...inputProps
}: FormDateInputProps<T>) {
  const isTimeEnabled = pickerProps?.showTimeSelect;
  const defaultFormat = isTimeEnabled ? 'yyyy-MM-dd h:mm aa' : 'yyyy-MM-dd';

  return (
    <div className={className}>
      <EnhancedLabel htmlFor={name} className={labelClassName} tooltip={tooltip}>
        {label}
        {required ? <span className='ml-0.5 text-red-600'>*</span> : null}
      </EnhancedLabel>

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const raw = field.value as unknown;
          let selected: Date | null = null;

          if (raw instanceof Date) {
            selected = raw;
          } else if (typeof raw === 'string' && raw) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && !isTimeEnabled) {
              const [y, m, d] = raw.split('-').map(Number);
              selected = new Date(y, m - 1, d);
            } else {
              const d = new Date(raw);
              if (!isNaN(d.getTime())) selected = d;
            }
          }

          const datePickerProps = {
            id: name,
            selected,
            onChange: (d: Date | Date[] | null) => {
              const value = Array.isArray(d) ? (d[0] ?? null) : d;
              if (!value) {
                field.onChange(null);
                return;
              }

              let valueToSet;
              if (isTimeEnabled) {
                valueToSet = value.toISOString();
              } else {
                const y = value.getFullYear();
                const m = String(value.getMonth() + 1).padStart(2, '0');
                const day = String(value.getDate()).padStart(2, '0');
                valueToSet = `${y}-${m}-${day}`;
              }

              field.onChange(valueToSet as PathValue<T, Path<T>>);
            },
            onBlur: field.onBlur,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dateFormat: (pickerProps as any)?.dateFormat ?? defaultFormat,
            isClearable: true,
            showMonthDropdown: true,
            showYearDropdown: true,
            dropdownMode: 'select' as const,
            yearDropdownItemNumber: 15,
            minDate,
            maxDate,
            // THE FIX: Adding portalId forces the react-datepicker to mount in the body
            // rather than inline. This perfectly prevents clipping issues in modals.
            portalId: 'root-portal',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            timeIntervals: (pickerProps as any)?.timeIntervals ?? 1,
            customInput: (
              <DateTextInput
                errorText={typeof error?.message === 'string' ? error.message : undefined}
                placeholder={inputProps.placeholder ?? 'Select date'}
              />
            ),
            ...(pickerProps ?? {}),
          };

          return <DatePicker {...datePickerProps} />;
        }}
      />

      {error && (
        <ErrorMessage message={typeof error?.message === 'string' ? error.message : undefined} />
      )}
      {!error && helperText && <HelperText text={helperText} />}
    </div>
  );
}
