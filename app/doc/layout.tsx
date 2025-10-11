// path: app/doc/layout.tsx
'use client';

import { Protected } from '@/components/auth/Protected';
import DocSidebar from '@/components/doc/DocSidebar';
import { workflowSections } from '@/components/doc/data/workflowData';
import { allowedRoles } from '@/constants/constants';
import { QueryProvider } from '@/providers/QueryProvider';
import { UserProvider } from '@/providers/UserProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function DocLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
      <UserProvider>
      <Protected allowedRoles={allowedRoles}>
      <div className="flex min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950">

        <DocSidebar sections={workflowSections} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="p-6 md:p-10"
            >
              <div className="max-w-11/12 mx-auto">{children}</div>
            </motion.div>
          </AnimatePresence>

          {/* Scroll to top button */}
          <ScrollToTopButton />
        </main>
      </div>
    </Protected>
    </UserProvider>
  );
}

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/50 z-50 transition-colors"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Add React import
import React from 'react';
