"use client";

import { motion, AnimatePresence } from "framer-motion";
import { NavItem as NavItemType } from "./sidebar-types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRole } from "@/types/user-roles";
import { useUser } from "@/providers/UserProvider";

interface HoverMenuProps {
  hoveredItem: NavItemType | null;
  setHoveredItem: (item: NavItemType | null) => void;
}

export const HoverMenu = ({ hoveredItem, setHoveredItem }: HoverMenuProps) => {
  const router = useRouter();
  const { isSuperAdmin, role } = useUser();

  const hasPermission = (roles: UserRole[]) => {
    if (isSuperAdmin) return true;
    if (!roles || roles.length === 0) return false;
    return roles.includes(role as UserRole);
  };

  const handleChildClick = (e: React.MouseEvent, child: NavItemType) => {
    e.stopPropagation();
    if (!hasPermission(child.roles)) {
      toast.error("You are not authorized to access this section.");
      return;
    }
    if (child.href) {
      router.push(child.href);
      setHoveredItem(null);
    }
  };

  return (
    <AnimatePresence>
      {hoveredItem?.children && (
        <motion.div
          initial={{ opacity: 0, x: 10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed left-16 z-60 min-w-48 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
          style={{
            top: `${Math.max(80, Math.min(window.innerHeight - 200, 160))}px`,
          }}
          onMouseEnter={() => setHoveredItem(hoveredItem)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="py-2">
            {hoveredItem.children.map((child) => (
              <button
                key={child.id}
                onClick={(e) => handleChildClick(e, child)}
                disabled={!hasPermission(child.roles)}
                className={`
                  flex w-full items-center space-x-3 px-4 py-2 text-left text-sm transition-colors
                  ${hasPermission(child.roles) 
                    ? "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" 
                    : "text-gray-400 cursor-not-allowed dark:text-gray-600"
                  }
                `}
              >
                <span className="shrink-0">{child.icon}</span>
                <span className="truncate">{child.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};