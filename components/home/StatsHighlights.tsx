"use client"
import { motion } from "framer-motion";

export default function StatsHighlights() {
  const stats = [
    { number: "99.9%", label: "Uptime Guarantee", icon: "⚡" },
    { number: "Secure", label: "Military Grade", icon: "🔒" },
    { number: "Offline", label: "Local Caching", icon: "📈" }
  ];

  // Removed top margin to allow parent flex to control spacing
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-2xl px-2"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + index * 0.1 }}
          className="group relative p-2 sm:p-4 rounded-xl bg-white/5 border border-white/10 dark:border-gray-600/30 shadow-lg text-center"
        >
          <div className="text-lg sm:text-2xl mb-1 sm:mb-2">{stat.icon}</div>
          <div className="text-sm sm:text-xl font-bold text-red-400 dark:text-blue-400 mb-0.5">
            {stat.number}
          </div>
          <div className="text-[10px] sm:text-xs font-medium text-gray-300">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}