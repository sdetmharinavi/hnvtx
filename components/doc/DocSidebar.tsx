// components/doc/DocSidebar.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import Image from 'next/image';
import AuthButton from '@/components/auth/authButton';
import ThemeToggle from '@/components/common/ui/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

// Icons
import {
  Menu,
  X,
  Search,
  ChevronDown,
  Settings,
  LayoutDashboard,
  Sparkles,
  Workflow,
} from 'lucide-react';

// --- Types ---
// Define local interfaces to avoid import errors if the separate files are missing
export interface WorkflowItem {
  title: string;
  description?: string;
  steps?: unknown[];
}

export interface WorkflowSection {
  title: string;
  value: string;
  icon?: React.ElementType | string;
  iconColor?: string;
  workflows: WorkflowItem[];
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface DocSidebarProps {
  sections: WorkflowSection[];
  features: FeatureItem[];
}

// --- Helper: Dynamic Icon Renderer ---
const DynamicIcon = ({
  icon,
  className,
}: {
  icon: React.ElementType | string | undefined;
  className?: string;
}) => {
  if (!icon) return <Icons.FileText className={className} />;

  // If it's a React component (function)
  if (typeof icon === 'function' || typeof icon === 'object') {
    const IconComponent = icon as React.ElementType;
    return <IconComponent className={className} />;
  }

  // If it's a string name from Lucide
  if (typeof icon === 'string') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LucideIcon = (Icons as any)[icon];
    if (LucideIcon) return <LucideIcon className={className} />;
  }

  return <Icons.FileText className={className} />;
};

// --- Main Component ---
export default function DocSidebar({ sections, features }: DocSidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // State
  const [isOpen, setIsOpen] = useState(false); // For mobile drawer
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Auto-expand active section
  useEffect(() => {
    const activeSection = sections.find((s) => pathname.startsWith(`/doc/${s.value}`));
    if (activeSection) {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        next.add(activeSection.value);
        return next;
      });
    }
  }, [pathname, sections]);

  // Filter Logic
  const filteredContent = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return { features, sections };

    return {
      features: features.filter((f) => f.title.toLowerCase().includes(query)),
      sections: sections.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.workflows.some((w) => w.title.toLowerCase().includes(query))
      ),
    };
  }, [sections, features, searchQuery]);

  // Auto-expand search results
  useEffect(() => {
    if (searchQuery.trim()) {
      const matchedIDs = filteredContent.sections.map((s) => s.value);
      setExpandedSections(new Set(matchedIDs));
    }
  }, [searchQuery, filteredContent.sections]);

  const toggleSection = (value: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const userInitials = useMemo(() => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name[0].toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  }, [user]);

  // --- Sidebar Inner Content ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800">
      {/* User Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80">
        <div className="flex items-center justify-between gap-2">
          {user ? (
            <div className="relative flex-1">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    className="rounded-full ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-blue-500/50"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 ring-2 ring-white dark:ring-gray-800 shadow-sm">
                    <span className="text-xs font-bold text-white">{userInitials}</span>
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {user.user_metadata?.first_name || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-mono">
                    {user.email}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
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
                      className="absolute top-full left-0 right-0 mt-2 z-40 origin-top"
                    >
                      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-1">
                          <Link
                            href="/onboarding"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <Settings className="w-4 h-4" /> Settings
                          </Link>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Features */}
        {filteredContent.features.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Core Features
            </h3>
            <div className="space-y-0.5">
              {filteredContent.features.map((feature) => {
                const isActive = pathname === `/doc/${feature.id}`;
                return (
                  <Link
                    key={feature.id}
                    href={`/doc/${feature.id}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <DynamicIcon
                      icon={feature.icon}
                      className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}
                    />
                    <span>{feature.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Workflows */}
        {filteredContent.sections.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
              <Workflow className="w-3 h-3" /> Workflows
            </h3>
            <div className="space-y-1">
              {filteredContent.sections.map((section) => {
                const isActive = pathname === `/doc/${section.value}`;
                const isExpanded = expandedSections.has(section.value);
                const hasChildren = section.workflows && section.workflows.length > 0;

                return (
                  <div key={section.value} className="relative">
                    <div className="flex items-center">
                      <Link
                        href={`/doc/${section.value}`}
                        onClick={(e) => {
                          if (hasChildren && !isExpanded) {
                            // Optionally prevent nav if just expanding, but usually we want to nav to parent doc too
                            toggleSection(section.value);
                          }
                        }}
                        className={cn(
                          'flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        <DynamicIcon
                          icon={section.icon}
                          className={cn(
                            'w-4 h-4',
                            isActive
                              ? 'text-blue-500'
                              : section.iconColor?.replace('text-', 'text-') || 'text-gray-400'
                          )}
                        />
                        <span className="truncate">{section.title}</span>
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSection(section.value);
                          }}
                          className="p-1.5 ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? '' : '-rotate-90'
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && hasChildren && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-9 mt-1 space-y-0.5 border-l border-gray-200 dark:border-gray-800 pl-2">
                            {section.workflows.map((wf, idx) => (
                              <Link
                                key={idx}
                                href={`/doc/${section.value}#workflow-${idx}`}
                                className="block px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                              >
                                {wf.title}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredContent.features.length === 0 && filteredContent.sections.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No results found
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Open Docs Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-80 h-full shadow-2xl"
            >
              <SidebarContent />
              {/* Mobile Close Button inside drawer */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-500 z-50"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 h-[calc(100vh-64px)] sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
