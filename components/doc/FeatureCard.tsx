// path: components/doc/FeatureCard.tsx
"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { FeatureItem } from "./types/featureTypes";
import { Card } from "../common/ui";
import { CheckCircle2, Code2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
  feature: FeatureItem;
}

// THE FIX: Added solid background colors (e.g., bg-violet-600) before gradients for fallback support.
const colorStyles = {
  violet: "bg-violet-600 from-violet-500 to-purple-600 text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700",
  blue: "bg-blue-600 from-blue-500 to-indigo-600 text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700",
  teal: "bg-teal-600 from-teal-500 to-emerald-600 text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-700",
  cyan: "bg-cyan-600 from-cyan-500 to-blue-600 text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700",
  orange: "bg-orange-600 from-orange-500 to-red-600 text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700",
  yellow: "bg-yellow-500 from-yellow-500 to-amber-600 text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700",
  rose: "bg-rose-600 from-rose-500 to-pink-600 text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700",
  green: "bg-green-600 from-green-500 to-emerald-600 text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
};

export default function FeatureCard({ feature }: FeatureCardProps) {
  // Dynamic Icon Mapping with Fallback
  const Icon = (LucideIcons[feature.icon as keyof typeof LucideIcons] || LucideIcons.Star) as LucideIcons.LucideIcon;
  
  // Extract theme styles
  const fullStyle = colorStyles[feature.color] || colorStyles.blue;
  
  // Extract just the header background classes (first 3 classes: solid bg + gradient from/to)
  const headerBgClasses = fullStyle.split(" ").slice(0, 3).join(" "); 
  
  // Extract border color for the card accent
  const borderColorVar = `var(--color-${feature.color}-500)`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto"
    >
      <div className="mb-6">
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
            Back to Dashboard
          </Link>
      </div>

      {/* Hero Header with Solid Fallback + Gradient */}
      <div className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${headerBgClasses} p-8 md:p-12 shadow-2xl`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/30">
            <Icon className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight">{feature.title}</h1>
            <p className="text-blue-50 text-lg md:text-xl font-medium opacity-90">{feature.subtitle}</p>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute left-0 bottom-0 w-full h-32 bg-linear-to-t from-black/10 to-transparent"></div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Description & Benefits */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-t-4" style={{ borderColor: borderColorVar }}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Overview</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              {feature.description}
            </p>
          </Card>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <SparklesIcon className={`w-5 h-5 text-${feature.color}-500`} /> 
              Key Benefits
            </h3>
            <div className="grid gap-4">
              {feature.benefits.map((benefit, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`mt-1 p-1.5 rounded-full bg-${feature.color}-100 dark:bg-${feature.color}-900/30 text-${feature.color}-600 dark:text-${feature.color}-400`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 font-medium">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl sticky top-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
              <Code2 className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-lg">Under the Hood</h3>
            </div>
            <ul className="space-y-4">
              {feature.technicalHighlights.map((tech, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                  {tech}
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {['React', 'Next.js', 'Supabase', 'TanStack Query', 'Leaflet', 'Dexie.js'].map(tag => (
                  <span key={tag} className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);