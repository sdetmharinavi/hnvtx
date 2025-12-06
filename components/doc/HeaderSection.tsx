// path: components/doc/HeaderSection.tsx
"use client";

import { 
  Workflow, 
  Sparkles, 
  BookOpen, 
  Zap, 
  UserPlus, 
  Settings, 
  MapPin, 
  Cable, 
  Server, 
  CircleDot, 
  GitBranch,
  CheckCircle2,
  ArrowDown
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useUser } from "@/providers/UserProvider";

const PARTICLE_COUNT = 8;

// Detailed vertical flow configuration
const SETUP_FLOW = [
  {
    id: 1,
    title: "User Onboarding",
    description: "Sign up, verify email, login, and complete your user profile (Phone & Address).",
    icon: UserPlus,
    color: "bg-blue-500",
    textColor: "text-blue-500"
  },
  {
    id: 2,
    title: "Master Data Setup",
    description: "Create Categories, Lookup Types (e.g., System Types, OFC Types), and Employee Designations.",
    icon: Settings,
    color: "bg-slate-500",
    textColor: "text-slate-500"
  },
  {
    id: 3,
    title: "Geo-Infrastructure",
    description: "Define Maintenance Areas (Zones/Terminals) and create Network Nodes (Locations).",
    icon: MapPin,
    color: "bg-emerald-500",
    textColor: "text-emerald-500"
  },
  {
    id: 4,
    title: "Physical Network",
    description: "Create OFC Cables between nodes. Define route topology by adding Junction Closures (JCs).",
    icon: Cable,
    color: "bg-orange-500",
    textColor: "text-orange-500"
  },
  {
    id: 5,
    title: "Active Equipment",
    description: "Add Systems (SDH/CPAN/MAAN). Use 'Port Templates' to auto-generate ports.",
    icon: Server,
    color: "bg-violet-500",
    textColor: "text-violet-500"
  },
  {
    id: 6,
    title: "Ring Configuration",
    description: "Create Logical Rings. Associate existing Systems to Rings and configure schematic topology.",
    icon: CircleDot,
    color: "bg-pink-500",
    textColor: "text-pink-500"
  },
  {
    id: 7,
    title: "Service Provisioning",
    description: "Create System Connections. Allocate specific fibers via the Provisioning Wizard.",
    icon: GitBranch,
    color: "bg-cyan-500",
    textColor: "text-cyan-500"
  },
  {
    id: 8,
    title: "Live Operations",
    description: "Trace fiber paths, monitor dashboard stats, and generate inventory QR codes.",
    icon: CheckCircle2,
    color: "bg-green-600",
    textColor: "text-green-600"
  },
];

export default function HeaderSection() {
  const prefersReducedMotion = useReducedMotion();
  const { isSuperAdmin } = useUser();

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
    <div className="w-full">
      {/* === HERO SECTION === */}
      <div className="text-center space-y-6 mb-16 relative overflow-hidden py-12">
        {/* Floating particles effect */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full bg-blue-500/40 blur-sm"
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

        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0.3, 0.5, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-3xl"
          />
        </div>

        {/* Main Title Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-block mb-6"
          >
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gray-800/50 rounded-full border border-violet-500/30 backdrop-blur-sm shadow-lg shadow-violet-500/10">
              <Workflow className="w-4 h-4 text-violet-400" />
              <span className="font-medium text-gray-200 text-sm">
                {isSuperAdmin ? "Technical" : "User"} Documentation
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6"
          >
            System Workflows
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Your comprehensive guide to mastering the Harinavi Transmission Maintenance Database.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-500" />
              <span>Detailed Guides</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-500" />
              <span>Quick Reference</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* === DIVIDER TEXT === */}
      <div className="text-center py-8 border-t border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
          Please select a topic from the sidebar to view detailed documentation, or follow the <span className="text-blue-600 dark:text-blue-400 font-bold">Setup Roadmap</span> below.
        </p>
        <div className="flex justify-center mt-4">
          <ArrowDown className="w-6 h-6 text-gray-400 animate-bounce" />
        </div>
      </div>

      {/* === VERTICAL ROADMAP === */}
      <div className="max-w-3xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-12 text-center">
          System Setup Roadmap
        </h2>

        <div className="relative">
          {/* Vertical Connecting Line */}
          <div className="absolute left-8 top-4 bottom-12 w-0.5 bg-gradient-to-b from-blue-500 via-violet-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 opacity-30"></div>

          {SETUP_FLOW.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative flex gap-6 mb-10 last:mb-0 group"
            >
              {/* Icon Bubble */}
              <div className={`
                relative z-10 shrink-0 flex items-center justify-center w-16 h-16 rounded-full 
                border-4 border-white dark:border-gray-950 shadow-lg 
                ${step.color} text-white transition-transform duration-300 group-hover:scale-110
              `}>
                <step.icon className="w-7 h-7" />
              </div>

              {/* Content Card */}
              <div className="flex-1 pt-1">
                <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-lg font-bold ${step.textColor}`}>
                      {step.title}
                    </h3>
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                      STEP {String(step.id).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Completion Message */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl border border-green-200 dark:border-green-800/30"
        >
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
            System Ready!
          </h3>
          <p className="text-green-600 dark:text-green-300">
            Once these steps are complete, the database is fully operational for daily maintenance tasks.
          </p>
        </motion.div>
      </div>
    </div>
  );
}