// app/dashboard/logical-paths/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FiGitBranch, FiTrash2, FiEye } from 'react-icons/fi';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { DataTable } from '@/components/table/DataTable';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';

import { Row, usePagedData } from '@/hooks/database';
import { useDeprovisionPath } from '@/hooks/database/path-mutations';
import { DataQueryHookReturn } from '@/hooks/useCrudManager';
import type { TableAction } from '@/components/table/datatable-types';

import { LogicalPathsTableColumns } from '@/config/table-columns/LogicalPathsTableColumns';
import { V_end_to_end_pathsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/providers/UserProvider';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard';
import { Filters } from '@/hooks/database/queries-type-helpers';

type LogicalPathView = Row<'v_end_to_end_paths'> & { id: string | null };

const useLogicalPathsData = (params: {
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  statusFilter?: string;
}): DataQueryHookReturn<LogicalPathView> => {
  const { currentPage, pageLimit, searchQuery, statusFilter } = params;
  const supabase = createClient();

  const searchFilters = useMemo(() => {
    const filters: Filters = {};

    // FIX: Use standard SQL syntax for the 'or' filter passed to the RPC
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''"); // Basic SQL escape
      // The RPC's build_where_clause expects a string that fits inside `AND (...)`
      const searchString = `path_name ILIKE '%${term}%' OR route_names ILIKE '%${term}%'`;
      filters.or = searchString;
    }

    // Add status filtering
    if (statusFilter) {
      filters.operational_status = statusFilter;
    }

    return filters;
  }, [searchQuery, statusFilter]);

  const { data, isLoading, isFetching, error, refetch } = usePagedData<V_end_to_end_pathsRowSchema>(
    supabase,
    'v_end_to_end_paths',
    {
      filters: searchFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      orderBy: 'path_name',
    },
  );

  const mappedData = useMemo(() => {
    return (data?.data || []).map((path) => ({
      ...path,
      id: path.path_id,
    }));
  }, [data]);

  return {
    data: mappedData,
    totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0,
    inactiveCount: data?.inactive_count || 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

export default function LogicalPathsPage() {
  const router = useRouter();
  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // Local filter state
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    data: logicalPaths,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLogicalPathsData({ currentPage, pageLimit, searchQuery, statusFilter });

  const deprovisionMutation = useDeprovisionPath();

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };
  const hasActiveFilters = !!searchQuery || !!statusFilter;

  const handleDeletePath = useCallback((record: Row<'v_end_to_end_paths'>) => {
    if (!record.path_id) {
      toast.error('Cannot de-provision: Path ID is missing.');
      return;
    }
    setItemToDelete({
      id: record.path_id,
      name: record.path_name || `Path ${record.path_id.slice(0, 8)}`,
    });
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deprovisionMutation.mutate(
        { pathId: itemToDelete.id },
        {
          onSuccess: () => {
            toast.success(`Successfully de-provisioned "${itemToDelete.name}".`);
            setItemToDelete(null);
            setDeleteModalOpen(false);
            refetch();
          },
          onError: (err) => {
            toast.error(`De-provision failed: ${err.message}`);
            setItemToDelete(null);
            setDeleteModalOpen(false);
          },
        },
      );
    }
  };

  const tableActions = useMemo<TableAction<'v_end_to_end_paths'>[]>(() => {
    const actions: TableAction<'v_end_to_end_paths'>[] = [
      {
        key: 'view',
        label: 'View Details',
        icon: <FiEye />,
        onClick: (record) => {
          if (record.source_system_id) {
            router.push(`/dashboard/systems/${record.source_system_id}`);
          } else {
            toast.info('This path does not have a source system assigned.');
          }
        },
        variant: 'secondary',
      },
    ];

    if (canDelete) {
      actions.push({
        key: 'deprovision',
        label: 'De-provision Path',
        icon: <FiTrash2 />,
        onClick: handleDeletePath,
        variant: 'danger',
      });
    }

    return actions;
  }, [canDelete, handleDeletePath, router]);

  const headerActions = useStandardHeaderActions<'v_end_to_end_paths'>({
    data: logicalPaths,
    onRefresh: async () => {
      await refetch();
      toast.success('Logical paths refreshed!');
    },
    isLoading: isLoading,
    isFetching: isFetching,
    exportConfig: canEdit ? { tableName: 'v_end_to_end_paths' } : undefined,
  });

  const headerStats = useMemo<StatProps[]>(() => {
    return [
      {
        value: totalCount,
        label: 'Total Paths',
        onClick: () => setStatusFilter(''),
        isActive: !statusFilter,
      },
      {
        value: null, 
        label: 'Configured',
        color: 'success',
        onClick: () => setStatusFilter('configured'),
        isActive: statusFilter === 'configured',
      },
      {
        value: null,
        label: 'Provisioned',
        color: 'primary',
        onClick: () => setStatusFilter('provisioned'),
        isActive: statusFilter === 'provisioned',
      },
    ];
  }, [totalCount, statusFilter]);

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );
  }

  return (
    <div className='p-6 space-y-6'>
      <PageHeader
        title='Logical Fiber Paths'
        description='View and manage all provisioned end-to-end service paths.'
        icon={<FiGitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      <DataTable<'v_end_to_end_paths'>
        autoHideEmptyColumns={true}
        tableName='v_end_to_end_paths'
        data={logicalPaths}
        columns={LogicalPathsTableColumns(logicalPaths)}
        loading={isLoading}
        isFetching={isFetching || deprovisionMutation.isPending}
        actions={tableActions}
        searchable={false}
        pagination={{
          current: currentPage,
          pageSize: pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
            setCurrentPage(page);
            setPageLimit(limit);
          },
        }}
        customToolbar={
          <SearchAndFilters
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((p) => !p)}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={statusFilter ? 1 : 0}
            searchPlaceholder='Search by path or route name...'
          >
            <div className='flex flex-col gap-1'>
              <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value=''>All</option>
                <option value='configured'>Configured</option>
                <option value='provisioned'>Provisioned</option>
                <option value='unprovisioned'>Unprovisioned</option>
              </select>
            </div>
          </SearchAndFilters>
        }
      />

      <ConfirmModal
        isOpen={canDelete && isDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        title='Confirm De-provisioning'
        message={`Are you sure you want to de-provision "${itemToDelete?.name}"? This will release all associated fibers.`}
        loading={deprovisionMutation.isPending}
        type='danger'
      />
    </div>
  );
}