// components/systems/SystemPortsManagerModal.tsx
"use client";

import { useMemo, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ActionButton, PageHeader } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, Modal } from '@/components/common/ui';
import { DataTable, TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { FiServer, FiUpload, FiDownload, FiLayout } from 'react-icons/fi';
import { V_ports_management_completeRowSchema, Ports_managementInsertSchema, V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createStandardActions } from '@/components/table/action-helpers';
import { PortsManagementTableColumns } from '@/config/table-columns/PortsManagementTableColumns';
import { PortsFormModal } from '@/components/systems/PortsFormModal';
import { PortTemplateModal } from '@/components/systems/PortTemplateModal';
import { useTableBulkOperations } from '@/hooks/database';
import { usePortsExcelUpload } from '@/hooks/database/excel-queries/usePortsExcelUpload';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { buildUploadConfig, buildColumnConfig } from '@/constants/table-column-keys';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row, TableOrViewName } from '@/hooks/database';
import { generatePortsFromTemplate } from '@/config/port-templates';
import { usePortsData } from '@/hooks/data/usePortsData'; // THE FIX: Import the new hook
import { formatDate } from '@/utils/formatters';

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

  // THE FIX: Use the factory-created hook with systemId closure
  const {
    data: ports, totalCount, isLoading, isMutating, isFetching, error, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'ports_management', V_ports_management_completeRowSchema>({
    tableName: 'ports_management',
    localTableName: 'v_ports_management_complete', // Specify local view for cleanup
    dataQueryHook: usePortsData(systemId), // Pass systemId to the hook factory
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
      fileName: `${formatDate(new Date(), {
                      format: "dd-mm-yyyy",
                    })}-${system?.system_name}-${system?.system_type_code}_ports.xlsx`,
      sheetName: 'Ports',
      columns: allExportColumns as Column<Row<TableOrViewName>>[],
      filters: { system_id: systemId }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportPorts, system?.system_name, systemId]);

  const handleApplyTemplate = useCallback((templateKey: string) => {
    if (!systemId) return;

    const portsPayload = generatePortsFromTemplate(templateKey, systemId);
    
    if (portsPayload.length === 0) {
      toast.error("Selected template is empty or invalid.");
      return;
    }

    bulkUpsert.mutate(
      { 
        data: portsPayload, 
        onConflict: 'system_id,port'
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