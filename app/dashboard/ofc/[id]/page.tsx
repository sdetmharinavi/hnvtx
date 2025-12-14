// path: app/dashboard/ofc/[id]/page.tsx
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PageSpinner, ConfirmModal, StatusBadge } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { Row, useTableQuery } from '@/hooks/database';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useCrudManager } from '@/hooks/useCrudManager';
import { createStandardActions } from '@/components/table/action-helpers';
import { OfcConnectionsFormModal } from '@/components/ofc-details/OfcConnectionsFormModal';
import { FiberTraceModal } from '@/components/ofc-details/FiberTraceModal';
import { GitCommit, GitBranch } from 'lucide-react';
import { useOfcRoutesForSelection, useRouteDetails } from '@/hooks/database/route-manager-hooks';
import CableNotFound from '@/components/ofc-details/CableNotFound';
import OfcDetailsHeader from '@/components/ofc-details/OfcDetailsHeader';
import { useCreateOfcConnection } from '@/hooks/useCreateOfcConnection';
import { toast } from 'sonner';
import {
  Ofc_connectionsRowSchema,
  V_ofc_cables_completeRowSchema,
  V_ofc_connections_completeRowSchema,
} from '@/schemas/zod-schemas';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { StatProps } from '@/components/common/page-header/StatCard';
import { useUser } from '@/providers/UserProvider';
import { useOfcConnectionsData } from '@/hooks/data/useOfcConnectionsData';
import { FiActivity, FiArrowRight } from 'react-icons/fi';
import { UserRole } from '@/types/user-roles';

