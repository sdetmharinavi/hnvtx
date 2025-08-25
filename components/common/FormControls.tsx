"use client";

import { Control, Controller, FieldError, FieldErrorsImpl, Merge, UseFormRegister, Path, FieldValues } from "react-hook-form";
import { SearchableSelect, Option } from "@/components/common/SearchableSelect";
import { Input } from "@/components/common/ui/Input";
import { Textarea } from "@/components/common/ui/textarea/Textarea";
import { Label, Switch } from "@/components/common/ui";

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

interface FormInputProps<T extends FieldValues> extends BaseProps<T>, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'size'> {
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
      <Label htmlFor={name} required={props.required} className={labelClassName}>{label}</Label>
      <Input
        id={name}
        type={type}
        error={typeof error?.message === 'string' ? error.message : undefined}
        {...props}
        {...register(name, {
            ...(type === 'number' && { valueAsNumber: true }),
            ...(type === 'date' && {
              setValueAs: (v) => (v ? new Date(v) : null),
            }),
        })}
      />
    </div>
  );
}

// --- FORM TEXTAREA COMPONENT ---

interface FormTextareaProps<T extends FieldValues> extends BaseProps<T>, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'value' | 'onChange'> {
  register?: UseFormRegister<T>;
  control?: Control<T>;
}

export function FormTextarea<T extends FieldValues>({ name, register, control, label, error, className, labelClassName, ...props }: FormTextareaProps<T>) {
  return (
    <div className={className}>
      <Label htmlFor={name} required={props.required} className={labelClassName}>{label}</Label>
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
      <Label htmlFor={name} required={props.required} className={labelClassName}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <SearchableSelect
            {...props}
            value={field.value as string ?? ""}
            onChange={(value) => field.onChange(value === "" ? null : value)}
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

// --- FORM DATE INPUT COMPONENT ---

interface FormDateInputProps<T extends FieldValues> extends BaseProps<T>, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'size'> {
    control: Control<T>;
}

export function FormDateInput<T extends FieldValues>({ name, control, label, error, className, labelClassName, ...props }: FormDateInputProps<T>) {
  return (
    <div className={className}>
      <Label htmlFor={name} required={props.required} className={labelClassName}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // Handle both Date objects and string representations from the database
          const dateValue = field.value
            ? new Date(field.value).toISOString().split("T")[0]
            : "";
          return (
            <Input
              id={name}
              type="date"
              {...props}
              value={dateValue}
              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
              onBlur={field.onBlur}
              error={typeof error?.message === 'string' ? error.message : undefined}
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

export function FormSwitch<T extends FieldValues>({ name, control, label, error, description, className }: FormSwitchProps<T>) {
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
                    {description && <p className="text-xs text-gray-500">{description}</p>}
                </div>
            </div>
        )}
      />
      {error && <p className='mt-1 text-sm text-red-500'>{typeof error?.message === 'string' ? error.message : null}</p>}
    </div>
  );
}