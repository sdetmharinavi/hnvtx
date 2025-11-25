// path: components/doc/HeaderSection.tsx
"use client";

import { Workflow, Sparkles, BookOpen, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const PARTICLE_COUNT = 8;

export default function HeaderSection() {
  const prefersReducedMotion = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        startX: Math.random() * 100,
        startY: Math.random() * 100,
        endX: Math.random() * 100,
        endY: Math.random() * 100,
        delay: i * 0.3,
        duration: 8 + i * 1.5,
        size: Math.random() * 2 + 1,
      })),
    []
  );

  return (
    <div className="text-center space-y-6 mb-12 relative overflow-hidden py-8">
      {/* Floating particles effect */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-blue-500 bg-gradient-to-br from-violet-500/40 to-cyan-500/40 blur-sm"
              style={{
                width: particle.size,
                height: particle.size,
              }}
              initial={{
                x: `${particle.startX}%`,
                y: `${particle.startY}%`,
                opacity: 0,
              }}
              animate={{
                x: [`${particle.startX}%`, `${particle.endX}%`, `${particle.startX}%`],
                y: [`${particle.startY}%`, `${particle.endY}%`, `${particle.startY}%`],
                scale: [1, 1.8, 1],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Background gradient glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.2,
        }}
        className="inline-block relative z-10"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-cyan-500/20 rounded-full border border-violet-500/30 backdrop-blur-sm cursor-pointer shadow-lg shadow-violet-500/10 group"
        >
          <motion.div
            animate={
              !prefersReducedMotion
                ? {
                    rotate: [0, 360],
                  }
                : {}
            }
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="relative"
          >
            <Workflow className="w-4 h-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
            <motion.div
              animate={
                !prefersReducedMotion
                  ? {
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-violet-400/30 rounded-full blur-md"
            />
          </motion.div>

          <span className="font-medium text-gray-200 text-sm group-hover:text-white transition-colors">
            Technical Documentation
          </span>

          <motion.div
            animate={
              !prefersReducedMotion
                ? {
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                    rotate: [0, 180, 360],
                  }
                : {}
            }
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Main title with enhanced gradient */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <motion.span
            // FIX: Added text-gray-900/white fallback for text color
            className="text-gray-900 dark:text-white supports-[background-clip:text]:text-transparent bg-gradient-to-r from-white via-violet-200 to-cyan-200 supports-[background-clip:text]:bg-clip-text inline-block"
            animate={
              !prefersReducedMotion
                ? {
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }
                : {}
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          >
            System Workflows
          </motion.span>
        </h1>

        {/* Decorative accent under title */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
          className="h-1 w-32 mx-auto mt-4 bg-violet-500 bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 rounded-full"
        />
      </motion.div>

      {/* Subtitle with icons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="relative z-10"
      >
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Comprehensive step-by-step user and technical workflows for your application
        </p>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span>Detailed Guides</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-600" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Quick Reference</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom decorative line with glow effect */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="relative z-10 mx-auto w-64 h-px"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        <motion.div
          animate={
            !prefersReducedMotion
              ? {
                  x: ["-100%", "100%"],
                }
              : {}
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent blur-sm"
        />
      </motion.div>
    </div>
  );
}