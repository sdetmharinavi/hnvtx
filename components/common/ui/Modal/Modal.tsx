// components/common/ui/Modal/Modal.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import { cn } from '@/utils/classNames';
import { useScrollLock } from '@/hooks/useScrollLock';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  /** Custom class for the inner content wrapper (e.g., to remove padding) */
  contentClassName?: string;
  visible?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  contentClassName,
  visible = true,
}: ModalProps) => {
  const [mounted, setMounted] = useState(false);
  const mouseDownTarget = useRef<EventTarget | null>(null);

  // 1. Handle Scroll Locking (via safe hook)
  useScrollLock(isOpen);

  // 2. Handle Escape Key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      // Check if this is the top-most modal if multiple are open?
      // For now, standard behavior is sufficient.
      if (e.key === 'Escape') {
        e.stopPropagation(); // Prevent closing parent modals if nested
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // 3. Mount check for Portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const sizeClasses = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    xxl: 'max-w-11/12',
    full: 'max-w-[98vw] max-h-[95vh]',
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (
      closeOnOverlayClick &&
      e.target === e.currentTarget &&
      mouseDownTarget.current === e.currentTarget
    ) {
      onClose();
    }
    mouseDownTarget.current = null;
  };

  // 4. Render Logic
  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className='fixed inset-0 z-9999 flex items-center justify-center p-4'
          role='dialog'
          aria-modal='true'
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onMouseDown={handleMouseDown}
            onClick={handleOverlayClick}
            aria-hidden='true'
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
            className={cn(
              'relative flex flex-col max-h-full w-full rounded-lg bg-white shadow-xl',
              'dark:bg-gray-900 dark:border dark:border-gray-700 dark:shadow-2xl',
              sizeClasses[size],
              className,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && visible && (
              <div className='flex shrink-0 items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700'>
                {title && (
                  <h2
                    id='modal-title'
                    className='text-xl font-semibold text-gray-900 dark:text-gray-100'
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className='ml-auto rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    aria-label='Close modal'
                  >
                    <IoClose size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Content - Scrollable Area */}
            {/* FIX: Use contentClassName to override default padding and overflow */}
            <div className={cn('flex-1 min-h-0', contentClassName || 'overflow-y-auto p-6')}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
