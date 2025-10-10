// path: components/doc/DocSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkflowSection } from "@/components/doc/types/workflowTypes";
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
} as const;

interface DocSidebarProps {
  sections: WorkflowSection[];
}

export default function DocSidebar({ sections }: DocSidebarProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Memoize filtered sections for better performance
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.value.toLowerCase().includes(query)
    );
  }, [sections, searchQuery]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleHoverStart = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  // Get user initials
  const userInitials = useMemo(() => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    return user?.user_metadata?.first_name?.[0]?.toUpperCase() || "U";
  }, [user]);

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-64 border-r border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-950 hidden md:flex flex-col sticky top-0 h-screen"
    >
      {/* User Section & Theme Toggle */}
      <div className="p-4 border-b border-gray-200  dark:border-gray-800">
        <div className="flex items-center justify-between gap-2">
          {user ? (
            <div className="relative flex-1">
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors group"
              >
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    className="h-8 w-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-500 transition-all">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {userInitials}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {user.user_metadata?.first_name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
                <LucideIcons.ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    
                    {/* Menu */}
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 z-50"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* User Info */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                          <Link
                            href="/onboarding"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            <LucideIcons.User className="w-4 h-4" />
                            Profile Settings
                          </Link>
                          <Link
                            href="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            <LucideIcons.LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                        </div>
                      </div>
                      <div className="p-2 border-t border-gray-200 dark:border-gray-700 w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-b-lg" >
                        <ThemeToggle />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex-1">
              <AuthButton />
            </div>
          )}
          
          
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent p-6">
        {/* Header */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-wide flex items-center gap-2">
            <LucideIcons.BookOpen className="w-5 h-5 text-blue-500" />
            Workflows
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {filteredSections.length} of {sections.length} sections
          </p>
        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-4 relative"
        >
          <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <LucideIcons.X className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-1" role="navigation" aria-label="Documentation sections">
          <AnimatePresence mode="popLayout">
            {filteredSections.length > 0 ? (
              filteredSections.map((section, index) => {
                const href = `/doc/${section.value}`;
                const isActive = pathname === href;
                const Icon = iconMap[section.icon as keyof typeof iconMap] || LucideIcons.FileText;

                return (
                  <motion.div
                    key={section.value}
                    layout
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    onHoverStart={() => handleHoverStart(index)}
                    onHoverEnd={handleHoverEnd}
                    className="relative"
                  >
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 relative overflow-hidden group ${
                        isActive
                          ? "text-blue-800 dark:text-blue-300"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {/* Active background */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            layoutId="activeBackground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
                          />
                        )}
                      </AnimatePresence>

                      {/* Hover background */}
                      {!isActive && hoveredIndex === index && (
                        <motion.div
                          layoutId="hoverBackground"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg"
                        />
                      )}

                      {/* Icon */}
                      <motion.div
                        animate={{
                          scale: isActive ? 1.1 : hoveredIndex === index ? 1.05 : 1,
                          rotate: isActive ? [0, -5, 5, 0] : 0
                        }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10"
                      >
                        <Icon className={`w-4 h-4 ${isActive ? section.iconColor : 'text-gray-400 dark:text-gray-500'}`} />
                      </motion.div>

                      {/* Title */}
                      <span className="flex-1 relative z-10 text-sm truncate" title={section.title}>
                        {section.title}
                      </span>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-blue-500 relative z-10"
                        />
                      )}

                      {/* Hover arrow */}
                      {!isActive && hoveredIndex === index && (
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="relative z-10"
                        >
                          <LucideIcons.ChevronRight className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <LucideIcons.SearchX className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No workflows found
                </p>
                <button
                  onClick={clearSearch}
                  className="text-xs text-blue-500 hover:text-blue-600 mt-2 underline"
                >
                  Clear search
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </motion.aside>
  );
}