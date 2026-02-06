'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export function Breadcrumbs() {
  const pathname = usePathname();

  // Split path, remove empty strings
  const segments = pathname.split('/').filter(Boolean);

  // Helper to format segment names
  const formatSegment = (segment: string) => {
    // If it looks like a UUID, show "Details" instead of the ugly ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(segment)) return 'Details';

    // Replace hyphens/underscores with spaces and Title Case
    return segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label='Breadcrumb'
      // Changed: Removed 'hidden sm:block', added scrolling handling
      className='mb-2 block w-full overflow-x-auto whitespace-nowrap no-scrollbar mask-linear-fade'>
      <ol className='flex items-center space-x-1 sm:space-x-2 p-1'>
        <li className='shrink-0'>
          <Link
            href='/dashboard'
            className='text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors flex items-center'>
            <Home className='h-4 w-4' />
            <span className='sr-only'>Home</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          // Don't show "Dashboard" text again since we have the Home icon
          if (segment === 'dashboard') return null;

          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const label = formatSegment(segment);

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
                      'text-xs sm:text-sm', // Smaller text on mobile
                    )}>
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className={cn(
                      'font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors',
                      'text-xs sm:text-sm',
                    )}>
                    {label}
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
