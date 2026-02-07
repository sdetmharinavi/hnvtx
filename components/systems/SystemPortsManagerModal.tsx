// components/systems/SystemPortsManagerModal.tsx
'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ActionButton, PageHeader } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Modal, DebouncedInput } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { FiServer } from 'react-icons/fi';
import {
  V_ports_management_completeRowSchema,
  Ports_managementInsertSchema,
  V_systems_completeRowSchema,
  Lookup_typesRowSchema,
  V_system_connections_completeRowSchema,
} from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import {
  PortsManagementTableColumns,
  PortServiceMap,
} from '@/config/table-columns/PortsManagementTableColumns';
import { PortsFormModal } from '@/components/systems/PortsFormModal';
import { PortTemplateModal } from '@/components/systems/PortTemplateModal';
import { useTableBulkOperations, usePagedData, EnhancedUploadResult } from '@/hooks/database';
import { usePortsExcelUpload } from '@/hooks/database/excel-queries/usePortsExcelUpload';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { buildUploadConfig, buildColumnConfig } from '@/constants/table-column-keys';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row, TableOrViewName } from '@/hooks/database';
import { generatePortsFromTemplate } from '@/config/port-templates';
import { usePortsData } from '@/hooks/data/usePortsData';
import { formatDate } from '@/utils/formatters';
import { MultiSelectFilter } from '@/components/common/filters/MultiSelectFilter';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { PortHeatmap } from '@/components/systems/PortHeatmap';
import { Activity, Shield, Search } from 'lucide-react';
import { UploadResultModal } from '@/components/common/ui/UploadResultModal';
import { useUser } from '@/providers/UserProvider';
import { PERMISSIONS } from '@/config/permissions';
import dynamic from 'next/dynamic';
import { PageSpinner } from '@/components/common/ui';

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

type ExtendedConnection = V_system_connections_completeRowSchema & {
  en_protection_interface?: string | null;
};

interface SystemPortsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: V_systems_completeRowSchema | null;
}

