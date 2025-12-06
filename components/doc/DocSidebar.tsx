// path: components/doc/DocSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkflowSection } from "@/components/doc/types/workflowTypes";
import { FeatureItem } from "@/components/doc/types/featureTypes"; // New Import
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useCallback } from "react";
import AuthButton from "@/components/auth/authButton";
import ThemeToggle from "@/components/common/ui/theme/ThemeToggle";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";

const iconMap = {
  ShieldCheck: LucideIcons.ShieldCheck,
  Server: LucideIcons.Server,
  ImUserTie: LucideIcons.Users,
  BsPeople: LucideIcons.Users2,
  FaDiagramNext: LucideIcons.Network,
  Users: LucideIcons.Users,
  Cpu: LucideIcons.Cpu,
  BellRing: LucideIcons.BellRing,
  Route: LucideIcons.Route,
  GitBranch: LucideIcons.GitBranch,
  GitCommit: LucideIcons.GitCommit,
  WifiOff: LucideIcons.WifiOff, 
  Map: LucideIcons.Map,         
  QrCode: LucideIcons.QrCode,   
  Database: LucideIcons.Database,
  MapPin: LucideIcons.MapPin,
  FileSpreadsheet: LucideIcons.FileSpreadsheet,
  Globe: LucideIcons.Globe,
  FileClock: LucideIcons.FileClock,
} as const;

interface DocSidebarProps {
  sections: WorkflowSection[];
  features: FeatureItem[]; // New Prop
}

export default function DocSidebar({ sections, features }: DocSidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Combined filter logic
  const filteredContent = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return { features, sections };

    return {
      features: features.filter(f => f.title.toLowerCase().includes(query)),
      sections: sections.filter(s => s.title.toLowerCase().includes(query))
    };
  }, [sections, features, searchQuery]);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  const userInitials = useMemo(() => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    return user?.user_metadata?.first_name?.[0]?.toUpperCase() || "U";
  }, [user]);

  // Helper to render a link item
  const renderLinkItem = (id: string, title: string, iconName: string, href: string, colorClass: string) => {
    const isActive = pathname === href;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (iconMap as any)[iconName] || LucideIcons.FileText;

    return (
      <motion.div
        key={id}
        layout
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setHoveredItem(id)}
        onHoverEnd={() => setHoveredItem(null)}
        className="relative"
      >
        <Link
          href={href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden group ${
            isActive
              ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          {/* Hover Background */}
          {!isActive && hoveredItem === id && (
            <motion.div
              layoutId="hoverBg"
              className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          {/* Icon */}
          <div className={`relative z-10 ${isActive ? colorClass : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}`}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Title */}
          <span className="relative z-10 flex-1 truncate">{title}</span>

          {/* Active Indicator */}
          {isActive && (
            <motion.div layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-blue-500 relative z-10" />
          )}
        </Link>
      </motion.div>
    );
  };

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-72 border-r border-gray-200 bg-white/50 dark:bg-gray-950/50 dark:border-gray-800 hidden md:flex flex-col sticky top-0 h-screen backdrop-blur-xl"
    >
      {/* --- User Header (Same as before) --- */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-20">
        <div className="flex items-center justify-between gap-2">
          {user ? (
             <div className="relative flex-1">
             <button
               onClick={toggleUserMenu}
               className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
             >
               {user.user_metadata?.avatar_url ? (
                 <Image
                   src={user.user_metadata.avatar_url}
                   alt="User Avatar"
                   className="h-8 w-8 rounded-full ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-blue-500/50 transition-all"
                   width={32}
                   height={32}
                 />
               ) : (
                 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 ring-2 ring-white dark:ring-gray-800 shadow-sm">
                   <span className="text-xs font-bold text-white">
                     {userInitials}
                   </span>
                 </div>
               )}
               <div className="flex-1 text-left min-w-0">
                 <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                   {user.user_metadata?.first_name || "User"}
                 </p>
                 <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-mono">
                   {user.email}
                 </p>
               </div>
               <LucideIcons.ChevronDown
                 className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                   isUserMenuOpen ? "rotate-180" : ""
                 }`}
               />
             </button>

             <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute top-full left-0 right-0 mt-2 z-40 origin-top"
                    >
                      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                         <div className="p-1">
                          <Link href="/onboarding" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <LucideIcons.Settings className="w-4 h-4" /> Settings
                          </Link>
                          <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <LucideIcons.LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                         </div>
                         <div className="border-t border-gray-100 dark:border-gray-800 p-2 bg-gray-50 dark:bg-gray-800/50 flex justify-center">
                            <ThemeToggle />
                         </div>
                      </div>
                    </motion.div>
                  </>
                )}
             </AnimatePresence>
           </div>
          ) : (
            <AuthButton />
          )}
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <LucideIcons.X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* --- Scrollable Nav --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
        
        {/* FEATURES SECTION */}
        {filteredContent.features.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
              <LucideIcons.Sparkles className="w-3 h-3" /> Core Features
            </h3>
            <div className="space-y-0.5">
              {filteredContent.features.map(feature => 
                renderLinkItem(feature.id, feature.title, feature.icon, `/doc/${feature.id}`, `text-${feature.color}-500`)
              )}
            </div>
          </div>
        )}

        {/* WORKFLOWS SECTION */}
        {filteredContent.sections.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
               <LucideIcons.Workflow className="w-3 h-3" /> Workflows
            </h3>
             <div className="space-y-0.5">
              {filteredContent.sections.map(section => 
                 renderLinkItem(section.value, section.title, section.icon, `/doc/${section.value}`, section.iconColor.replace('text-', 'text-').split(' ')[0])
              )}
            </div>
          </div>
        )}

        {filteredContent.features.length === 0 && filteredContent.sections.length === 0 && (
           <div className="text-center py-8 text-gray-400 text-sm">No results found</div>
        )}

      </div>
    </motion.aside>
  );
}