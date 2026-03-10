// components/common/ui/NetworkStatusBar.tsx
'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Cloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const NetworkStatusBar = () => {
  const isOnline = useOnlineStatus();

  // Don't render anything if online
  if (isOnline) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-full shadow-lg border bg-gray-800 dark:bg-gray-700 border-gray-700 dark:border-gray-600 min-w-[200px] justify-center backdrop-blur-md`}>
        <WifiOff className='w-4 h-4 text-gray-400' />
        <span className='font-medium text-gray-200'>Offline Mode</span>
        <span className='text-gray-400 text-xs hidden sm:inline'>• Read Only Viewer</span>
      </motion.div>
    </AnimatePresence>
  );
};
