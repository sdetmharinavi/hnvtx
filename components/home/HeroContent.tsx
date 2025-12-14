"use client";

import { motion, MotionValue, TargetAndTransition, Variants } from "framer-motion";
import { useRouter } from "next/navigation"; // Import useRouter
import { useState, useEffect, useRef } from "react";

interface HeroContentProps {
  variants: {
    containerVariants: Variants;
    titleVariants: Variants;
    subtitleVariants: Variants;
    highlightVariants: Variants;
    ctaVariants: Variants;
  };
  floatingAnimation: TargetAndTransition;
  textY: MotionValue<number>;
}

// Fixed Spinner to ensure Tailwind classes work reliably
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "lg", color?: string }) => (
  <div className={`animate-spin rounded-full border-2 border-t-transparent border-white ${
    size === "sm" ? "h-4 w-4" : "h-6 w-6"
  }`} />
);

export default function HeroContent({
  variants,
  floatingAnimation,
  textY,
}: HeroContentProps) {
  const router = useRouter(); // Initialize router
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Ref to hold the navigation timer to prevent duplicate scheduling
  const navTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update time every second (Clock)
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Countdown & Auto-Redirect Logic
  useEffect(() => {
    // If navigation has started, don't do anything
    if (loading) return;

    // Trigger redirect when countdown hits 0
    if (countdown === 0) {
      setLoading(true);
      router.push("/dashboard");
      return;
    }

    // Decrement countdown
    navTimerRef.current = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, [countdown, loading, router]);

  const handleGetStarted = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Clear any pending countdown timer to prevent race conditions
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    
    router.push("/dashboard");
  };

  // Time formatting functions
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeZones = () => {
    const zones = [
      { name: 'IST', offset: 5.5, city: 'Kolkata' },
      { name: 'UTC', offset: 0, city: 'London' },
      { name: 'EST', offset: -5, city: 'New York' },
      { name: 'JST', offset: 9, city: 'Tokyo' }
    ];

    return zones.map(zone => {
      const utcTime = currentTime.getTime() + (currentTime.getTimezoneOffset() * 60000);
      const zoneTime = new Date(utcTime + (3600000 * zone.offset));
      return {
        ...zone,
        time: zoneTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      };
    });
  };

  const getDayProgress = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return (totalSeconds / 86400) * 100;
  };

  return (
    <motion.div
      className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6 overflow-hidden"
      style={{ y: textY }}
      variants={variants.containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Floating badge */}
      <motion.div
        variants={variants.ctaVariants}
        animate={floatingAnimation}
        className="mb-6 rounded-full border border-red-400/40 bg-red-900/50 bg-linear-to-r from-red-500/20 to-purple-500/20 px-4 py-2 text-red-200 shadow-lg backdrop-blur-md sm:mb-8 sm:px-6 sm:py-3 dark:border-blue-400/40 dark:from-blue-500/20 dark:to-cyan-500/20 dark:text-blue-200"
      >
        <span className="text-xs font-semibold tracking-wide sm:text-sm">
          🚀 Advanced Database Management
        </span>
      </motion.div>

      {/* Time & Date Wizard */}
      <motion.div
        variants={variants.highlightVariants}
        className="mb-8 w-full max-w-4xl"
      >
        {/* Main Clock Display */}
        <div className="relative overflow-hidden rounded-2xl border border-red-400/30 bg-linear-to-br from-red-950/80 via-purple-950/60 to-red-950/80 p-6 shadow-2xl backdrop-blur-xl">
          {/* Animated background glow */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 h-32 w-32 animate-pulse rounded-full bg-red-500 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-32 w-32 animate-pulse rounded-full bg-purple-500 blur-3xl" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            {/* Current Date */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-4 text-sm font-medium text-red-300/80 sm:text-base"
            >
              {formatDate(currentTime)}
            </motion.div>

            {/* Main Time Display */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6 font-mono"
            >
              <div className="text-5xl font-bold text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
                {formatTime(currentTime)}
              </div>
              <div className="mt-2 text-xs text-red-300/60 sm:text-sm">
                Indian Standard Time (IST)
              </div>
            </motion.div>

            {/* Day Progress Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-6"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-red-300/60">
                <span>Day Progress</span>
                <span>{getDayProgress().toFixed(1)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-red-950/50">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-red-500 via-purple-500 to-pink-500 shadow-lg shadow-red-500/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${getDayProgress()}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            {/* World Clocks Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="hidden lg:grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {getTimeZones().map((zone, index) => (
                <motion.div
                  key={zone.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="rounded-lg border border-red-400/20 bg-red-900/30 p-3 backdrop-blur-sm transition-all hover:border-red-400/40 hover:bg-red-900/40"
                >
                  <div className="mb-1 text-xs font-semibold text-red-300/80">
                    {zone.city}
                  </div>
                  <div className="mb-1 font-mono text-lg font-bold text-white sm:text-xl">
                    {zone.time}
                  </div>
                  <div className="text-xs text-red-300/60">{zone.name}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={variants.titleVariants}
        className="relative mb-4 text-3xl leading-tight font-black text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl dark:text-gray-100"
      >
        <span className="mb-1 block text-2xl sm:mb-2 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
          Welcome to
        </span>
        <span className="block text-red-500 dark:text-blue-400 text-3xl font-extrabold sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
          Harinavi Transmission
        </span>
        <span className="mt-1 block text-2xl font-semibold text-gray-200 sm:mt-2 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl dark:text-gray-300">
          Record Database
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={variants.subtitleVariants}
        className="mb-6 max-w-xs px-2 text-base leading-relaxed text-gray-300 sm:mb-8 sm:max-w-2xl sm:px-0 sm:text-lg md:text-xl lg:max-w-3xl lg:text-2xl dark:text-gray-400"
      >
        Secure, reliable, and efficient database management for transmission
        records
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        variants={variants.ctaVariants}
        className="mt-2 flex w-full max-w-xs flex-col gap-3 px-4 sm:mt-4 sm:max-w-md sm:flex-col sm:items-center sm:gap-4 sm:px-0"
      >
        <motion.button
          whileHover={{
            scale: 1.02,
            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.3)",
          }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-600 px-6 py-3 text-base font-bold text-white shadow-xl transition-all hover:bg-red-700 sm:px-8 sm:py-4 sm:text-lg dark:bg-red-700 dark:hover:bg-red-800"
          disabled={loading}
          onClick={handleGetStarted}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" color="white" />
              <span>Redirecting...</span>
            </div>
          ) : (
            `Get Started`
          )}
        </motion.button>
        
        {/* Countdown Indicator */}
        {!loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 1 }}
            className="text-xs sm:text-sm text-gray-400 font-mono bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10"
          >
            Auto-redirecting in {countdown}s
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}