export const SystemPortsManagerModal: React.FC<SystemPortsManagerModalProps> = ({
  isOpen,
  onClose,
  system,
}) => {
  const systemId = system?.id || null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // 1. Fetch Ports
  const {
    data: ports,
    totalCount,
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
    actions: crudActions,
  } = useCrudManager<'ports_management', V_ports_management_completeRowSchema>({
    tableName: 'ports_management',
    localTableName: 'v_ports_management_complete',
    dataQueryHook: usePortsData(systemId),
    displayNameField: 'port',
    searchColumn: ['port', 'port_type_name', 'sfp_serial_no'],
  });

  // Set default filters on mount
  useEffect(() => {
    if (isOpen) {
      filters.setFilters((prev) => ({
        ...prev,
        port_type_code: ['GE(O)', 'GE(E)', '10GE', 'GE/10GE', 'PON', 'STM16'],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 2. Fetch Port Types for Filter
  const { data: portTypesData, isLoading: loadingTypes } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['port-types-filter'],
    async () =>
      (await supabase.from('lookup_types').select('*').eq('category', 'PORT_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'PORT_TYPES' }).toArray()
  );

  const portTypeCodeOptions = useMemo(() => {
    return (portTypesData || [])
      .filter((t) => t.name !== 'DEFAULT' && t.code)
      .map((t) => ({
        value: t.code!,
        label: t.code!,
      }));
  }, [portTypesData]);

  // 3. Fetch Connections (Bi-Directional)
  const { data: connectionsResult } = usePagedData<V_system_connections_completeRowSchema>(
    supabase,
    'v_system_connections_complete',
    {
      filters: {
        or: `system_id = '${systemId}' OR en_id = '${systemId}'`,
      },
      limit: 2000,
    },
    { enabled: !!systemId && isOpen }
  );

  // 4. Build Service Map (Bi-Directional)
  const portServicesMap = useMemo((): PortServiceMap => {
    const map: PortServiceMap = {};
    if (!Array.isArray(connectionsResult?.data)) return map;

    const connections = connectionsResult.data as ExtendedConnection[];

    connections.forEach((conn) => {
      if (conn.system_id === systemId) {
        if (conn.system_working_interface) {
          if (!map[conn.system_working_interface]) map[conn.system_working_interface] = [];
          map[conn.system_working_interface].push(conn);
        }
        if (conn.system_protection_interface) {
          if (!map[conn.system_protection_interface]) map[conn.system_protection_interface] = [];
          map[conn.system_protection_interface].push(conn);
        }
      }

      if (conn.en_id === systemId) {
        if (conn.en_interface) {
          if (!map[conn.en_interface]) map[conn.en_interface] = [];
          map[conn.en_interface].push(conn);
        }
        if (conn.en_protection_interface) {
          if (!map[conn.en_protection_interface]) map[conn.en_protection_interface] = [];
          map[conn.en_protection_interface].push(conn);
        }
      }
    });
    return map;
  }, [connectionsResult?.data, systemId]);

  // 5. Calculate Stats
  const portStats = useMemo(() => {
    if (!ports) return { total: 0, used: 0, available: 0, down: 0 };

    const total = ports.length;
    const used = ports.filter((p) => p.port_utilization).length;
    const available = ports.filter((p) => !p.port_utilization && p.port_admin_status).length;
    const down = ports.filter((p) => !p.port_admin_status).length;

    return { total, used, available, down };
  }, [ports]);

  // 6. Mutations
  const [uploadResult, setUploadResult] = useState<EnhancedUploadResult | null>(null);
  const [isUploadResultOpen, setIsUploadResultOpen] = useState(false);

  const { mutate: uploadPorts, isPending: isUploading } = usePortsExcelUpload(supabase, {
    showToasts: false, // Handle via modal
    onSuccess: (result) => {
      setUploadResult(result);
      setIsUploadResultOpen(true);
      if (result.successCount > 0) refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: exportPorts, isPending: isExporting } = useTableExcelDownload(
    supabase,
    'v_ports_management_complete'
  );
  const { bulkUpsert } = useTableBulkOperations(supabase, 'ports_management');

  // 7. Configure Columns (Direct call, internal memoization used)
  const columns = PortsManagementTableColumns(ports, portServicesMap);
  const { canAccess } = useUser();
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const tableActions = useMemo(
    (): TableAction<'v_ports_management_complete'>[] =>
      createStandardActions<V_ports_management_completeRowSchema>({
        onEdit: editModal.openEdit,
        onDelete: canDelete ? crudActions.handleDelete : undefined,
        onToggleStatus: (record) =>
          crudActions.handleToggleStatus({ ...record, status: record.port_admin_status }),
      }),
    [editModal.openEdit, crudActions.handleDelete, crudActions.handleToggleStatus, canDelete]
  );

  // 8. Handlers
  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && systemId) {
      const uploadConfig = buildUploadConfig('ports_management');
      uploadPorts({ file, columns: uploadConfig.columnMapping, systemId });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = useCallback(() => {
    const allExportColumns = buildColumnConfig('v_ports_management_complete');
    exportPorts({
      fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}-${
        system?.system_name
      }_ports.xlsx`,
      sheetName: 'Ports',
      columns: allExportColumns as Column<Row<TableOrViewName>>[],
      filters: { system_id: systemId },
    });
  }, [exportPorts, system?.system_name, systemId]);

  const handleApplyTemplate = useCallback(
    (templateKey: string) => {
      if (!systemId) return;
      const portsPayload = generatePortsFromTemplate(templateKey, systemId);
      if (portsPayload.length === 0) {
        toast.error('Selected template is empty or invalid.');
        return;
      }
      bulkUpsert.mutate(
        { data: portsPayload, onConflict: 'system_id,port' },
        {
          onSuccess: () => {
            toast.success(`Successfully populated ${portsPayload.length} ports from template.`);
            refetch();
            setIsTemplateModalOpen(false);
          },
          onError: (err) => {
            toast.error(`Failed to populate ports: ${err.message}`);
          },
        }
      );
    },
    [systemId, bulkUpsert, refetch]
  );

  const headerActions = useMemo((): ActionButton[] => {
    const actions: ActionButton[] = [
      {
        label: 'Refresh',
        onClick: () => {
          refetch();
          toast.success('Ports refreshed!');
        },
        variant: 'outline',
        loading: isLoading,
      },
      {
        label: 'Actions',
        variant: 'outline',
        disabled: isLoading,
        'data-dropdown': true,
        dropdownoptions: [
          { label: 'Upload Excel', onClick: handleUploadClick, disabled: isUploading },
          { label: 'Export Excel', onClick: handleExport, disabled: isExporting },
          { label: 'Apply Template', onClick: () => setIsTemplateModalOpen(true) },
        ],
      },
      {
        label: 'Add Port',
        onClick: editModal.openAdd,
        variant: 'primary',
        disabled: isLoading,
      },
    ];
    return actions;
  }, [
    isLoading,
    isUploading,
    isExporting,
    refetch,
    handleUploadClick,
    handleExport,
    editModal.openAdd,
  ]);

  const renderMobileItem = useCallback(
    (record: Row<'v_ports_management_complete'>, actions: React.ReactNode) => {
      const portName = record.port;
      const services = portName ? portServicesMap[portName] : [];

      return (
        <div className='flex flex-col gap-3'>
          <div className='flex justify-between items-start'>
            <div className='flex items-center gap-3'>
              <div className='h-10 w-10 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 font-mono font-bold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'>
                {record.port?.replace(/^(Gi|Te|Fa|Eth)/i, '') || '?'}
              </div>
              <div>
                <h4 className='font-semibold text-gray-900 dark:text-gray-100'>{record.port}</h4>
                <div className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex gap-2'>
                  <span>{record.port_type_name || 'Generic'}</span>
                  {record.sfp_serial_no && (
                    <span className='font-mono'>SFP: {record.sfp_serial_no}</span>
                  )}
                </div>
              </div>
            </div>
            {actions}
          </div>

          {services && services.length > 0 ? (
            <div className='bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded border border-blue-100 dark:border-blue-800 space-y-2'>
              <div className='text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide'>
                Allocated Service
              </div>
              {services.map((svc, i) => (
                <div
                  key={`${svc.id} + ${i}`}
                  className='flex items-center gap-2 text-sm bg-white dark:bg-gray-800 p-2 rounded shadow-xs border dark:border-gray-700'
                >
                  {svc.system_working_interface === portName ? (
                    <Activity className='w-3.5 h-3.5 text-blue-500' />
                  ) : (
                    <Shield className='w-3.5 h-3.5 text-purple-500' />
                  )}
                  <div className='min-w-0 flex-1'>
                    <div className='font-medium truncate text-gray-800 dark:text-gray-200'>
                      {svc.service_name || svc.connected_system_name}
                    </div>
                    <div className='text-xs text-gray-500 truncate'>
                      {svc.connected_link_type_name}{' '}
                      {svc.bandwidth_allocated && `• ${svc.bandwidth_allocated}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-800 p-2 rounded text-center'>
              No services allocated
            </div>
          )}

          <div className='flex items-center gap-2 pt-2 mt-1 border-t border-gray-100 dark:border-gray-700'>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                record.port_admin_status
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {record.port_admin_status ? 'Admin UP' : 'Admin DOWN'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                record.port_utilization
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {record.port_utilization ? 'Utilized' : 'Free'}
            </span>
          </div>
        </div>
      );
    },
    [portServicesMap]
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Ports for: ${system?.system_name}`}
      size="full"
    >
      <div className="space-y-4">
        {error && <ErrorDisplay error={error.message} />}

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
          title="Ports Upload Report"
        />

        <PageHeader
          title="System Ports"
          icon={<FiServer />}
          stats={[
            { value: portStats.total, label: 'Total' },
            { value: portStats.used, label: 'Utilized', color: 'primary' },
            { value: portStats.available, label: 'Available', color: 'success' },
            { value: portStats.down, label: 'Down', color: 'danger' },
          ]}
          actions={headerActions}
          isLoading={isLoading}
          isFetching={isFetching}
        />

        <PortHeatmap ports={ports} onPortClick={editModal.openEdit} />

        {/* --- REFACTORED FILTER SECTION --- */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="w-full lg:w-96">
            <DebouncedInput
              placeholder="Search ports, serials..."
              value={search.searchQuery}
              onChange={search.setSearchQuery}
              leftIcon={<Search className="text-gray-400" />}
              fullWidth
              clearable
            />
          </div>
          <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0 items-center no-scrollbar">
            <div className="min-w-[180px]">
              <MultiSelectFilter
                label="Port Types"
                filterKey="port_type_code"
                filters={filters.filters}
                setFilters={filters.setFilters}
                options={portTypeCodeOptions}
                isLoading={loadingTypes}
              />
            </div>
            <div className="min-w-[140px]">
              <select
                value={String(filters.filters.port_utilization ?? '')}
                onChange={(e) =>
                  filters.setFilters((prev) => ({ ...prev, port_utilization: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Utilization</option>
                <option value="true">In Use</option>
                <option value="false">Free</option>
              </select>
            </div>
            <div className="min-w-[140px]">
              <select
                value={String(filters.filters.port_admin_status ?? '')}
                onChange={(e) =>
                  filters.setFilters((prev) => ({ ...prev, port_admin_status: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Admin Status</option>
                <option value="true">Up</option>
                <option value="false">Down</option>
              </select>
            </div>
          </div>
        </div>
        {/* --- END REFACTORED FILTER SECTION --- */}

        <DataTable
          autoHideEmptyColumns={true}
          tableName="v_ports_management_complete"
          data={ports}
          columns={columns}
          loading={isLoading}
          isFetching={isFetching || isMutating}
          actions={tableActions}
          renderMobileItem={renderMobileItem}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            showSizeChanger: true,
            onChange: (page, limit) => {
              pagination.setCurrentPage(page);
              pagination.setPageLimit(limit);
            },
          }}
          customToolbar={<></>}
          sortable={true}
        />

        {editModal.isOpen && (
          <PortsFormModal
            isOpen={editModal.isOpen}
            onClose={editModal.close}
            systemId={systemId!}
            editingRecord={editModal.record}
            onSubmit={crudActions.handleSave as (data: Ports_managementInsertSchema) => void}
            isLoading={isMutating}
          />
        )}

        <PortTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSubmit={handleApplyTemplate}
          isLoading={bulkUpsert.isPending}
        />

        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onConfirm={deleteModal.onConfirm}
          onCancel={deleteModal.onCancel}
          title="Confirm Port Deletion"
          message={deleteModal.message}
          loading={deleteModal.loading}
          type="danger"
        />
      </div>
    </Modal>
  );
};