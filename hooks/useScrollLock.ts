import { useEffect } from 'react';

// Module-level variables to track lock state across multiple components
let lockCount = 0;
let originalStyle = '';
let originalPadding = '';

export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (isOpen) {
      // 1. Lock
      lockCount++;

      if (lockCount === 1) {
        // We are the first/only locker. Save state and apply lock.
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        originalStyle = document.body.style.overflow;
        originalPadding = document.body.style.paddingRight;

        document.body.style.overflow = 'hidden';

        // Prevent layout shift if scrollbar exists
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
      }
    }

    return () => {
      if (isOpen) {
        // 2. Unlock (Cleanup)
        lockCount--;

        if (lockCount <= 0) {
          // No more locks, restore state.
          document.body.style.overflow = originalStyle;
          document.body.style.paddingRight = originalPadding;
          lockCount = 0; // Safety reset
        }
      }
    };
  }, [isOpen]);
}
