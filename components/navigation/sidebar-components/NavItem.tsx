// components/navigation/sidebar-components/NavItem.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { FiChevronDown, FiExternalLink } from 'react-icons/fi';
import { NavItem as NavItemType, submenuVariants } from './sidebar-types';
import { UserRole } from '@/types/user-roles';
import { useState, useEffect } from 'react';
import { useUser } from '@/providers/UserProvider';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ButtonSpinner } from '@/components/common/ui/LoadingSpinner';

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
  const pathname = usePathname();
  const { isSuperAdmin, role } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Check Permissions
  const hasPermission = (roles: readonly (UserRole | string)[]) => {
    if (isSuperAdmin) return true;
    if (!roles || roles.length === 0) return false;
    return roles.includes(role as UserRole);
  };

  const active = isActive();
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.id);

  function isActive() {
    if (!item.href) return false;
    if (item.external) return false;
    if (item.href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(item.href);
  }

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  if (!hasPermission(item.roles)) return null;

  const itemContentClasses = cn(
    'group relative flex items-center transition-all duration-200 rounded-xl cursor-pointer overflow-hidden',
    active
      ? 'bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:via-indigo-600 hover:to-cyan-600'
      : 'text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md border-2 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800',
    // Collapsed vs Expanded spacing
    isCollapsed
      ? 'justify-center py-2.5 px-2 mx-1 mb-1.5'
      : `justify-between py-2.5 px-3 mx-2 mb-1.5 ${depth > 0 ? 'pl-5' : ''}`,
  );

  const renderContent = () => (
    <>
      <div
        className={cn(
          'flex items-center relative z-10',
          isCollapsed ? 'justify-center' : 'gap-3 min-w-0 flex-1',
        )}
      >
        {/* Enhanced Icon Container */}
        <div
          className={cn(
            'shrink-0 flex items-center justify-center rounded-xl transition-all duration-200',
            // Smaller icon in collapsed mode for better fit
            isCollapsed ? 'w-10 h-10' : 'w-9 h-9',
            active
              ? 'bg-white bg-opacity-25 backdrop-blur-sm shadow-lg'
              : 'bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-blue-900 dark:group-hover:to-indigo-900 border border-blue-100 dark:border-gray-600',
          )}
        >
          {isLoading ? (
            <ButtonSpinner size='xs' />
          ) : (
            <span
              className={cn(
                'transition-colors duration-200 flex items-center justify-center',
                isCollapsed ? 'text-lg' : 'text-base',
                active
                  ? 'text-white'
                  : 'text-blue-600 dark:text-blue-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
              )}
            >
              {item.icon}
            </span>
          )}
        </div>

        {/* Enhanced Label - Only show when not collapsed */}
        {!isCollapsed && (
          <div className='flex-1 min-w-0'>
            <span
              className={cn(
                'block truncate font-bold text-sm transition-colors duration-200',
                active
                  ? 'text-white'
                  : 'text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300',
              )}
            >
              {item.label}
            </span>
          </div>
        )}

        {/* Active Indicator - Only show when not collapsed */}
        {active && !isCollapsed && (
          <motion.div
            className='absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white rounded-r-full shadow-xl'
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
      </div>

      {/* Enhanced Expand Button - Only show when not collapsed */}
      {!isCollapsed && hasChildren && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleExpanded(item.id);
          }}
          className={cn(
            'relative z-10 p-2 rounded-lg transition-all duration-200',
            active
              ? 'bg-white bg-opacity-20 hover:bg-opacity-30'
              : 'bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900 dark:hover:to-indigo-900 border border-blue-100 dark:border-gray-600',
          )}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          >
            <FiChevronDown
              className={cn(
                'w-4 h-4 transition-colors duration-200',
                active ? 'text-white' : 'text-blue-600 dark:text-blue-400',
              )}
            />
          </motion.div>
        </button>
      )}

      {/* External Link Badge - Only show when not collapsed */}
      {!isCollapsed && item.external && (
        <div
          className={cn(
            'relative z-10 ml-2 p-1.5 rounded-md transition-all duration-200',
            active
              ? 'bg-white bg-opacity-20 text-white'
              : 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 text-blue-600 dark:text-blue-400',
          )}
        >
          <FiExternalLink className='w-3.5 h-3.5' />
        </div>
      )}
    </>
  );

  // --- 1. EXTERNAL LINKS ---
  if (item.external) {
    return (
      <div
        key={item.id}
        className='relative'
        onMouseEnter={() => isCollapsed && hasChildren && setHoveredItem(item)}
        onMouseLeave={() => isCollapsed && hasChildren && setHoveredItem(null)}
      >
        <a
          href={item.href}
          target='_blank'
          rel={item.preferNative ? undefined : 'noopener noreferrer'}
          className={itemContentClasses}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.id);
            }
          }}
        >
          {renderContent()}
        </a>
      </div>
    );
  }

  // --- 2. PARENT ITEM WITH CHILDREN ---
  if (hasChildren) {
    return (
      <div
        key={item.id}
        className='relative'
        onMouseEnter={() => isCollapsed && hasChildren && setHoveredItem(item)}
        onMouseLeave={() => isCollapsed && hasChildren && setHoveredItem(null)}
      >
        <div onClick={() => toggleExpanded(item.id)} className={itemContentClasses}>
          {renderContent()}
        </div>

        {!isCollapsed && (
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial='hidden'
                animate='visible'
                exit='hidden'
                variants={submenuVariants}
                transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
                className='overflow-hidden'
              >
                <div className='relative ml-5 pl-5 mt-1'>
                  {/* linear Border */}
                  <div className='absolute left-0 top-0 bottom-0 w-0.5 bg-linear-to-b from-blue-400 via-indigo-400 to-blue-400 dark:from-blue-500 dark:via-indigo-500 dark:to-blue-500 rounded-full' />

                  {/* Connecting Dot */}
                  <div className='absolute left-[-3px] top-3 w-2 h-2 bg-linear-to-br from-blue-400 to-indigo-500 rounded-full' />

                  {item.children?.map((child, index) => (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.2,
                        ease: [0.4, 0.0, 0.2, 1],
                      }}
                    >
                      <NavItem
                        item={child}
                        isCollapsed={isCollapsed}
                        depth={depth + 1}
                        expandedItems={expandedItems}
                        toggleExpanded={toggleExpanded}
                        setHoveredItem={setHoveredItem}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  }

  // --- 3. INTERNAL LINK ITEMS ---
  return (
    <div key={item.id} className='relative'>
      <Link
        href={item.href || '#'}
        className={itemContentClasses}
        prefetch={true}
        title={isCollapsed ? item.label : undefined}
        onClick={(e) => {
          if (item.href === pathname) {
            e.preventDefault();
            return;
          }
          setIsLoading(true);
        }}
      >
        {renderContent()}
      </Link>
    </div>
  );
};
