// path: app/doc/layout.tsx
'use client';

import { Protected } from '@/components/auth/Protected';
import DocSidebar from '@/components/doc/DocSidebar';
import { workflowSections } from '@/components/doc/data/workflowData';
import { featuresData } from '@/components/doc/data/featuresData'; // NEW IMPORT
import { allowedRoles } from '@/constants/constants';
import { UserProvider } from '@/providers/UserProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function DocLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <UserProvider>
      <Protected allowedRoles={allowedRoles}>
        <div className="flex min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950">
          <DocSidebar
            sections={workflowSections}
            features={featuresData} // PASS DATA
          />
          <main className="flex-1 overflow-y-auto h-screen">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="p-6 md:p-12 max-w-7xl mx-auto"
              >
                {children}
              </motion.div>
            </AnimatePresence>

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
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const toggleVisibility = () => {
      if (mainElement.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    mainElement.addEventListener('scroll', toggleVisibility);
    return () => mainElement.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const mainElement = document.querySelector('main');
    mainElement?.scrollTo({
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
          className="fixed bottom-8 right-8 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 z-50 transition-colors"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
