// path: components/doc/WorkflowCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/ui/card/card";
import { ScrollArea } from "@/components/common/ui/scroll-area";
import { WorkflowSection as WorkflowSectionType } from "@/components/doc/types/workflowTypes";
import WorkflowSectionComponent from "@/components/doc/WorkflowSection";
import { ArrowLeft, Info, CheckCircle2, Workflow } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useMemo } from "react";

interface WorkflowCardProps {
  section: WorkflowSectionType;
}

type ColorTheme = "violet" | "blue" | "teal" | "cyan" | "orange" | "yellow";

interface ColorConfig {
  border: string;
  glow: string;
  badge: string;
  icon: string;
  gradient: string;
  accent: string;
}

const colorMap: Record<ColorTheme, ColorConfig> = {
  violet: {
    border: "border-violet-200 dark:border-violet-500/30",
    glow: "shadow-violet-500/20 dark:shadow-violet-500/10",
    badge: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30",
    icon: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10",
    accent: "bg-violet-500",
  },
  blue: {
    border: "border-blue-200 dark:border-blue-500/30",
    glow: "shadow-blue-500/20 dark:shadow-blue-500/10",
    badge: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
    icon: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10",
    accent: "bg-blue-500",
  },
  teal: {
    border: "border-teal-200 dark:border-teal-500/30",
    glow: "shadow-teal-500/20 dark:shadow-teal-500/10",
    badge: "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30",
    icon: "text-teal-600 dark:text-teal-400",
    gradient: "from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/10",
    accent: "bg-teal-500",
  },
  cyan: {
    border: "border-cyan-200 dark:border-cyan-500/30",
    glow: "shadow-cyan-500/20 dark:shadow-cyan-500/10",
    badge: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30",
    icon: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-50 to-blue-50 dark:from-cyan-500/10 dark:to-blue-500/10",
    accent: "bg-cyan-500",
  },
  orange: {
    border: "border-orange-200 dark:border-orange-500/30",
    glow: "shadow-orange-500/20 dark:shadow-orange-500/10",
    badge: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
    icon: "text-orange-600 dark:text-orange-400",
    gradient: "from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10",
    accent: "bg-orange-500",
  },
  yellow: {
    border: "border-yellow-200 dark:border-yellow-500/30",
    glow: "shadow-yellow-500/20 dark:shadow-yellow-500/10",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30",
    icon: "text-yellow-600 dark:text-yellow-400",
    gradient: "from-yellow-50 to-orange-50 dark:from-yellow-500/10 dark:to-orange-500/10",
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
  const colors = useMemo(() => colorMap[color], [color]);

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
          bg-white dark:bg-gray-900
          backdrop-blur-sm
          border ${colors.border}
          ${colors.glow}
          shadow-xl transition-all duration-300
        `}>
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between gap-4 mb-4'>
            {/* Back button */}
            <motion.div variants={itemVariants}>
              <Link
                href='/dashboard'
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-lg 
                  bg-gray-100 dark:bg-gray-800/50
                  border border-gray-200 dark:border-gray-700
                  text-gray-600 dark:text-gray-300
                  hover:bg-gray-200 dark:hover:bg-gray-700
                  hover:text-gray-900 dark:hover:text-white 
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
                ${colors.badge}
              `}>
                <Workflow className='w-3.5 h-3.5' />
                {workflowStats.total} {workflowStats.total === 1 ? "Workflow" : "Workflows"}
              </div>
              <div
                className={`
                px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5
                bg-gray-100 dark:bg-gray-800/50
                border-gray-200 dark:border-gray-700
                text-gray-600 dark:text-gray-300
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
              p-2.5 bg-white dark:bg-gray-800 bg-linear-to-br border rounded-xl shadow-sm
              ${colors.gradient}
              ${colors.border}
            `}>
              <Info className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <div className='flex-1'>
              <CardTitle className='text-lg text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2'>
                {title}
                <div className={`h-1 w-12 rounded-full ${colors.accent}`} />
              </CardTitle>
              <p className='text-gray-600 dark:text-gray-400 leading-relaxed text-sm'>
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
              border-gray-200 dark:border-gray-800
              bg-gray-50/50 dark:bg-gray-950/50
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

                {workflows.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: workflows.length * 0.1 + 0.3 }}
                    className='flex items-center justify-center pt-4 pb-2'>
                    <div className='flex items-center gap-3 text-gray-400 dark:text-gray-500'>
                      <div className='h-px w-16 bg-linear-to-r from-transparent to-gray-300 dark:to-gray-700' />
                      <CheckCircle2 className='w-4 h-4' />
                      <span className='text-xs font-medium'>End of documentation</span>
                      <div className='h-px w-16 bg-linear-to-l from-transparent to-gray-300 dark:to-gray-700' />
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