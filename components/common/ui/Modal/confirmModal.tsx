// components/common/ui/Modal/confirmModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X, CheckCircle, XCircle, Info, HelpCircle } from 'lucide-react';

const icons = {
  Warning: AlertTriangle,
  Close: X,
  Check: CheckCircle,
  Error: XCircle,
  Info: Info,
  Help: HelpCircle,
};

type ModalType = 'default' | 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  showIcon?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  confirmButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  cancelButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => (
  <div
    className={`border-2 border-current border-t-transparent rounded-full animate-spin ${
      size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    }`}
    aria-hidden='true'
  />
);

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
  showIcon = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  loading = false,
  size = 'md',
  className,
  confirmButtonProps = {},
  cancelButtonProps = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle modal opening/closing
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      setIsVisible(true);
      // Use requestAnimationFrame for smoother animations
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        // Restore focus to previously active element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && closeOnEscape && !loading) {
        onCancel();
        return;
      }

      // Handle tab navigation within modal
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );

        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [isOpen, closeOnEscape, loading, onCancel],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus management
  useEffect(() => {
    if (isOpen && isAnimating) {
      // Focus the cancel button by default (safer option)
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isAnimating]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop && !loading) {
      onCancel();
    }
  };

  const handleConfirm = async () => {
    if (loading) return;

    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirm action failed:', error);
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return 'text-red-500 dark:text-red-400';
      case 'warning':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'info':
        return 'text-blue-500 dark:text-blue-400';
      case 'success':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getIcon = () => {
    const className = `w-6 h-6 ${getIconColor()}`;

    switch (type) {
      case 'danger':
        return <icons.Error className={className} />;
      case 'warning':
        return <icons.Warning className={className} />;
      case 'info':
        return <icons.Info className={className} />;
      case 'success':
        return <icons.Check className={className} />;
      default:
        return <icons.Help className={className} />;
    }
  };

  const getButtonStyles = () => {
    const baseConfirm =
      'text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const baseCancel =
      'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    switch (type) {
      case 'danger':
        return {
          confirm: `${baseConfirm} bg-red-600 hover:bg-red-700 focus:ring-red-500 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600 dark:active:bg-red-900`,
          cancel: `${baseCancel} bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-500`,
        };
      case 'warning':
        return {
          confirm: `${baseConfirm} bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 active:bg-yellow-800 dark:bg-yellow-700 dark:hover:bg-yellow-800 dark:focus:ring-yellow-600 dark:active:bg-yellow-900`,
          cancel: `${baseCancel} bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-500`,
        };
      case 'success':
        return {
          confirm: `${baseConfirm} bg-green-600 hover:bg-green-700 focus:ring-green-500 active:bg-green-800 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-green-600 dark:active:bg-green-900`,
          cancel: `${baseCancel} bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-500`,
        };
      case 'info':
        return {
          confirm: `${baseConfirm} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-blue-600 dark:active:bg-blue-900`,
          cancel: `${baseCancel} bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-500`,
        };
      default:
        return {
          confirm: `${baseConfirm} bg-gray-900 hover:bg-gray-800 focus:ring-gray-700 active:bg-gray-950 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-600 dark:active:bg-gray-900`,
          cancel: `${baseCancel} bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-500`,
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-lg';
      default:
        return 'max-w-md';
    }
  };

  const buttonStyles = getButtonStyles();

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isAnimating ? 'bg-black/50 dark:bg-black/70 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleBackdropClick}
      role='presentation'
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full transform transition-all duration-200 ${getSizeClasses()} ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } ${className || ''}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-title'
        aria-describedby='modal-description'
      >
        {/* Header */}
        <div className='px-6 py-5 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              {showIcon && (
                <div className='shrink-0' aria-hidden='true'>
                  {getIcon()}
                </div>
              )}
              <h3
                id='modal-title'
                className='text-lg font-semibold text-gray-900 dark:text-gray-100 leading-6'
              >
                {title}
              </h3>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className='shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed'
              aria-label='Close modal'
              type='button'
            >
              <icons.Close className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className='px-6 py-5'>
          <div id='modal-description' className='text-gray-600 dark:text-gray-300 leading-relaxed'>
            {typeof message === 'string' ? <div>{message}</div> : message}
          </div>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex justify-end space-x-3'>
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg ${buttonStyles.cancel}`}
            type='button'
            {...cancelButtonProps}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg ${buttonStyles.confirm} ${
              loading ? 'cursor-wait' : ''
            }`}
            type='button'
            {...confirmButtonProps}
          >
            {loading ? (
              <div className='flex items-center space-x-2' aria-label='Loading'>
                <LoadingSpinner size='sm' />
                <span>Loading...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for easier modal management
export const useConfirmModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const confirm = useCallback((options?: Partial<ConfirmModalProps>): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setIsOpen(false);
    setLoading(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setIsOpen(false);
    setLoading(false);
  }, []);

  return {
    isOpen,
    loading,
    setLoading,
    confirm,
    handleConfirm,
    handleCancel,
  };
};
