import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/classNames';

interface FormCardProps {
  title: React.ReactNode;
  subtitle?: string | React.ReactNode;
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
  standalone?: boolean;
}

export const FormCard: React.FC<FormCardProps> = ({
  title,
  subtitle,
  isLoading = false,
  onCancel,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  children,
  footerContent,
  widthClass = 'max-w-7xl',
  heightClass = 'max-h-[90vh]',
  disableSubmit = false,
  standalone = false,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-focus first input when modal opens (desktop only)
  useEffect(() => {
    if (standalone && window.innerWidth >= 768) {
      const firstInput = formRef.current?.querySelector<HTMLInputElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])',
      );
      firstInput?.focus();
    }
  }, [standalone]);

  // Trap focus within modal for accessibility
  useEffect(() => {
    if (!standalone) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }

      // Tab trap
      if (e.key === 'Tab') {
        const focusableElements = formRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [standalone, isLoading, onCancel]);

  const modalContent = (
    <div
      className={cn(
        'w-full h-full overflow-hidden rounded-xl bg-white shadow-2xl',
        'dark:bg-gray-900 dark:border dark:border-gray-700',
        'flex flex-col transform mx-auto',
        'transition-all duration-300',
        // Responsive width improvements
        'sm:rounded-2xl',
        widthClass,
        heightClass,
      )}
      style={{
        animation: 'slideInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      }}
      onClick={(e) => e.stopPropagation()}
      role='dialog'
      aria-modal='true'
      aria-labelledby='form-title'
    >
      {/* Header - Responsive padding and sizing */}
      <div
        className={cn(
          'shrink-0 px-4 py-3 sm:px-6 sm:py-4',
          'border-b border-gray-200 dark:border-gray-700',
          'flex items-start sm:items-center justify-between gap-3',
          'sticky top-0 bg-white dark:bg-gray-900 z-10',
        )}
        style={{
          animation: 'slideDown 0.5s ease-out 0.1s both',
        }}
      >
        <div className='flex-1 min-w-0'>
          <h2
            id='form-title'
            className={cn(
              'text-xl sm:text-2xl font-bold text-gray-900 dark:text-white',
              'truncate',
            )}
            style={{
              animation: 'fadeInUp 0.6s ease-out 0.2s both',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <div
              className={cn(
                'text-gray-600 dark:text-gray-400',
                'text-xs sm:text-sm mt-1',
                'line-clamp-2 sm:line-clamp-1',
              )}
              style={{
                animation: 'fadeInUp 0.6s ease-out 0.3s both',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Close button - Touch-friendly size */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className={cn(
            'text-gray-400 hover:text-gray-600',
            'dark:text-gray-500 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'rounded-full p-2 sm:p-2.5',
            'transition-all duration-300',
            'hover:scale-110 hover:rotate-90',
            // Touch target size (minimum 44x44px)
            'min-w-[44px] min-h-[44px]',
            'flex items-center justify-center',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          style={{
            animation: 'fadeInRotate 0.5s ease-out 0.2s both',
          }}
          aria-label='Close dialog'
        >
          <svg
            className='w-5 h-5 sm:w-6 sm:h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>

      {/* Form Body + Footer */}
      <form ref={formRef} onSubmit={onSubmit} className='flex flex-col flex-1 min-h-0' noValidate>
        {/* Body - Improved scrolling and mobile spacing */}
        <div
          className={cn(
            'flex-1 overflow-y-auto relative min-h-0',
            // Better mobile scrolling
            'overscroll-contain',
            // Smooth scrolling on iOS
            '-webkit-overflow-scrolling-touch',
          )}
          style={{
            animation: 'fadeInUp 0.6s ease-out 0.3s both',
          }}
        >
          {/* Loading overlay - Improved UX */}
          {isLoading && (
            <div
              className={cn(
                'absolute inset-0',
                'bg-white/90 dark:bg-gray-900/90',
                'backdrop-blur-sm',
                'flex flex-col items-center justify-center gap-3',
                'z-20',
              )}
              style={{
                animation: 'fadeIn 0.3s ease-out',
              }}
              role='status'
              aria-live='polite'
            >
              <div className='flex items-center space-x-2'>
                <div
                  className='w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full'
                  style={{
                    animation: 'bounce 1.4s ease-in-out infinite both',
                  }}
                ></div>
                <div
                  className='w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full'
                  style={{
                    animation: 'bounce 1.4s ease-in-out 0.16s infinite both',
                  }}
                ></div>
                <div
                  className='w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full'
                  style={{
                    animation: 'bounce 1.4s ease-in-out 0.32s infinite both',
                  }}
                ></div>
              </div>
              <span className='text-sm sm:text-base text-gray-600 dark:text-gray-300'>
                Loading...
              </span>
            </div>
          )}

          {/* Content with responsive padding */}
          <div className='p-4 sm:p-6 lg:p-8'>{children}</div>
        </div>

        {/* Footer - Sticky on mobile, responsive layout */}
        <div
          className={cn(
            'shrink-0 px-4 py-3 sm:px-6 sm:py-4',
            'border-t border-gray-200 dark:border-gray-700',
            'bg-gray-50 dark:bg-gray-800/50',
            // Sticky footer on mobile for better UX
            'sticky bottom-0',
            // Shadow when content is scrolled
            'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]',
            'sm:shadow-none',
          )}
          style={{
            animation: 'slideUp 0.5s ease-out 0.4s both',
          }}
        >
          {footerContent ? (
            footerContent
          ) : (
            <div className='flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 w-full'>
              {/* Cancel button - Full width on mobile */}
              <button
                type='button'
                onClick={onCancel}
                disabled={isLoading}
                className={cn(
                  'w-full sm:w-auto',
                  'px-4 sm:px-6 py-2.5 sm:py-2',
                  'border rounded-lg',
                  'border-gray-300 dark:border-gray-600',
                  'text-gray-700 dark:text-gray-300',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'transition-all duration-300',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'font-medium text-sm sm:text-base',
                  // Minimum touch target
                  'min-h-[44px]',
                )}
                style={{
                  animation: 'fadeInLeft 0.5s ease-out 0.5s both',
                }}
              >
                {cancelText}
              </button>

              {/* Submit button - Full width on mobile, prominent */}
              {onSubmit && (
                <button
                  type='submit'
                  disabled={isLoading || disableSubmit}
                  className={cn(
                    'w-full sm:w-auto',
                    'px-6 sm:px-8 py-2.5 sm:py-2',
                    'bg-blue-600 hover:bg-blue-700',
                    'dark:bg-blue-600 dark:hover:bg-blue-700',
                    'text-white font-medium text-sm sm:text-base',
                    'shadow-lg hover:shadow-xl',
                    'rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'transition-all duration-300',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                    // Minimum touch target
                    'min-h-[44px]',
                    // Loading state
                    isLoading && 'cursor-wait',
                  )}
                  style={{
                    animation: 'fadeInRight 0.5s ease-out 0.6s both',
                    backgroundColor: '#2563EB',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  }}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className='flex items-center justify-center gap-2'>
                      <svg
                        className='animate-spin h-4 w-4'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    submitText
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </form>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInScale {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeInRotate {
          from {
            opacity: 0;
            transform: rotate(-90deg) scale(0.8);
          }
          to {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );

  if (standalone) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-9999',
          'flex items-center justify-center',
          'p-4 sm:p-6',
          // Prevent scroll on body when modal is open
          'overflow-y-auto',
          // Better mobile handling
          'overscroll-contain',
        )}
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          animation: 'fadeIn 0.3s ease-out',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isLoading) {
            onCancel();
          }
        }}
        role='presentation'
      >
        {modalContent}
      </div>
    );
  }

  return <div className='flex items-center justify-center p-4 sm:p-6 w-full'>{modalContent}</div>;
};
