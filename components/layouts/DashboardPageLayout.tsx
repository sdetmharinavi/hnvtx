// components/layouts/DashboardPageLayout.tsx
import React, { ReactNode } from 'react';
import { PageHeader, PageHeaderProps } from '@/components/common/page-header';
import { GenericFilterBar, FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { BulkActions } from '@/components/common/BulkActions';
import { DataTable, DataTableProps } from '@/components/table';
import { PublicTableOrViewName, Filters } from '@/hooks/database';
import { UseCrudManagerReturn } from '@/hooks/useCrudManager';
import { ConfirmModal } from '@/components/common/ui';

interface DashboardPageLayoutProps<T extends PublicTableOrViewName> {
  // Header Props
  header: PageHeaderProps;

  // CRUD Props (New)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  crud?: UseCrudManagerReturn<any>;

  // Filter Props
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: Record<string, any>;
  onFilterChange?: (key: string, value: string | null) => void;
  setFilters?: React.Dispatch<React.SetStateAction<Filters>>;
  filterConfigs?: FilterConfig[];

  // View Mode Props
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;

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

  // Allow custom bulk actions rendering
  renderBulkActions?: () => ReactNode;

  // Content Props
  renderGrid?: () => ReactNode;

  // Allow overriding table rendering if not using DataTable
  renderTable?: () => ReactNode;

  // Table Props
  tableProps?: DataTableProps<T>;

  // Empty State Logic
  isEmpty?: boolean;
  emptyState?: ReactNode;

  // Modals slot
  modals?: ReactNode;

  // Automatically render delete modal if crud is provided?
  autoDeleteModal?: boolean;

  // Extra class
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
  filterConfigs = [],
  viewMode,
  onViewModeChange,
  bulkActions,
  renderBulkActions,
  renderGrid,
  renderTable,
  tableProps,
  modals,
  autoDeleteModal = true,
  className = 'p-4 md:p-6 space-y-6',
}: DashboardPageLayoutProps<T>) {
  // --- Auto-Wire Props from CRUD ---
  const effectiveSearchQuery = searchQuery ?? crud?.search.searchQuery ?? '';
  const effectiveOnSearchChange = onSearchChange ?? crud?.search.setSearchQuery ?? (() => {});

  const effectiveFilters = filters ?? crud?.filters.filters ?? {};

  // Default filter change handler if not provided
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

  // Bulk Actions
  const effectiveBulkActions =
    bulkActions ??
    (crud
      ? {
          selectedCount: crud.bulkActions.selectedCount,
          isOperationLoading: crud.isMutating,
          onBulkDelete: crud.bulkActions.handleBulkDelete,
          onBulkUpdateStatus: crud.bulkActions.handleBulkUpdateStatus,
          onClearSelection: crud.bulkActions.handleClearSelection,
          entityName: 'item', // Default
          showStatusUpdate: true,
        }
      : undefined);

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

      {renderBulkActions
        ? renderBulkActions()
        : effectiveBulkActions &&
          effectiveBulkActions.selectedCount > 0 && <BulkActions {...effectiveBulkActions} />}

      {/* Content Rendering */}
      {viewMode === 'grid' && renderGrid ? (
        renderGrid()
      ) : renderTable ? (
        renderTable()
      ) : tableProps ? (
        <DataTable<T> {...tableProps} />
      ) : null}

      {/* Auto-render delete modal if crud provided */}
      {autoDeleteModal && crud && (
        <ConfirmModal
          isOpen={crud.deleteModal.isOpen}
          onConfirm={crud.deleteModal.onConfirm}
          onCancel={crud.deleteModal.onCancel}
          title='Confirm Deletion'
          message={crud.deleteModal.message}
          type='danger'
          loading={crud.deleteModal.loading}
        />
      )}

      {modals}
    </div>
  );
}
