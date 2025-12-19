// components/common/ui/NetworkStatusBar.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useMutationQueue } from '@/hooks/data/useMutationQueue';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const NetworkStatusBar = () => {
  const isOnline = useOnlineStatus();
  const { pendingCount, failedCount } = useMutationQueue();
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [prevPendingCount, setPrevPendingCount] = useState(0);

  // Detect when sync finishes (pending drops to 0 from > 0)
  useEffect(() => {
    if (prevPendingCount > 0 && pendingCount === 0 && failedCount === 0) {
      setShowSyncSuccess(true);
      const timer = setTimeout(() => setShowSyncSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevPendingCount(pendingCount);
  }, [pendingCount, failedCount, prevPendingCount]);

  // Don't render anything if everything is normal
  if (isOnline && pendingCount === 0 && failedCount === 0 && !showSyncSuccess) {
    return null;
  }

  let content = null;
  let bgColor = "";
  let borderColor = "";

  if (!isOnline) {
    bgColor = "bg-gray-800 dark:bg-gray-700";
    borderColor = "border-gray-700 dark:border-gray-600";
    content = (
      <>
        <WifiOff className="w-4 h-4 text-gray-400" />
        <span className="font-medium text-gray-200">Offline Mode</span>
        <span className="text-gray-400 text-xs hidden sm:inline">• View Only</span>
      </>
    );
  } else if (failedCount > 0) {
    bgColor = "bg-red-800 dark:bg-red-900";
    borderColor = "border-red-700 dark:border-red-800";
    content = (
      <>
        <AlertTriangle className="w-4 h-4 text-white" />
        <span className="font-medium text-white">{failedCount} Sync Failed</span>
        <span className="text-red-200 text-xs hidden sm:inline">• Check Header</span>
      </>
    );
  } else if (pendingCount > 0) {
    bgColor = "bg-blue-600 dark:bg-blue-700";
    borderColor = "border-blue-500 dark:border-blue-600";
    content = (
      <>
        <RefreshCw className="w-4 h-4 text-white animate-spin" />
        <span className="font-medium text-white">Syncing {pendingCount} changes...</span>
      </>
    );
  } else if (showSyncSuccess) {
    bgColor = "bg-green-600 dark:bg-green-700";
    borderColor = "border-green-500 dark:border-green-600";
    content = (
      <>
        <CheckCircle2 className="w-4 h-4 text-white" />
        <span className="font-medium text-white">Data Synced</span>
      </>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-full shadow-lg border ${bgColor} ${borderColor} min-w-[200px] justify-center backdrop-blur-md`}
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
};