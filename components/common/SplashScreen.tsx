'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export const SplashScreen = () => {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasSeenSplash = sessionStorage.getItem('hnv_splash_seen');

    if (!hasSeenSplash) {
      setShowSplash(true);
      // Hide splash after 2 seconds
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('hnv_splash_seen', 'true');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: 'easeInOut' }
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-gray-900"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, filter: 'blur(10px)' }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="relative flex flex-col items-center"
          >
            <Image
              src="/logo.png"
              alt="Harinavi Logo"
              width={300}
              height={100}
              className="object-contain drop-shadow-xl"
              priority
            />

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className="h-1 mt-6 rounded-full bg-blue-600 bg-linear-to-r from-blue-500 to-indigo-600"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
