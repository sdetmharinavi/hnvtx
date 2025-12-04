// path: components/navigation/sidebar.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { memo, useState, useCallback, useEffect } from 'react';
import useIsMobile from '@/hooks/useIsMobile';

import { NavItem } from '@/components/navigation/sidebar-components/NavItem';
import { QuickActions } from '@/components/navigation/sidebar-components/QuickActions';
import { HoverMenu } from '@/components/navigation/sidebar-components/HoverMenu';
import { MobileSidebar } from '@/components/navigation/sidebar-components/MobileSidebar';
import {
  SidebarProps,
  NavItem as NavItemType,
  sidebarVariants,
  contentVariants,
} from '@/components/navigation/sidebar-components/sidebar-types';
import NavItems from './sidebar-components/NavItems';
import { FiMenu, FiX, FiLayout, FiTool } from 'react-icons/fi';
import { useViewSettings } from '@/contexts/ViewSettingsContext';

const Sidebar = memo(({ isCollapsed, setIsCollapsed, showMenuFeatures }: SidebarProps) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<NavItemType | null>(null);
  const isMobile = useIsMobile();

  // THE FIX: Extract the help item from the main navigation items.
  const allNavItems = NavItems();
  const helpNavItem = allNavItems.find(item => item.id === 'help');
  const mainNavItems = allNavItems.filter(item => item.id !== 'help');
  const { showHeader, setShowHeader, showToolbar, setShowToolbar } = useViewSettings();


  // Close mobile sidebar on route changes
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [pathname, isMobile, setIsCollapsed]);

  // Close hover menu when sidebar expands
  useEffect(() => {
    if (!isCollapsed) {
      setHoveredItem(null);
    }
  }, [isCollapsed]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  if (isMobile) {
    return (
      <MobileSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        navItems={allNavItems} // Mobile can show all items in one scrollable list
        expandedItems={expandedItems}
        toggleExpanded={toggleExpanded}
        setHoveredItem={setHoveredItem}
        pathname={pathname}
      />
    );
  }


  return (
    <motion.aside
      data-sidebar
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white"
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.h2
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Navigation
            </motion.h2>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            {isCollapsed ? <FiMenu className="h-5 w-5" /> : <FiX className="h-5 w-5" />}
          </motion.div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1" role="navigation">
          {/* Render only the main navigation items here. */}
          {mainNavItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              setHoveredItem={setHoveredItem}
            />
          ))}
        </nav>
        {showMenuFeatures && <QuickActions isCollapsed={isCollapsed} pathname={pathname} />}
      </div>

      {/* View Toggles */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-1">
        <button
          onClick={() => setShowHeader(!showHeader)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            showHeader 
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <FiLayout className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>{showHeader ? 'Hide' : 'Show'} Header</span>}
        </button>
        
        <button
          onClick={() => setShowToolbar(!showToolbar)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            showToolbar 
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <FiTool className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>{showToolbar ? 'Hide' : 'Show'} Toolbar</span>}
        </button>
      </div>

      {/* Help section */}
      {helpNavItem && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <NavItem
            item={helpNavItem}
            isCollapsed={isCollapsed}
            expandedItems={expandedItems}
            toggleExpanded={toggleExpanded}
            setHoveredItem={setHoveredItem}
          />
        </div>
      )}


      <HoverMenu hoveredItem={hoveredItem} setHoveredItem={setHoveredItem} />
    </motion.aside>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;