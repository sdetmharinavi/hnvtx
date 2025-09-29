// path: app/dashboard/ofc/[id]/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PageSpinner } from "@/components/common/ui/LoadingSpinner";
import { DataTable } from "@/components/table";
import { Row, usePagedData, useTableQuery } from "@/hooks/database";
import { ConfirmModal } from "@/components/common/ui";
import { OfcDetailsTableColumns } from "@/config/table-columns/OfcDetailsTableColumns";
import useOrderedColumns from "@/hooks/useOrderedColumns";
import { TABLE_COLUMN_KEYS } from "@/config/table-column-keys";
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from "@/hooks/useCrudManager";
import { createStandardActions } from "@/components/table/action-helpers";
import { useIsSuperAdmin } from "@/hooks/useAdminUsers";
import { OfcConnectionsFormModal } from "@/components/ofc-details/OfcConnectionsFormModal";
import { FiberTraceModal } from "@/components/ofc-details/FiberTraceModal";
import { GitCommit } from "lucide-react";
import { useOfcRoutesForSelection, useRouteDetails } from "@/hooks/database/route-manager-hooks";
import CableNotFound from "@/components/ofc-details/CableNotFound";
import OfcDetailsHeader from "@/components/ofc-details/OfcDetailsHeader";
import { useCreateOfcConnection } from "@/hooks/useCreateOfcConnection";
import { toast } from "sonner";
import { Ofc_connectionsRowSchema, V_ofc_cables_completeRowSchema, V_ofc_connections_completeRowSchema } from "@/schemas/zod-schemas";

export const dynamic = "force-dynamic";

const useOfcConnectionsData = (params: DataQueryHookParams): DataQueryHookReturn<V_ofc_connections_completeRowSchema> => {
  const { currentPage, pageLimit, searchQuery } = params;
  const supabase = createClient();
  const { id } = useParams();
  const cableId = id as string;

  const { data, isLoading, error, refetch } = usePagedData<V_ofc_connections_completeRowSchema>(supabase, "v_ofc_connections_complete", {
    filters: { ofc_id: cableId, ...(searchQuery ? { or: `system_name.ilike.%${searchQuery}%,connection_type.ilike.%${searchQuery}%` } : {}) },
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit,
    orderBy: "fiber_no_sn",
    orderDir: "asc",
  });

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

export default function OfcCableDetailsPage() {
  const {
    data: cableConnectionsData,
    totalCount,
    isLoading,
    refetch,
    pagination,
    editModal,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<"ofc_connections", V_ofc_connections_completeRowSchema>({
    tableName: "ofc_connections",
    dataQueryHook: useOfcConnectionsData,
  });

  const { id: cableId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const { data: routeDetails, isLoading: isLoadingRouteDetails } = useRouteDetails(cableId as string);
  const { data: allCablesData } = useOfcRoutesForSelection();

  // CORRECTED: This state now correctly stores the CABLE ID and fiber number.
  const [tracingFiber, setTracingFiber] = useState<{ startSegmentId: string; fiberNo: number } | null>(null);

  // NEW: Fetch the segments specifically for the current cable being viewed.
  const { data: cableSegments, isLoading: isLoadingSegments } = useTableQuery(createClient(), "cable_segments", {
    filters: { original_cable_id: cableId as string },
    orderBy: [{ column: "segment_order", ascending: true }],
  });

  const { ensureConnectionsExist } = useCreateOfcConnection({
    supabase,
    cableId: cableId as string,
    rawConnections: cableConnectionsData as Ofc_connectionsRowSchema[],
    refetchOfcConnections: refetch,
    isLoadingOfcConnections: isLoading,
  });

  useEffect(() => {
    if (!isLoading && routeDetails?.route) {
      ensureConnectionsExist();
    }
  }, [isLoading, routeDetails, ensureConnectionsExist]);

  const columns = OfcDetailsTableColumns(cableConnectionsData);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_ofc_connections_complete]);

  const { data: isSuperAdmin } = useIsSuperAdmin();

  const tableActions = useMemo(
    () => [
      {
        key: "trace",
        label: "Trace Fiber Path",
        icon: <GitCommit className='h-4 w-4' />,
        onClick: (record: V_ofc_connections_completeRowSchema) => {
          // Find the very first segment of this cable route. This is our starting point.
          const firstSegment = cableSegments?.find((s) => s.segment_order === 1);

          if (firstSegment && record.fiber_no_sn) {
            // Initiate the trace from the first segment of this cable.
            setTracingFiber({ startSegmentId: firstSegment.id, fiberNo: record.fiber_no_sn });
          } else {
            toast.error("Cannot trace fiber: No cable segments found for this route or fiber number is missing.");
          }
        },
        variant: "secondary" as const,
      },
      ...createStandardActions({
        onEdit: editModal.openEdit,
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
        canDelete: () => isSuperAdmin === true,
      }),
    ],
    [editModal.openEdit, crudActions.handleDelete, crudActions.handleToggleStatus, isSuperAdmin, cableSegments]
  );

  if (isLoading || isLoadingRouteDetails) {
    return <PageSpinner />;
  }

  if (!routeDetails?.route) {
    return <CableNotFound id={cableId as string} handleBackToOfcList={() => router.push("/dashboard/ofc")} isBackClicked={false} />;
  }

  return (
    <div className='mx-auto space-y-6 p-4 md:p-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl md:text-3xl font-bold text-gray-800 dark:text-white'>OFC Cable Details</h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>{`Route: ${routeDetails.route.route_name}`}</p>
        </div>
        <div>
          <Link href='/dashboard/ofc' className='px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'>
            Back to List
          </Link>
        </div>
      </div>
      <OfcDetailsHeader cable={routeDetails.route as unknown as V_ofc_cables_completeRowSchema} />

      <div className='rounded-lg border border-gray-200 dark:border-gray-700 p-4'>
        <DataTable<"v_ofc_connections_complete">
          tableName='v_ofc_connections_complete'
          data={cableConnectionsData as unknown as Row<"v_ofc_connections_complete">[]}
          columns={orderedColumns}
          loading={isLoading}
          actions={tableActions}
          selectable={true}
          searchable={true}
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
        />
      </div>
      <OfcConnectionsFormModal isOpen={editModal.isOpen} onClose={editModal.close} editingOfcConnections={editModal.record as Ofc_connectionsRowSchema | null} />
      <ConfirmModal isOpen={deleteModal.isOpen} onConfirm={deleteModal.onConfirm} onCancel={deleteModal.onCancel} title='Confirm Deletion' message={deleteModal.message} type='danger' loading={deleteModal.loading} />
      <FiberTraceModal isOpen={!!tracingFiber} onClose={() => setTracingFiber(null)} startSegmentId={tracingFiber?.startSegmentId || null} fiberNo={tracingFiber?.fiberNo || null} allCables={allCablesData} />
    </div>
  );
}