export default function OfcCableDetailsPage() {
  const { id: cableId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { isSuperAdmin, role } = useUser();

  const {
    data: cableConnectionsData,
    isLoading,
    refetch,
    pagination,
    editModal,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'ofc_connections', V_ofc_connections_completeRowSchema>({
    tableName: 'ofc_connections',
    dataQueryHook: useOfcConnectionsData(cableId as string),
    displayNameField: ['system_name', 'ofc_route_name'],
  });

  // --- PERMISSIONS ---
  const canEdit = !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ASSETADMIN;
  // Strictly Super Admin for deletion of fibers (should come from capacity)
  const canDelete = !!isSuperAdmin;
  // Adding new fibers manually is also restricted
  const canAdd = !!isSuperAdmin;

  const { data: routeDetails, isLoading: isLoadingRouteDetails } = useRouteDetails(
    cableId as string
  );
  const { data: allCablesData } = useOfcRoutesForSelection();

  const { data: utilResult } = useTableQuery(supabase, 'v_cable_utilization', {
    filters: { cable_id: cableId as string },
    limit: 1,
  });
  const utilization = utilResult?.data?.[0];

  const [tracingFiber, setTracingFiber] = useState<{
    startSegmentId: string;
    fiberNo: number;
    record?: V_ofc_connections_completeRowSchema;
  } | null>(null);

  const { data: cableSegments } = useTableQuery(createClient(), 'cable_segments', {
    filters: { original_cable_id: cableId as string },
    orderBy: [{ column: 'segment_order', ascending: true }],
  });

  const { ensureConnectionsExist } = useCreateOfcConnection({
    supabase,
    cableId: cableId as string,
    refetchOfcConnections: refetch,
    isLoadingOfcConnections: isLoading,
  });

  useEffect(() => {
    if (!isLoading && routeDetails?.route) {
      ensureConnectionsExist();
    }
  }, [isLoading, routeDetails, ensureConnectionsExist]);

  const columns = OfcDetailsTableColumns(cableConnectionsData);
  const orderedColumns = useOrderedColumns(columns, [
    ...TABLE_COLUMN_KEYS.v_ofc_connections_complete,
  ]);

  const tableActions = useMemo(
    () => [
      {
        key: 'trace',
        label: 'Trace Fiber Path',
        icon: <GitCommit className="h-4 w-4" />,
        onClick: (record: V_ofc_connections_completeRowSchema) => {
          const firstSegment = cableSegments?.data.find((s) => s.segment_order === 1);
          if (firstSegment && record.fiber_no_sn) {
            setTracingFiber({
              startSegmentId: firstSegment.id,
              fiberNo: record.fiber_no_sn,
              record,
            });
          } else {
            toast.error(
              'Cannot trace fiber: No cable segments found for this route or fiber number is missing.'
            );
          }
        },
        variant: 'secondary' as const,
      },
      ...createStandardActions({
        // Conditionally allow editing
        onEdit: canEdit ? editModal.openEdit : undefined,
        // Conditionally allow deletion
        onDelete: canDelete ? crudActions.handleDelete : undefined,
        onToggleStatus: canEdit ? crudActions.handleToggleStatus : undefined,
      }),
    ],
    [
      editModal.openEdit,
      crudActions.handleDelete,
      crudActions.handleToggleStatus,
      canEdit,
      canDelete,
      cableSegments,
    ]
  );

  const headerActions = useStandardHeaderActions({
    data: cableConnectionsData as Ofc_connectionsRowSchema[],
    onRefresh: async () => {
      await refetch();
      toast.success('Connections refreshed!');
    },
    // Conditionally allow adding new fibers
    onAddNew: canAdd ? editModal.openAdd : undefined,
    isLoading: isLoading,
    exportConfig: {
      tableName: 'ofc_connections',
      fileName: `${routeDetails?.route.route_name}_connections`,
      filters: { ofc_id: { operator: 'eq', value: cableId as string } },
    },
  });

  const headerStats: StatProps[] = useMemo(() => {
    const utilPercent = utilization?.utilization_percent ?? 0;
    return [
      { value: utilization?.capacity ?? 0, label: 'Total Capacity', color: 'default' },
      { value: utilization?.used_fibers ?? 0, label: 'Utilized', color: 'primary' },
      { value: utilization?.available_fibers ?? 0, label: 'Available', color: 'success' },
      { value: `${utilPercent}%`, label: 'Utilization', color: utilPercent > 80 ? 'warning' : 'default' },
    ];
  }, [utilization]);

  const renderMobileItem = useCallback(
    (record: Row<'v_ofc_connections_complete'>, actions: React.ReactNode) => {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                F{record.fiber_no_sn}
              </span>
              {record.fiber_no_sn !== record.fiber_no_en && (
                <>
                  <FiArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                    F{record.fiber_no_en}
                  </span>
                </>
              )}
            </div>
            {actions}
          </div>

          <div className="min-w-0 mt-1">
            {record.system_name ? (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {record.system_name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                  <span className="uppercase font-bold tracking-wider">
                    {record.connection_type || 'Connection'}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">Unallocated Fiber</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-xs bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700">
            <div>
              <span className="block text-gray-400 text-[10px] uppercase">End A (Node)</span>
              <div className="truncate font-medium text-gray-700 dark:text-gray-300">
                {record.updated_sn_name || 'N/A'}
              </div>
              <div className="text-gray-500 mt-0.5">
                {record.otdr_distance_sn_km ? `${record.otdr_distance_sn_km} km` : '-'}
              </div>
            </div>
            <div>
              <span className="block text-gray-400 text-[10px] uppercase">End B (Node)</span>
              <div className="truncate font-medium text-gray-700 dark:text-gray-300">
                {record.updated_en_name || 'N/A'}
              </div>
              <div className="text-gray-500 mt-0.5">
                {record.otdr_distance_en_km ? `${record.otdr_distance_en_km} km` : '-'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <FiActivity className="w-3.5 h-3.5" />
              <span>Loss: {record.route_loss_db ? `${record.route_loss_db} dB` : '-'}</span>
            </div>
            <StatusBadge status={record.status ?? false} />
          </div>
        </div>
      );
    },
    []
  );

  if (isLoading || isLoadingRouteDetails) return <PageSpinner />;

  if (!routeDetails?.route) {
    return (
      <CableNotFound
        id={cableId as string}
        handleBackToOfcList={() => router.push('/dashboard/ofc')}
        isBackClicked={false}
      />
    );
  }

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <PageHeader
        title="OFC Cable Details"
        description={`Managing connections for route: ${routeDetails.route.route_name}`}
        icon={<GitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
      />

      <OfcDetailsHeader cable={routeDetails.route as V_ofc_cables_completeRowSchema} />

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DataTable<'v_ofc_connections_complete'>
          autoHideEmptyColumns={true}
          tableName="v_ofc_connections_complete"
          data={cableConnectionsData as Row<'v_ofc_connections_complete'>[]}
          columns={orderedColumns}
          loading={isLoading}
          actions={tableActions}
          // THE FIX: Restrict bulk selection
          selectable={canDelete}
          searchable={true}
          renderMobileItem={renderMobileItem}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: utilization?.capacity ?? 0,
            showSizeChanger: true,
            onChange: (page, limit) => {
              pagination.setCurrentPage(page);
              pagination.setPageLimit(limit);
            },
          }}
        />
      </div>
      <OfcConnectionsFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        editingOfcConnections={editModal.record as Ofc_connectionsRowSchema | null}
        onCreated={crudActions.handleSave}
        onUpdated={crudActions.handleSave}
      />
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.loading}
      />
      <FiberTraceModal
        refetch={refetch}
        isOpen={!!tracingFiber}
        onClose={() => setTracingFiber(null)}
        startSegmentId={tracingFiber?.startSegmentId || null}
        fiberNo={tracingFiber?.fiberNo || null}
        allCables={allCablesData}
        record={tracingFiber?.record}
      />
    </div>
  );
}