// Type definitions
type LabelSize = "xs" | "sm" | "md" | "lg" | "xl";
type LabelWeight = "normal" | "medium" | "semibold" | "bold";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  disabled?: boolean;
  size?: LabelSize;
  weight?: LabelWeight;
  className?: string;
  showRequiredSymbol?: boolean;
  tooltip?: string;
}

// Label Component  
export const Label: React.FC<LabelProps> = ({ 
  children, 
  htmlFor, 
  required = false, 
  disabled = false,
  size = "md",
  weight = "medium",
  className = "",
  showRequiredSymbol = true,
  tooltip,
  ...props 
}) => {
  const sizeClasses: Record<LabelSize, string> = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base", 
    lg: "text-lg",
    xl: "text-xl"
  };

  const weightClasses: Record<LabelWeight, string> = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold"
  };

  return (
    <label
      htmlFor={htmlFor}
      className={`
        ${sizeClasses[size]} 
        ${weightClasses[weight]} 
        block text-gray-900 dark:text-gray-100
        ${disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
        relative
      `}
      aria-disabled={disabled}
      data-tooltip={tooltip}
      {...props}
    >
      {children}
      {required && showRequiredSymbol && (
        <span className="text-red-500 dark:text-red-400 ml-1">*</span>
      )}
      {tooltip && (
        <span className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 inline" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </span>
      )}
    </label>
  );
};


// // Usage
// // Basic usage
// <Label htmlFor="email">Email Address</Label>

// // With required field
// <Label htmlFor="password" required>Password</Label>

// // With tooltip
// <Label htmlFor="api-key" tooltip="Your unique API identifier">API Key</Label>

// // Custom size and weight
// <Label htmlFor="name" size="full" weight="bold">Full Name</Label>

// // Disabled state
// <Label htmlFor="readonly" disabled>Read-only Field</Label>