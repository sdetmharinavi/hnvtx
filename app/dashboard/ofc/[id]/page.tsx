// path: app/dashboard/ofc/[id]/page.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PageSpinner } from '@/components/common/ui/LoadingSpinner';
import { DataTable } from '@/components/table';
import { Row, usePagedOfcConnectionsComplete } from '@/hooks/database';
import { Button, ConfirmModal } from '@/components/common/ui';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/config/table-column-keys';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { OfcConnectionRowsWithCount } from '@/types/view-row-types';
import { createStandardActions } from '@/components/table/action-helpers';
import { useIsSuperAdmin } from '@/hooks/useAdminUsers';
import { OfcConnectionsFormModal, OfcConnectionsRow } from '@/components/ofc-details/OfcConnectionsFormModal';
import { FiberTraceModal } from '@/components/ofc-details/FiberTraceModal';
import { GitCommit } from 'lucide-react';
import { useOfcRoutesForSelection, useRouteDetails } from '@/hooks/database/route-manager-hooks';
import CableNotFound from '@/components/ofc-details/CableNotFound';
import OfcDetailsHeader from '@/components/ofc-details/OfcDetailsHeader';
import { useCreateOfcConnection } from '@/hooks/useCreateOfcConnection';
import { useEffect } from 'react';


export const dynamic = 'force-dynamic';

const useOfcConnectionsData = (params: DataQueryHookParams): DataQueryHookReturn<OfcConnectionRowsWithCount> => {
  const { currentPage, pageLimit, searchQuery } = params;
  const supabase = createClient();
  const { id } = useParams();
  const cableId = id as string;

  const { data, isLoading, error, refetch } = usePagedOfcConnectionsComplete(supabase, {
      filters: { ofc_id: cableId, ...(searchQuery ? { or: `system_name.ilike.%${searchQuery}%,connection_type.ilike.%${searchQuery}%` } : {}) },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  const totalCount = data?.[0]?.total_count || 0;
  const activeCount = data?.[0]?.active_count || 0;
  const inactiveCount = data?.[0]?.inactive_count || 0;

  return { data: data || [], totalCount, activeCount, inactiveCount, isLoading, error, refetch };
};

export default function OfcCableDetailsPage() {
  const {
    data: cableConnectionsData, totalCount, activeCount, inactiveCount,
    isLoading, refetch, pagination, editModal, deleteModal, actions: crudActions,
  } = useCrudManager<'ofc_connections', OfcConnectionRowsWithCount>({
    tableName: 'ofc_connections',
    dataQueryHook: useOfcConnectionsData,
  });

  const { id: cableId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const { data: routeDetails, isLoading: isLoadingRouteDetails } = useRouteDetails(cableId as string);
  const { data: allCablesData } = useOfcRoutesForSelection();
  const [tracingFiber, setTracingFiber] = useState<{ cableId: string; fiberNo: number } | null>(null);

  const { ensureConnectionsExist } = useCreateOfcConnection({
    supabase,
    cableId: cableId as string,
    rawConnections: cableConnectionsData,
    refetchOfcConnections: refetch,
    isLoadingOfcConnections: isLoading,
  });

  useEffect(() => {
    if (!isLoading && routeDetails?.route) {
        ensureConnectionsExist();
    }
  }, [isLoading, routeDetails, ensureConnectionsExist]);

  const columns = OfcDetailsTableColumns(cableConnectionsData);
  const orderedColumns = useOrderedColumns(columns, TABLE_COLUMN_KEYS.v_ofc_connections_complete);

  const { data: isSuperAdmin } = useIsSuperAdmin();

  const tableActions = useMemo(
    () => [
        {
            key: 'trace',
            label: 'Trace Fiber Path',
            icon: <GitCommit className="h-4 w-4" />,
            onClick: (record: OfcConnectionRowsWithCount) => {
                if (record.fiber_no_sn) {
                  setTracingFiber({ cableId: cableId as string, fiberNo: record.fiber_no_sn });
                }
            },
            variant: 'secondary' as const
        },
      ...createStandardActions({
        onEdit: editModal.openEdit,
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
        canDelete: () => isSuperAdmin === true,
      }),
    ],
    [editModal.openEdit, crudActions.handleDelete, crudActions.handleToggleStatus, isSuperAdmin, cableId]
  );

  if (isLoading || isLoadingRouteDetails) {
    return <PageSpinner />;
  }

  if (!routeDetails?.route) {
    return <CableNotFound id={cableId as string} handleBackToOfcList={() => router.push('/dashboard/ofc')} isBackClicked={false} />;
  }

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">OFC Cable Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{`Route: ${routeDetails.route.route_name}`}</p>
        </div>
        <div>
          <Link href="/dashboard/ofc" className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Back to List</Link>
        </div>
      </div>
      <OfcDetailsHeader cable={routeDetails.route as unknown as Row<'v_ofc_cables_complete'>} />

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <DataTable<'v_ofc_connections_complete'>
          tableName="v_ofc_connections_complete"
          data={cableConnectionsData as unknown as Row<'v_ofc_connections_complete'>[]}
          columns={orderedColumns}
          loading={isLoading}
          actions={tableActions}
          selectable={true}
          searchable={true}
          pagination={{
            current: pagination.currentPage, pageSize: pagination.pageLimit, total: totalCount,
            showSizeChanger: true, onChange: (page, limit) => { pagination.setCurrentPage(page); pagination.setPageLimit(limit); },
          }}
        />
      </div>
      <OfcConnectionsFormModal isOpen={editModal.isOpen} onClose={editModal.close} editingOfcConnections={editModal.record as OfcConnectionsRow | null} />
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
        isOpen={!!tracingFiber}
        onClose={() => setTracingFiber(null)}
        cableId={tracingFiber?.cableId || null}
        fiberNo={tracingFiber?.fiberNo || null}
        allCables={allCablesData}
      />
    </div>
  );
}