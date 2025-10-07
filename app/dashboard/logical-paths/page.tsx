// path: app/dashboard/logical-paths/page.tsx
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

// Define the shape for our UI, aliasing path_id to id for compatibility with generic components
type LogicalPathView = Row<'v_end_to_end_paths'> & { id: string | null };

// Data fetching hook remains the same, but we'll use its return value directly
const useLogicalPathsData = (
  params: { currentPage: number; pageLimit: number; searchQuery: string }
): DataQueryHookReturn<LogicalPathView> => {
  const { currentPage, pageLimit, searchQuery } = params;
  const supabase = createClient();

  const searchFilters = useMemo(() => {
    if (!searchQuery) return {};
    return { or: { path_name: searchQuery, route_names: searchQuery } };
  }, [searchQuery]);

  const { data, isLoading, isFetching, error, refetch } = usePagedData<V_end_to_end_pathsRowSchema>(
    supabase,
    'v_end_to_end_paths',
    {
      filters: searchFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      orderBy: 'path_name',
    }
  );

  const mappedData = useMemo(() => {
    return (data?.data || []).map(path => ({
      ...path,
      id: path.path_id,
    }));
  }, [data]);

  return {
    data: mappedData,
    totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0,
    inactiveCount: data?.inactive_count || 0,
    isLoading, isFetching, error, refetch,
  };
};

export default function LogicalPathsPage() {
  const router = useRouter();
  
  // --- MANUAL STATE MANAGEMENT (Replaces useCrudManager) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false); // Kept for consistency, though unused
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    data: logicalPaths, totalCount, activeCount, inactiveCount, isLoading, isFetching, error, refetch
  } = useLogicalPathsData({ currentPage, pageLimit, searchQuery });
  
  const deprovisionMutation = useDeprovisionPath();

  const handleClearFilters = () => setSearchQuery('');
  const hasActiveFilters = !!searchQuery;

  // --- Deletion Logic ---
  const handleDeletePath = useCallback((record: Row<'v_end_to_end_paths'>) => {
    if (!record.path_id) {
      toast.error("Cannot de-provision: Path ID is missing.");
      return;
    }
    setItemToDelete({
      id: record.path_id,
      name: record.path_name || `Path ${record.path_id.slice(0, 8)}`
    });
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deprovisionMutation.mutate({ pathId: itemToDelete.id }, {
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
        }
      });
    }
  };

  const tableActions = useMemo<TableAction<'v_end_to_end_paths'>[]>(() => [
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
    {
      key: 'deprovision',
      label: 'De-provision Path',
      icon: <FiTrash2 />,
      onClick: handleDeletePath,
      variant: 'danger',
    },
  ], [handleDeletePath, router]);

  const headerActions = useStandardHeaderActions<'v_end_to_end_paths'>({
    data: logicalPaths,
    onRefresh: async () => { await refetch(); toast.success('Logical paths refreshed!'); },
    isLoading: isLoading,
    exportConfig: { tableName: 'v_end_to_end_paths' }
  });

  const headerStats = [
    { value: totalCount, label: 'Total Paths' },
    { value: activeCount, label: 'Active' },
    { value: inactiveCount, label: 'Inactive' },
  ];
  
  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Logical Fiber Paths"
        description="View and manage all provisioned end-to-end service paths."
        icon={<FiGitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
      />

      <DataTable<'v_end_to_end_paths'>
        // Provide the view name for column config, but the specific data type for operation
        tableName="v_end_to_end_paths"
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
            onToggleFilters={() => setShowFilters(p => !p)}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={0}
            searchPlaceholder="Search by path or route name..."
          >
            placeholder
          </SearchAndFilters>
        }
      />
      
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        title="Confirm De-provisioning"
        message={`Are you sure you want to de-provision "${itemToDelete?.name}"? This will release all associated fibers.`}
        loading={deprovisionMutation.isPending}
        type="danger"
      />
    </div>
  );
}