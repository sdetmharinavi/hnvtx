import { MouseEvent } from "react";
import { Label } from "@/components/common/ui/label/Label";

// Type definitions
type SwitchSize = "sm" | "md" | "lg";
type SwitchColor = "primary" | "secondary" | "success" | "danger" | "warning";

// Omit the onChange from ButtonHTMLAttributes since we're using our own
interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  color?: SwitchColor;
  label?: string;
  labelPosition?: "left" | "right";
  id?: string;
  className?: string;
  showStatusText?: boolean;
  showIcons?: boolean;
}

// Color classes for light and dark modes
const colorClasses: Record<SwitchColor, { light: string; dark: string }> = {
  primary: {
    light: "bg-blue-600",
    dark: "bg-blue-500",
  },
  secondary: {
    light: "bg-gray-600",
    dark: "bg-gray-500",
  },
  success: {
    light: "bg-green-600",
    dark: "bg-green-500",
  },
  danger: {
    light: "bg-red-600",
    dark: "bg-red-500",
  },
  warning: {
    light: "bg-yellow-600",
    dark: "bg-yellow-500",
  },
};

// Switch Component
export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onChange = () => {},
  disabled = false,
  size = "md",
  color = "primary",
  label,
  labelPosition = "right",
  id,
  className = "",
  showStatusText = false,
  showIcons = false,
  ...props
}) => {
  // Size classes
  const sizeClasses: Record<SwitchSize, { container: string; thumb: string }> =
    {
      sm: {
        container: "h-5 w-9",
        thumb: "h-4 w-4",
      },
      md: {
        container: "h-6 w-11",
        thumb: "h-5 w-5",
      },
      lg: {
        container: "h-7 w-14",
        thumb: "h-6 w-6",
      },
    };

  // Position classes based on checked state
  const translateClasses: Record<SwitchSize, string> = {
    sm: checked ? "translate-x-4" : "translate-x-0",
    md: checked ? "translate-x-5" : "translate-x-0",
    lg: checked ? "translate-x-7" : "translate-x-0",
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent form submission if inside a form
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {label && labelPosition === "left" && (
        <Label
          id={id ? `${id}-label` : undefined}
          htmlFor={id}
          className={`${labelPosition === "left" ? "order-first" : ""} ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          disabled={disabled}
        >
          {label}
        </Label>
      )}

      <div className="flex items-center gap-2">
        {showStatusText && (
          <span
            className={`text-sm ${
              disabled
                ? "text-gray-400 dark:text-gray-500"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            {checked ? "On" : "Off"}
          </span>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={label && id ? `${id}-label` : undefined}
          disabled={disabled}
          onClick={handleClick}
          className={`
            ${
              sizeClasses[size].container
            } relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${
              checked
                ? colorClasses[color].light
                : "bg-gray-200 dark:bg-gray-600"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}
            dark:${checked ? colorClasses[color].dark : "bg-gray-600"}
          `}
          {...props}
        >
          <span
            className={`
              ${sizeClasses[size].thumb} ${translateClasses[size]} pointer-events-none 
              rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out
              flex items-center justify-center
            `}
          >
            {showIcons && (
              <>
                {checked ? (
                  <svg
                    className="h-3 w-3 text-blue-600 dark:text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-3 w-3 text-gray-400 dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </>
            )}
          </span>
        </button>
      </div>

      {label && labelPosition === "right" && (
        <Label
          id={id ? `${id}-label` : undefined}
          htmlFor={id}
          className={`${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
          disabled={disabled}
        >
          {label}
        </Label>
      )}
    </div>
  );
};

// // Basic usage
// <Switch checked={isActive} onChange={setIsActive} />

// // With label on left
// <Switch 
//   label="Dark Mode" 
//   labelPosition="left" 
//   checked={darkMode} 
//   onChange={setDarkMode} 
// />

// // With color and status text
// <Switch
//   color="success"
//   showStatusText
//   checked={isEnabled}
//   onChange={setIsEnabled}
// />

// // With icons and custom size
// <Switch
//   size="lg"
//   showIcons
//   checked={notifications}
//   onChange={setNotifications}
// />

// // Disabled switch
// <Switch
//   disabled
//   label="Read-only"
//   checked={false}
// />
