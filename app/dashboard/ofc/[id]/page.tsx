// path: app/dashboard/ofc/[id]/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { PageSpinner, ConfirmModal } from "@/components/common/ui";
import { DataTable } from "@/components/table";
import { Row, usePagedData, useTableQuery } from "@/hooks/database";
import { OfcDetailsTableColumns } from "@/config/table-columns/OfcDetailsTableColumns";
import useOrderedColumns from "@/hooks/useOrderedColumns";
import { TABLE_COLUMN_KEYS } from "@/config/table-column-keys";
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from "@/hooks/useCrudManager";
import { createStandardActions } from "@/components/table/action-helpers";
import { useIsSuperAdmin } from "@/hooks/useAdminUsers";
import { OfcConnectionsFormModal } from "@/components/ofc-details/OfcConnectionsFormModal";
import { FiberTraceModal } from "@/components/ofc-details/FiberTraceModal";
import { GitCommit, GitBranch } from "lucide-react"; // Changed icon for better context
import { useOfcRoutesForSelection, useRouteDetails } from "@/hooks/database/route-manager-hooks";
import CableNotFound from "@/components/ofc-details/CableNotFound";
import OfcDetailsHeader from "@/components/ofc-details/OfcDetailsHeader";
import { useCreateOfcConnection } from "@/hooks/useCreateOfcConnection";
import { toast } from "sonner";
import { Ofc_connectionsInsertSchema, Ofc_connectionsRowSchema, V_ofc_cables_completeRowSchema, V_ofc_connections_completeRowSchema } from "@/schemas/zod-schemas";
import { PageHeader, useStandardHeaderActions } from "@/components/common/page-header"; // Import PageHeader components

export const dynamic = "force-dynamic";

// Data fetching hook remains the same
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
    activeCount,
    inactiveCount,
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

  const [tracingFiber, setTracingFiber] = useState<{ startSegmentId: string; fiberNo: number; record?: V_ofc_connections_completeRowSchema } | null>(null);

  const { data: cableSegments } = useTableQuery(createClient(), "cable_segments", {
    filters: { original_cable_id: cableId as string },
    orderBy: [{ column: "segment_order", ascending: true }],
  });

  const { ensureConnectionsExist } = useCreateOfcConnection({
    supabase,
    cableId: cableId as string,
    rawConnections: cableConnectionsData as Ofc_connectionsInsertSchema[],
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
          const firstSegment = cableSegments?.data.find((s) => s.segment_order === 1);
          if (firstSegment && record.fiber_no_sn) {
            setTracingFiber({ startSegmentId: firstSegment.id, fiberNo: record.fiber_no_sn, record });
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

  const headerActions = useStandardHeaderActions({
    data: cableConnectionsData as Ofc_connectionsRowSchema[],
    onRefresh: async () => { await refetch(); toast.success('Connections refreshed!'); },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: {
      tableName: 'ofc_connections',
      fileName: `${routeDetails?.route.route_name}_connections`,
      filters: { ofc_id: { operator: 'eq', value: cableId as string } }
    },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Connections' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  if (isLoading || isLoadingRouteDetails) {
    return <PageSpinner />;
  }

  if (!routeDetails?.route) {
    return <CableNotFound id={cableId as string} handleBackToOfcList={() => router.push("/dashboard/ofc")} isBackClicked={false} />;
  }

  return (
    <div className='mx-auto space-y-6 p-4 md:p-6'>
      {/* --- REPLACED: Old header is replaced with PageHeader --- */}
      <PageHeader
        title="OFC Cable Details"
        description={`Managing connections for route: ${routeDetails.route.route_name}`}
        icon={<GitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
      />
      {/* --- END REPLACEMENT --- */}

      <OfcDetailsHeader cable={routeDetails.route as V_ofc_cables_completeRowSchema} />

      <div className='rounded-lg border border-gray-200 dark:border-gray-700 p-4'>
        <DataTable<"v_ofc_connections_complete">
          tableName='v_ofc_connections_complete'
          data={cableConnectionsData as Row<"v_ofc_connections_complete">[]}
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
      <OfcConnectionsFormModal isOpen={editModal.isOpen} onClose={editModal.close} editingOfcConnections={editModal.record as Ofc_connectionsRowSchema | null} onCreated={crudActions.handleSave} onUpdated={crudActions.handleSave} />
      <ConfirmModal isOpen={deleteModal.isOpen} onConfirm={deleteModal.onConfirm} onCancel={deleteModal.onCancel} title='Confirm Deletion' message={deleteModal.message} type='danger' loading={deleteModal.loading} />
      <FiberTraceModal refetch={refetch} isOpen={!!tracingFiber} onClose={() => setTracingFiber(null)} startSegmentId={tracingFiber?.startSegmentId || null} fiberNo={tracingFiber?.fiberNo || null} allCables={allCablesData} record={tracingFiber?.record} />
    </div>
  );
}