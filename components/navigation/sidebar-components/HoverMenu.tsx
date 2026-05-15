// components/navigation/sidebar-components/HoverMenu.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { NavItem as NavItemType } from './sidebar-types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserRole } from '@/types/user-roles';
import { useUser } from '@/providers/UserProvider';
import { useMemo } from 'react';

interface HoverMenuProps {
  hoveredItem: NavItemType | null;
  hoverPosition: DOMRect | null;
  clearLeaveTimeout: () => void;
  onMouseLeave: () => void;
}

export const HoverMenu = ({
  hoveredItem,
  hoverPosition,
  clearLeaveTimeout,
  onMouseLeave,
}: HoverMenuProps) => {
  const router = useRouter();
  const { isSuperAdmin, role } = useUser();

  const hasPermission = (roles: readonly (UserRole | string)[]) => {
    if (isSuperAdmin) return true;
    if (!roles || roles.length === 0) return false;
    return roles.includes(role as UserRole);
  };

  const handleChildClick = (e: React.MouseEvent, child: NavItemType) => {
    e.stopPropagation();
    if (!hasPermission(child.roles)) {
      toast.error('You are not authorized to access this section.');
      return;
    }
    if (child.href) {
      router.push(child.href);
      onMouseLeave(); // Close menu on click
    }
  };

  const menuStyle = useMemo(() => {
    if (!hoverPosition) {
      return { display: 'none' };
    }
    return {
      top: `${hoverPosition.top}px`,
      left: `68px`, // 64px sidebar + 4px gap
    };
  }, [hoverPosition]);

  return (
    <AnimatePresence>
      {hoveredItem?.children && (
        <motion.div
          initial={{ opacity: 0, x: 10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          // THE FIX: Added `before:absolute before:inset-y-0 before:-left-4 before:w-4 before:bg-transparent`
          // This creates an invisible bridge spanning the 4px gap so the mouse never triggers onMouseLeave
          className='fixed z-60 min-w-48 overflow-visible rounded-lg bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10 before:absolute before:inset-y-0 before:-left-4 before:w-4 before:bg-transparent'
          style={menuStyle}
          onMouseEnter={clearLeaveTimeout}
          onMouseLeave={onMouseLeave}
        >
          <div className='py-2'>
            {hoveredItem.children.map((child) => (
              <button
                key={child.id}
                onClick={(e) => handleChildClick(e, child)}
                disabled={!hasPermission(child.roles)}
                className={`
                  flex w-full items-center space-x-3 px-4 py-2 text-left text-sm transition-colors
                  ${
                    hasPermission(child.roles)
                      ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      : 'text-gray-400 cursor-not-allowed dark:text-gray-600'
                  }
                `}
              >
                <span className='shrink-0'>{child.icon}</span>
                <span className='truncate'>{child.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
