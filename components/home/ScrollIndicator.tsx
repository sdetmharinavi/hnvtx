"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ScrollIndicator() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 3.5, duration: 1 }}
      className="fixed bottom-4 left-1/2 z-30 hidden -translate-x-1/2 transform sm:bottom-8 md:block"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const,
        }}
        className="flex flex-col items-center space-y-2"
      >
        {/* Mouse indicator */}
        <div className={`
          relative flex justify-center rounded-full border-2 shadow-lg backdrop-blur-sm
          h-8 w-5 sm:h-10 sm:w-6
          ${isDarkMode 
            ? "border-gray-300/70 bg-gray-800/30" 
            : "border-white/70 bg-white/20"}
        `}>
          <motion.div
            animate={{ 
              y: [2, 10, 2], 
              opacity: [1, 0.3, 1] 
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
            className={`
              mt-1 rounded-full shadow-sm
              h-2 w-0.5 sm:h-3 sm:w-1
              ${isDarkMode ? "bg-gray-300" : "bg-white"}
            `}
          />
        </div>
        
        {/* Scroll text */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5 }}
          className={`text-xs font-medium tracking-wider ${
            isDarkMode ? "text-gray-300/80" : "text-white/80"
          }`}
        >
          <small>Harinavi Transmission</small>
        </motion.span>
      </motion.div>
    </motion.div>
  );
}