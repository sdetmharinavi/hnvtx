// path: app/dashboard/systems/[id]/page.tsx
'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { usePagedData, RpcFunctionArgs } from '@/hooks/database';
import { ErrorDisplay, ConfirmModal, PageSpinner } from '@/components/common/ui';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { FiDatabase, FiUpload } from 'react-icons/fi';
import { DataTable, TableAction } from '@/components/table';
import {
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { toast } from 'sonner';
import { createStandardActions } from '@/components/table/action-helpers';
import { SystemConnectionFormModal, SystemConnectionFormValues } from '@/components/systems/SystemConnectionFormModal';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { useUpsertSystemConnection } from '@/hooks/database/system-connection-hooks';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { DEFAULTS } from '@/constants/constants';
import { buildUploadConfig } from '@/constants/table-column-keys';
import { useSystemConnectionExcelUpload } from '@/hooks/database/excel-queries/useSystemConnectionExcelUpload';

export default function SystemConnectionsPage() {
  const params = useParams();
  const systemId = params.id as string;
  const supabase = createClient();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<V_system_connections_completeRowSchema | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: systemData, isLoading: isLoadingSystem } = usePagedData<V_systems_completeRowSchema>(
    supabase,
    'v_systems_complete',
    { filters: { id: systemId } }
  );
  const parentSystem = systemData?.data?.[0];

  const { data: connectionsData, isLoading: isLoadingConnections, refetch } = usePagedData<V_system_connections_completeRowSchema>(
    supabase,
    'v_system_connections_complete',
    {
      filters: {
        system_id: systemId,
        ...(searchQuery ? { or: `(customer_name.ilike.%${searchQuery}%,connected_system_name.ilike.%${searchQuery}%)` } : {}),
      },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  const connections = connectionsData?.data || [];
  const totalCount = connectionsData?.total_count || 0;

  const upsertMutation = useUpsertSystemConnection();
  const deleteManager = useDeleteManager({
    tableName: 'system_connections',
    onSuccess: () => refetch(),
  });

  const { mutate: uploadConnections, isPending: isUploading } = useSystemConnectionExcelUpload(supabase, {
    onSuccess: (result) => {
      if (result.successCount > 0) refetch();
    }
  });

  const columns = SystemConnectionsTableColumns(connections);

  const openEditModal = (record: V_system_connections_completeRowSchema) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };
  const openAddModal = () => {
    setEditingRecord(null);
    setIsEditModalOpen(true);
  };
  const closeModal = () => {
    setEditingRecord(null);
    setIsEditModalOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && parentSystem?.id) {
      const uploadConfig = buildUploadConfig('v_system_connections_complete');
      
      uploadConnections({
        file,
        columns: uploadConfig.columnMapping,
        parentSystemId: parentSystem.id,
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const tableActions = useMemo(
    () => createStandardActions<V_system_connections_completeRowSchema>({
        onEdit: openEditModal,
        onDelete: (record) => deleteManager.deleteSingle({ id: record.id!, name: record.customer_name || record.connected_system_name || 'Connection' }),
      }) as TableAction<'v_system_connections_complete'>[],
    [deleteManager]
  );

  // This hook call is now simplified as it doesn't need export logic
  const headerActions = useStandardHeaderActions({
    onRefresh: () => { refetch(); toast.success('Connections refreshed!'); },
    onAddNew: openAddModal,
    isLoading: isLoadingConnections,
  });

  if (isLoadingSystem) return <PageSpinner text="Loading system details..." />;
  if (!parentSystem) return <ErrorDisplay error="System not found." />;

  // --- THIS IS THE FIX ---
  // The handleSave function now constructs the full payload for the updated RPC.
  const handleSave = (formData: SystemConnectionFormValues) => {
    const payload: RpcFunctionArgs<'upsert_system_connection_with_details'> = {
      p_id: editingRecord?.id ?? undefined,
      p_system_id: parentSystem.id!,
      p_media_type_id: formData.media_type_id!,
      p_status: formData.status ?? true,
      p_sn_id: formData.sn_id || undefined,
      p_en_id: formData.en_id || undefined,
      p_connected_system_id: formData.connected_system_id || undefined,
      p_sn_ip: formData.sn_ip || undefined,
      p_sn_interface: formData.sn_interface || undefined,
      p_en_ip: formData.en_ip || undefined,
      p_en_interface: formData.en_interface || undefined,
      p_bandwidth_mbps: formData.bandwidth_mbps || undefined,
      p_vlan: formData.vlan || undefined,
      p_commissioned_on: formData.commissioned_on || undefined,
      p_remark: formData.remark || undefined,
      p_customer_name: formData.customer_name || undefined,
      p_bandwidth_allocated_mbps: formData.bandwidth_allocated_mbps || undefined,
      p_working_fiber_in: formData.working_fiber_in || undefined,
      p_working_fiber_out: formData.working_fiber_out || undefined,
      p_protection_fiber_in: formData.protection_fiber_in || undefined,
      p_protection_fiber_out: formData.protection_fiber_out || undefined,
      p_connected_system_working_interface: formData.connected_system_working_interface || undefined,
      p_connected_system_protection_interface: formData.connected_system_protection_interface || undefined,
      p_connected_link_type_id: formData.connected_link_type_id || undefined,
      p_stm_no: formData.stm_no || undefined,
      p_carrier: formData.carrier || undefined,
      p_a_slot: formData.a_slot || undefined,
      p_a_customer: formData.a_customer || undefined,
      p_b_slot: formData.b_slot || undefined,
      p_b_customer: formData.b_customer || undefined,
    };

    upsertMutation.mutate(payload, {
      onSuccess: () => {
        refetch();
        closeModal();
      }
    });
  };
  // --- END FIX ---

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={parentSystem.system_name || 'System Details'}
        description={`Manage connections for ${parentSystem.system_type_name} at ${parentSystem.node_name}`}
        icon={<FiDatabase />}
        actions={headerActions}
        stats={[{ label: 'Total Connections', value: totalCount }]}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />

      <DataTable
        tableName="v_system_connections_complete"
        data={connections}
        columns={columns}
        loading={isLoadingConnections}
        actions={tableActions}
        pagination={{
          current: currentPage,
          pageSize: pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
            setCurrentPage(page);
            setPageLimit(limit);
          },
        }}
        searchable
        onSearchChange={setSearchQuery}
      />

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
    </div>
  );
}