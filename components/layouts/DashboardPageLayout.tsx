// components/layouts/DashboardPageLayout.tsx
import React, { ReactNode } from 'react';
import { PageHeader, PageHeaderProps } from '@/components/common/page-header';
import { GenericFilterBar, FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { DataTable, DataTableProps } from '@/components/table';
import { PublicTableOrViewName, Filters } from '@/hooks/database';
import { UseCrudManagerReturn } from '@/hooks/useCrudManager';

interface DashboardPageLayoutProps<T extends PublicTableOrViewName> {
  header: PageHeaderProps;
  crud?: UseCrudManagerReturn<any>;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Record<string, any>;
  onFilterChange?: (key: string, value: string | null) => void;
  setFilters?: React.Dispatch<React.SetStateAction<Filters>>;
  filterConfigs?: FilterConfig[];
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;
  renderGrid?: () => ReactNode;
  renderTable?: () => ReactNode;
  tableProps?: DataTableProps<T>;
  isEmpty?: boolean;
  emptyState?: ReactNode;
  modals?: ReactNode; // Kept for 'View Details' modals
  className?: string;
}

export function DashboardPageLayout<T extends PublicTableOrViewName>({
  header,
  crud,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filters,
  onFilterChange,
  setFilters,
  filterConfigs =[],
  viewMode,
  onViewModeChange,
  renderGrid,
  renderTable,
  tableProps,
  modals,
  className = 'p-4 md:p-6 space-y-6',
}: DashboardPageLayoutProps<T>) {
  const effectiveSearchQuery = searchQuery ?? crud?.search.searchQuery ?? '';
  const effectiveOnSearchChange = onSearchChange ?? crud?.search.setSearchQuery ?? (() => {});
  const effectiveFilters = filters ?? crud?.filters.filters ?? {};
  
  const effectiveOnFilterChange =
    onFilterChange ??
    ((key: string, value: string | null) => {
      crud?.filters.setFilters((prev) => {
        const next = { ...prev };
        if (value === null || value === '') delete next[key];
        else next[key] = value;
        return next;
      });
    });

  const effectiveSetFilters = setFilters ?? crud?.filters.setFilters;

  return (
    <div className={className}>
      <PageHeader {...header} />

      <GenericFilterBar
        searchQuery={effectiveSearchQuery}
        onSearchChange={effectiveOnSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={effectiveFilters}
        onFilterChange={effectiveOnFilterChange}
        setFilters={effectiveSetFilters}
        filterConfigs={filterConfigs}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      {viewMode === 'grid' && renderGrid ? (
        renderGrid()
      ) : renderTable ? (
        renderTable()
      ) : tableProps ? (
        <DataTable<T> {...tableProps} />
      ) : null}

      {modals}
    </div>
  );
}