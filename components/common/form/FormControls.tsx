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
import { forwardRef } from 'react';
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

// --- FORM INPUT COMPONENT ---

interface FormInputProps<T extends FieldValues>
  extends BaseProps<T>, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'size'> {
  register: UseFormRegister<T>;
  treatAsNumber?: boolean;
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
  ...props
}: FormInputProps<T>) {
  const isNumber = type === 'number' || treatAsNumber;

  return (
    <div className={className}>
      <Label htmlFor={name} required={props.required} className={labelClassName}>
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        error={typeof error?.message === 'string' ? error.message : undefined}
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
        })}
      />
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
      <Label htmlFor={name} required={props.required} className={labelClassName}>
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
              errorMessage={typeof error?.message === 'string' ? error.message : undefined}
              {...props}
            />
          )}
        />
      ) : (
        <Textarea
          id={name}
          error={!!error}
          errorMessage={typeof error?.message === 'string' ? error.message : undefined}
          {...props}
        />
      )}
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
  ...props
}: FormSearchableSelectProps<T>) {
  return (
    <div className={className}>
      <Label htmlFor={name} required={props.required} className={labelClassName}>
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
        <p className='mt-1 text-sm text-red-500'>
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
      <Label htmlFor={name} required={props.required} className={labelClassName}>
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
            <SelectTrigger className='w-full' aria-invalid={!!error}>
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
        <p className='mt-1 text-sm text-red-500'>
          {typeof error?.message === 'string' ? error.message : null}
        </p>
      )}
    </div>
  );
}

// --- FORM DATE INPUT COMPONENT ---

export interface FormDateInputProps<T extends FieldValues>
  extends
    BaseProps<T>,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'size'> {
  control: Control<T>;
  pickerProps?: Partial<SingleDatePickerProps>;
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
          'w-full rounded-md border bg-white text-gray-900',
          'dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700',
          'px-10 py-2 outline-none',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          errorText ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300',
          className ?? '',
        ].join(' ')}
        readOnly
      />
      <svg
        className='pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-300'
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
      {errorText ? <p className='mt-1 text-sm text-red-600'>{errorText}</p> : null}
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
          {required ? <span className='ml-0.5 text-red-600'>*</span> : null}
        </Label>
      ) : null}

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const raw = field.value as unknown;
          let selected: Date | null = null;

          if (raw instanceof Date) {
            selected = raw;
          } else if (typeof raw === 'string' && raw) {
            selected = new Date(raw);
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
              const y = value.getFullYear();
              const m = String(value.getMonth() + 1).padStart(2, '0');
              const day = String(value.getDate()).padStart(2, '0');
              const isoDate = `${y}-${m}-${day}`;
              // Use PathValue casting for strict type compliance
              field.onChange(isoDate as PathValue<T, Path<T>>);
            },
            onBlur: field.onBlur,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dateFormat: (pickerProps as any)?.dateFormat ?? 'yyyy-MM-dd',
            isClearable: true,
            showMonthDropdown: true,
            showYearDropdown: true,
            dropdownMode: 'select' as const,
            yearDropdownItemNumber: 15,
            portalId: '__next',
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
          <div className='flex items-center space-x-2'>
            <Switch
              id={name}
              checked={!!field.value}
              onChange={(checked: boolean) => field.onChange(checked)}
            />
            <div>
              <Label htmlFor={name}>{label}</Label>
              {description && <p className='text-xs text-gray-500'>{description}</p>}
            </div>
          </div>
        )}
      />
      {error && (
        <p className='mt-1 text-sm text-red-500'>
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
      <Label htmlFor={name} required={props.required} className={labelClassName}>
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <IPAddressInput {...props} value={field.value || ''} onChange={field.onChange} />
        )}
      />
      {error && (
        <p className='mt-1 text-sm text-red-500'>
          {typeof error?.message === 'string' ? error.message : 'Invalid input'}
        </p>
      )}
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
  ...props
}: FormRichTextEditorProps<T>) {
  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <RichTextEditor
            label={label}
            value={field.value ?? ''}
            onChange={field.onChange}
            error={typeof error?.message === 'string' ? error.message : undefined}
            disabled={props.disabled}
            placeholder={props.placeholder}
          />
        )}
      />
    </div>
  );
}
