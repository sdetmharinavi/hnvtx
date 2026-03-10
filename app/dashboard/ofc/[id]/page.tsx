// app/dashboard/ofc/[id]/page.tsx
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PageSpinner } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { Row, usePagedData, useTableQuery } from '@/hooks/database';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useCrudManager } from '@/hooks/useCrudManager';
import { createStandardActions } from '@/components/table/action-helpers';
import { GitBranch, GitCommit, RefreshCw } from 'lucide-react';
import { useRouteDetails } from '@/hooks/database/route-manager-hooks';
import CableNotFound from '@/components/ofc-details/CableNotFound';
import OfcDetailsHeader from '@/components/ofc-details/OfcDetailsHeader';
import { toast } from 'sonner';
import {
  V_ofc_cables_completeRowSchema,
  V_ofc_connections_completeRowSchema,
  V_cable_utilizationRowSchema,
  Cable_segmentsRowSchema,
} from '@/schemas/zod-schemas';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { StatProps } from '@/components/common/page-header/StatCard';
import { useOfcConnectionsData } from '@/hooks/data/useOfcConnectionsData';
import { FiberConnectionCard } from '@/components/ofc-details/FiberConnectionCard';
import { FancyEmptyState } from '@/components/common/ui/FancyEmptyState';
import { FilterConfig, GenericFilterBar } from '@/components/common/filters/GenericFilterBar';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import dynamic from 'next/dynamic';
import { Button } from '@/components/common/ui';

const FiberTraceModal = dynamic(
  () => import('@/components/ofc-details/FiberTraceModal').then((mod) => mod.FiberTraceModal),
  { ssr: false, loading: () => <PageSpinner /> },
);

type ExtendedUtilization = V_cable_utilizationRowSchema & {
  faulty_fibers?: number;
  healthy_utilization_percent?: number;
};

