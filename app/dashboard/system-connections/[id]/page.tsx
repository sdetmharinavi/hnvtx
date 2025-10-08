// path: app/dashboard/systems/[id]/page.tsx
"use client";

import { useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useTableRecord, usePagedData } from '@/hooks/database';
import { PageSpinner, ErrorDisplay, ConfirmModal } from '@/components/common/ui';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { FiDatabase } from 'react-icons/fi';
import { DataTable } from '@/components/table';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { toast } from 'sonner';
import { createStandardActions } from '@/components/table/action-helpers';
import { SystemConnectionFormModal } from '@/components/systems/SystemConnectionFormModal';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';

// Data fetching hook for system connections
const useSystemConnectionsData = (params: DataQueryHookParams): DataQueryHookReturn<V_system_connections_completeRowSchema> => {
    const { currentPage, pageLimit, searchQuery, filters } = params;
    const supabase = createClient();
    
    const { data, isLoading, error, refetch } = usePagedData<V_system_connections_completeRowSchema>(
        supabase,
        'v_system_connections_complete',
        {
            filters: { ...filters, ...(searchQuery ? { or: `customer_name.ilike.%${searchQuery}%` } : {}) },
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
    const router = useRouter();
    const systemId = params.id as string;
    const supabase = createClient();

    const { data: system, isLoading: isLoadingSystem } = useTableRecord(supabase, 'v_systems_complete', systemId);

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
        displayNameField: 'id',
    });

    const columns = useMemo(() => SystemsTableColumns(connections), [connections]);

    const tableActions = useMemo(() => createStandardActions<V_system_connections_completeRowSchema>({
        onEdit: editModal.openEdit,
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
    }), [editModal.openEdit, crudActions]);

    const headerActions = useStandardHeaderActions({
        onRefresh: () => { refetch(); toast.success('Connections refreshed!'); },
        onAddNew: editModal.openAdd,
        isLoading: isLoadingConnections,
    });

    if (isLoadingSystem) return <PageSpinner text="Loading System Details..." />;
    if (!system) return <ErrorDisplay error="System not found." />;

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title={system.system_name || 'System Details'}
                description={`Manage connections for ${system.system_type_name} at ${system.node_name}`}
                icon={<FiDatabase />}
                actions={headerActions}
                stats={[
                    { label: "Total Connections", value: totalCount },
                ]}
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
                    onChange: (page, limit) => { pagination.setCurrentPage(page); pagination.setPageLimit(limit); }
                }}
                searchable
                onSearchChange={search.setSearchQuery}
            />

            {editModal.isOpen && (
                <SystemConnectionFormModal
                    isOpen={editModal.isOpen}
                    onClose={editModal.close}
                    parentSystem={system}
                    editingConnection={editModal.record}
                    refetch={refetch}
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