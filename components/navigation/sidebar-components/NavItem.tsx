"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";
import { NavItem as NavItemType, submenuVariants } from "./sidebar-types";
import { useUserPermissions } from "@/hooks/useRoleFunctions";
import { toast } from "sonner";
import { UserRole } from "@/types/user-roles";
import { ButtonSpinner } from "@/components/common/ui/LoadingSpinner";
import { useState, useEffect } from "react";

interface NavItemProps {
  item: NavItemType;
  isCollapsed: boolean;
  depth?: number;
  expandedItems: string[];
  toggleExpanded: (id: string) => void;
  setHoveredItem: (item: NavItemType | null) => void;
}

export const NavItem = ({
  item,
  isCollapsed,
  depth = 0,
  expandedItems,
  toggleExpanded,
  setHoveredItem,
}: NavItemProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isSuperAdmin, role } = useUserPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const hasPermission = (roles: UserRole[]) => {
    if (isSuperAdmin) return true;
    if (!roles || roles.length === 0) return false;
    return roles.includes(role as UserRole);
  };

  const isActive = () => {
    if (!item.href) return false;
    if (item.href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(item.href);
  };

  const handleItemClick = async (e: React.MouseEvent) => {
    if (!hasPermission(item.roles)) {
      e.preventDefault();
      toast.error("You are not authorized to access this section.");
      return;
    }
    
    if (item.children && item.children.length > 0) {
      e.preventDefault();
      toggleExpanded(item.id);
      return;
    }
    
    if (item.href) {
      try {
        setNavigatingTo(item.href);
        setIsLoading(true);
        if (item.external) {
          window.open(item.href, "_blank", "noopener,noreferrer");
          setIsLoading(false);
        } else {
          await router.push(item.href);
          // The loading state will be cleared by the effect below
        }
      } catch (error) {
        console.error("Navigation error:", error);
        toast.error("Failed to navigate. Please try again.");
        setIsLoading(false);
        setNavigatingTo(null);
      }
    }
  };

  // Clear loading state when the route changes
  useEffect(() => {
    if (pathname === navigatingTo) {
      setIsLoading(false);
      setNavigatingTo(null);
    }
  }, [pathname, navigatingTo]);

  if (!hasPermission(item.roles)) return null;

  const active = isActive();
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.id);

  return (
    <div 
      key={item.id} 
      className="relative" 
      onMouseEnter={() => isCollapsed && hasChildren && setHoveredItem(item)} 
      onMouseLeave={() => isCollapsed && hasChildren && setHoveredItem(null)}
    >
      <div
        onClick={handleItemClick}
        className={`
          flex cursor-pointer items-center justify-between py-3 text-sm font-medium 
          transition-all duration-200 rounded-lg mx-2 mb-1
          ${active 
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm" 
            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm"
          } 
          ${isCollapsed ? "justify-center px-4" : `pr-4 ${depth > 0 ? "pl-8" : "pl-4"}`}
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleItemClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        <div className="flex items-center space-x-3">
          <span className="flex-shrink-0">
            {isLoading && pathname !== item.href ? <ButtonSpinner size="xs" /> : item.icon}
          </span>
          {!isCollapsed && (
            <span className="truncate">
              {isLoading && pathname !== item.href ? 'Loading...' : item.label}
            </span>
          )}
        </div>
        {!isCollapsed && hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(item.id);
            }}
            className="p-1 rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <motion.div 
              animate={{ rotate: isExpanded ? 0 : -90 }} 
              transition={{ duration: 0.2 }}
            >
              <FiChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        )}
      </div>
      
      {!isCollapsed && hasChildren && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div 
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={submenuVariants}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                {item.children?.map((child) => (
                  <NavItem
                    key={child.id}
                    item={child}
                    isCollapsed={isCollapsed}
                    depth={depth + 1}
                    expandedItems={expandedItems}
                    toggleExpanded={toggleExpanded}
                    setHoveredItem={setHoveredItem}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};