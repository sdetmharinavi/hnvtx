// app/dashboard/logical-paths/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FiGitBranch, FiTrash2, FiEye, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { DataTable } from '@/components/table/DataTable';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';

import { Row, usePagedData } from '@/hooks/database';
import { useDeprovisionPath, useUpdatePathStatus } from '@/hooks/database/path-mutations';
import { DataQueryHookReturn } from '@/hooks/useCrudManager';
import type { TableAction } from '@/components/table/datatable-types';

import { LogicalPathsTableColumns } from '@/config/table-columns/LogicalPathsTableColumns';
import { V_end_to_end_pathsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@/providers/UserProvider';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard';
import { Filters } from '@/hooks/database/queries-type-helpers';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

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

    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      const searchString = `path_name ILIKE '%${term}%' OR route_names ILIKE '%${term}%'`;
      filters.or = searchString;
    }

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

// IMPROVED STATS HOOK
const usePathStats = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: ['logical-path-stats'],
    queryFn: async () => {
      // Use RPC to group by operational_status and count
      const { data, error } = await supabase.rpc('aggregate_query', {
        table_name: 'v_end_to_end_paths',
        aggregation_options: {
          count: true,
          groupBy: ['operational_status'],
        },
        filters: {}, // No filters, get global stats
      });

      if (error) {
        console.error('Stats fetch error:', error);
        return { active: 0, provisioned: 0 };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data as any) || [];

      // Logic to bucket various status strings into 'Active' or 'Provisioned'
      // This matches the visual logic of StatusBadge more closely
      let activeCount = 0;
      let provisionedCount = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.forEach((row: any) => {
        const status = (row.operational_status || '').toLowerCase().trim();
        const count = Number(row.count || 0);

        // Define what counts as "Active"
        if (['active', 'ready', 'on-air', 'live', 'working', 'issued'].includes(status)) {
          activeCount += count;
        } 
        // Define what counts as "Provisioned" (Planned/Inactive but configured)
        else {
          provisionedCount += count;
        }
      });

      return {
        active: activeCount,
        provisioned: provisionedCount,
      };
    },
    staleTime: 60 * 1000,
  });
};

export default function LogicalPathsPage() {
  const router = useRouter();
  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const { sync, isSyncing } = useDataSync();
  const isOnline = useOnlineStatus();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
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

  const { data: stats, refetch: refetchStats } = usePathStats(); // Refetch stats on mutation

  const deprovisionMutation = useDeprovisionPath();
  const statusMutation = useUpdatePathStatus(); 

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

  const handleToggleStatus = useCallback((record: Row<'v_end_to_end_paths'>) => {
    if (!record.path_id) return;
    
    const currentStatus = record.operational_status || 'Provisioned';
    const newStatus = currentStatus === 'Active' ? 'Provisioned' : 'Active';
    
    statusMutation.mutate({ pathId: record.path_id, status: newStatus }, {
      onSuccess: () => {
        refetch();
        refetchStats();
      }
    });
  }, [statusMutation, refetch, refetchStats]);

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
            refetchStats();
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

    if (canEdit) {
      actions.push({
        key: 'toggle_status',
        label: 'Toggle Active',
        getIcon: (record) => record.operational_status === 'Active' ? <FiXCircle className="text-orange-600" /> : <FiCheckCircle className="text-green-600" />,
        onClick: handleToggleStatus,
        variant: 'secondary',
        disabled: (record) => !['Active', 'Provisioned'].includes(record.operational_status || 'Provisioned')
      });
    }

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
  }, [canDelete, canEdit, handleDeletePath, handleToggleStatus, router]);

  const isBusy = isLoading || isFetching || isSyncing || statusMutation.isPending;

  const headerActions = useStandardHeaderActions<'v_end_to_end_paths'>({
    data: logicalPaths,
    onRefresh: async () => {
      if (isOnline) {
        await sync([
          'logical_paths',
          'logical_path_segments',
          'logical_fiber_paths',
          'v_end_to_end_paths',
        ]);
        refetch();
        refetchStats();
      } else {
        refetch();
      }
      toast.success('Logical paths refreshed!');
    },
    isLoading: isBusy,
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
        value: stats?.active ?? '-',
        label: 'Active (Live)',
        color: 'success',
        onClick: () => setStatusFilter('Active'),
        isActive: statusFilter === 'Active',
      },
      {
        value: stats?.provisioned ?? '-',
        label: 'Provisioned (Planned)',
        color: 'primary',
        onClick: () => setStatusFilter('Provisioned'),
        isActive: statusFilter === 'Provisioned',
      },
    ];
  }, [totalCount, statusFilter, stats]);

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
        isFetching={isBusy}
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
                <option value='Active'>Active</option>
                <option value='Provisioned'>Provisioned</option>
                <option value='Faulty'>Faulty</option>
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