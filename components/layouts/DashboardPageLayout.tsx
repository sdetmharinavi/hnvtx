import React, { ReactNode } from 'react';
import { PageHeader, PageHeaderProps } from '@/components/common/page-header';
import { GenericFilterBar, FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { BulkActions } from '@/components/common/BulkActions';
import { DataTable, DataTableProps } from '@/components/table';
import { PublicTableOrViewName, Filters } from '@/hooks/database';

interface DashboardPageLayoutProps<T extends PublicTableOrViewName> {
  // Header Props
  header: PageHeaderProps;

  // Filter Props
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>;
  onFilterChange: (key: string, value: string | null) => void;
  setFilters?: React.Dispatch<React.SetStateAction<Filters>>;
  filterConfigs: FilterConfig[];

  // View Mode Props
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;

  // Bulk Action Props
  bulkActions?: {
    selectedCount: number;
    isOperationLoading: boolean;
    onBulkDelete: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onBulkUpdateStatus: (status: any) => void;
    onClearSelection: () => void;
    entityName: string;
    showStatusUpdate?: boolean;
    canDelete?: () => boolean;
  };

  // Content Props
  renderGrid: () => ReactNode;

  // Table Props
  tableProps: DataTableProps<T>;

  // Empty State Logic
  isEmpty: boolean;
  emptyState?: ReactNode;

  // Modals slot
  modals?: ReactNode;

  // Extra class
  className?: string;
}

export function DashboardPageLayout<T extends PublicTableOrViewName>({
  header,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filters,
  onFilterChange,
  setFilters,
  filterConfigs,
  viewMode,
  onViewModeChange,
  bulkActions,
  renderGrid,
  tableProps,
  isEmpty,
  emptyState,
  modals,
  className = 'p-4 md:p-6 space-y-6',
}: DashboardPageLayoutProps<T>) {
  return (
    <div className={className}>
      <PageHeader {...header} />

      <GenericFilterBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        onFilterChange={onFilterChange}
        setFilters={setFilters}
        filterConfigs={filterConfigs}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      {bulkActions && bulkActions.selectedCount > 0 && <BulkActions {...bulkActions} />}

      {viewMode === 'grid' ? (
        <>
          {renderGrid()}
          {isEmpty && emptyState}
        </>
      ) : (
        <DataTable<T> {...tableProps} />
      )}

      {modals}
    </div>
  );
}
