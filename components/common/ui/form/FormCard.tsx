import React from "react";
import { cn } from "@/utils/classNames";

interface FormCardProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  submitText?: string;
  cancelText?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode; // custom footer override
  widthClass?: string; // e.g. "max-w-2xl"
  disableSubmit?: boolean;
  hightClass?: string; // e.g. "max-h-[99vh]"
}

export const FormCard: React.FC<FormCardProps> = ({
  title,
  subtitle,
  isLoading = false,
  onCancel,
  onSubmit,
  submitText = "Submit",
  cancelText = "Cancel",
  children,
  footerContent,
  widthClass = "max-w-3xl",
  hightClass = "max-h-[99vh]",
  disableSubmit = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-700",
          widthClass
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body + Footer */}
        <form onSubmit={onSubmit} className="contents">
          {/* Body */}
          <div className={cn("overflow-y-auto relative ", hightClass)}>
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                <span className="text-gray-600 dark:text-gray-300">Loading...</span>
              </div>
            )}
            <div className="p-6">{children}</div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            {footerContent ? (
              footerContent
            ) : (
              <div className="flex justify-end space-x-3 w-full">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-6 py-2 border rounded-md dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  {cancelText}
                </button>
                {onSubmit && (
                  <button
                    type="submit"
                    disabled={isLoading || disableSubmit}
                    className="px-8 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {submitText}
                  </button>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
