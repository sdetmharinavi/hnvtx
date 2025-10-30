/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import {
  Control,
  Controller,
  FieldError,
  FieldErrorsImpl,
  Merge,
  UseFormRegister,
  Path,
  FieldValues,
} from 'react-hook-form';
import {
  SearchableSelect,
  Option,
} from '@/components/common/ui/select/SearchableSelect';
import { Input } from '@/components/common/ui/Input';
import { Textarea } from '@/components/common/ui/textarea/Textarea';
import { Label, Switch } from '@/components/common/ui';
import { forwardRef } from 'react';
import DatePicker, { type DatePickerProps } from 'react-datepicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/ui/select/Select';
import IPAddressInput from '@/components/common/form/IPAddressInput';

// --- TYPE DEFINITIONS for Generic Components ---

type BaseProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
  required?: boolean;
  className?: string;
  labelClassName?: string;
};

// --- FORM INPUT COMPONENT ---

interface FormInputProps<T extends FieldValues>
  extends BaseProps<T>,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'size'> {
  register: UseFormRegister<T>;
}

export function FormInput<T extends FieldValues>({
  name,
  register,
  label,
  error,
  type = 'text',
  className,
  labelClassName,
  ...props
}: FormInputProps<T>) {
  return (
    <div className={className}>
      <Label
        htmlFor={name}
        required={props.required}
        className={labelClassName}
      >
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        error={typeof error?.message === 'string' ? error.message : undefined}
        {...props}
        {...register(name, {
          // For number inputs, treat empty string as null and otherwise coerce to Number
          ...(type === 'number' && {
            setValueAs: (v) =>
              v === '' || v === null || typeof v === 'undefined' ? null : Number(v),
          }),
          // For date inputs, map empty to null and non-empty to Date object
          ...(type === 'date' && {
            setValueAs: (v) => (v ? new Date(v) : null),
          }),
        })}
      />
    </div>
  );
}

// --- FORM TEXTAREA COMPONENT ---

interface FormTextareaProps<T extends FieldValues>
  extends BaseProps<T>,
    Omit<
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
      'name' | 'value' | 'onChange'
    > {
  register?: UseFormRegister<T>;
  control?: Control<T>;
}

export function FormTextarea<T extends FieldValues>({
  name,
  control,
  label,
  error,
  className,
  labelClassName,
  ...props
}: FormTextareaProps<T>) {
  return (
    <div className={className}>
      <Label
        htmlFor={name}
        required={props.required}
        className={labelClassName}
      >
        {label}
      </Label>
      {control ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Textarea
              id={name}
              value={(field.value as string) ?? ''}
              onChange={(_e, val) => field.onChange(val)}
              onBlur={field.onBlur}
              error={!!error}
              errorMessage={
                typeof error?.message === 'string' ? error.message : undefined
              }
              {...props}
            />
          )}
        />
      ) : (
        <Textarea
          id={name}
          error={!!error}
          errorMessage={
            typeof error?.message === 'string' ? error.message : undefined
          }
          {...props}
        />
      )}
    </div>
  );
}

// --- FORM SEARCHABLE SELECT COMPONENT ---

interface FormSearchableSelectProps<T extends FieldValues>
  extends BaseProps<T> {
  control: Control<T>;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  // **NEW PROPS FOR SERVER-SIDE SEARCH**
  serverSide?: boolean; // When true, options are not filtered client-side
  onSearch?: (term: string) => void; // Function to trigger a search
  isLoading?: boolean; // To show a loading indicator
}

export function FormSearchableSelect<T extends FieldValues>({
  name,
  control,
  label,
  options,
  error,
  className,
  labelClassName,
  ...props
}: FormSearchableSelectProps<T>) {
  // console.log("options",options);

  return (
    <div className={className}>
      <Label
        htmlFor={name}
        required={props.required}
        className={labelClassName}
      >
        {label}
      </Label>
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
          />
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {typeof error?.message === 'string' ? error.message : null}
        </p>
      )}
    </div>
  );
}

// --- FORM SELECT COMPONENT ---

interface FormSelectProps<T extends FieldValues> extends BaseProps<T> {
  control: Control<T>;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
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
  ...props
}: FormSelectProps<T>) {
  return (
    <div className={className}>
      <Label
        htmlFor={name}
        required={props.required}
        className={labelClassName}
      >
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            {...props}
            value={(field.value as string) ?? ''}
            onValueChange={(value) => field.onChange(value)}
          >
            <SelectTrigger className="w-full" aria-invalid={!!error}>
              <SelectValue placeholder={props.placeholder ?? 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {typeof error?.message === 'string' ? error.message : null}
        </p>
      )}
    </div>
  );
}

