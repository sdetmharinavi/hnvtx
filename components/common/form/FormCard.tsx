import React from "react";
import { cn } from "@/utils/classNames";

interface FormCardProps {
  title: React.ReactNode;
  subtitle?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  submitText?: string;
  cancelText?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  widthClass?: string;
  disableSubmit?: boolean;
  heightClass?: string;
  standalone?: boolean; // New prop to control backdrop behavior
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
  widthClass = "max-w-7xl",
  heightClass = "max-h-[90vh]",
  disableSubmit = false,
  standalone = false, // Default to false - no backdrop
}) => {
  const modalContent = (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-700 flex flex-col transform mx-auto",
        widthClass,
        heightClass
      )}
      style={{
        animation: "slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div 
        className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        style={{
          animation: "slideDown 0.5s ease-out 0.1s both"
        }}
      >
        <div>
          <h2 
            className="text-2xl font-bold text-gray-900 dark:text-white"
            style={{
              animation: "fadeInUp 0.6s ease-out 0.2s both"
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="text-gray-600 dark:text-gray-400 text-sm mt-1"
              style={{
                animation: "fadeInUp 0.6s ease-out 0.3s both"
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-all duration-300 hover:scale-110 hover:rotate-90"
          style={{
            animation: "fadeInRotate 0.5s ease-out 0.2s both"
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form Body + Footer */}
      <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
        {/* Body */}
        <div 
          className="flex-1 overflow-y-auto relative min-h-0"
          style={{
            animation: "fadeInUp 0.6s ease-out 0.3s both"
          }}
        >
          {isLoading && (
            <div 
              className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10"
              style={{
                animation: "fadeIn 0.3s ease-out"
              }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 bg-blue-600 rounded-full"
                  style={{
                    animation: "bounce 1.4s ease-in-out infinite both"
                  }}
                ></div>
                <div 
                  className="w-4 h-4 bg-blue-600 rounded-full"
                  style={{
                    animation: "bounce 1.4s ease-in-out 0.16s infinite both"
                  }}
                ></div>
                <div 
                  className="w-4 h-4 bg-blue-600 rounded-full"
                  style={{
                    animation: "bounce 1.4s ease-in-out 0.32s infinite both"
                  }}
                ></div>
                <span className="text-gray-600 dark:text-gray-300 ml-3">Loading...</span>
              </div>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>

        {/* Footer */}
        <div 
          className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50"
          style={{
            animation: "slideUp 0.5s ease-out 0.4s both"
          }}
        >
          {footerContent ? (
            footerContent
          ) : (
            <div className="flex justify-end space-x-3 w-full">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-6 py-2 border rounded-md dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg transform"
                style={{
                  animation: "fadeInLeft 0.5s ease-out 0.5s both"
                }}
              >
                {cancelText}
              </button>
              {onSubmit && (
                <button
                  type="submit"
                  disabled={isLoading || disableSubmit}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-md"
                  style={{
                    animation: "fadeInRight 0.5s ease-out 0.6s both",
                    // FIX: Added solid background color fallback
                    backgroundColor: "#2563EB",
                    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
                  }}
                >
                  {submitText}
                </button>
              )}
            </div>
          )}
        </div>
      </form>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* ... (rest of animations kept same) */
        @keyframes slideInScale {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRotate {
          from { opacity: 0; transform: rotate(-90deg) scale(0.8); }
          to { opacity: 1; transform: rotate(0deg) scale(1); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );

  if (standalone) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          animation: "fadeIn 0.3s ease-out"
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onCancel();
          }
        }}
      >
        {modalContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 w-full">
      {modalContent}
    </div>
  );
};