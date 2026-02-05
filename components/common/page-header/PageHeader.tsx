'use client';

import React, { ReactNode } from 'react';
import { useViewSettings } from '@/contexts/ViewSettingsContext';
import { cn } from '@/lib/utils';
import { CardSkeleton } from '@/components/common/ui/table/TableSkeleton';
import { StatCard, StatProps } from '@/components/common/page-header/StatCard';
import { ActionButton, DropdownButton } from '@/components/common/page-header/DropdownButton';
import { Button } from '@/components/common/ui';
import { Breadcrumbs } from '@/components/common/ui/Breadcrumbs';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  stats?: StatProps[];
  actions?: ActionButton[];
  isLoading?: boolean;
  isFetching?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  stats,
  actions = [],
  isLoading = false,
  isFetching = false,
  className,
}: PageHeaderProps) {
  const { showHeader } = useViewSettings();

  if (isLoading) {
    return <CardSkeleton showImage={false} lines={2} />;
  }

  return (
    <>
      {showHeader && (
        <div className={cn('space-y-4 sm:space-y-6', className)}>
          <Breadcrumbs />

          {/* Header Section */}
          <div className='flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between lg:gap-4'>
            <div className='flex-1 space-y-2 sm:space-y-3 min-w-0'>
              <div className='flex items-center gap-2 sm:gap-3'>
                {icon && (
                  <div className='text-xl sm:text-2xl md:text-3xl text-blue-600 dark:text-blue-400 shrink-0'>
                    {icon}
                  </div>
                )}
                <h1 className='text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight wrap-break'>
                  {title}
                </h1>
              </div>
              {description && (
                <p className='text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed'>
                  {description}
                </p>
              )}
            </div>

            {/* Desktop Action Buttons */}
            {actions.length > 0 && (
              <div className='hidden lg:flex items-center gap-2 shrink-0'>
                {actions.map((action, index) => {
                  const {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    hideTextOnMobile,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    hideOnMobile,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    priority,
                    'data-dropdown': isDropdown,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    dropdownoptions,
                    ...btnProps
                  } = action;

                  return isDropdown ? (
                    <div key={`desktop-dropdown-${index}`} data-dropdown='true'>
                      <DropdownButton {...action} disabled={action.disabled || isLoading} />
                    </div>
                  ) : (
                    <Button
                      key={`desktop-action-${index}`}
                      {...btnProps}
                      disabled={action.disabled || isLoading}
                    >
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats and Mobile Actions Row */}
          {(stats && stats.length > 0) || actions.length > 0 ? (
            <div className='flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4'>
              {/* Stats Grid */}
              {stats && stats.length > 0 && (
                <div
                  className={cn(
                    'grid gap-3 sm:gap-4 grow',
                    // Responsive grid columns based on number of stats
                    stats.length === 1 && 'grid-cols-1',
                    stats.length === 2 && 'grid-cols-2',
                    stats.length === 3 && 'grid-cols-2 sm:grid-cols-3',
                    stats.length >= 4 && 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
                  )}
                >
                  {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} isLoading={isFetching} />
                  ))}
                </div>
              )}

              {/* Mobile Actions - Horizontal Scroll */}
              {actions.length > 0 && (
                <div className='flex lg:hidden items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0'>
                  <div className='flex items-center gap-2 min-w-min'>
                    {actions.map((action, index) => {
                      const {
                        hideTextOnMobile,
                        hideOnMobile,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        priority,
                        'data-dropdown': isDropdown,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        dropdownoptions,
                        ...btnProps
                      } = action;

                      if (hideOnMobile) {
                        return null;
                      }

                      return isDropdown ? (
                        <DropdownButton
                          key={`mobile-dropdown-${index}`}
                          {...action}
                          className='shrink-0'
                          disabled={action.disabled || isLoading}
                        />
                      ) : (
                        <Button
                          key={`mobile-action-${index}`}
                          {...btnProps}
                          className='shrink-0 whitespace-nowrap'
                          disabled={action.disabled || isLoading}
                        >
                          {hideTextOnMobile ? '' : action.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