// --- FORM DATE INPUT COMPONENT ---

// Keep your original prop intent; allow passing datepicker props safely
export interface FormDateInputProps<T extends FieldValues>
  extends BaseProps<T>,
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'name' | 'type' | 'size'
    > {
  control: Control<T>;
  // Optional passthrough for DatePicker props (minDate, maxDate, showTimeSelect, etc.)
  pickerProps?: Partial<
    Omit<
      DatePickerProps,
      // Keep single-date mode: exclude props that change `onChange` signature
      | 'selected'
      | 'onChange'
      | 'customInput'
      | 'onBlur'
      | 'onSelect'
      | 'selectsRange'
      | 'selectsMultiple'
      | 'startDate'
      | 'endDate'
    >
  >;
}

/** A styled input used as ReactDatePicker's customInput to control theme + icon */
const DateTextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { errorText?: string }
>(({ className, errorText, ...rest }, ref) => {
  return (
    <div className="relative">
      <input
        ref={ref}
        {...rest}
        className={[
          'w-full rounded-md border bg-white text-gray-900',
          'dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700',
          'px-10 py-2 outline-none',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          errorText
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300',
          className ?? '',
        ].join(' ')}
        readOnly // recommended with customInput to avoid parsing issues
      />
      {/* Calendar icon (theme-aware via currentColor) */}
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      {errorText ? (
        <p className="mt-1 text-sm text-red-600">{errorText}</p>
      ) : null}
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
  ...inputProps
}: FormDateInputProps<T>) {
  return (
    <div className={className}>
      {label ? (
        <Label htmlFor={name} className={labelClassName}>
          {label}
          {required ? <span className="ml-0.5 text-red-600">*</span> : null}
        </Label>
      ) : null}

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // Normalize value to Date | null
          const raw = field.value as unknown;
          const selected: Date | null =
            raw == null || (raw as any) === ''
              ? null
              : typeof raw === 'object' &&
                raw !== null &&
                'getTime' in (raw as object)
              ? (raw as Date)
              : new Date(raw as any);

          return (
            // @ts-expect-error react-datepicker's prop union sometimes misinfers to multi-select variant.
            // We intentionally use single-date mode: `selected: Date | null` and `onChange(date | null)`.
            <DatePicker
              id={name}
              // --- recommended defaults for date-only fields ---
              selected={selected}
              onChange={(d: Date | null) => {
                if (!d) return field.onChange(null);
                // Format as local date (YYYY-MM-DD) to avoid UTC shifting
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                field.onChange(`${y}-${m}-${day}`);
              }}
              onBlur={field.onBlur}
              // Keep keyboard nav and accessibility
              // Use a date-only format; adjust as you like
              dateFormat={(pickerProps as any)?.dateFormat ?? 'yyyy-MM-dd'}
              // Show clear button by default; optional
              isClearable
              // Enable year and month dropdowns
              showMonthDropdown
              showYearDropdown
              dropdownMode="select" // Makes dropdowns selectable instead of scrollable
              // You can also set year range if needed
              yearDropdownItemNumber={15} // Shows 15 years in dropdown
              // Render portal into Next.js root so it appears above modals/overflows
              portalId="__next"
              // Custom input so we fully control theme + icon
              customInput={
                <DateTextInput
                  errorText={
                    typeof error?.message === 'string'
                      ? error.message
                      : undefined
                  }
                  placeholder={inputProps.placeholder ?? 'Select date'}
                />
              }
              // Pass through any extra ReactDatePicker props (minDate, maxDate, showTimeSelect, etc.)
              {...pickerProps}
            />
          );
        }}
      />
    </div>
  );
}

// --- FORM SWITCH COMPONENT ---

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
}: FormSwitchProps<T>) {
  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Switch
              id={name}
              checked={!!field.value}
              onChange={(checked: boolean) => field.onChange(checked)}
            />
            <div>
              <Label htmlFor={name}>{label}</Label>
              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}
            </div>
          </div>
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {typeof error?.message === 'string' ? error.message : null}
        </p>
      )}
    </div>
  );
}

// --- FORM IP ADDRESS COMPONENT ---

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
  ...props
}: FormIPAddressInputProps<T>) {
  return (
    <div className={className}>
      <Label
        htmlFor={name}
        required={props.required}
        className={labelClassName}
      >
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <IPAddressInput
            {...props} // Pass through placeholder, allowIPv4, etc.
            value={field.value || ''} // Get value from react-hook-form
            onChange={field.onChange} // Use react-hook-form's onChange
          />
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {typeof error?.message === 'string' ? error.message : 'Invalid input'}
        </p>
      )}
    </div>
  );
}
