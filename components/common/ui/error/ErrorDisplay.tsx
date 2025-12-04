import React, { useState, MouseEvent } from "react";

interface ErrorDisplayProps {
  error?: string | string[] | null;
  variant?: "inline" | "alert" | "toast" | "banner";
  severity?: "error" | "warning" | "info";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  id?: string;
  title?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }>;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  variant = "inline",
  severity = "error",
  size = "md",
  showIcon = true,
  dismissible = false,
  onDismiss,
  className = "",
  id,
  title,
  actions = []
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!error || dismissed) return null;

  const errorArray = Array.isArray(error) ? error : [error];
  const hasMultipleErrors = errorArray.length > 1;

  const iconConfig = {
    error: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 
            11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 
            102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      colorClass: "text-red-600"
    },
    warning: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 
            3.486 0l5.58 9.92c.75 1.334-.213 
            2.98-1.742 2.98H4.42c-1.53 
            0-2.493-1.646-1.743-2.98l5.58-9.92zM11 
            13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 
            00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      colorClass: "text-yellow-600"
    },
    info: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 
            0116 0zm-7-4a1 1 0 11-2 0 1 1 
            0 012 0zM9 9a1 1 0 000 2v3a1 1 
            0 001 1h1a1 1 0 100-2v-3a1 1 0 
            00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
      colorClass: "text-blue-600"
    }
  } as const;

  const sizeConfig = {
    sm: { text: "text-sm", padding: "p-3", iconSize: "w-4 h-4" },
    md: { text: "text-base", padding: "p-4", iconSize: "w-5 h-5" },
    lg: { text: "text-lg", padding: "p-5", iconSize: "w-6 h-6" }
  };

  const variantConfig = {
    inline: {
      container: "inline-flex items-start space-x-2",
      background: "",
      border: ""
    },
    alert: {
      container: "rounded-lg border",
      background:
        severity === "error"
          ? "bg-red-50"
          : severity === "warning"
          ? "bg-yellow-50"
          : "bg-blue-50",
      border:
        severity === "error"
          ? "border-red-200"
          : severity === "warning"
          ? "border-yellow-200"
          : "border-blue-200"
    },
    toast: {
      container: "rounded-lg border shadow-lg",
      background: "bg-white",
      border:
        severity === "error"
          ? "border-red-400"
          : severity === "warning"
          ? "border-yellow-400"
          : "border-blue-400"
    },
    banner: {
      container: "border-l-4",
      background:
        severity === "error"
          ? "bg-red-50"
          : severity === "warning"
          ? "bg-yellow-50"
          : "bg-blue-50",
      border:
        severity === "error"
          ? "border-l-red-400"
          : severity === "warning"
          ? "border-l-yellow-400"
          : "border-l-blue-400"
    }
  };

  const currentIcon = iconConfig[severity];
  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleActionClick =
    (actionOnClick: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      actionOnClick();
    };

  return (
    <div
      id={id}
      className={`${currentVariant.container} ${currentVariant.background} ${currentVariant.border} ${
        variant !== "inline" ? currentSize.padding : ""
      } ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && variant !== "inline" && (
        <div className={`shrink-0 ${currentIcon.colorClass}`}>
          <div className={currentSize.iconSize}>{currentIcon.icon}</div>
        </div>
      )}

      <div className={`flex-1 ${variant !== "inline" && showIcon ? "ml-3" : ""}`}>
        {title && (
          <h3
            className={`font-medium ${currentIcon.colorClass} ${currentSize.text} mb-1`}
          >
            {title}
          </h3>
        )}

        <div
          className={`${currentSize.text} ${
            variant === "inline" ? "inline-flex items-center space-x-2" : ""
          }`}
        >
          {variant === "inline" && showIcon && (
            <div className={`shrink-0 ${currentIcon.colorClass}`}>
              <div className={currentSize.iconSize}>{currentIcon.icon}</div>
            </div>
          )}

          <div className={currentIcon.colorClass}>
            {hasMultipleErrors ? (
              <ul
                className={
                  variant === "inline"
                    ? "inline"
                    : "list-disc list-inside space-y-1"
                }
              >
                {errorArray.map((errorItem, index) => (
                  <li key={index}>
                    {variant === "inline" && index > 0 && ", "}
                    {errorItem}
                  </li>
                ))}
              </ul>
            ) : (
              <span>{errorArray[0]}</span>
            )}
          </div>
        </div>

        {actions.length > 0 && variant !== "inline" && (
          <div className="mt-3 flex space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={handleActionClick(action.onClick)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                  action.variant === "primary"
                    ? `${
                        severity === "error"
                          ? "bg-red-600 hover:bg-red-700"
                          : severity === "warning"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white`
                    : `${
                        severity === "error"
                          ? "text-red-600 hover:text-red-800 hover:bg-red-100"
                          : severity === "warning"
                          ? "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                          : "text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      } border ${
                        severity === "error"
                          ? "border-red-300"
                          : severity === "warning"
                          ? "border-yellow-300"
                          : "border-blue-300"
                      }`
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {dismissible && (
        <div className="ml-auto pl-3">
          <button
            type="button"
            onClick={handleDismiss}
            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentIcon.colorClass} hover:bg-gray-100 focus:ring-gray-500`}
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 
                8.586l4.293-4.293a1 1 0 
                111.414 1.414L11.414 10l4.293 
                4.293a1 1 0 01-1.414 1.414L10 
                11.414l-4.293 4.293a1 1 0 
                01-1.414-1.414L8.586 10 4.293 
                5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