export default function OfcCableDetailsPage() {
  const { id: cableId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const[viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const[hasInitializedView, setHasInitializedView] = useState(false);

  const [tracingFiber, setTracingFiber] = useState<{
    record: V_ofc_connections_completeRowSchema;
  } | null>(null);

  const {
    data: cableConnectionsData,
    isLoading,
    isFetching,
    refetch,
    pagination,
    search,
    filters,
  } = useCrudManager<'ofc_connections', V_ofc_connections_completeRowSchema>({
    tableName: 'ofc_connections',
    localTableName: 'v_ofc_connections_complete',
    dataQueryHook: useOfcConnectionsData(cableId as string),
    displayNameField: ['system_name', 'ofc_route_name'],
  });

  const filterConfigs = useMemo<FilterConfig[]>(
    () =>[
      {
        key: 'allocation_status',
        label: 'Allocation',
        type: 'native-select',
        placeholder: 'All Statuses',
        options:[
          { value: 'available', label: 'Spare (Available)' },
          { value: 'allocated', label: 'Utilized' },
          { value: 'faulty', label: 'Faulty' },
        ],
      },
      {
        key: 'status',
        label: 'Status',
        type: 'native-select',
        placeholder: 'All Active/Inactive',
        options:[
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
    ],[],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const {
    data: routeDetails,
    isLoading: isLoadingRouteDetails,
    isError: isRouteDetailsError,
  } = useRouteDetails(cableId as string);

  const { data: utilResult, isLoading: isLoadingUtil } = usePagedData<V_cable_utilizationRowSchema>(
    supabase,
    'v_cable_utilization',
    {
      filters: { cable_id: cableId as string },
      limit: 1,
    },
  );
  const utilization = utilResult?.data?.[0] as ExtendedUtilization | undefined;

  const { data: cableSegmentsResult } = useTableQuery(supabase, 'cable_segments', {
    filters: { original_cable_id: cableId as string },
    orderBy:[{ column: 'segment_order', ascending: true }],
    enabled: !!cableId,
  });
  const cableSegments = cableSegmentsResult?.data ||[];

  useEffect(() => {
    if (!isLoading && cableConnectionsData.length > 0 && !hasInitializedView) {
      const smartMode = cableConnectionsData.length > 12 ? 'table' : 'grid';
      setViewMode(smartMode);
      setHasInitializedView(true);
    }
  }, [isLoading, cableConnectionsData.length, hasInitializedView]);

  const handleTraceClick = useCallback((record: V_ofc_connections_completeRowSchema) => {
    setTracingFiber({ record });
  },[]);

  const getCardActions = useCallback(
    (record: V_ofc_connections_completeRowSchema) => {
      return (
        <div className='w-full flex justify-end'>
          <Button
            size='xs'
            variant='outline'
            onClick={() => handleTraceClick(record)}
            title='Trace Path'
          >
            <GitCommit className='w-4 h-4 mr-1' /> Trace
          </Button>
        </div>
      );
    },
    [handleTraceClick],
  );

  // Disable cell editing globally
  const columns = OfcDetailsTableColumns(cableConnectionsData).map(col => ({ ...col, editable: false }));
  const orderedColumns = useOrderedColumns(columns,[
    ...TABLE_COLUMN_KEYS.v_ofc_connections_complete,
  ]);

  const tableActions = useMemo(
    () =>[
      {
        key: 'trace',
        label: 'Trace Path',
        icon: <GitCommit className='h-4 w-4' />,
        onClick: handleTraceClick,
        variant: 'secondary' as const,
      },
      ...createStandardActions({}),
    ],
    [handleTraceClick],
  );

  const headerActions = useStandardHeaderActions({
    data: cableConnectionsData as V_ofc_connections_completeRowSchema[],
    onRefresh: async () => {
      await refetch();
      toast.success('Connections refreshed!');
    },
    isLoading: isLoading,
    isFetching: isFetching,
    exportConfig: {
      tableName: 'v_ofc_connections_complete',
      fileName: `${routeDetails?.route.route_name}_fibers`,
      useRpc: true,
      filters: { ofc_id: cableId as string },
      orderBy:[{ column: 'fiber_no_sn', ascending: true }],
    },
  });

  const headerStats: StatProps[] = useMemo(() => {
    const utilPercent = utilization?.utilization_percent ?? 0;
    const healthyUtilPercent = utilization?.healthy_utilization_percent ?? 0;

    return[
      { value: utilization?.capacity ?? 0, label: 'Total Capacity', color: 'default' },
      { value: utilization?.used_fibers ?? 0, label: 'Utilized', color: 'primary' },
      { value: utilization?.available_fibers ?? 0, label: 'Available', color: 'success' },
      {
        value: `${utilPercent}%`,
        label: 'Utilization',
        color: utilPercent > 80 ? 'warning' : 'default',
      },
      {
        value: `${healthyUtilPercent}%`,
        label: 'Healthy Fiber Utilization',
        color: healthyUtilPercent > 80 ? 'warning' : 'default',
      },
    ];
  }, [utilization]);

  const renderMobileItem = useCallback(
    (record: Row<'v_ofc_connections_complete'>, actions: React.ReactNode) => {
      return (
        <FiberConnectionCard
          fiber={record as V_ofc_connections_completeRowSchema}
          actions={actions}
        />
      );
    },[],
  );

  if (isLoading || isLoadingRouteDetails || isLoadingUtil) return <PageSpinner />;

  if (isRouteDetailsError || !routeDetails?.route) {
    return (
      <CableNotFound
        id={cableId as string}
        handleBackToOfcList={() => router.push('/dashboard/ofc')}
        isBackClicked={false}
      />
    );
  }

  return (
    <div className='mx-auto space-y-6 p-4 md:p-6'>
      <PageHeader
        title='Fiber Details Viewer'
        description={`Viewing connections for route: ${routeDetails.route.route_name}`}
        icon={<GitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
      />

      <OfcDetailsHeader cable={routeDetails.route as V_ofc_cables_completeRowSchema} />

      <GenericFilterBar
        searchQuery={search.searchQuery}
        onSearchChange={search.setSearchQuery}
        searchPlaceholder='Search fibers, systems...'
        filters={filters.filters}
        onFilterChange={handleFilterChange}
        filterConfigs={filterConfigs}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className='rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800'>
        {viewMode === 'grid' ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {cableConnectionsData.map((fiber) => (
              <FiberConnectionCard key={fiber.id} fiber={fiber} actions={getCardActions(fiber)} />
            ))}
            {cableConnectionsData.length === 0 && !isLoading && (
              <div className='col-span-full'>
                <FancyEmptyState
                  title='No fibers found'
                  description='Adjust filters to see results'
                />
              </div>
            )}
          </div>
        ) : (
          <DataTable<'v_ofc_connections_complete'>
            autoHideEmptyColumns={true}
            tableName='v_ofc_connections_complete'
            data={cableConnectionsData as Row<'v_ofc_connections_complete'>[]}
            columns={orderedColumns}
            loading={isLoading}
            isFetching={isFetching}
            actions={tableActions}
            selectable={false}
            searchable={false}
            customToolbar={<></>}
            renderMobileItem={renderMobileItem}
            pagination={{
              current: pagination.currentPage,
              pageSize: pagination.pageLimit,
              total: utilization?.capacity ?? 0,
              showSizeChanger: true,
              onChange: (page, limit) => {
                pagination.setCurrentPage(page);
                pagination.setPageLimit(limit);
              },
            }}
          />
        )}
      </div>

      {tracingFiber && (
        <FiberTraceModal
          isOpen={!!tracingFiber}
          onClose={() => setTracingFiber(null)}
          segments={cableSegments}
          fiberNoSn={tracingFiber.record.fiber_no_sn}
          fiberNoEn={tracingFiber.record.fiber_no_en}
          allCables={undefined} 
          record={tracingFiber.record}
          refetch={refetch}
          cableName={tracingFiber.record.ofc_route_name || undefined}
        />
      )}
    </div>
  );
}