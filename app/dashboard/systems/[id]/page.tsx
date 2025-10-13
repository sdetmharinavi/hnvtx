// path: app/dashboard/systems/[id]/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { usePagedData } from '@/hooks/database';
import { ErrorDisplay, ConfirmModal, PageSpinner } from '@/components/common/ui';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { FiDatabase } from 'react-icons/fi';
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

export default function SystemConnectionsPage() {
  const params = useParams();
  const systemId = params.id as string;
  const supabase = createClient();

  // THE FIX: Manually manage state instead of using useCrudManager
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<V_system_connections_completeRowSchema | null>(null);

  const { data: systemData, isLoading: isLoadingSystem } = usePagedData<V_systems_completeRowSchema>(
    supabase,
    'v_systems_complete',
    { filters: { id: systemId } }
  );
  const parentSystem = systemData?.data?.[0];

  // THE FIX: Call usePagedData directly, passing the necessary systemId filter
  const { data: connectionsData, isLoading: isLoadingConnections, refetch } = usePagedData<V_system_connections_completeRowSchema>(
    supabase,
    'v_system_connections_complete',
    {
      filters: {
        system_id: systemId,
        ...(searchQuery ? { or: { customer_name: searchQuery, connected_system_name: searchQuery } } : {}),
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

  const tableActions = useMemo(
    () => createStandardActions<V_system_connections_completeRowSchema>({
        onEdit: openEditModal,
        onDelete: (record) => deleteManager.deleteSingle({ id: record.id!, name: record.customer_name || record.connected_system_name || 'Connection' }),
        onToggleStatus: (record) => { /* In this table, status toggle is handled via the upsert RPC */ },
      }) as TableAction<'v_system_connections_complete'>[],
    [deleteManager]
  );

  const headerActions = useStandardHeaderActions({
    onRefresh: () => { refetch(); toast.success('Connections refreshed!'); },
    onAddNew: openAddModal,
    isLoading: isLoadingConnections,
    exportConfig: {
        tableName: 'v_system_connections_complete',
        fileName: `${parentSystem?.system_name || 'system'}_connections`,
        filters: { system_id: systemId }
    }
  });

  if (isLoadingSystem) return <PageSpinner text="Loading system details..." />;
  if (!parentSystem) return <ErrorDisplay error="System not found." />;

  const handleSave = (formData: SystemConnectionFormValues) => {
    const payload = {
      p_id: editingRecord?.id ?? undefined,
      p_system_id: parentSystem.id!,
      p_media_type_id: formData.media_type_id,
      p_status: formData.status ?? true,
      p_sn_id: formData.sn_id ?? undefined,
      p_en_id: formData.en_id ?? undefined,
      p_connected_system_id: formData.connected_system_id ?? undefined,
      p_sn_ip: formData.sn_ip ?? undefined,
      p_sn_interface: formData.sn_interface ?? undefined,
      p_en_ip: formData.en_ip ?? undefined,
      p_en_interface: formData.en_interface ?? undefined,
      p_bandwidth_mbps: formData.bandwidth_mbps ?? undefined,
      p_vlan: formData.vlan ?? undefined,
      p_commissioned_on: formData.commissioned_on ?? undefined,
      p_remark: formData.remark ?? undefined,
      p_sfp_port: formData.sfp_port ?? undefined,
      p_sfp_type_id: formData.sfp_type_id ?? undefined,
      p_sfp_capacity: formData.sfp_capacity ?? undefined,
      p_sfp_serial_no: formData.sfp_serial_no ?? undefined,
      p_fiber_in: formData.fiber_in ?? undefined,
      p_fiber_out: formData.fiber_out ?? undefined,
      p_customer_name: formData.customer_name ?? undefined,
      p_bandwidth_allocated_mbps: formData.bandwidth_allocated_mbps ?? undefined,
      p_stm_no: formData.stm_no ?? undefined,
      p_carrier: formData.carrier ?? undefined,
      p_a_slot: formData.a_slot ?? undefined,
      p_a_customer: formData.a_customer ?? undefined,
      p_b_slot: formData.b_slot ?? undefined,
      p_b_customer: formData.b_customer ?? undefined,
      p_subscriber: formData.subscriber ?? undefined,
      p_c_code: formData.c_code ?? undefined,
      p_channel: formData.channel ?? undefined,
      p_tk: formData.tk ?? undefined,
    };

    upsertMutation.mutate(payload, {
      onSuccess: () => {
        refetch();
        closeModal();
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={parentSystem.system_name || 'System Details'}
        description={`Manage connections for ${parentSystem.system_type_name} at ${parentSystem.node_name}`}
        icon={<FiDatabase />}
        actions={headerActions}
        stats={[{ label: 'Total Connections', value: totalCount }]}
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