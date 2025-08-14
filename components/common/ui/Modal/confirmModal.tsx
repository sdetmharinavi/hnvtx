import React, { useState, useEffect, useCallback, useRef } from 'react';

// Icon components with proper TypeScript support
interface IconProps {
  className?: string;
}

const icons = {
  Warning: ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  Close: ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
  Check: ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  Error: ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  Info: ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  Help: ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
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
    aria-hidden="true"
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
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
    [isOpen, closeOnEscape, loading, onCancel]
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

  const getButtonStyles = () => {
    const baseConfirm = 'text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const baseCancel = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

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
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full transform transition-all duration-200 ${getSizeClasses()} ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        } ${className || ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showIcon && (
                <div className="flex-shrink-0" aria-hidden="true">
                  {getIcon()}
                </div>
              )}
              <h3 
                id="modal-title" 
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-6"
              >
                {title}
              </h3>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close modal"
              type="button"
            >
              <icons.Close />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div id="modal-description" className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex justify-end space-x-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg ${buttonStyles.cancel}`}
            type="button"
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
            type="button"
            {...confirmButtonProps}
          >
            {loading ? (
              <div className="flex items-center space-x-2" aria-label="Loading">
                <LoadingSpinner size="sm" />
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

// Demo component
export const ConfirmModalDemo: React.FC = () => {
  const [modals, setModals] = useState({
    default: false,
    danger: false,
    warning: false,
    info: false,
    success: false,
    loading: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const openModal = (type: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [type]: false }));
    setIsLoading(false);
  };

  const handleConfirm = async (type: keyof typeof modals) => {
    if (type === 'loading') {
      setIsLoading(true);
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      closeModal(type);
      alert('Action completed!');
    } else {
      closeModal(type);
      alert(`${type} action confirmed!`);
    }
  };

  return (
    <div className="p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          Improved ConfirmModal Demo
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Modal Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(modals).map((type) => (
              <button
                key={type}
                onClick={() => openModal(type as keyof typeof modals)}
                className={`p-3 text-white rounded-md transition-colors font-medium ${
                  type === 'default' ? 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600' :
                  type === 'danger' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' :
                  type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800' :
                  type === 'info' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' :
                  type === 'success' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800' :
                  'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} Modal
              </button>
            ))}
          </div>
        </div>

        {/* Modals */}
        <ConfirmModal
          isOpen={modals.default}
          onConfirm={() => handleConfirm('default')}
          onCancel={() => closeModal('default')}
          title="Confirm Action"
          message="This is a default confirmation modal. Are you sure you want to proceed?"
        />

        <ConfirmModal
          isOpen={modals.danger}
          onConfirm={() => handleConfirm('danger')}
          onCancel={() => closeModal('danger')}
          title="Delete Item"
          message="This action cannot be undone. Are you sure you want to delete this item permanently?"
          confirmText="Delete"
          cancelText="Keep"
          type="danger"
        />

        <ConfirmModal
          isOpen={modals.warning}
          onConfirm={() => handleConfirm('warning')}
          onCancel={() => closeModal('warning')}
          title="Unsaved Changes"
          message="You have unsaved changes that will be lost. Do you want to continue without saving?"
          confirmText="Continue"
          cancelText="Save First"
          type="warning"
        />

        <ConfirmModal
          isOpen={modals.info}
          onConfirm={() => handleConfirm('info')}
          onCancel={() => closeModal('info')}
          title="Information Required"
          message="Before proceeding, please confirm that you have read and understood the terms and conditions."
          confirmText="I Understand"
          cancelText="Cancel"
          type="info"
        />

        <ConfirmModal
          isOpen={modals.success}
          onConfirm={() => handleConfirm('success')}
          onCancel={() => closeModal('success')}
          title="Complete Setup"
          message="Your account setup is almost complete. Would you like to finish the configuration now?"
          confirmText="Complete Setup"
          cancelText="Later"
          type="success"
        />

        <ConfirmModal
          isOpen={modals.loading}
          onConfirm={() => handleConfirm('loading')}
          onCancel={() => closeModal('loading')}
          title="Process Data"
          message="This will process all selected items. This action may take a few moments to complete."
          confirmText="Process"
          cancelText="Cancel"
          type="default"
          loading={isLoading}
        />
      </div>
    </div>
  );
};