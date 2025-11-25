// path: components/doc/WorkflowCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/ui/card/card";
import { ScrollArea } from "@/components/common/ui/scroll-area";
import { WorkflowSection as WorkflowSectionType } from "@/components/doc/types/workflowTypes";
import WorkflowSectionComponent from "@/components/doc/WorkflowSection";
import { Workflow, ArrowLeft, Info, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useMemo } from "react";

interface WorkflowCardProps {
  section: WorkflowSectionType;
}

type ColorTheme = "violet" | "blue" | "teal" | "cyan" | "orange" | "yellow";

interface ColorConfig {
  border: {
    light: string;
    dark: string;
  };
  glow: {
    light: string;
    dark: string;
  };
  badge: {
    light: string;
    dark: string;
  };
  icon: {
    light: string;
    dark: string;
  };
  gradient: {
    light: string;
    dark: string;
  };
  accent: string;
}

const colorMap: Record<ColorTheme, ColorConfig> = {
  violet: {
    border: {
      light: "border-violet-400/40",
      dark: "border-violet-500/30",
    },
    glow: {
      light: "shadow-violet-500/20",
      dark: "shadow-violet-500/10",
    },
    badge: {
      light: "bg-violet-100 text-violet-700 border-violet-300",
      dark: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    },
    icon: {
      light: "text-violet-600",
      dark: "text-violet-400",
    },
    gradient: {
      light: "from-violet-100 to-purple-100",
      dark: "from-violet-500/10 to-purple-500/10",
    },
    accent: "bg-violet-500",
  },
  blue: {
    border: {
      light: "border-blue-400/40",
      dark: "border-blue-500/30",
    },
    glow: {
      light: "shadow-blue-500/20",
      dark: "shadow-blue-500/10",
    },
    badge: {
      light: "bg-blue-100 text-blue-700 border-blue-300",
      dark: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    icon: {
      light: "text-blue-600",
      dark: "text-blue-400",
    },
    gradient: {
      light: "from-blue-100 to-cyan-100",
      dark: "from-blue-500/10 to-cyan-500/10",
    },
    accent: "bg-blue-500",
  },
  teal: {
    border: {
      light: "border-teal-400/40",
      dark: "border-teal-500/30",
    },
    glow: {
      light: "shadow-teal-500/20",
      dark: "shadow-teal-500/10",
    },
    badge: {
      light: "bg-teal-100 text-teal-700 border-teal-300",
      dark: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    },
    icon: {
      light: "text-teal-600",
      dark: "text-teal-400",
    },
    gradient: {
      light: "from-teal-100 to-emerald-100",
      dark: "from-teal-500/10 to-emerald-500/10",
    },
    accent: "bg-teal-500",
  },
  cyan: {
    border: {
      light: "border-cyan-400/40",
      dark: "border-cyan-500/30",
    },
    glow: {
      light: "shadow-cyan-500/20",
      dark: "shadow-cyan-500/10",
    },
    badge: {
      light: "bg-cyan-100 text-cyan-700 border-cyan-300",
      dark: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    },
    icon: {
      light: "text-cyan-600",
      dark: "text-cyan-400",
    },
    gradient: {
      light: "from-cyan-100 to-blue-100",
      dark: "from-cyan-500/10 to-blue-500/10",
    },
    accent: "bg-cyan-500",
  },
  orange: {
    border: {
      light: "border-orange-400/40",
      dark: "border-orange-500/30",
    },
    glow: {
      light: "shadow-orange-500/20",
      dark: "shadow-orange-500/10",
    },
    badge: {
      light: "bg-orange-100 text-orange-700 border-orange-300",
      dark: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
    icon: {
      light: "text-orange-600",
      dark: "text-orange-400",
    },
    gradient: {
      light: "from-orange-100 to-amber-100",
      dark: "from-orange-500/10 to-amber-500/10",
    },
    accent: "bg-orange-500",
  },
  yellow: {
    border: {
      light: "border-yellow-400/40",
      dark: "border-yellow-500/30",
    },
    glow: {
      light: "shadow-yellow-500/20",
      dark: "shadow-yellow-500/10",
    },
    badge: {
      light: "bg-yellow-100 text-yellow-700 border-yellow-300",
      dark: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    },
    icon: {
      light: "text-yellow-600",
      dark: "text-yellow-400",
    },
    gradient: {
      light: "from-yellow-100 to-orange-100",
      dark: "from-yellow-500/10 to-orange-500/10",
    },
    accent: "bg-yellow-500",
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function WorkflowCard({ section }: WorkflowCardProps) {
  const { purpose, workflows, color, title } = section;

  // Memoize color configuration with light/dark variants
  const colors = useMemo(() => colorMap[color], [color]);

  // Calculate workflow stats
  const workflowStats = useMemo(
    () => ({
      total: workflows.length,
      steps: workflows.reduce((acc, w) => acc + (w.uiSteps?.length || 0), 0),
    }),
    [workflows]
  );

  return (
    <motion.div initial='hidden' animate='visible' variants={containerVariants}>
      <Card
        className={`
          // Solid fallbacks first
          bg-white dark:bg-gray-900
          
          // Gradient overlays (will override in supported browsers)
          bg-gradient-to-br 
          dark:from-gray-900/90 dark:to-gray-800/50 
          light:from-white/95 light:to-gray-50/80
          
          // Backdrop blur with fallback
          backdrop-blur-sm
          
          // Border
          border 
          dark:${colors.border.dark} light:${colors.border.light}
          dark:${colors.glow.dark} light:${colors.glow.light}
          
          // Shadows
          shadow-2xl hover:shadow-3xl transition-all duration-300
        `}>
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between gap-4 mb-4'>
            {/* Back button */}
            <motion.div variants={itemVariants}>
              <Link
                href='/dashboard'
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-lg 
                  dark:bg-gray-800/50 light:bg-gray-100/80
                  border 
                  dark:border-gray-700/50 light:border-gray-300/80
                  dark:text-gray-300 light:text-gray-600
                  hover:text-white dark:hover:border-gray-600 light:hover:border-gray-400
                  transition-all duration-200 text-sm font-medium group
                `}>
                <ArrowLeft className='w-4 h-4 group-hover:-translate-x-0.5 transition-transform' />
                Dashboard
              </Link>
            </motion.div>

            {/* Stats badges */}
            <motion.div variants={itemVariants} className='flex items-center gap-2'>
              <div
                className={`
                px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5
                dark:${colors.badge.dark} light:${colors.badge.light}
              `}>
                <Workflow className='w-3.5 h-3.5' />
                {workflowStats.total} {workflowStats.total === 1 ? "Workflow" : "Workflows"}
              </div>
              <div
                className={`
                px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5
                dark:bg-gray-800/50 light:bg-gray-100/80
                dark:border-gray-700/50 light:border-gray-300/80
                dark:text-gray-300 light:text-gray-600
              `}>
                <CheckCircle2 className='w-3.5 h-3.5' />
                {workflowStats.steps} Steps
              </div>
            </motion.div>
          </div>

          {/* Purpose section */}
          <motion.div variants={itemVariants} className='flex items-start gap-3'>
            <div
              className={`
              p-2.5 bg-gradient-to-br border rounded-xl shadow-lg
              dark:${colors.gradient.dark} light:${colors.gradient.light}
              dark:${colors.border.dark} light:${colors.border.light}
            `}>
              <Info className={`w-5 h-5 dark:${colors.icon.dark} light:${colors.icon.light}`} />
            </div>
            <div className='flex-1'>
              <CardTitle className='text-lg dark:text-gray-100 light:text-gray-900 mb-2 flex items-center gap-2'>
                {title}
                <div className={`h-1 w-12 rounded-full ${colors.accent}`} />
              </CardTitle>
              <p className='dark:text-gray-400 light:text-gray-600 leading-relaxed text-sm'>
                {purpose}
              </p>
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className='pt-0'>
          <motion.div variants={itemVariants}>
            <ScrollArea
              className={`
              h-[calc(100vh-22rem)] rounded-xl border backdrop-blur-sm
              dark:border-gray-800/50 light:border-gray-300/80
              dark:bg-gray-950/50 light:bg-white/50
            `}>
              <div className='p-6 space-y-8'>
                {workflows.map((workflow, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      ease: "easeOut" as const,
                    }}>
                    <WorkflowSectionComponent
                      workflow={workflow}
                      index={index}
                      colors={colors}
                      isLast={index === workflows.length - 1}
                    />
                  </motion.div>
                ))}

                {/* End marker */}
                {workflows.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: workflows.length * 0.1 + 0.3 }}
                    className='flex items-center justify-center pt-4 pb-2'>
                    <div className='flex items-center gap-3 dark:text-gray-500 light:text-gray-400'>
                      <div className='h-px w-16 bg-gradient-to-r from-transparent dark:to-gray-700 light:to-gray-300' />
                      <CheckCircle2 className='w-4 h-4' />
                      <span className='text-xs font-medium'>All workflows loaded</span>
                      <div className='h-px w-16 bg-gradient-to-l from-transparent dark:to-gray-700 light:to-gray-300' />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
