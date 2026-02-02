// components/common/form/FormControls.tsx
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
  PathValue,
} from 'react-hook-form';
import { SearchableSelect, Option } from '@/components/common/ui/select/SearchableSelect';
import { Input } from '@/components/common/ui/Input';
import { Textarea } from '@/components/common/ui/textarea/Textarea';
import { Label, Switch } from '@/components/common/ui';
import { forwardRef, useState } from 'react';
import type { ComponentType } from 'react';
import DatePickerLib, { DatePickerProps } from 'react-datepicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/ui/select/Select';
import IPAddressInput from '@/components/common/form/IPAddressInput';
import { RichTextEditor } from '@/components/common/form/RichTextEditor';

const DatePicker = DatePickerLib as unknown as ComponentType<Record<string, unknown>>;

// --- TYPE DEFINITIONS for Generic Components ---

type BaseProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl> | undefined;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  helperText?: string;
  tooltip?: string;
};

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

// --- HELPER COMPONENTS ---

const ErrorMessage = ({ message }: { message?: string }) => {
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

const HelperText = ({ text }: { text?: string }) => {
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

const EnhancedLabel = ({
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

// --- FORM INPUT COMPONENT ---

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
        tooltip={tooltip}
      >
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
              if (v === '' || v === null || v === undefined) {
                return undefined;
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

// --- FORM TEXTAREA COMPONENT ---

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

// --- FORM SEARCHABLE SELECT COMPONENT ---

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

// --- FORM SELECT COMPONENT ---

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

// --- FORM DATE INPUT COMPONENT ---

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
  // Determine date format based on time select availability
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
            // Check for strict ISO date "YYYY-MM-DD"
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && !isTimeEnabled) {
              const [y, m, d] = raw.split('-').map(Number);
              selected = new Date(y, m - 1, d);
            } else {
              // Parse full ISO strings (with time)
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
                // Return Full ISO String for time-aware inputs
                valueToSet = value.toISOString();
              } else {
                // Return YYYY-MM-DD for date-only inputs
                const y = value.getFullYear();
                const m = String(value.getMonth() + 1).padStart(2, '0');
                const day = String(value.getDate()).padStart(2, '0');
                valueToSet = `${y}-${m}-${day}`;
              }
              
              // Explicitly cast to satisfy generic type
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
            // UPDATED: Set default time intervals to 1 minute for granular control
            // This enables users to select specific minutes when time selection is enabled.
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

// --- FORM RICH TEXT EDITOR COMPONENT ---

interface FormRichTextEditorProps<T extends FieldValues> extends BaseProps<T> {
  control: Control<T>;
  placeholder?: string;
  disabled?: boolean;
}

export function FormRichTextEditor<T extends FieldValues>({
  name,
  control,
  label,
  error,
  className,
  helperText,
  ...props
}: FormRichTextEditorProps<T>) {
  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            <RichTextEditor
              label={label}
              value={field.value ?? ''}
              onChange={field.onChange}
              error={typeof error?.message === 'string' ? error.message : undefined}
              disabled={props.disabled}
              placeholder={props.placeholder}
            />
            {!error && helperText && <HelperText text={helperText} />}
          </>
        )}
      />
    </div>
  );
}