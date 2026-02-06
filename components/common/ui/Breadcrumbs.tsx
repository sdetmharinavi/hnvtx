'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Row, PublicTableOrViewName } from '@/hooks/database';

// Map URL segments to the view/table names used in query keys
const segmentToEntityMap: Record<string, PublicTableOrViewName> = {
  systems: 'v_systems_complete',
  ofc: 'v_ofc_cables_complete',
  rings: 'v_rings',
  'e-files': 'v_e_files_extended',
  employees: 'v_employees',
  nodes: 'v_nodes_complete',
  services: 'v_services',
  inventory: 'v_inventory_items',
  'ring-paths': 'logical_paths',
  'route-manager': 'v_ofc_cables_complete',
  // ... add more as needed
};

// Map entity names to potential "name" fields in the data
const entityToNameFieldMap: Record<string, string[]> = {
  v_systems_complete: ['system_name', 'name'],
  v_ofc_cables_complete: ['route_name', 'name'],
  v_rings: ['name'],
  v_e_files_extended: ['subject', 'file_number'],
  v_employees: ['employee_name'],
  v_nodes_complete: ['name'],
  v_services: ['name'],
  v_inventory_items: ['name'],
  logical_paths: ['name'],
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ResolvedSegment = ({
  segment,
  prevSegment,
}: {
  segment: string;
  prevSegment: string | null;
}) => {
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    if (!uuidRegex.test(segment) || !prevSegment) {
      setResolvedName(null); // Not a UUID or no context, so nothing to resolve.
      return;
    }

    const entity = segmentToEntityMap[prevSegment];
    if (!entity) return;

    // More robust cache search logic
    const findNameInCache = () => {
      // Find all queries that start with the entity's base query key.
      // This is a "prefix" search and is very flexible.
      const queries = queryClient.getQueryCache().findAll({
        queryKey: [`${entity}-data`],
        fetchStatus: 'idle', // Only look in successful, non-fetching queries
      });

      // Also check for single-record RPC queries
      const rpcQueries = queryClient.getQueryCache().findAll({
        queryKey: ['rpc-record', entity, segment],
      });

      const allQueries = [...queries, ...rpcQueries];

      for (const query of allQueries) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const queryData: any = query.state.data;
        if (!queryData) continue;

        let dataArray: Row<typeof entity>[] = [];

        // Check if data is in a paged result format or a direct array/object
        if (queryData.data && Array.isArray(queryData.data)) {
          dataArray = queryData.data; // e.g., from useCrudManager
        } else if (Array.isArray(queryData)) {
          dataArray = queryData; // e.g., from a direct useQuery
        } else if (typeof queryData === 'object' && queryData.id === segment) {
          dataArray = [queryData]; // It's the single object we're looking for
        }

        // Search within the data array for our ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = dataArray.find((d: any) => d.id === segment);

        if (item) {
          const nameFields = entityToNameFieldMap[entity] || ['name'];
          for (const field of nameFields) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const name = (item as any)[field];
            if (name && typeof name === 'string') {
              if (isMounted) setResolvedName(name);
              return name; // Found it, exit.
            }
          }
        }
      }
      return null; // Not found in any cache
    };

    const name = findNameInCache();
    if (!name && isMounted) {
      setResolvedName(null); // Explicitly set to null if not found
    }

    return () => {
      isMounted = false;
    };
  }, [segment, prevSegment, queryClient]);

  const formatSegment = (s: string) => {
    return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const label = resolvedName || (uuidRegex.test(segment) ? 'Details' : formatSegment(segment));

  return <span>{label}</span>;
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label='Breadcrumb'
      className='mb-2 block w-full overflow-x-auto whitespace-nowrap no-scrollbar mask-linear-fade'
    >
      <ol className='flex items-center space-x-1 sm:space-x-2 p-1'>
        <li className='shrink-0'>
          <Link
            href='/dashboard'
            className='text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors flex items-center'
          >
            <Home className='h-4 w-4' />
            <span className='sr-only'>Home</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          if (segment === 'dashboard') return null;

          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const prevSegment = index > 0 ? segments[index - 1] : null;

          return (
            <Fragment key={href}>
              <li className='shrink-0 text-gray-300 dark:text-gray-600'>
                <ChevronRight className='h-3 w-3 sm:h-4 sm:w-4' />
              </li>
              <li className='shrink-0 last:pr-4'>
                {isLast ? (
                  <span
                    className={cn(
                      'font-semibold text-gray-800 dark:text-gray-200 cursor-default',
                      'text-xs sm:text-sm',
                    )}
                  >
                    <ResolvedSegment segment={segment} prevSegment={prevSegment} />
                  </span>
                ) : (
                  <Link
                    href={href}
                    className={cn(
                      'font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors',
                      'text-xs sm:text-sm',
                    )}
                  >
                    <ResolvedSegment segment={segment} prevSegment={prevSegment} />
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
