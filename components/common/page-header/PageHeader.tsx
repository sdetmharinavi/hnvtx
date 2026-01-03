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
          <div className="flex flex-col space-y-3 sm:space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-1 sm:space-y-3 min-w-0">
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-3">
                {icon && (
                  <div className="text-2xl sm:text-3xl text-blue-600 dark:text-blue-400 hidden sm:block">
                    {icon}
                  </div>
                )}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight wrap-break-words">
                  {title}
                </h1>
              </div>
              {description && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-2 shrink-0 ml-4">
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
                  <div key={`desktop-dropdown-${index}`} data-dropdown="true">
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
          </div>

          {/* Stats and Mobile Actions Row */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* 
                MOBILE OPTIMIZATION: 
                - Changed grid-cols-1 to grid-cols-2 for mobile to save vertical space.
                - Added gap-3 for tighter packing on mobile.
            */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 grow">
              {stats?.map((stat) => (
                <StatCard key={stat.label} {...stat} isLoading={isFetching} />
              ))}
            </div>

            {/* 
                MOBILE OPTIMIZATION FOR ACTIONS:
                - Added overflow-x-auto and no-scrollbar to allow horizontal scrolling
                - Removed flex-wrap so buttons stay in one line
            */}
            <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto sm:shrink-0 overflow-x-auto no-scrollbar pb-1">
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

                return isDropdown ? (
                  <DropdownButton
                    key={`mobile-dropdown-${index}`}
                    {...action}
                    className={`shrink-0 ${hideOnMobile ? 'hidden sm:flex' : ''}`}
                    disabled={action.disabled || isLoading}
                  />
                ) : (
                  <Button
                    key={`mobile-action-${index}`}
                    {...btnProps}
                    // Removed flex-1 to prevent weird stretching
                    className={`shrink-0 whitespace-nowrap ${hideOnMobile ? 'hidden sm:flex' : ''}`}
                    disabled={action.disabled || isLoading}
                  >
                    {hideTextOnMobile ? '' : action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
