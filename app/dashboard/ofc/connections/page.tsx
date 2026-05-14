// app/dashboard/ofc/connections/page.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  V_ofc_connections_completeRowSchema,
  Cable_segmentsRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { FiActivity, FiGitCommit } from 'react-icons/fi';
import { useAllOfcConnectionsData } from '@/hooks/data/useAllOfcConnectionsData';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import dynamic from 'next/dynamic';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { StatProps } from '@/components/common/page-header/StatCard';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';

const FiberTraceModal = dynamic(
  () => import('@/components/ofc-details/FiberTraceModal').then((mod) => mod.FiberTraceModal),
  { ssr: false, loading: () => <PageSpinner /> },
);

export default function GlobalOfcConnectionsPage() {
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [tracingFiber, setTracingFiber] = useState<{
    segments: Cable_segmentsRowSchema[];
    record: V_ofc_connections_completeRowSchema;
  } | null>(null);

  const crud = useCrudManager<'ofc_connections', V_ofc_connections_completeRowSchema>({
    tableName: 'ofc_connections',
    localTableName: 'v_ofc_connections_complete',
    dataQueryHook: useAllOfcConnectionsData,
    displayNameField: 'ofc_route_name',
    searchColumn: ['ofc_route_name', 'system_name'],
    syncTables: ['ofc_connections', 'v_ofc_connections_complete', 'ofc_cables', 'cable_segments'],
  });

  const {
    data: fibers,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
  } = crud;

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const handleTraceClick = useCallback(
    async (record: V_ofc_connections_completeRowSchema) => {
      if (!record.ofc_id || record.fiber_no_sn === null) {
        toast.error('Invalid fiber data for tracing.');
        return;
      }
      try {
        const { data, error: segmentError } = await supabase
          .from('cable_segments')
          .select('*')
          .eq('original_cable_id', record.ofc_id)
          .order('segment_order', { ascending: true });
        if (segmentError) throw segmentError;
        setTracingFiber({ segments: data || [], record });
      } catch (err) {
        console.error('Trace error', err);
        toast.error('Failed to prepare trace data.');
      } finally {
      }
    },
    [supabase],
  );

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'native-select',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
    ],
    [],
  );

  const columns = OfcDetailsTableColumns(fibers).map((c) => ({ ...c, editable: false })); // Enforce read-only
  const orderedColumns = useOrderedColumns(columns, [
    'ofc_route_name',
    'fiber_no_sn',
    ...TABLE_COLUMN_KEYS.v_ofc_connections_complete,
  ]);

  const tableActions: TableAction<'v_ofc_connections_complete'>[] = useMemo(
    () => [
      {
        key: 'trace',
        label: 'Trace Path',
        icon: <FiGitCommit className='w-4 h-4' />,
        onClick: (record) => handleTraceClick(record as V_ofc_connections_completeRowSchema),
        variant: 'secondary',
      },
    ],
    [handleTraceClick],
  );

  const headerActions = useStandardHeaderActions({
    data: fibers,
    onRefresh: async () => {
      refetch();
      toast.success('Sync triggered!');
    },
    isLoading,
    isFetching,
    exportConfig: {
      tableName: 'v_ofc_connections_complete',
      fileName: 'All_Physical_Fibers',
      useRpc: true,
      orderBy: [{ column: 'ofc_route_name' }, { column: 'fiber_no_sn' }],
      maxRows: 50000,
    },
  });

  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;
    return [
      {
        value: totalCount,
        label: 'Total Fibers',
        color: 'default',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: 'Active',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Inactive/Faulty',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <DashboardPageLayout
      header={{
        title: 'Global Fiber Connections',
        description: 'Read-only view of all physical fiber connections.',
        icon: <FiActivity />,
        stats: headerStats,
        actions: headerActions,
        isLoading: isLoading && fibers.length === 0,
        isFetching: isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search by route, system, or node...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      tableProps={{
        tableName: 'v_ofc_connections_complete',
        data: fibers,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching,
        actions: tableActions,
        searchable: false,
        selectable: false, // Read only
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (p, s) => {
            pagination.setCurrentPage(p);
            pagination.setPageLimit(s);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={fibers.length === 0 && !isLoading}
      modals={
        tracingFiber && (
          <FiberTraceModal
            isOpen={!!tracingFiber}
            onClose={() => setTracingFiber(null)}
            segments={tracingFiber.segments}
            fiberNoSn={tracingFiber.record.fiber_no_sn}
            fiberNoEn={tracingFiber.record.fiber_no_en}
            allCables={undefined}
            record={tracingFiber.record}
            refetch={refetch}
            cableName={tracingFiber.record.ofc_route_name || undefined}
          />
        )
      }
    />
  );
}
