// components/systems/SystemPortsManagerModal.tsx
"use client";

import { useMemo, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ActionButton, PageHeader } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Modal } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { FiServer } from 'react-icons/fi';
import { V_ports_management_completeRowSchema, Ports_managementInsertSchema, V_systems_completeRowSchema, Lookup_typesRowSchema, V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import { PortsManagementTableColumns, PortServiceMap } from '@/config/table-columns/PortsManagementTableColumns'; 
import { PortsFormModal } from '@/components/systems/PortsFormModal';
import { PortTemplateModal } from '@/components/systems/PortTemplateModal';
import { useTableBulkOperations, useTableQuery } from '@/hooks/database';
import { usePortsExcelUpload } from '@/hooks/database/excel-queries/usePortsExcelUpload';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { buildUploadConfig, buildColumnConfig } from '@/constants/table-column-keys';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row, TableOrViewName } from '@/hooks/database';
import { generatePortsFromTemplate } from '@/config/port-templates';
import { usePortsData } from '@/hooks/data/usePortsData';
import { formatDate } from '@/utils/formatters';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { PortHeatmap } from '@/components/systems/PortHeatmap'; // IMPORTED

// Extended type to handle the new column before codegen updates
type ExtendedConnection = V_system_connections_completeRowSchema & {
  en_protection_interface?: string | null;
};

interface SystemPortsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: V_systems_completeRowSchema | null;
}

