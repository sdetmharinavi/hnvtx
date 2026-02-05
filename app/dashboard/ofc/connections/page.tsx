// app/dashboard/ofc/connections/page.tsx
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  V_ofc_connections_completeRowSchema,
  Cable_segmentsRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildUploadConfig, TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { FiActivity, FiUpload, FiGitCommit } from 'react-icons/fi';
import { useAllOfcConnectionsData } from '@/hooks/data/useAllOfcConnectionsData';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import { useOfcConnectionsExcelUpload } from '@/hooks/database/excel-queries/useOfcConnectionsExcelUpload';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { EnhancedUploadResult, Filters } from '@/hooks/database';
import { UploadResultModal } from '@/components/common/ui/UploadResultModal';
import { FiberTraceModal } from '@/components/ofc-details/FiberTraceModal';
import { FilterConfig, GenericFilterBar } from '@/components/common/filters/GenericFilterBar';
import { StatProps } from '@/components/common/page-header/StatCard'; // Added

export default function GlobalOfcConnectionsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSuperAdmin, role } = useUser();

  const canEdit =
    !!isSuperAdmin ||
    [UserRole.ADMIN, UserRole.ADMINPRO, UserRole.ASSETADMIN].includes(role as UserRole);

  const [filters, setFilters] = useState<Filters>({});
  // const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // -- UPDATED STATE FOR TRACING --
  const [tracingFiber, setTracingFiber] = useState<{
    segments: Cable_segmentsRowSchema[];
    record: V_ofc_connections_completeRowSchema;
  } | null>(null);

  const [isTracing, setIsTracing] = useState(false);

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
  } = useCrudManager<'ofc_connections', V_ofc_connections_completeRowSchema>({
    tableName: 'ofc_connections',
    localTableName: 'v_ofc_connections_complete',
    dataQueryHook: useAllOfcConnectionsData,
    displayNameField: 'ofc_route_name',
    searchColumn: ['ofc_route_name', 'system_name'],
    syncTables: ['ofc_connections', 'v_ofc_connections_complete', 'ofc_cables', 'cable_segments'],
  });

  // --- FILTER CONFIG ---
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

  const handleFilterChange = useCallback((key: string, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const [uploadResult, setUploadResult] = useState<EnhancedUploadResult | null>(null);
  const [isUploadResultOpen, setIsUploadResultOpen] = useState(false);

  const { mutate: uploadFibers, isPending: isUploading } = useOfcConnectionsExcelUpload(supabase, {
    showToasts: false,
    onSuccess: (result) => {
      setUploadResult(result);
      setIsUploadResultOpen(true);
      if (result.successCount > 0) refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const uploadConfig = buildUploadConfig('v_ofc_connections_complete');
        uploadFibers({ file, columns: uploadConfig.columnMapping });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadFibers],
  );

  // -- UPDATED TRACE HANDLER --
  const handleTraceClick = useCallback(
    async (record: V_ofc_connections_completeRowSchema) => {
      if (!record.ofc_id || !record.fiber_no_sn) {
        toast.error('Invalid fiber data for tracing.');
        return;
      }

      setIsTracing(true);
      try {
        // Fetch ALL segments for this cable to allow the modal to determine start/end points
        const { data, error } = await supabase
          .from('cable_segments')
          .select('*')
          .eq('original_cable_id', record.ofc_id)
          .order('segment_order', { ascending: true });

        if (error) {
          console.error('Error fetching segments:', error);
          toast.error('Could not initiate trace: Segment data fetch failed.');
          return;
        }

        if (data && data.length > 0) {
          setTracingFiber({
            segments: data,
            record: record,
          });
        } else {
          toast.error('No segments found for this cable.');
        }
      } catch (err) {
        console.error(err);
        toast.error('An error occurred while initiating trace.');
      } finally {
        setIsTracing(false);
      }
    },
    [supabase],
  );

  const columns = OfcDetailsTableColumns(fibers);
  const orderedColumns = useOrderedColumns(columns, [
    'ofc_route_name',
    'fiber_no_sn',
    ...TABLE_COLUMN_KEYS.v_ofc_connections_complete,
  ]);

  const tableActions = [
    {
      key: 'trace',
      label: 'Trace Path',
      icon: <FiGitCommit className='w-4 h-4' />,
      onClick: handleTraceClick,
      variant: 'secondary' as const,
    },
  ];

  const headerActions = useStandardHeaderActions({
    data: fibers,
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed!');
    },
    isLoading,
    isFetching,
    exportConfig: canEdit
      ? {
          tableName: 'v_ofc_connections_complete',
          fileName: 'All_Physical_Fibers',
          useRpc: true,
          orderBy: [{ column: 'ofc_route_name', ascending: true }],
          maxRows: 50000,
        }
      : undefined,
  });

  if (canEdit) {
    headerActions.splice(1, 0, {
      label: isUploading ? 'Uploading...' : 'Upload Data',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoading,
      hideTextOnMobile: true,
    });
  }

  // --- INTERACTIVE STATS ---
  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.status;

    return [
      {
        value: totalCount,
        label: 'Total Fibers',
        color: 'default',
        onClick: () =>
          setFilters((prev) => {
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
        onClick: () => setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Inactive/Faulty',
        color: 'danger',
        onClick: () => setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
  }, [totalCount, activeCount, inactiveCount, filters.status]);

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <div className='p-4 md:p-6 space-y-6'>
      {/* Overlay spinner when initializing trace */}
      {isTracing && (
        <div className='fixed inset-0 bg-black/20 z-9999 flex items-center justify-center backdrop-blur-[1px]'>
          <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-3'>
            <PageSpinner text='Preparing Trace...' />
          </div>
        </div>
      )}

      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileChange}
        className='hidden'
        accept='.xlsx, .xls, .csv'
      />

      <UploadResultModal
        isOpen={isUploadResultOpen}
        onClose={() => setIsUploadResultOpen(false)}
        result={uploadResult}
        title='Fiber Connections Upload Report'
      />

      <PageHeader
        title='Physical Fiber Inventory'
        description='Search, export, and manage physical fiber properties across all cables.'
        icon={<FiActivity />}
        stats={headerStats} // Interactive
        actions={headerActions}
        isLoading={isLoading && fibers.length === 0}
        isFetching={isFetching}
      />

      <GenericFilterBar
        searchQuery={search.searchQuery}
        onSearchChange={search.setSearchQuery}
        searchPlaceholder='Search route, system, node...'
        filters={filters}
        onFilterChange={handleFilterChange}
        filterConfigs={filterConfigs}
        viewMode='table'
      />

      <DataTable
        autoHideEmptyColumns={true}
        tableName='v_ofc_connections_complete'
        data={fibers}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching}
        actions={tableActions}
        searchable={false}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (p, s) => {
            pagination.setCurrentPage(p);
            pagination.setPageLimit(s);
          },
        }}
        customToolbar={<></>}
      />

      {/* Trace Modal - UPDATED PROPS */}
      {tracingFiber && (
        <FiberTraceModal
          isOpen={!!tracingFiber}
          onClose={() => setTracingFiber(null)}
          segments={tracingFiber.segments}
          fiberNoSn={tracingFiber.record.fiber_no_sn}
          fiberNoEn={tracingFiber.record.fiber_no_en}
          // We pass undefined for allCables as we don't have the full list here,
          // and the visualizer will use the record data where possible
          allCables={undefined}
          record={tracingFiber.record}
          refetch={refetch}
          cableName={tracingFiber.record.ofc_route_name || undefined}
        />
      )}
    </div>
  );
}
