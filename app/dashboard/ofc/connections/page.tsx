// app/dashboard/ofc/connections/page.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay, DebouncedInput, PageSpinner } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildUploadConfig, TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { FiActivity, FiUpload, FiList, FiSearch, FiGitCommit } from 'react-icons/fi'; // Added FiGitCommit
import { useAllOfcConnectionsData } from '@/hooks/data/useAllOfcConnectionsData';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { useOfcConnectionsExcelUpload } from '@/hooks/database/excel-queries/useOfcConnectionsExcelUpload';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { EnhancedUploadResult, Filters } from '@/hooks/database';
import { UploadResultModal } from '@/components/common/ui/UploadResultModal';
import { FiberTraceModal } from '@/components/ofc-details/FiberTraceModal'; // Added Import

export default function GlobalOfcConnectionsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSuperAdmin, role } = useUser();

  const canEdit =
    !!isSuperAdmin ||
    [UserRole.ADMIN, UserRole.ADMINPRO, UserRole.ASSETADMIN].includes(role as UserRole);

  const [filters, setFilters] = useState<Filters>({});
  
  // -- NEW STATE FOR TRACING --
  const [tracingFiber, setTracingFiber] = useState<{
    startSegmentId: string;
    fiberNo: number;
    record?: V_ofc_connections_completeRowSchema;
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
    syncTables: ['ofc_connections', 'v_ofc_connections_complete', 'ofc_cables', 'cable_segments'], // Added cable_segments for tracing
  });

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
    [uploadFibers]
  );

  // -- NEW TRACE HANDLER --
  const handleTraceClick = useCallback(async (record: V_ofc_connections_completeRowSchema) => {
    if (!record.ofc_id || !record.fiber_no_sn) {
      toast.error('Invalid fiber data for tracing.');
      return;
    }

    setIsTracing(true);
    try {
      // 1. We need to find the START segment ID for this cable to begin the trace.
      // We assume Segment Order 1 is the start.
      const { data, error } = await supabase
        .from('cable_segments')
        .select('id')
        .eq('original_cable_id', record.ofc_id)
        .eq('segment_order', 1)
        .single();

      if (error) {
        console.error('Error fetching start segment:', error);
        toast.error('Could not initiate trace: Start segment not found.');
        return;
      }

      if (data) {
        setTracingFiber({
          startSegmentId: data.id,
          fiberNo: record.fiber_no_sn,
          record: record,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while initiating trace.');
    } finally {
      setIsTracing(false);
    }
  }, [supabase]);

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
      icon: <FiGitCommit className="w-4 h-4" />,
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

  const headerStats = [
    { value: totalCount, label: 'Total Fibers' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive/Faulty', color: 'danger' as const },
  ];

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Overlay spinner when initializing trace */}
      {isTracing && (
        <div className="fixed inset-0 bg-black/20 z-9999 flex items-center justify-center backdrop-blur-[1px]">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-3">
             <PageSpinner text="Preparing Trace..." />
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />

      <UploadResultModal
        isOpen={isUploadResultOpen}
        onClose={() => setIsUploadResultOpen(false)}
        result={uploadResult}
        title="Fiber Connections Upload Report"
      />

      <PageHeader
        title="Physical Fiber Inventory"
        description="Search, export, and manage physical fiber properties across all cables."
        icon={<FiActivity />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading && fibers.length === 0}
        isFetching={isFetching}
      />

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10 mb-4">
        <div className="w-full lg:w-96">
          <DebouncedInput
            placeholder="Search route, system, node..."
            value={search.searchQuery}
            onChange={(value) => search.setSearchQuery(value)}
            leftIcon={<FiSearch className="text-gray-400" />}
            fullWidth
            clearable
            debounce={900}
          />
        </div>

        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
          <div className="min-w-[120px]">
            <SelectFilter
              label=""
              filterKey="status"
              filters={filters}
              setFilters={setFilters}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              placeholder="All Status"
            />
          </div>
          <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0 self-end">
            <button
              className={`p-2 rounded-md transition-all bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400`}
              title="Table View"
            >
              <FiList size={16} />
            </button>
          </div>
        </div>
      </div>

      <DataTable
        autoHideEmptyColumns={true}
        tableName="v_ofc_connections_complete"
        data={fibers}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching}
        actions={tableActions} // Added actions
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

      {/* Trace Modal */}
      {tracingFiber && (
        <FiberTraceModal
          isOpen={!!tracingFiber}
          onClose={() => setTracingFiber(null)}
          startSegmentId={tracingFiber.startSegmentId}
          fiberNo={tracingFiber.fiberNo}
          // We pass undefined for allCables as we don't have the full list here, 
          // and the visualizer will use the record data where possible
          allCables={undefined}
          record={tracingFiber.record}
          refetch={refetch}
        />
      )}
    </div>
  );
}