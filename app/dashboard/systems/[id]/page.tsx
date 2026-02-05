// path: app/dashboard/systems/[id]/page.tsx
'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Input, PageSpinner } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import {
  useRpcMutation,
  RpcFunctionArgs,
  Filters,
  Row,
  usePagedData,
  UploadColumnMapping,
  useTableBulkOperations, // ADDED
} from '@/hooks/database';
import {
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { DEFAULTS } from '@/constants/constants';
import { useSystemConnectionExcelUpload } from '@/hooks/database/excel-queries/useSystemConnectionExcelUpload';
import { createStandardActions } from '@/components/table/action-helpers';
import { useTracePath, TraceRoutes } from '@/hooks/database/trace-hooks';
import { ZapOff, Eye, Monitor } from 'lucide-react';
import { useDeprovisionServicePath } from '@/hooks/database/system-connection-hooks';
import { toPgBoolean, toPgDate } from '@/config/helper-functions';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { useQueryClient } from '@tanstack/react-query';
import { StatProps } from '@/components/common/page-header/StatCard';
import { usePortsData } from '@/hooks/data/usePortsData';
import { useSystemConnectionsData } from '@/hooks/data/useSystemConnectionsData';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import {
  FiDatabase,
  FiPieChart,
  FiUpload,
  FiGrid,
  FiList,
  FiSearch,
  FiGitBranch,
} from 'react-icons/fi';
import { StatsConfigModal, StatsFilterState } from '@/components/system-details/StatsConfigModal';
import { useUser } from '@/providers/UserProvider';
import { ConnectionCard } from '@/components/system-details/connections/ConnectionCard';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import dynamic from 'next/dynamic';
import { BulkActions } from '@/components/common/BulkActions'; // ADDED
import { PERMISSIONS } from '@/config/permissions';

// DYNAMIC IMPORTS
const SystemConnectionFormModal = dynamic(
  () =>
    import('@/components/system-details/SystemConnectionFormModal').then(
      (mod) => mod.SystemConnectionFormModal
    ),
  { loading: () => <PageSpinner text="Loading Form..." /> }
);

const FiberAllocationModal = dynamic(
  () =>
    import('@/components/system-details/FiberAllocationModal').then(
      (mod) => mod.FiberAllocationModal
    ),
  { loading: () => <PageSpinner text="Loading Ports..." /> }
);

const SystemFiberTraceModal = dynamic(
  () => import('@/components/system-details/SystemFiberTraceModal').then((mod) => mod.default),
  { ssr: false }
);

const SystemConnectionDetailsModal = dynamic(
  () =>
    import('@/components/system-details/SystemConnectionDetailsModal').then(
      (mod) => mod.SystemConnectionDetailsModal
    ),
  { ssr: false }
);

type UpsertConnectionPayload = RpcFunctionArgs<'upsert_system_connection_with_details'>;

export default function SystemConnectionsPage() {
  const params = useParams();
  const systemId = params.id as string;
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();
  const isOnline = useOnlineStatus();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');

  const [filters, setFilters] = useState<Filters>({});

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<V_system_connections_completeRowSchema | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [connectionToAllocate, setConnectionToAllocate] =
    useState<V_system_connections_completeRowSchema | null>(null);
  const [isDeprovisionModalOpen, setDeprovisionModalOpen] = useState(false);
  const [connectionToDeprovision, setConnectionToDeprovision] =
    useState<V_system_connections_completeRowSchema | null>(null);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceModalData, setTraceModalData] = useState<TraceRoutes | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsConnectionId, setDetailsConnectionId] = useState<string | null>(null);

  const [isStatsConfigOpen, setIsStatsConfigOpen] = useState(false);
  const [statsFilters, setStatsFilters] = useState<StatsFilterState>({
    includeAdminDown: true,
    selectedCapacities: [],
    selectedTypes: [],
  });
  
  // ADDED: Local state for bulk selection
  const [selectedRows, setSelectedRows] = useState<V_system_connections_completeRowSchema[]>([]);
  const selectedRowIds = useMemo(() => selectedRows.map(r => String(r.id)), [selectedRows]);

  const tracePath = useTracePath(supabase);

  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const { options: mediaOptions } = useLookupTypeOptions('MEDIA_TYPES');
  const { options: linkTypeOptions } = useLookupTypeOptions('LINK_TYPES');

  const useData = useSystemConnectionsData(systemId);

  const {
    data: connections,
    totalCount: totalConnections,
    isLoading: isLoadingConnections,
    refetch,
    isFetching,
  } = useData({
    currentPage,
    pageLimit,
    searchQuery,
    filters,
  });
  
  // ADDED: Bulk Update hook
  const { bulkUpdate } = useTableBulkOperations(supabase, 'system_connections');

  const sortedConnections = useMemo(() => {
    if (!searchQuery && connections.length > 0) {
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      return [...connections].sort((a, b) => {
        const portA = a.system_working_interface || '';
        const portB = b.system_working_interface || '';
        if (portA === portB) {
          return (a.service_name || '').localeCompare(b.service_name || '');
        }
        return collator.compare(portA, portB);
      });
    }
    return connections;
  }, [connections, searchQuery]);

  const { data: systemData, isLoading: isLoadingSystem } =
    usePagedData<V_systems_completeRowSchema>(supabase, 'v_systems_complete', {
      filters: { id: systemId },
    });
  const parentSystem = systemData?.data?.[0];

  const { data: ports = [] } = usePortsData(systemId)({
    currentPage: 1,
    pageLimit: 5000,
    searchQuery: '',
    filters: {},
  });

  const headerStats: StatProps[] = useMemo(() => {
    if (!ports || ports.length === 0) {
      return [{ label: 'Total Connections', value: totalConnections }];
    }

    const filteredPorts = ports.filter((p) => {
      if (!statsFilters.includeAdminDown && !p.port_admin_status) return false;
      if (statsFilters.selectedCapacities.length > 0) {
        if (!p.port_capacity || !statsFilters.selectedCapacities.includes(p.port_capacity))
          return false;
      }
      const typeLabel = p.port_type_code || p.port_type_name || 'Unknown';
      if (statsFilters.selectedTypes.length > 0) {
        if (!statsFilters.selectedTypes.includes(typeLabel)) return false;
      }
      return true;
    });

    const totalPorts = filteredPorts.length;
    const availablePorts = filteredPorts.filter(
      (p) => !p.port_utilization && p.port_admin_status
    ).length;
    const portsDown = filteredPorts.filter((p) => !p.port_admin_status).length;
    const utilPercent =
      totalPorts > 0
        ? Math.round((filteredPorts.filter((p) => p.port_utilization).length / totalPorts) * 100)
        : 0;

    const typeStats = filteredPorts.reduce((acc, port) => {
      const code =
        port.port_type_code ||
        (port.port_type_name
          ? port.port_type_name.replace(/[^A-Z0-9]/gi, '').substring(0, 6)
          : 'Other');
      if (!acc[code]) acc[code] = { total: 0, used: 0 };
      acc[code].total++;
      if (port.port_utilization) {
        acc[code].used++;
      }
      return acc;
    }, {} as Record<string, { total: number; used: number }>);

    const typeCards: StatProps[] = Object.entries(typeStats)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([code, stats]) => {
        const percentage = Math.round((stats.used / stats.total) * 100);
        return {
          label: `${code}`,
          value: `${stats.used} / ${stats.total} (${percentage}%)`,
          color: percentage > 90 ? 'warning' : 'default',
        };
      });

    return [
      { label: 'Connections', value: totalConnections, color: 'default' },
      {
        label: `Utilization ${statsFilters.selectedCapacities.length ? '(Filtered)' : ''}`,
        value: `${utilPercent}%`,
        color: utilPercent > 80 ? 'warning' : 'default',
      },
      {
        label: 'Free Ports',
        value: availablePorts,
        color: availablePorts === 0 ? 'danger' : 'success',
      },
      ...(portsDown > 0
        ? [{ label: 'Ports Down', value: portsDown, color: 'danger' as const }]
        : []),
      ...typeCards,
    ];
  }, [ports, totalConnections, statsFilters]);

  const upsertMutation = useRpcMutation(supabase, 'upsert_system_connection_with_details', {
    onSuccess: () => {
      refetch();
      closeModal();
      queryClient.invalidateQueries({
        queryKey: [
          'paged-data',
          'v_ports_management_complete',
          { filters: { system_id: systemId } },
        ],
      });
    },
  });

  const deprovisionMutation = useDeprovisionServicePath();
  const deleteManager = useDeleteManager({
    tableName: 'system_connections',
    onSuccess: () => {
      refetch();
      setSelectedRows([]); // Clear selection
      queryClient.invalidateQueries({
        queryKey: [
          'paged-data',
          'v_ports_management_complete',
          { filters: { system_id: systemId } },
        ],
      });
    },
  });

  const { mutate: uploadConnections, isPending: isUploading } = useSystemConnectionExcelUpload(
    supabase,
    {
      onSuccess: (result) => {
        if (result.successCount > 0) {
          refetch();
        }
      },
    }
  );

  const columns = SystemConnectionsTableColumns(connections);
  const orderedColumns = useOrderedColumns(columns, [
    ...TABLE_COLUMN_KEYS.v_system_connections_complete,
  ]);

  const openEditModal = useCallback((record: V_system_connections_completeRowSchema) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  }, []);
  const openAddModal = useCallback(() => {
    setEditingRecord(null);
    setIsEditModalOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setEditingRecord(null);
    setIsEditModalOpen(false);
  }, []);
  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && parentSystem?.id) {
        const columnMapping: UploadColumnMapping<'v_system_connections_complete'>[] = [
          { excelHeader: 'Id', dbKey: 'id' },
          { excelHeader: 'Media Type Id', dbKey: 'media_type_id', required: true },
          { excelHeader: 'Status', dbKey: 'status', transform: toPgBoolean },
          { excelHeader: 'Sn Id', dbKey: 'sn_id' },
          { excelHeader: 'En Id', dbKey: 'en_id' },
          { excelHeader: 'Sn Ip', dbKey: 'sn_ip' },
          { excelHeader: 'Sn Interface', dbKey: 'sn_interface' },
          { excelHeader: 'En Ip', dbKey: 'en_ip' },
          { excelHeader: 'En Interface', dbKey: 'en_interface' },
          { excelHeader: 'Bandwidth Mbps', dbKey: 'bandwidth' },
          { excelHeader: 'Vlan', dbKey: 'vlan' },
          { excelHeader: 'LC ID', dbKey: 'lc_id' },
          { excelHeader: 'Unique ID', dbKey: 'unique_id' },
          { excelHeader: 'Commissioned On', dbKey: 'commissioned_on', transform: toPgDate },
          { excelHeader: 'Remark', dbKey: 'remark' },
          { excelHeader: 'Customer Name', dbKey: 'service_name' },
          { excelHeader: 'Service Id', dbKey: 'service_id' },
          { excelHeader: 'Service Node Id', dbKey: 'service_node_id' },
          { excelHeader: 'Connected System Name', dbKey: 'connected_system_name' },
          { excelHeader: 'Bandwidth Allocated Mbps', dbKey: 'bandwidth_allocated' },
          { excelHeader: 'Working Fiber In Ids', dbKey: 'working_fiber_in_ids' },
          { excelHeader: 'Working Fiber Out Ids', dbKey: 'working_fiber_out_ids' },
          { excelHeader: 'Protection Fiber In Ids', dbKey: 'protection_fiber_in_ids' },
          { excelHeader: 'Protection Fiber Out Ids', dbKey: 'protection_fiber_out_ids' },
          { excelHeader: 'System Working Interface', dbKey: 'system_working_interface' },
          { excelHeader: 'System Protection Interface', dbKey: 'system_protection_interface' },
          { excelHeader: 'Connected Link Type', dbKey: 'connected_link_type_name' },
          { excelHeader: 'Sdh Stm No', dbKey: 'sdh_stm_no' },
          { excelHeader: 'Sdh Carrier', dbKey: 'sdh_carrier' },
          { excelHeader: 'Sdh A Slot', dbKey: 'sdh_a_slot' },
          { excelHeader: 'Sdh A Customer', dbKey: 'sdh_a_customer' },
          { excelHeader: 'Sdh B Slot', dbKey: 'sdh_b_slot' },
          { excelHeader: 'Sdh B Customer', dbKey: 'sdh_b_customer' },
        ] as UploadColumnMapping<'v_system_connections_complete'>[];
        uploadConnections({ file, columns: columnMapping, parentSystemId: parentSystem.id });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadConnections, parentSystem]
  );

  const handleOpenAllocationModal = useCallback(
    (record: V_system_connections_completeRowSchema) => {
      setConnectionToAllocate(record);
      setIsAllocationModalOpen(true);
    },
    []
  );
  const handleDeprovisionClick = useCallback((record: V_system_connections_completeRowSchema) => {
    setConnectionToDeprovision(record);
    setDeprovisionModalOpen(true);
  }, []);
  const handleConfirmDeprovision = () => {
    if (!connectionToDeprovision?.id) return;
    deprovisionMutation.mutate(connectionToDeprovision.id, {
      onSuccess: () => {
        setDeprovisionModalOpen(false);
        setConnectionToDeprovision(null);
        refetch();
      },
    });
  };
  const handleAllocationSave = useCallback(() => {
    refetch();
    setIsAllocationModalOpen(false);
  }, [refetch]);
  const handleTracePath = useCallback(
    async (record: V_system_connections_completeRowSchema) => {
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
    },
    [tracePath]
  );
  const handleViewDetails = useCallback((record: V_system_connections_completeRowSchema) => {
    setDetailsConnectionId(record.id);
    setIsDetailsModalOpen(true);
  }, []);

  const tableActions = useMemo((): TableAction<'v_system_connections_complete'>[] => {
    const standard = createStandardActions<V_system_connections_completeRowSchema>({
      onEdit: canEdit ? openEditModal : undefined,
      onDelete: canDelete
        ? (record) =>
            deleteManager.deleteSingle({
              id: record.id!,
              name: record.service_name || record.connected_system_name || 'Connection',
            })
        : undefined,
      onToggleStatus: (record) => { // ADDED toggle status
        // Using upsert instead of bulkUpdate for single toggle since we have upsert RPC
        if (canEdit) {
           upsertMutation.mutate({
             p_id: record.id!,
             p_system_id: record.system_id!, // system_id is required
             p_media_type_id: record.media_type_id!, // required
             p_status: !record.status
           })
        }
      }
    });
    const isProvisioned = (record: V_system_connections_completeRowSchema) =>
      Array.isArray(record.working_fiber_in_ids) && record.working_fiber_in_ids.length > 0;

    return [
      {
        key: 'view-details',
        label: 'Full Details',
        icon: <Monitor className="w-4 h-4" />,
        onClick: handleViewDetails,
        variant: 'primary',
      },
      {
        key: 'view-path',
        label: 'View Path',
        icon: <Eye className="w-4 h-4" />,
        onClick: handleTracePath,
        variant: 'secondary',
        hidden: (record) => !isProvisioned(record),
      },
      {
        key: 'deprovision',
        label: 'Deprovision',
        icon: <ZapOff className="w-4 h-4" />,
        onClick: handleDeprovisionClick,
        variant: 'danger',
        hidden: (record) => !isProvisioned(record) || !canEdit,
      },
      {
        key: 'allocate-fiber',
        label: 'Allocate Fibers',
        icon: <FiGitBranch className="w-4 h-4" />,
        onClick: handleOpenAllocationModal,
        variant: 'primary',
        hidden: (record) => isProvisioned(record) || !canEdit,
      },
      ...standard,
    ];
  }, [
    deleteManager,
    handleTracePath,
    handleDeprovisionClick,
    handleOpenAllocationModal,
    openEditModal,
    handleViewDetails,
    canEdit,
    canDelete,
    upsertMutation
  ]);

  const isBusy = isLoadingConnections || isSyncingData || isFetching;

  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      if (isOnline) {
        // Sync system-specific tables
        await syncData([
          'system_connections',
          'v_system_connections_complete',
          'ports_management',
          'v_ports_management_complete',
          'services',
          'v_services',
        ]);
        // No explicit refetch() here, sync invalidates automatically
      } else {
        refetch(); // Fallback for offline
      }
      toast.success('Connections refreshed!');
    },
    onAddNew: canEdit ? openAddModal : undefined,
    isLoading: isBusy, // THE FIX: Use isBusy
    exportConfig: canEdit
      ? {
          tableName: 'v_system_connections_complete',
          fileName: `${
            parentSystem?.node_name +
              '_' +
              parentSystem?.system_type_code +
              '_' +
              parentSystem?.ip_address?.split('/')[0] || 'system'
          }_connections`,
          filters: { system_id: systemId },
        }
      : undefined,
  });

  headerActions.splice(0, 0, {
    label: 'Configure Stats',
    onClick: () => setIsStatsConfigOpen(true),
    variant: 'outline',
    leftIcon: <FiPieChart />,
    disabled: isLoadingConnections || !ports.length,
    hideTextOnMobile: true,
  });

  if (canEdit) {
    headerActions.splice(2, 0, {
      label: isUploading ? 'Uploading...' : 'Upload Connections',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoadingConnections,
      hideTextOnMobile: true,
    });
  }

  const renderMobileItem = useCallback(
    (record: Row<'v_system_connections_complete'>) => {
      return (
        <div className="flex flex-col gap-3">
          <ConnectionCard
            connection={record as V_system_connections_completeRowSchema}
            parentSystemId={systemId}
            onViewDetails={handleViewDetails}
            onViewPath={handleTracePath}
            onGoToSystem={() => {}}
            isSystemContext={true}
            onEdit={canEdit ? openEditModal : undefined}
            onDelete={
              canDelete
                ? (rec) =>
                    deleteManager.deleteSingle({
                      id: rec.id!,
                      name: rec.service_name || 'Connection',
                    })
                : undefined
            }
            canEdit={canEdit}
            canDelete={canDelete}
          />
          <div className="flex justify-end gap-2 px-2">
            {/* This is where mobile actions would go if not on the card */}
          </div>
        </div>
      );
    },
    [systemId, handleViewDetails, handleTracePath, canEdit, canDelete, openEditModal, deleteManager]
  );

  if (isLoadingSystem) return <PageSpinner text="Loading system details..." />;
  if (!parentSystem) return <ErrorDisplay error="System not found." />;

  const handleSave = (payload: UpsertConnectionPayload) => {
    upsertMutation.mutate(payload, {
      onSuccess: () => {
        refetch();
        closeModal();
        queryClient.invalidateQueries({
          queryKey: [
            'paged-data',
            'v_ports_management_complete',
            { filters: { system_id: systemId } },
          ],
        });
      },
    });
  };
  
  // ADDED: Handlers for bulk actions
  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0) return;
    const itemsToDelete = selectedRows.map(r => ({ id: r.id!, name: r.service_name || 'Connection' }));
    deleteManager.deleteMultiple(itemsToDelete);
  };
  
  const handleClearSelection = () => setSelectedRows([]);
  
  const handleBulkUpdateStatus = async (status: 'active' | 'inactive') => {
      if (selectedRowIds.length === 0) return;
      const newStatus = status === 'active';
      const updates = selectedRowIds.map((id) => ({
          id,
          data: { status: newStatus }
      }));
      
      // Cast to match expected type of bulkUpdate mutation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bulkUpdate.mutate({ updates: updates as any }, {
          onSuccess: () => {
              toast.success('Status updated for selected items');
              refetch();
              handleClearSelection();
          }
      });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={
          `${parentSystem.system_name} (${parentSystem.ip_address?.split('/')[0]})` ||
          'System Details'
        }
        description={`Manage connections for ${parentSystem.system_type_code} at ${parentSystem.node_name}`}
        icon={<FiDatabase />}
        actions={headerActions}
        stats={headerStats}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />

      <StatsConfigModal
        isOpen={isStatsConfigOpen}
        onClose={() => setIsStatsConfigOpen(false)}
        ports={ports}
        filters={statsFilters}
        onApply={setStatsFilters}
      />

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10 mb-4">
        <div className="w-full lg:w-96">
          <Input
            placeholder="Search service, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<FiSearch className="text-gray-400" />}
            fullWidth
            clearable
          />
        </div>

        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
          <div className="min-w-[160px]">
            <SelectFilter
              label=""
              filterKey="media_type_id"
              filters={filters}
              setFilters={setFilters}
              options={mediaOptions}
              placeholder="All Media Types"
            />
          </div>
          <div className="min-w-[160px]">
            <SelectFilter
              label=""
              filterKey="connected_link_type_id"
              filters={filters}
              setFilters={setFilters}
              options={linkTypeOptions}
              placeholder="All Link Types"
            />
          </div>
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
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <FiGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Table View"
            >
              <FiList size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* ADDED: Bulk Actions */}
      {selectedRowIds.length > 0 && (
          <BulkActions
            selectedCount={selectedRowIds.length}
            isOperationLoading={deleteManager.isPending || bulkUpdate.isPending}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onClearSelection={handleClearSelection}
            entityName="connection"
            showStatusUpdate={true}
            canDelete={() => canDelete}
          />
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
          {sortedConnections.map((conn) => (
            <div key={conn.id} className="h-full">
              <ConnectionCard
                connection={conn}
                parentSystemId={systemId}
                onViewDetails={handleViewDetails}
                onViewPath={handleTracePath}
                onGoToSystem={() => {}}
                isSystemContext={true}
                onEdit={canEdit ? openEditModal : undefined}
                onDelete={
                  canDelete
                    ? (record) =>
                        deleteManager.deleteSingle({
                          id: record.id!,
                          name: record.service_name || record.connected_system_name || 'Connection',
                        })
                    : undefined
                }
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </div>
          ))}
          {sortedConnections.length === 0 && !isLoadingConnections && (
            <div className="col-span-full py-16 text-center text-gray-500">
              <FiDatabase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <div>No connections found matching your criteria.</div>
            </div>
          )}
        </div>
      ) : (
        <DataTable
          autoHideEmptyColumns={true}
          tableName="v_system_connections_complete"
          data={sortedConnections}
          columns={orderedColumns}
          loading={isLoadingConnections}
          isFetching={isLoadingConnections}
          actions={tableActions}
          renderMobileItem={renderMobileItem}
          // ADDED: Selection props
          selectable={canDelete}
          onRowSelect={(rows) => {
              const validRows = rows.filter((r): r is V_system_connections_completeRowSchema => !!r.id);
              setSelectedRows(validRows);
          }}
          pagination={{
            current: currentPage,
            pageSize: pageLimit,
            total: totalConnections,
            showSizeChanger: true,
            onChange: (page, limit) => {
              setCurrentPage(page);
              setPageLimit(limit);
            },
          }}
          searchable={false}
          customToolbar={<></>}
        />
      )}

      {isEditModalOpen && (
        <SystemConnectionFormModal
          isOpen={isEditModalOpen}
          onClose={closeModal}
          parentSystem={parentSystem}
          editingConnection={editingRecord}
          onSubmit={handleSave}
          isLoading={upsertMutation.isPending}
        />
      )}

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title="Confirm Delete"
        message={deleteManager.confirmationMessage}
        loading={deleteManager.isPending}
        type="danger"
      />
      {isAllocationModalOpen && (
        <FiberAllocationModal
          isOpen={isAllocationModalOpen}
          onClose={() => setIsAllocationModalOpen(false)}
          connection={connectionToAllocate}
          onSave={handleAllocationSave}
          parentSystem={parentSystem}
        />
      )}
      <ConfirmModal
        isOpen={isDeprovisionModalOpen}
        onConfirm={handleConfirmDeprovision}
        onCancel={() => setDeprovisionModalOpen(false)}
        title="Confirm Deprovisioning"
        message={`Are you sure you want to deprovision this connection?`}
        loading={deprovisionMutation.isPending}
        type="danger"
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
        parentSystem={parentSystem}
      />
    </div>
  );
}