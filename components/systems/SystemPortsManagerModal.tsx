// components/systems/SystemPortsManagerModal.tsx
"use client";

import { useMemo, useRef, useCallback, useState } from 'react'; // Added useState
import { toast } from 'sonner';
import { ActionButton, PageHeader } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Modal } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { FiServer, FiUpload, FiDownload, FiLayout } from 'react-icons/fi'; // Changed FiZap to FiLayout
import { V_ports_management_completeRowSchema, Ports_managementInsertSchema, V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import { PortsManagementTableColumns } from '@/config/table-columns/PortsManagementTableColumns';
import { PortsFormModal } from '@/components/systems/PortsFormModal';
import { PortTemplateModal } from '@/components/systems/PortTemplateModal'; // Import the new modal
import { usePagedData, useTableBulkOperations } from '@/hooks/database';
import { usePortsExcelUpload } from '@/hooks/database/excel-queries/usePortsExcelUpload';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { buildUploadConfig, buildColumnConfig } from '@/constants/table-column-keys';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row, TableOrViewName } from '@/hooks/database';
import { generatePortsFromTemplate } from '@/config/port-templates'; // Updated import

// --- Factory that returns a properly named custom hook ---
const createPortsDataHook = (systemId: string | null) => {
  function usePortsDataInner(
    params: DataQueryHookParams
  ): DataQueryHookReturn<V_ports_management_completeRowSchema> {
    const { currentPage, pageLimit, searchQuery, filters } = params;

    const { data, isLoading, isFetching, error, refetch } =
      usePagedData<V_ports_management_completeRowSchema>(
        createClient(),
        'v_ports_management_complete',
        {
          filters: { ...filters, system_id: systemId || '' },
          limit: 5000,
          offset: 0,
        },
        { enabled: !!systemId }
      );

    const processedData = useMemo(() => {
      const allPorts = data?.data ?? [];
      let filtered = allPorts;

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((p) =>
          p.port?.toLowerCase().includes(lowerQuery) ||
          p.port_type_name?.toLowerCase().includes(lowerQuery) ||
          p.sfp_serial_no?.toLowerCase().includes(lowerQuery)
        );
      }

      filtered.sort((a, b) =>
        (a.port || '').localeCompare(b.port || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );

      const totalCount = filtered.length;
      const start = (currentPage - 1) * pageLimit;
      const end = start + pageLimit;
      const paginatedData = filtered.slice(start, end);

      return {
        data: paginatedData,
        totalCount,
        activeCount: totalCount,
        inactiveCount: 0,
      };
    }, [data, searchQuery, currentPage, pageLimit]);

    return {
      ...processedData,
      isLoading,
      isFetching,
      error: error as Error | null,
      refetch,
    };
  }

  return usePortsDataInner;
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

  // State for Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const {
    data: ports, totalCount, isLoading, isMutating, isFetching, error, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'ports_management', V_ports_management_completeRowSchema>({
    tableName: 'ports_management',
    dataQueryHook: createPortsDataHook(systemId),
    displayNameField: 'port',
  });

  const { mutate: uploadPorts, isPending: isUploading } = usePortsExcelUpload(supabase, {
    onSuccess: (result) => {
      if (result.successCount > 0) refetch();
    }
  });

  const { mutate: exportPorts, isPending: isExporting } = useTableExcelDownload(supabase, 'v_ports_management_complete');

  // Bulk Operations Hook
  const { bulkUpsert } = useTableBulkOperations(supabase, 'ports_management');

  const columns = PortsManagementTableColumns(ports);

  const tableActions = useMemo((): TableAction<'v_ports_management_complete'>[] => 
    createStandardActions<V_ports_management_completeRowSchema>({
      onEdit: editModal.openEdit,
      onDelete: crudActions.handleDelete,
    }), [editModal.openEdit, crudActions.handleDelete]
  );
  
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
      fileName: `${system?.system_name}_ports.xlsx`,
      sheetName: 'Ports',
      columns: allExportColumns as Column<Row<TableOrViewName>>[],
      filters: { system_id: systemId }
    });
  }, [exportPorts, system?.system_name, systemId]);

  // New Handler for Template Application
  const handleApplyTemplate = useCallback((templateKey: string) => {
    if (!systemId) return;

    // 1. Generate data (NOW WITHOUT IDs)
    const portsPayload = generatePortsFromTemplate(templateKey, systemId);
    
    if (portsPayload.length === 0) {
      toast.error("Selected template is empty or invalid.");
      return;
    }

    // 2. Pass data + onConflict config
    bulkUpsert.mutate(
      { 
        data: portsPayload, 
        onConflict: 'system_id,port'  // <--- CRITICAL FIX
      }, 
      {
        onSuccess: () => {
          toast.success(`Successfully populated ${portsPayload.length} ports from template.`);
          refetch();
          setIsTemplateModalOpen(false);
        },
        onError: (err) => {
          toast.error(`Failed to populate ports: ${err.message}`);
        }
      }
    );
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
        label: 'Upload',
        loadingText: 'Uploading...',
        onClick: handleUploadClick,
        variant: 'outline',
        leftIcon: <FiUpload />,
        loading: isUploading,
        disabled: isLoading,
      },
      {
        label: 'Export',
        loadingText: 'Exporting...',
        onClick: handleExport,
        variant: 'outline',
        leftIcon: <FiDownload />,
        loading: isExporting,
        disabled: isLoading,
      },
      // Changed: Button now opens the Template Selection Modal
      {
        label: 'Apply Template',
        onClick: () => setIsTemplateModalOpen(true),
        variant: 'outline', 
        leftIcon: <FiLayout className="text-purple-500" />,
        disabled: isLoading
      },
      {
        label: 'Add New Port',
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

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".xlsx, .xls"
        />

        <PageHeader
            title="System Ports"
            icon={<FiServer />}
            stats={[{ value: totalCount, label: 'Total Ports' }]}
            actions={headerActions}
            isLoading={isLoading}
            isFetching={isFetching}
        />
        
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
          searchable
          onSearchChange={search.setSearchQuery}
          sortable={false}
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
        
        {/* Template Selection Modal */}
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