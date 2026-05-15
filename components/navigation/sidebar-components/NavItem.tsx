// components/navigation/sidebar-components/NavItem.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { FiChevronDown, FiExternalLink } from 'react-icons/fi';
import { NavItem as NavItemType, submenuVariants } from './sidebar-types';
import { UserRole } from '@/types/user-roles';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/providers/UserProvider';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ButtonSpinner } from '@/components/common/ui/LoadingSpinner';
import { useQueryClient } from '@tanstack/react-query';
import { ROUTE_QUERY_MAP } from '@/config/route-query-mapping';
import { createClient } from '@/utils/supabase/client';

interface NavItemProps {
  item: NavItemType;
  isCollapsed: boolean;
  depth?: number;
  expandedItems: string[];
  toggleExpanded: (id: string) => void;
  onMouseEnter: (item: NavItemType, position: DOMRect | null) => void;
  onMouseLeave: () => void;
}

export const NavItem = ({
  item,
  isCollapsed,
  depth = 0,
  expandedItems,
  toggleExpanded,
  onMouseEnter,
  onMouseLeave,
}: NavItemProps) => {
  const pathname = usePathname();
  const { isSuperAdmin, role } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const queryClient = useQueryClient();
  const supabase = createClient();

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

  // --- OPTIMIZED PREFETCHING ---
  const prefetchRouteData = useCallback(async () => {
    if (!item.href) return;
    
    const mapping = ROUTE_QUERY_MAP[item.href];
    if (mapping) {
      const { key, tableName } = mapping;
      
      // We perform a partial prefetch
      await queryClient.prefetchQuery({
        queryKey: [`${key}`], 
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_paged_data', {
            p_view_name: tableName!,
            p_limit: 6000, 
            p_offset: 0,
            p_filters: {},
            p_order_by: 'name', // Best guess default sort
          });
          if(error) throw error;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (data as any)?.data || [];
        },
        staleTime: 5 * 60 * 1000 // 5 minutes cache
      });
    }
  }, [item.href, queryClient, supabase]);

  const handleMouseEnterWrapper = () => {
    // 1. Trigger Hover Menu logic immediately (for UI responsiveness)
    if (isCollapsed && hasChildren && itemRef.current) {
      onMouseEnter(item, itemRef.current.getBoundingClientRect());
    }
    
    // 2. Trigger Prefetching with Debounce
    // This prevents firing requests if the user just swipes their mouse across the sidebar
    if (!item.external && item.href) {
        if (prefetchTimeoutRef.current) clearTimeout(prefetchTimeoutRef.current);
        prefetchTimeoutRef.current = setTimeout(() => {
            prefetchRouteData();
        }, 150); // 150ms delay - enough to filter accidental hovers, short enough to feel instant
    }
  };

  const handleMouseLeaveWrapper = () => {
     if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
     }
     onMouseLeave();
  }

  if (!hasPermission(item.roles)) return null;

  const itemContentClasses = cn(
    'group relative flex items-center transition-all duration-200 rounded-xl cursor-pointer overflow-hidden',
    active
      ? 'bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:via-indigo-600 hover:to-cyan-600'
      : 'text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-800 hover:shadow-md border-2 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800',
    isCollapsed
      ? 'justify-center py-1 px-1 mx-0.5 mb-1.5'
      : `justify-between py-1 px-1 mx-0.5 mb-1.5 ${depth > 0 ? 'pl-2' : ''}`,
  );

  const renderContent = () => (
    <>
      <div
        className={cn(
          'flex items-center relative z-10',
          isCollapsed ? 'justify-center' : 'gap-1 min-w-0 flex-1',
        )}
      >
        <div
          className={cn(
            'shrink-0 flex items-center justify-center rounded-xl transition-all duration-200',
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

        {active && !isCollapsed && (
          <motion.div
            className='absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white rounded-r-full shadow-xl'
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
      </div>

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
        ref={itemRef}
        className='relative'
        onMouseEnter={handleMouseEnterWrapper}
        onMouseLeave={handleMouseLeaveWrapper}
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
        ref={itemRef}
        className='relative'
        onMouseEnter={handleMouseEnterWrapper}
        onMouseLeave={handleMouseLeaveWrapper}
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
                <div className='relative ml-1 pl-1 mt-1'>
                  <div className='absolute left-0 top-0 bottom-0 w-0.5 bg-linear-to-b from-blue-400 via-indigo-400 to-blue-400 dark:from-blue-500 dark:via-indigo-500 dark:to-blue-500 rounded-full' />
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
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
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
    <div 
        key={item.id} 
        className='relative'
        onMouseEnter={handleMouseEnterWrapper}
        onMouseLeave={handleMouseLeaveWrapper}
    >
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