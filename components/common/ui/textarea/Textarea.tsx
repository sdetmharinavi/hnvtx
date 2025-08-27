/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, ChangeEvent, FocusEvent } from "react";
import { Label } from "@/components/common/ui/label/Label";

// Type definitions
type TextareaResize = "none" | "both" | "horizontal" | "vertical";
type TextareaVariant = "default" | "filled" | "outlined";

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>, value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
  rows?: number;
  maxLength?: number;
  resize?: TextareaResize;
  variant?: TextareaVariant;
  className?: string;
  id?: string;
  showCharCount?: boolean;
  fullWidth?: boolean;
}

// Textarea Component
export const Textarea: React.FC<TextareaProps> = ({
  value = "",
  onChange = (e: ChangeEvent<HTMLTextAreaElement>, value: string) => {},
  placeholder = "",
  disabled = false,
  required = false,
  error = false,
  errorMessage = "",
  label,
  helperText,
  rows = 4,
  maxLength,
  resize = "vertical",
  variant = "default",
  className = "",
  id,
  showCharCount = true,
  fullWidth = true,
  ...props
}) => {
  const [focused, setFocused] = useState<boolean>(false);
  const [charCount, setCharCount] = useState<number>(value.length);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCharCount(newValue.length);
    onChange(e, newValue);
  };

  const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
    setFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    setFocused(false);
    props.onBlur?.(e);
  };

  const resizeClasses: Record<TextareaResize, string> = {
    none: "resize-none",
    both: "resize",
    horizontal: "resize-x",
    vertical: "resize-y",
  };

  const variantClasses: Record<TextareaVariant, string> = {
    default: "border shadow-sm",
    filled: "border-b-2 bg-gray-50 dark:bg-gray-900",
    outlined: "border-2"
  };

  const uniqueId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${fullWidth ? "w-full" : "w-fit"} ${className}`}>
      {label && (
        <Label
          htmlFor={uniqueId}
          required={required}
          disabled={disabled}
          className="mb-2"
        >
          {label}
        </Label>
      )}

      <div className="relative">
        <textarea
          id={uniqueId}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={`
            ${fullWidth ? "w-full" : "w-fit"} 
            px-3 py-2 rounded-lg transition-all duration-200
            ${resizeClasses[resize]}
            ${variantClasses[variant]}
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-600"
                : focused
                ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-20 dark:border-blue-400 dark:ring-blue-400"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
            }
            ${
              disabled
                ? "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-900 dark:text-gray-500"
                : "bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
            }
            focus:outline-none placeholder-gray-400 dark:placeholder-gray-500
          `}
          {...props}
        />

        {maxLength && showCharCount && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-400 bg-white dark:bg-gray-900 px-1 rounded">
            {charCount}/{maxLength}
          </div>
        )}
      </div>

      {(errorMessage || helperText) && (
        <div className="mt-1">
          {error && errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errorMessage}
            </p>
          )}
          {!error && helperText && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};