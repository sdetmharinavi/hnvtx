"use client";

import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { NavItem } from "./NavItem";
import { QuickActions } from "./QuickActions";
import { mobileOverlayVariants, mobileSidebarVariants } from "./sidebar-types";
import { NavItem as NavItemType } from "./sidebar-types";

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
        className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:text-white"
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
      </motion.aside>
    </>
  );
};