export const SystemPortsManagerModal: React.FC<SystemPortsManagerModalProps> = ({ isOpen, onClose, system }) => {
  const systemId = system?.id || null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false); 

  // 1. Fetch Ports
  const {
    data: ports, totalCount, isLoading, isMutating, isFetching, error, refetch,
    pagination, search, filters, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'ports_management', V_ports_management_completeRowSchema>({
    tableName: 'ports_management',
    localTableName: 'v_ports_management_complete',
    dataQueryHook: usePortsData(systemId),
    displayNameField: 'port',
    searchColumn: ['port', 'port_type_name', 'sfp_serial_no']
  });

  // 2. Fetch Port Types for Filter
  const { data: portTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['port-types-filter'],
    async () => (await supabase.from('lookup_types').select('*').eq('category', 'PORT_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'PORT_TYPES' }).toArray()
  );
  
  const portTypeOptions = useMemo(() => {
    return (portTypesData || [])
        .filter(t => t.name !== 'DEFAULT')
        .map(t => ({ value: t.name, label: t.name }));
  }, [portTypesData]);


  // 3. Fetch Connections (Bi-Directional)
  const { data: connectionsResult } = useTableQuery(supabase, 'v_system_connections_complete', {
      filters: { 
          or: `system_id.eq.${systemId},en_id.eq.${systemId}` 
      },
      enabled: !!systemId && isOpen,
      limit: 2000
  });

  // 4. Build Service Map (Bi-Directional)
  const portServicesMap = useMemo((): PortServiceMap => {
      const map: PortServiceMap = {};
      if (!Array.isArray(connectionsResult?.data)) return map;

      const connections = connectionsResult.data as ExtendedConnection[];

      connections.forEach(conn => {
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
    const used = ports.filter(p => p.port_utilization).length;
    const available = ports.filter(p => !p.port_utilization && p.port_admin_status).length;
    const down = ports.filter(p => !p.port_admin_status).length;

    return { total, used, available, down };
  }, [ports]);

  // 6. Mutations
  const { mutate: uploadPorts, isPending: isUploading } = usePortsExcelUpload(supabase, {
    onSuccess: (result) => {
      if (result.successCount > 0) refetch();
    }
  });

  const { mutate: exportPorts, isPending: isExporting } = useTableExcelDownload(supabase, 'v_ports_management_complete');
  const { bulkUpsert } = useTableBulkOperations(supabase, 'ports_management');

  // 7. Configure Columns (Direct call, internal memoization used)
  const columns = PortsManagementTableColumns(ports, portServicesMap);

  const tableActions = useMemo((): TableAction<'v_ports_management_complete'>[] => 
    createStandardActions<V_ports_management_completeRowSchema>({
      onEdit: editModal.openEdit,
      onDelete: crudActions.handleDelete,
      onToggleStatus: (record) => crudActions.handleToggleStatus({ ...record, status: record.port_admin_status }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [editModal.openEdit, crudActions.handleDelete, crudActions.handleToggleStatus]
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
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${system?.system_name}_ports.xlsx`,
      sheetName: 'Ports',
      columns: allExportColumns as Column<Row<TableOrViewName>>[],
      filters: { system_id: systemId }
    });
  }, [exportPorts, system?.system_name, systemId]);

  const handleApplyTemplate = useCallback((templateKey: string) => {
    if (!systemId) return;
    const portsPayload = generatePortsFromTemplate(templateKey, systemId);
    if (portsPayload.length === 0) {
      toast.error("Selected template is empty or invalid.");
      return;
    }
    bulkUpsert.mutate({ data: portsPayload, onConflict: 'system_id,port' }, {
        onSuccess: () => {
          toast.success(`Successfully populated ${portsPayload.length} ports from template.`);
          refetch();
          setIsTemplateModalOpen(false);
        },
        onError: (err) => {
          toast.error(`Failed to populate ports: ${err.message}`);
        }
    });
  }, [systemId, bulkUpsert, refetch]);

  const headerActions = useMemo((): ActionButton[] => {
    const actions: ActionButton[] = [
      {
        label: 'Refresh',
        onClick: () => { refetch(); toast.success('Ports refreshed!'); },
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
        ]
      },
      {
        label: 'Add Port',
        onClick: editModal.openAdd,
        variant: 'primary',
        disabled: isLoading,
      }
    ];
    return actions;
  }, [isLoading, isUploading, isExporting, refetch, handleUploadClick, handleExport, editModal.openAdd]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Ports for: ${system?.system_name}`} size="full">
      <div className="space-y-4">
        {error && <ErrorDisplay error={error.message} />}

        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />

        <PageHeader
            title="System Ports"
            icon={<FiServer />}
            stats={[
                { value: portStats.total, label: 'Total' },
                { value: portStats.used, label: 'Utilized', color: 'primary' },
                { value: portStats.available, label: 'Available', color: 'success' },
                { value: portStats.down, label: 'Down', color: 'danger' }
            ]}
            actions={headerActions}
            isLoading={isLoading}
            isFetching={isFetching}
        />
        
        {/* HEATMAP ADDED HERE */}
        <PortHeatmap ports={ports} onPortClick={editModal.openEdit} />
        
        <DataTable
          tableName="v_ports_management_complete"
          data={ports}
          columns={columns}
          loading={isLoading}
          isFetching={isFetching || isMutating}
          actions={tableActions}
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
          customToolbar={
            <SearchAndFilters
                searchTerm={search.searchQuery}
                onSearchChange={search.setSearchQuery}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onClearFilters={() => { search.setSearchQuery(''); filters.setFilters({}); }}
                hasActiveFilters={Object.keys(filters.filters).length > 0 || !!search.searchQuery}
                activeFilterCount={Object.keys(filters.filters).length}
                searchPlaceholder="Search ports, serials..."
            >
                <SelectFilter 
                    label="Port Type"
                    filterKey="port_type_name"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={portTypeOptions}
                />
                <SelectFilter 
                    label="Utilization"
                    filterKey="port_utilization"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={[
                        { value: 'true', label: 'In Use' },
                        { value: 'false', label: 'Free' }
                    ]}
                />
                <SelectFilter 
                    label="Admin Status"
                    filterKey="port_admin_status"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={[
                        { value: 'true', label: 'Up' },
                        { value: 'false', label: 'Down' }
                    ]}
                />
            </SearchAndFilters>
          }
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