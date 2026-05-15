// components/navigation/sidebar.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { memo, useState, useCallback, useEffect, useRef } from 'react'; // THE FIX: Imported useRef
import useIsMobile from '@/hooks/useIsMobile';

import { NavItem } from '@/components/navigation/sidebar-components/NavItem';
import { QuickActions } from '@/components/navigation/sidebar-components/QuickActions';
import { HoverMenu } from '@/components/navigation/sidebar-components/HoverMenu';
import {
  SidebarProps,
  NavItem as NavItemType,
  sidebarVariants,
  contentVariants,
} from '@/components/navigation/sidebar-components/sidebar-types';
import NavItems from './sidebar-components/NavItems';
import { FiMenu, FiX, FiLayout, FiTool } from 'react-icons/fi';
import { useViewSettings } from '@/contexts/ViewSettingsContext';
import { MobileSidebar } from '@/components/navigation/sidebar-components/MobileSidebar';

const Sidebar = memo(({ isCollapsed, setIsCollapsed, showMenuFeatures }: SidebarProps) => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<NavItemType | null>(null);
  const [hoverPosition, setHoverPosition] = useState<DOMRect | null>(null);
  const isMobile = useIsMobile();
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // THE FIX: Ref for the close delay timer

  const allNavItems = NavItems();
  const helpNavItem = allNavItems.find((item) => item.id === 'help');
  const mainNavItems = allNavItems.filter((item) => item.id !== 'help');
  const { showHeader, setShowHeader, showToolbar, setShowToolbar } = useViewSettings();

  // THE FIX: Clear any pending close timer
  const clearLeaveTimeout = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  // THE FIX: Handler for when the mouse enters an icon
  const handleItemMouseEnter = useCallback(
    (item: NavItemType | null, position: DOMRect | null) => {
      clearLeaveTimeout();
      setHoveredItem(item);
      setHoverPosition(position);
    },
    [clearLeaveTimeout],
  );

  // THE FIX: Handler for when the mouse leaves an icon (with a delay)
  const handleItemMouseLeave = useCallback(() => {
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setHoverPosition(null);
    }, 200); // 200ms delay
  }, []);

  // THE FIX: Handler for when the mouse leaves the pop-out menu itself (immediate)
  const handleMenuMouseLeave = useCallback(() => {
    clearLeaveTimeout();
    setHoveredItem(null);
    setHoverPosition(null);
  }, [clearLeaveTimeout]);

  useEffect(() => {
    if (!isCollapsed) {
      handleMenuMouseLeave(); // Close immediately if sidebar expands
    }
  }, [isCollapsed, handleMenuMouseLeave]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  if (isMobile) {
    return (
      <MobileSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        navItems={allNavItems}
        expandedItems={expandedItems}
        toggleExpanded={toggleExpanded}
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
      className='hidden md:flex fixed top-0 left-0 z-50 h-full flex-col border-r border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white'
    >
      {/* Toggle Header */}
      <div className='flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800'>
        <AnimatePresence mode='wait'>
          {!isCollapsed && (
            <motion.h2
              initial='hidden'
              animate='visible'
              exit='exit'
              variants={contentVariants}
              transition={{ duration: 0.2 }}
              className='text-lg font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-hidden'
            >
              Navigation
            </motion.h2>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ml-auto'
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            {isCollapsed ? <FiMenu className='h-5 w-5' /> : <FiX className='h-5 w-5' />}
          </motion.div>
        </button>
      </div>

      {/* Scrollable Nav Content */}
      <div className='flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar'>
        <nav className='space-y-1 px-2' role='navigation'>
          {mainNavItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              onMouseEnter={handleItemMouseEnter} // THE FIX: Pass new handler
              onMouseLeave={handleItemMouseLeave} // THE FIX: Pass new handler
            />
          ))}
        </nav>
        {showMenuFeatures && <QuickActions isCollapsed={isCollapsed} pathname={pathname} />}
      </div>

      {/* View Toggles Footer */}
      <div className='border-t border-gray-200 dark:border-gray-700 p-2 space-y-1'>
        <button
          onClick={() => setShowHeader(!showHeader)}
          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
            showHeader
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
          title='Toggle Header'
        >
          <div className='flex items-center justify-center w-6'>
            <FiLayout className='h-4 w-4' />
          </div>
          {!isCollapsed && <span>{showHeader ? 'Hide' : 'Show'} Header</span>}
        </button>

        <button
          onClick={() => setShowToolbar(!showToolbar)}
          className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
            showToolbar
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
          title='Toggle Toolbar'
        >
          <div className='flex items-center justify-center w-6'>
            <FiTool className='h-4 w-4' />
          </div>
          {!isCollapsed && <span>{showToolbar ? 'Hide' : 'Show'} Toolbar</span>}
        </button>
      </div>

      {/* Help Section */}
      {helpNavItem && (
        <div className='border-t border-gray-200 dark:border-gray-700 p-2'>
          <NavItem
            item={helpNavItem}
            isCollapsed={isCollapsed}
            expandedItems={expandedItems}
            toggleExpanded={toggleExpanded}
            onMouseEnter={handleItemMouseEnter} // THE FIX: Pass new handler
            onMouseLeave={handleItemMouseLeave} // THE FIX: Pass new handler
          />
        </div>
      )}

      {/* Desktop Hover Menu (Popper) */}
      <HoverMenu
        hoveredItem={hoveredItem}
        hoverPosition={hoverPosition}
        clearLeaveTimeout={clearLeaveTimeout} // THE FIX: Pass canceller
        onMouseLeave={handleMenuMouseLeave} // THE FIX: Pass immediate leave handler
      />
    </motion.aside>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
