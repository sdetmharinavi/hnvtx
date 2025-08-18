// components/common/FormControls.tsx

import { Control, Controller, FieldError, FieldErrorsImpl, Merge, UseFormRegister } from "react-hook-form";
import { SearchableSelect, Option } from "@/components/common/SearchableSelect";

// --- OPTIMIZED: Reusable Input Component using register ---
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  // Pass the register function from useForm
  register: UseFormRegister<any>; 
  label: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
}

export const FormInput: React.FC<FormInputProps> = ({ name, register, label, error, type, ...props }) => {
  // Special handling for date inputs
  const registerOptions = type === 'date' ? {
    valueAsDate: true, // This ensures the value is returned as a Date object
    setValueAs: (value: string) => value ? new Date(value) : null
  } : {};

  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {props.required && "*"}
      </label>
      <input
        // Spread the result of the register function with date-specific options
        {...register(name, registerOptions)} 
        {...props}
        type={type}
        id={name}
        className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 
          ${error 
            ? "border-red-500 focus:ring-red-500" 
            : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
          } 
          dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{(error as FieldError).message}</p>}
    </div>
  );
};

// --- Alternative: Using Controller for more complex date handling ---
interface FormDateInputProps {
  name: string;
  control: Control<any>;
  label: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
  required?: boolean;
  placeholder?: string;
}

export const FormDateInput: React.FC<FormDateInputProps> = ({ 
  name, 
  control, 
  label, 
  error, 
  required,
  placeholder 
}) => (
  <div>
    <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label} {required && "*"}
    </label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <input
          type="date"
          id={name}
          value={field.value ? 
            (field.value instanceof Date && !isNaN(field.value.getTime()) ? 
              field.value.toISOString().split('T')[0] : 
              typeof field.value === 'string' ? field.value : ''
            ) : ''
          }
          onChange={(e) => {
            // Keep as string for date inputs to match form schema expectations
            field.onChange(e.target.value || null);
          }}
          onBlur={field.onBlur}
          placeholder={placeholder}
          className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 
            ${error 
              ? "border-red-500 focus:ring-red-500" 
              : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            } 
            dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600`}
        />
      )}
    />
    {error && <p className="mt-1 text-sm text-red-500">{(error as FieldError).message}</p>}
  </div>
);

// --- OPTIMIZED: Reusable Textarea Component using register ---
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  register: UseFormRegister<any>;
  label: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({ name, register, label, error, ...props }) => (
  <div>
    <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <textarea
      {...register(name)}
      {...props}
      id={name}
      className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 
        ${error 
          ? "border-red-500 focus:ring-red-500" 
          : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
        } 
        dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600`}
    />
    {error && <p className="mt-1 text-sm text-red-500">{(error as FieldError).message}</p>}
  </div>
);


// --- CORRECT: Wrapper for SearchableSelect using Controller (NO CHANGE NEEDED) ---
interface FormSearchableSelectProps {
  name: string;
  control: Control<any>;
  label: string;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>;
}

export const FormSearchableSelect: React.FC<FormSearchableSelectProps> = ({
  name,
  control,
  label,
  options,
  error,
  ...props
}) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <SearchableSelect
          options={options}
          value={field.value || ""}
          onChange={(value) => field.onChange(value === "" ? null : value)}
          clearable={true}
          className="w-full"
          error={!!error}
          {...props}
        />
      )}
    />
    {error && <p className="mt-1 text-sm text-red-500">{(error as FieldError).message}</p>}
  </div>
);