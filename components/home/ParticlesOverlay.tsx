"use client"
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ParticlesOverlay() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Colors that adapt to dark/light mode
  const colors = {
    red: isDarkMode 
      ? { gradient: 'rgba(239, 68, 68, 0.8)' } 
      : { gradient: 'rgba(220, 38, 38, 0.6)' },
    purple: isDarkMode 
      ? { gradient: 'rgba(168, 85, 247, 0.8)' } 
      : { gradient: 'rgba(147, 51, 234, 0.6)' },
    white: isDarkMode 
      ? { gradient: 'rgba(255, 255, 255, 0.4)' } 
      : { gradient: 'rgba(255, 255, 255, 0.2)' }
  };

  return (
    <div className="fixed inset-0 z-5 pointer-events-none">
      {/* Animated particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            background: i % 3 === 0 
              ? `radial-gradient(circle, ${colors.red.gradient}, transparent 70%)`
              : i % 3 === 1
              ? `radial-gradient(circle, ${colors.purple.gradient}, transparent 70%)`
              : `radial-gradient(circle, ${colors.white.gradient}, transparent 70%)`,
            boxShadow: i % 3 === 0 
              ? `0 0 20px rgba(239, 68, 68, ${isDarkMode ? 0.6 : 0.4})`
              : i % 3 === 1
              ? `0 0 20px rgba(168, 85, 247, ${isDarkMode ? 0.6 : 0.4})`
              : `0 0 15px rgba(255, 255, 255, ${isDarkMode ? 0.5 : 0.3})`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
            x: [0, Math.random() * 50 - 25, 0],
            y: [0, Math.random() * 50 - 25, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Floating geometric shapes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`shape-${i}`}
          className="absolute"
          style={{
            left: `${20 + i * 12}%`,
            top: `${20 + (i % 3) * 20}%`,
            width: `${isDarkMode ? 3 : 2}px`,
            height: `${isDarkMode ? 3 : 2}px`,
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.white.gradient}, transparent 70%)`,
              boxShadow: `0 0 ${isDarkMode ? 15 : 10}px ${colors.white.gradient}`
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}