"use client";

import { motion } from "framer-motion";
import { FiLayout, FiTool, FiX } from "react-icons/fi";
import { NavItem } from "./NavItem";
import { QuickActions } from "./QuickActions";
import { mobileOverlayVariants, mobileSidebarVariants } from "./sidebar-types";
import { NavItem as NavItemType } from "./sidebar-types";
import { useViewSettings } from "@/contexts/ViewSettingsContext";

interface MobileSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  navItems: NavItemType[];
  expandedItems: string[];
  toggleExpanded: (id: string) => void;
  setHoveredItem: (item: NavItemType | null) => void;
  pathname: string;
}

export const MobileSidebar = ({
  isCollapsed,
  setIsCollapsed,
  navItems,
  expandedItems,
  toggleExpanded,
  setHoveredItem,
  pathname,
}: MobileSidebarProps) => {
  const handleBackdropClick = () => {
    setIsCollapsed(true);
  };
  
  // THE FIX: Added useViewSettings hook to get state and setters
  const { showHeader, setShowHeader, showToolbar, setShowToolbar } = useViewSettings();

  if (isCollapsed) return null;

  return (
    <>
      <motion.div 
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={mobileOverlayVariants}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" 
        aria-label="Sidebar backdrop" 
        onClick={handleBackdropClick}
      />
      <motion.aside
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={mobileSidebarVariants}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 z-[9999] flex h-full w-64 flex-col border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:text-white"
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Navigation
          </h2>
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" 
            aria-label="Close sidebar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1" role="navigation">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isCollapsed={false}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                setHoveredItem={setHoveredItem}
              />
            ))}
          </nav>
          <QuickActions
            isCollapsed={false}
            pathname={pathname}
          />
        </div>

        {/* THE FIX: Added View Toggles section for mobile */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-1">
          <button
            onClick={() => setShowHeader(!showHeader)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              showHeader 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <FiLayout className="h-4 w-4 flex-shrink-0" />
            <span>{showHeader ? 'Hide' : 'Show'} Header</span>
          </button>
          
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              showToolbar 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <FiTool className="h-4 w-4 flex-shrink-0" />
            <span>{showToolbar ? 'Hide' : 'Show'} Toolbar</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};