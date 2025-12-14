"use client"
import { motion } from "framer-motion";

export default function StatsHighlights() {
  const stats = [
    { number: "99.9%", label: "Uptime Guarantee", icon: "⚡" },
    { number: "Secure", label: "military-grade security", icon: "🔒" },
    { number: "Offline-capable", label: "high caching ability", icon: "📈" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 2.2 }}
      className="mt-8 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-xs sm:max-w-4xl w-full px-4"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.6, 
            delay: 2.5 + index * 0.15,
            type: "spring",
            stiffness: 100
          }}
          whileHover={{ 
            scale: 1.05, 
            y: -5,
            transition: { duration: 0.2 }
          }}
          className="group relative p-4 sm:p-6 rounded-2xl backdrop-blur-lg border bg-white/10 border-white/20 dark:border-gray-600/30 shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          {/* Background glow effect - using standard bg color with opacity instead of gradient for safety */}
          <div className="absolute inset-0 rounded-2xl bg-red-500/10 dark:bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 2.7 + index * 0.1,
                type: "spring",
                stiffness: 200
              }}
              className="text-2xl sm:text-3xl mb-2 sm:mb-3"
            >
              {stat.icon}
            </motion.div>
            
            {/* Number */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 2.8 + index * 0.1, 
                type: "spring", 
                stiffness: 200 
              }}
              // FIX: Removed text-transparent, using solid red/blue
              className="text-2xl sm:text-3xl md:text-4xl font-black text-red-500 dark:text-blue-400 mb-1 sm:mb-2"
            >
              {stat.number}
            </motion.div>
            
            {/* Label */}
            <div className="text-xs sm:text-sm font-semibold text-gray-200 dark:text-gray-300 tracking-wide">
              {stat.label}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}