// components/navigation/sidebar-components/NavItem.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { FiChevronDown } from 'react-icons/fi';
import { NavItem as NavItemType, submenuVariants } from './sidebar-types';
import { UserRole } from '@/types/user-roles';
import { useState, useEffect } from 'react'; // Added hooks
import { useUser } from '@/providers/UserProvider';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ButtonSpinner } from '@/components/common/ui/LoadingSpinner'; // Added import

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

  // Re-introduced loading state
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

  // Reset loading state when the path changes (Navigation Complete)
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  if (!hasPermission(item.roles)) return null;

  const itemContentClasses = cn(
    'flex items-center justify-between py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-2 mb-1 cursor-pointer',
    active
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm'
      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-sm',
    isCollapsed ? 'justify-center px-4' : `pr-4 ${depth > 0 ? 'pl-8' : 'pl-4'}`,
  );

  const renderContent = () => (
    <>
      <div className='flex items-center space-x-3 min-w-0'>
        <span className='shrink-0 flex items-center justify-center w-5 h-5'>
          {/* Show spinner if loading and this specific item is the active target, OR if it's the current active link updating */}
          {isLoading && active ? <ButtonSpinner size='xs' /> : item.icon}
        </span>
        {!isCollapsed && <span className='truncate'>{item.label}</span>}
      </div>
      {!isCollapsed && hasChildren && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleExpanded(item.id);
          }}
          className='p-1 rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 z-10'
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <motion.div animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
            <FiChevronDown className='w-4 h-4' />
          </motion.div>
        </button>
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

  // --- 2. PARENT ITEM WITH CHILDREN (No HREF usually) ---
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
                transition={{ duration: 0.2 }}
                className='overflow-hidden'
              >
                <div className='ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-2'>
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
          // If already on this page, don't navigate again
          if (item.href === pathname) {
            e.preventDefault();
            return;
          }
          setIsLoading(true);
        }}
      >
        {/* We need to pass isLoading manually here because renderContent relies on closure scope state */}
        <div className='flex items-center space-x-3 min-w-0'>
          <span className='shrink-0 flex items-center justify-center w-5 h-5'>
            {isLoading ? <ButtonSpinner size='xs' /> : item.icon}
          </span>
          {!isCollapsed && <span className='truncate'>{item.label}</span>}
        </div>
      </Link>
    </div>
  );
};
