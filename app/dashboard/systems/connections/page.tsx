// app/dashboard/systems/connections/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useRef } from 'react';
import { FiDatabase, FiUpload, FiDownload } from 'react-icons/fi';
import { toast } from 'sonner';

import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { ErrorDisplay, ConfirmModal, PageSpinner } from '@/components/common/ui';
import { ConnectionCard } from '@/components/system-details/connections/ConnectionCard';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import {
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useUser } from '@/providers/UserProvider';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { DataGrid } from '@/components/common/DataGrid';
import { createStandardActions } from '@/components/table/action-helpers';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import {
  TABLE_COLUMN_KEYS,
  buildUploadConfig,
  buildColumnConfig,
} from '@/constants/table-column-keys';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { createClient } from '@/utils/supabase/client';
import { useSystemConnectionExcelUpload } from '@/hooks/database/excel-queries/useSystemConnectionExcelUpload';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { buildRpcFilters, Row, TableOrViewName } from '@/hooks/database';
import { formatDate } from '@/utils/formatters';
import { useTracePath } from '@/hooks/database/trace-hooks';
import dynamic from 'next/dynamic';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAllSystemConnectionsData } from '@/hooks/data/useAllSystemConnectionsData';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard'; // Added
import { useUpsertSystemConnection } from '@/hooks/database/system-connection-hooks';

// Dynamic Imports
const SystemConnectionFormModal = dynamic(
  () =>
    import('@/components/system-details/SystemConnectionFormModal').then(
      (mod) => mod.SystemConnectionFormModal,
    ),
  { loading: () => <PageSpinner text='Loading Form...' /> },
);

const SystemFiberTraceModal = dynamic(
  () => import('@/components/system-details/SystemFiberTraceModal').then((mod) => mod.default),
  { ssr: false },
);

const SystemConnectionDetailsModal = dynamic(
  () =>
    import('@/components/system-details/SystemConnectionDetailsModal').then(
      (mod) => mod.SystemConnectionDetailsModal,
    ),
  { ssr: false },
);

