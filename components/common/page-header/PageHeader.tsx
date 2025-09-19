'use client';

import React, { ReactNode } from 'react';
import { Button } from '@/components/common/ui/Button/Button';
import { cn } from '@/lib/utils';
import { CardSkeleton } from '@/components/common/ui/table/TableSkeleton';
import { StatCard, StatProps } from '@/components/common/page-header/StatCard';
import {
  ActionButton,
  DropdownButton,
} from '@/components/common/page-header/DropdownButton';

// --- TYPE DEFINITIONS ---

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  stats?: StatProps[];
  actions?: ActionButton[];
  isLoading?: boolean;
  className?: string;
}

// --- SUB-COMPONENTS ---

// --- MAIN COMPONENT ---

export function PageHeader({
  title,
  description,
  icon,
  stats,
  actions = [],
  isLoading = false,
  className,
}: PageHeaderProps) {
  return (
    <>
      {isLoading ? (
        <CardSkeleton />
      ) : (
        <div
          className={cn(
            'space-y-4 sm:space-y-6',
            isLoading && 'opacity-50',
            className
          )}
        >
          {/* Header Section */}
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-3">
                {icon && (
                  <div className="text-2xl sm:text-3xl text-blue-600 dark:text-blue-400">
                    {icon}
                  </div>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {title}
                </h1>
              </div>
              {description && (
                <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-4">
              {actions.map((action, index) =>
                action['data-dropdown'] ? (
                  <div key={`desktop-dropdown-${index}`} data-dropdown="true">
                    <DropdownButton
                      {...action}
                      disabled={action.disabled || isLoading}
                    />
                  </div>
                ) : (
                  <Button
                    key={`desktop-action-${index}`}
                    {...action}
                    disabled={action.disabled || isLoading}
                  >
                    {action.label}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Stats and Mobile Actions Row */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
              {isLoading
                ? Array.from({ length: stats?.length || 2 }).map((_, i) => (
                    <div
                      key={`stat-skeleton-${i}`}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 animate-pulse"
                    >
                      <div className="h-8 w-1/2 rounded-md bg-gray-200 dark:bg-gray-700 mb-2"></div>
                      <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                  ))
                : stats?.map((stat) => <StatCard key={stat.label} {...stat} />)}
            </div>

            {/* Mobile/Tablet Action Buttons */}
            <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto sm:flex-shrink-0">
              {actions.map((action, index) =>
                action['data-dropdown'] ? (
                  <DropdownButton
                    key={`mobile-dropdown-${index}`}
                    {...action}
                    className={`flex-1 sm:flex-none ${
                      action.hideOnMobile ? 'hidden sm:flex' : ''
                    }`}
                    disabled={action.disabled || isLoading}
                  />
                ) : (
                  <Button
                    key={`mobile-action-${index}`}
                    {...action}
                    className={`flex-1 sm:flex-none ${
                      action.hideOnMobile ? 'hidden sm:flex' : ''
                    }`}
                    disabled={action.disabled || isLoading}
                  >
                    {action.hideTextOnMobile ? '' : action.label}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- HOOK FOR CREATING STANDARD ACTIONS ---
