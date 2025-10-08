// path: app/dashboard/systems/[id]/page.tsx
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { usePagedData } from '@/hooks/database';
import { ErrorDisplay, ConfirmModal } from '@/components/common/ui';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { FiDatabase } from 'react-icons/fi';
import { DataTable, TableAction } from '@/components/table';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import {
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';
import { toast } from 'sonner';
import { createStandardActions } from '@/components/table/action-helpers';
import { SystemConnectionFormModal, SystemConnectionFormValues } from '@/components/systems/SystemConnectionFormModal';
import { SystemConnectionsTableColumns } from '@/config/table-columns/SystemConnectionsTableColumns';
import { useUpsertSystemConnection } from '@/hooks/database/system-connection-hooks';

const useSystemConnectionsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_system_connections_completeRowSchema> => {
  const { currentPage, pageLimit, searchQuery, filters } = params;
  const supabase = createClient();

  const { data, isLoading, error, refetch } = usePagedData<V_system_connections_completeRowSchema>(
    supabase,
    'v_system_connections_complete',
    {
      filters: {
        ...filters,
        ...(searchQuery ? { or: `customer_name.ilike.%${searchQuery}%` } : {}),
      },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  return {
    data: data?.data || [],
    totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0,
    inactiveCount: data?.inactive_count || 0,
    isLoading,
    error,
    refetch,
  };
};

export default function SystemConnectionsPage() {
  const params = useParams();
  const systemId = params.id as string;
  const supabase = createClient();

  const { data: system } = usePagedData<V_systems_completeRowSchema>(
    supabase,
    'v_systems_complete',
    {
      filters: { id: systemId },
    }
  );
  
  // THE FIX: Add the mutation hook to the page.
  const upsertMutation = useUpsertSystemConnection();



  const {
    data: connections,
    totalCount,
    isLoading: isLoadingConnections,
    refetch,
    pagination,
    search,
    editModal,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'system_connections', V_system_connections_completeRowSchema>({
    tableName: 'system_connections',
    dataQueryHook: useSystemConnectionsData,
    displayNameField: ['customer_name', 'connected_system_name', 'system_name'],
  });

  const columns = SystemConnectionsTableColumns(connections);

  const tableActions = useMemo(
    () =>
      createStandardActions<V_system_connections_completeRowSchema>({
        onEdit: editModal.openEdit,
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
      }) as TableAction<'v_system_connections_complete'>[],
    [editModal.openEdit, crudActions.handleDelete, crudActions.handleToggleStatus]
  );

  const headerActions = useStandardHeaderActions({
    onRefresh: () => {
      refetch();
      toast.success('Connections refreshed!');
    },
    onAddNew: editModal.openAdd,
    isLoading: isLoadingConnections,
  });

  const parentSystem = system?.data?.[0];

  // Early return if system not found or still loading
  if (!parentSystem) return <ErrorDisplay error="System not found." />;

  // THE FIX: New save handler to construct payload and call mutation.
  const handleSave = (formData: SystemConnectionFormValues) => {
    const payload = {
      p_id: editModal.record?.id ?? undefined,
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
        editModal.close();
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
      />

      {editModal.isOpen && (
        <SystemConnectionFormModal
          isOpen={editModal.isOpen}
          onClose={editModal.close}
          parentSystem={parentSystem}
          editingConnection={editModal.record}
          onSubmit={handleSave}
          isLoading={upsertMutation.isPending}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Delete"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />
    </div>
  );
}