export default function GlobalConnectionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SYNC HOOKS
  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Local state for modals/actions that aren't purely CRUD
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceModalData, setTraceModalData] = useState<any>(null); // eslint-disable-line
  const [isTracing, setIsTracing] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsConnectionId, setDetailsConnectionId] = useState<string | null>(null);

  const tracePath = useTracePath(supabase);

  // CRUD Manager
  const {
    data: connections,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    deleteModal,
    bulkActions,
    actions: crudActions,
  } = useCrudManager<'system_connections', V_system_connections_completeRowSchema>({
    tableName: 'system_connections',
    localTableName: 'v_system_connections_complete',
    dataQueryHook: useAllSystemConnectionsData, // Uses the global hook
    displayNameField: 'service_name',
    syncTables: [
      'system_connections',
      'v_system_connections_complete',
      'systems',
      'v_systems_complete',
    ], // Explicit sync list
  });

  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const { mutate: upsertConnection, isPending: isUpserting } = useUpsertSystemConnection();
  

  // Dropdown Options
  const { options: mediaOptions, isLoading: loadingMedia } = useLookupTypeOptions('MEDIA_TYPES');
  const { options: linkOptions, isLoading: loadingLink } = useLookupTypeOptions('LINK_TYPES');

  // Filter Configuration
  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'connected_link_type_id',
        type: 'multi-select',
        options: linkOptions,
        isLoading: loadingLink,
        placeholder: 'Link Type',
      },
      {
        key: 'media_type_id',
        type: 'multi-select',
        options: mediaOptions,
        isLoading: loadingMedia,
        placeholder: 'Media Type',
      },
      {
        key: 'status',
        type: 'native-select',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
        placeholder: 'All Status',
      },
    ],
    [linkOptions, mediaOptions, loadingLink, loadingMedia],
  );

  // Columns
  const columns = SystemConnectionsTableColumns(connections);
  const orderedColumns = useOrderedColumns(columns, [
    ...TABLE_COLUMN_KEYS.v_system_connections_complete,
  ]);

  // Excel Upload/Export
  const { mutate: uploadConnections, isPending: isUploading } = useSystemConnectionExcelUpload(
    supabase,
    {
      onSuccess: (result) => {
        if (result.successCount > 0) refetch();
      },
    },
  );

  const { mutate: exportConnections, isPending: isExporting } = useRPCExcelDownload(supabase);

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const uploadConfig = buildUploadConfig('v_system_connections_complete');
      uploadConnections({ file, columns: uploadConfig.columnMapping });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    exportConnections({
      fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}_global_connections.xlsx`,
      sheetName: 'Connections',
      columns: buildColumnConfig('v_system_connections_complete') as Column<Row<TableOrViewName>>[],
      rpcConfig: {
        functionName: 'get_paged_data',
        parameters: {
          p_view_name: 'v_system_connections_complete',
          p_limit: 50000,
          p_offset: 0,
          p_filters: buildRpcFilters(filters.filters),
        },
      },
    });
  };

  // Actions
  const handleTrace = async (record: V_system_connections_completeRowSchema) => {
    setIsTracing(true);
    setIsTraceModalOpen(true);
    setTraceModalData(null);
    try {
      const data = await tracePath(record);
      setTraceModalData(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message || 'Trace failed');
      setIsTraceModalOpen(false);
    } finally {
      setIsTracing(false);
    }
  };

  const handleViewDetails = (record: V_system_connections_completeRowSchema) => {
    setDetailsConnectionId(record.id);
    setIsDetailsModalOpen(true);
  };

  const handleGoToSystem = (record: V_system_connections_completeRowSchema) => {
    if (record.system_id) router.push(`/dashboard/systems/${record.system_id}`);
  };

  // Row Rendering
  const renderItem = useCallback(
    (conn: V_system_connections_completeRowSchema) => (
      <ConnectionCard
        key={conn.id}
        connection={conn}
        onViewDetails={handleViewDetails}
        onViewPath={handleTrace}
        onGoToSystem={handleGoToSystem}
        onEdit={editModal.openEdit}
        onDelete={crudActions.handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editModal.openEdit, crudActions.handleDelete, canEdit, canDelete, router],
  );

  const isBusy = isLoading || isFetching || isSyncingData;

  // Header Actions
  const headerActions = useStandardHeaderActions({
    data: connections,
    onRefresh: async () => {
      if (isOnline) {
        // FIX: Explicitly sync tables to ensure local DB is populated
        await syncData(['system_connections', 'v_system_connections_complete']);
        toast.success('Connections synchronized');
      } else {
        refetch();
      }
    },
    onAddNew: undefined, // Global view typically doesn't add without system context
    isLoading: isBusy,
    isFetching: isFetching,
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (data: any) => {
    upsertConnection(data, {
      onSuccess: () => {
        editModal.close();
        refetch(); // Reload list
      },
    });
  };

  if (canEdit) {
    headerActions.push({
      label: isUploading ? 'Uploading...' : 'Upload List',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isBusy,
      hideTextOnMobile: true,
    });
    headerActions.push({
      label: isExporting ? 'Exporting...' : 'Export',
      onClick: handleExport,
      variant: 'outline',
      leftIcon: <FiDownload />,
      disabled: isExporting || isBusy,
      hideTextOnMobile: true,
    });
  }

  // --- INTERACTIVE STATS ---
  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;

    return [
      {
        value: totalCount,
        label: 'Total Connections',
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
        label: 'Inactive',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'Global Connection Explorer',
        description: 'View and search all service connections across the entire network.',
        icon: <FiDatabase />,
        stats: headerStats, // Interactive Stats
        actions: headerActions,
        isLoading: isLoading && connections.length === 0,
        isFetching: isBusy,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search service, system, or ID...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={{
        selectedCount: bulkActions.selectedCount,
        isOperationLoading: isMutating,
        onBulkDelete: bulkActions.handleBulkDelete,
        onBulkUpdateStatus: bulkActions.handleBulkUpdateStatus,
        onClearSelection: bulkActions.handleClearSelection,
        entityName: 'connection',
        showStatusUpdate: true,
        canDelete: () => canDelete,
      }}
      renderGrid={() => (
        <DataGrid
          data={connections}
          renderItem={renderItem}
          isLoading={isLoading}
          isEmpty={connections.length === 0 && !isLoading}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            onChange: (p, s) => {
              pagination.setCurrentPage(p);
              pagination.setPageLimit(s);
            },
          }}
        />
      )}
      tableProps={{
        tableName: 'v_system_connections_complete',
        data: connections,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: createStandardActions({
          onEdit: canEdit ? editModal.openEdit : undefined,
          onView: handleViewDetails,
          onDelete: canDelete ? crudActions.handleDelete : undefined,
        }),
        selectable: canDelete,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (r): r is V_system_connections_completeRowSchema & { id: string } => !!r.id,
          );
          bulkActions.handleRowSelect(validRows);
        },
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
      isEmpty={connections.length === 0 && !isLoading}
      modals={
        <>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            className='hidden'
            accept='.xlsx, .xls, .csv'
          />

          {editModal.isOpen && editModal.record && (
            <SystemConnectionFormModal
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              parentSystem={
                {
                  id: editModal.record.system_id,
                  system_name: editModal.record.system_name,
                  ip_address: editModal.record.sn_ip,
                } as V_systems_completeRowSchema
              }
              editingConnection={editModal.record}
              onSubmit={handleSave}
              isLoading={isMutating || isUpserting}
            />
          )}

          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title='Confirm Deletion'
            message={deleteModal.message}
            type='danger'
            loading={deleteModal.loading}
          />

          <SystemFiberTraceModal
            isOpen={isTraceModalOpen}
            onClose={() => setIsTraceModalOpen(false)}
            traceData={traceModalData}
            isLoading={isTracing}
          />

          <SystemConnectionDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            connectionId={detailsConnectionId}
            parentSystem={null}
          />
        </>
      }
    />
  );
}
