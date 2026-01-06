// app/dashboard/systems/connections/page.tsx
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildUploadConfig, TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { FiGitBranch, FiMonitor, FiEye, FiUpload } from 'react-icons/fi';
import { useAllSystemConnectionsData } from '@/hooks/data/useAllSystemConnectionsData';
import { SystemConnectionDetailsModal } from '@/components/system-details/SystemConnectionDetailsModal';
import { useTracePath, TraceRoutes } from '@/hooks/database/trace-hooks';
import SystemFiberTraceModal from '@/components/system-details/SystemFiberTraceModal';
import { useRouter } from 'next/navigation';
import { Row } from '@/hooks/database';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { useSystemConnectionExcelUpload } from '@/hooks/database/excel-queries/useSystemConnectionExcelUpload';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { UploadColumnMapping } from '@/hooks/database';
import { ConnectionCard } from '@/components/system-details/connections/ConnectionCard';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { FilterConfig, GenericFilterBar } from '@/components/common/filters/GenericFilterBar'; // IMPORT

export default function GlobalConnectionsPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSuperAdmin, role } = useUser();

  const canEdit =
    !!isSuperAdmin ||
    [
      UserRole.ADMINPRO,
      UserRole.ADMIN,
      UserRole.CPANADMIN,
      UserRole.MAANADMIN,
      UserRole.SDHADMIN,
    ].includes(role as UserRole);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] =
    useState<V_system_connections_completeRowSchema | null>(null);

  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceModalData, setTraceModalData] = useState<TraceRoutes | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const tracePath = useTracePath(supabase);

  const {
    data: connections,
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
  } = useCrudManager<'system_connections', V_system_connections_completeRowSchema>({
    tableName: 'system_connections',
    localTableName: 'v_system_connections_complete',
    dataQueryHook: useAllSystemConnectionsData,
    displayNameField: 'service_name',
    searchColumn: ['service_name', 'system_name', 'connected_system_name'],
  });

  // --- DATA OPTIONS ---
  const { options: mediaOptions, isLoading: mediaLoading } = useLookupTypeOptions('MEDIA_TYPES');
  const { options: linkTypeOptions, isLoading: linkTypeLoading } =
    useLookupTypeOptions('LINK_TYPES');

  // --- DRY FILTER CONFIG ---
  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'connected_link_type_id',
        label: 'Link Type',
        options: linkTypeOptions,
        isLoading: linkTypeLoading,
      },
      { key: 'media_type_id', label: 'Media Type', options: mediaOptions, isLoading: mediaLoading },
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
    [linkTypeOptions, mediaOptions, linkTypeLoading, mediaLoading]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters]
  );
  // -------------------------

  const { mutate: uploadConnections, isPending: isUploading } = useSystemConnectionExcelUpload(
    supabase,
    {
      onSuccess: (result) => {
        if (result.successCount > 0) refetch();
      },
    }
  );

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const uploadConfig = buildUploadConfig('v_system_connections_complete');
        const customMapping: UploadColumnMapping<'v_system_connections_complete'>[] = [
          { excelHeader: 'System Name', dbKey: 'system_name', required: true },
          ...uploadConfig.columnMapping.filter((c) => c.dbKey !== 'system_id'),
        ];
        uploadConnections({ file, columns: customMapping });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadConnections]
  );

  const columns = SystemConnectionsTableColumns(connections, true);
  const orderedColumns = useOrderedColumns(columns, [
    'system_name',
    ...TABLE_COLUMN_KEYS.v_system_connections_complete,
  ]);

  const handleViewDetails = (record: V_system_connections_completeRowSchema) => {
    setSelectedConnection(record);
    setIsDetailsModalOpen(true);
  };

  const handleTracePath = async (record: V_system_connections_completeRowSchema) => {
    setIsTracing(true);
    setIsTraceModalOpen(true);
    setTraceModalData(null);
    try {
      const traceData = await tracePath(record);
      setTraceModalData(traceData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to trace path');
      setIsTraceModalOpen(false);
    } finally {
      setIsTracing(false);
    }
  };

  const handleGoToSystem = (record: V_system_connections_completeRowSchema) => {
    if (record.system_id) {
      router.push(`/dashboard/systems/${record.system_id}`);
    }
  };

  const tableActions = useMemo(
    (): TableAction<'v_system_connections_complete'>[] => [
      {
        key: 'view-details',
        label: 'Full Details',
        icon: <FiMonitor />,
        onClick: handleViewDetails,
        variant: 'primary',
      },
      {
        key: 'view-path',
        label: 'View Path',
        icon: <FiEye />,
        onClick: handleTracePath,
        variant: 'secondary',
        hidden: (record) =>
          !(Array.isArray(record.working_fiber_in_ids) && record.working_fiber_in_ids.length > 0),
      },
      {
        key: 'go-to-system',
        label: 'Go to System',
        icon: <FiGitBranch />,
        onClick: handleGoToSystem,
        variant: 'secondary',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleGoToSystem]
  );

  const headerActions = useStandardHeaderActions({
    data: connections,
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed!');
    },
    isLoading,
    exportConfig: canEdit
      ? {
          tableName: 'v_system_connections_complete',
          fileName: 'Global_Connections_List',
          useRpc: true,
        }
      : undefined,
  });

  if (canEdit) {
    headerActions.splice(1, 0, {
      label: isUploading ? 'Uploading...' : 'Upload List',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoading,
      hideTextOnMobile: true,
    });
  }

  const headerStats = [
    { value: totalCount, label: 'Total Connections' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const renderMobileItem = useCallback(
    (record: Row<'v_system_connections_complete'>) => {
      return (
        <ConnectionCard
          connection={record as V_system_connections_completeRowSchema}
          onViewDetails={handleViewDetails}
          onViewPath={handleTracePath}
          onGoToSystem={handleGoToSystem}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleGoToSystem]
  );

  const parentSystemForModal = useMemo((): V_systems_completeRowSchema | null => {
    if (!selectedConnection) return null;

    return {
      id: selectedConnection.system_id,
      system_name: selectedConnection.system_name,
      node_name: selectedConnection.sn_node_name,
      ip_address: selectedConnection.sn_ip as string | null,
      system_type_code: selectedConnection.system_type_name,
      system_type_name: selectedConnection.system_type_name,
      commissioned_on: null,
      created_at: null,
      is_hub: null,
      is_ring_based: null,
      latitude: null,
      longitude: null,
      maan_node_id: null,
      maintenance_terminal_id: null,
      make: null,
      node_id: selectedConnection.sn_node_id,
      node_type_name: null,
      order_in_ring: null,
      remark: null,
      ring_associations: null,
      ring_id: null,
      ring_logical_area_name: null,
      s_no: null,
      status: null,
      system_capacity_id: null,
      system_capacity_name: null,
      system_category: null,
      system_maintenance_terminal_name: null,
      system_type_id: null,
      updated_at: null,
    };
  }, [selectedConnection]);

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />

      <PageHeader
        title="Global Connection Explorer"
        description="View and search all service connections across the entire network."
        icon={<FiGitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading && connections.length === 0}
        isFetching={isFetching}
      />

      {/* REUSABLE FILTER BAR */}
      <GenericFilterBar
        searchQuery={search.searchQuery}
        onSearchChange={search.setSearchQuery}
        searchPlaceholder="Search service, system, or ID..."
        filters={filters.filters}
        onFilterChange={handleFilterChange}
        filterConfigs={filterConfigs}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onViewDetails={handleViewDetails}
              onViewPath={handleTracePath}
              onGoToSystem={handleGoToSystem}
            />
          ))}
          {connections.length === 0 && !isLoading && (
            <div className="col-span-full py-16 text-center text-gray-500">
              <FiGitBranch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No connections found matching your criteria.</p>
            </div>
          )}
        </div>
      ) : (
        <DataTable
          autoHideEmptyColumns={true}
          tableName="v_system_connections_complete"
          data={connections}
          columns={orderedColumns}
          loading={isLoading}
          isFetching={isFetching}
          actions={tableActions}
          renderMobileItem={renderMobileItem}
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
      )}

      <SystemConnectionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedConnection(null);
        }}
        connectionId={selectedConnection?.id ?? null}
        parentSystem={parentSystemForModal}
      />
      <SystemFiberTraceModal
        isOpen={isTraceModalOpen}
        onClose={() => setIsTraceModalOpen(false)}
        traceData={traceModalData}
        isLoading={isTracing}
      />
    </div>
  );
}
