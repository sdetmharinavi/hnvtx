// components/common/ui/Modal/Modal.tsx
import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { cn } from "@/utils/classNames";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  visible?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  visible = true,
}: ModalProps) => {
  const mouseDownTarget = useRef<EventTarget | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // THE FIX: Handle Body Scroll Locking with Layout Shift Prevention
  useEffect(() => {
    if (isOpen) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Apply styles
      document.body.style.overflow = "hidden";
      // Add padding to body to prevent content shift
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      // Cleanup with a small delay to match animation if needed, 
      // but immediate cleanup is safer for state consistency
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      // Ensure cleanup happens on unmount
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    xxl: "max-w-6xl",
    full: "max-w-[98vw] max-h-[95vh]",
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onMouseDown={handleMouseDown}
            onClick={handleOverlayClick}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={cn(
              "relative max-h-screen w-full overflow-y-auto rounded-lg bg-white shadow-xl",
              "dark:bg-gray-900 dark:border dark:border-gray-700 dark:shadow-lg dark:shadow-gray-900/50",
              sizeClasses[size],
              className,
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && visible && (
              <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                {title && (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    aria-label="Close modal"
                  >
                    <IoClose size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};