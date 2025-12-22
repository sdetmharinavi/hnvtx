// path: app/dashboard/ofc/[id]/page.tsx
'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PageSpinner, ConfirmModal, Input, Button } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { Row, useTableQuery } from '@/hooks/database';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS, buildUploadConfig } from '@/constants/table-column-keys';
import { useCrudManager } from '@/hooks/useCrudManager';
import { createStandardActions } from '@/components/table/action-helpers';
import { OfcConnectionsFormModal } from '@/components/ofc-details/OfcConnectionsFormModal';
import { FiberTraceModal } from '@/components/ofc-details/FiberTraceModal';
import { FiberAssignmentModal } from '@/components/ofc-details/FiberAssignmentModal';
import { 
  GitCommit, 
  Search, 
  Grid, 
  List, 
  Trash2, 
  Edit2, 
  Link as LinkIcon, 
  Unlink, 
  Upload,
  GitBranch
} from 'lucide-react';
import { useOfcRoutesForSelection, useRouteDetails } from '@/hooks/database/route-manager-hooks';
import CableNotFound from '@/components/ofc-details/CableNotFound';
import OfcDetailsHeader from '@/components/ofc-details/OfcDetailsHeader';
import { toast } from 'sonner';
import {
  Ofc_connectionsInsertSchema,
  Ofc_connectionsRowSchema,
  V_ofc_cables_completeRowSchema,
  V_ofc_connections_completeRowSchema,
  Ofc_cablesRowSchema,
} from '@/schemas/zod-schemas';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { StatProps } from '@/components/common/page-header/StatCard';
import { useUser } from '@/providers/UserProvider';
import { useOfcConnectionsData } from '@/hooks/data/useOfcConnectionsData';
import { UserRole } from '@/types/user-roles';
import { FiberConnectionCard } from '@/components/ofc-details/FiberConnectionCard';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { FancyEmptyState } from '@/components/common/ui/FancyEmptyState';
import { useReleaseFiber } from '@/hooks/database/fiber-assignment-hooks';
import { useOfcConnectionsExcelUpload } from '@/hooks/database/excel-queries/useOfcConnectionsExcelUpload';
import { useCreateOfcConnection } from '@/hooks/database/ofc-connections-hooks';

export default function OfcCableDetailsPage() {
  const { id: cableId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { isSuperAdmin, role } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const connectionsEnsured = useRef(false);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [hasInitializedView, setHasInitializedView] = useState(false);

  const [assignFiber, setAssignFiber] = useState<V_ofc_connections_completeRowSchema | null>(null);
  const [fiberToUnlink, setFiberToUnlink] = useState<V_ofc_connections_completeRowSchema | null>(null);
  const { mutate: unlinkFiber, isPending: isUnlinking } = useReleaseFiber();
  const createConnectionsMutation = useCreateOfcConnection();

  const {
    data: cableConnectionsData,
    isLoading,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    deleteModal,
    actions: crudActions,
    isMutating,
  } = useCrudManager<'ofc_connections', V_ofc_connections_completeRowSchema>({
    tableName: 'ofc_connections',
    localTableName: 'v_ofc_connections_complete',
    dataQueryHook: useOfcConnectionsData(cableId as string),
    displayNameField: ['system_name', 'ofc_route_name'],
  });

  const canEdit = !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO || role === UserRole.ASSETADMIN;
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;
  const canAdd = !!isSuperAdmin || role === UserRole.ADMIN || role === UserRole.ADMINPRO || role === UserRole.ASSETADMIN;

  const { data: routeDetails, isLoading: isLoadingRouteDetails, isError: isRouteDetailsError } = useRouteDetails(
    cableId as string
  );
  const { data: allCablesData } = useOfcRoutesForSelection();

  const { data: utilResult, isLoading: isLoadingUtil } = useTableQuery(supabase, 'v_cable_utilization', {
    filters: { cable_id: cableId as string },
    limit: 1,
  });
  const utilization = utilResult?.data?.[0];

  const { mutate: uploadConnections, isPending: isUploading } = useOfcConnectionsExcelUpload(supabase, {
    onSuccess: (result) => {
      if (result.successCount > 0) refetch();
    }
  });

  // EFFECT TO ENSURE CONNECTIONS EXIST
  useEffect(() => {
    if (
      !isLoading &&
      !isLoadingRouteDetails &&
      !isLoadingUtil &&
      routeDetails?.route &&
      utilization &&
      !connectionsEnsured.current &&
      !createConnectionsMutation.isPending
    ) {
      connectionsEnsured.current = true;

      const expectedCount = routeDetails.route.capacity;
      const existingCount = (utilization.used_fibers || 0) + (utilization.available_fibers || 0);

      if (expectedCount && existingCount < expectedCount) {
        createConnectionsMutation.mutate({ cable: routeDetails.route as Ofc_cablesRowSchema });
      }
    }
  }, [
    isLoading,
    isLoadingRouteDetails,
    isLoadingUtil,
    routeDetails,
    utilization,
    createConnectionsMutation
  ]);


  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
       const uploadConfig = buildUploadConfig("v_ofc_connections_complete");
       uploadConnections({ file, columns: uploadConfig.columnMapping });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadConnections]);

  const [tracingFiber, setTracingFiber] = useState<{
    startSegmentId: string;
    fiberNo: number;
    record?: V_ofc_connections_completeRowSchema;
  } | null>(null);

  const { data: cableSegments } = useTableQuery(createClient(), 'cable_segments', {
    filters: { original_cable_id: cableId as string },
    orderBy: [{ column: 'segment_order', ascending: true }],
  });

  useEffect(() => {
    if (!isLoading && cableConnectionsData.length > 0 && !hasInitializedView) {
      const smartMode = (cableConnectionsData.length > 12) ? 'table' : 'grid';
      setViewMode(smartMode);
      setHasInitializedView(true);
    }
  }, [isLoading, cableConnectionsData.length, hasInitializedView]);
  
  const handleTraceClick = useCallback(
    (record: V_ofc_connections_completeRowSchema) => {
      const firstSegment = cableSegments?.data.find((s) => s.segment_order === 1);
      if (firstSegment && record.fiber_no_sn) {
        setTracingFiber({
          startSegmentId: firstSegment.id,
          fiberNo: record.fiber_no_sn,
          record,
        });
      } else {
        toast.error('Cannot trace fiber: No cable segments found.');
      }
    },
    [cableSegments]
  );

  const handleUnlink = () => {
    if (fiberToUnlink && fiberToUnlink.id) {
        unlinkFiber(fiberToUnlink.id, {
            onSuccess: () => setFiberToUnlink(null)
        });
    }
  };

  const getCardActions = useCallback(
    (record: V_ofc_connections_completeRowSchema) => {
      const isFree = !record.system_id && !record.logical_path_id;

      return (
        <>
          {canEdit && (
            isFree ? (
              <Button size="xs" variant="secondary" onClick={() => setAssignFiber(record)} title="Assign to Service" className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                <LinkIcon className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                 <Button size="xs" variant="ghost" onClick={() => setAssignFiber(record)} title="Edit Link">
                   <Edit2 className="w-4 h-4" />
                 </Button>
                 <Button size="xs" variant="ghost" onClick={() => setFiberToUnlink(record)} title="Unlink" className="text-orange-600 hover:bg-orange-50">
                   <Unlink className="w-4 h-4" />
                 </Button>
              </div>
            )
          )}
          {canEdit && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => editModal.openEdit(record)}
              title="Edit Fiber"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              size="xs"
              variant="ghost"
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => crudActions.handleDelete(record)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <div className="flex-1"></div>
          <Button size="xs" variant="outline" onClick={() => handleTraceClick(record)} title="Trace Path">
            <GitCommit className="w-4 h-4 mr-1" /> Trace
          </Button>
        </>
      );
    },
    [canEdit, canDelete, editModal, crudActions, handleTraceClick]
  );

  const columns = OfcDetailsTableColumns(cableConnectionsData);
  const orderedColumns = useOrderedColumns(columns, [
    ...TABLE_COLUMN_KEYS.v_ofc_connections_complete,
  ]);

  const tableActions = useMemo(
    () => [
      {
        key: 'trace',
        label: 'Trace Path',
        icon: <GitCommit className="h-4 w-4" />,
        onClick: handleTraceClick,
        variant: 'secondary' as const,
      },
      {
        key: 'link',
        label: 'Link Service',
        icon: <LinkIcon className="h-4 w-4" />,
        onClick: (record: V_ofc_connections_completeRowSchema) => setAssignFiber(record),
        variant: 'primary' as const,
        hidden: (record: V_ofc_connections_completeRowSchema) => !!record.system_id || !canEdit,
      },
      {
        key: 'edit-link',
        label: 'Edit Link',
        icon: <Edit2 className="h-4 w-4" />,
        onClick: (record: V_ofc_connections_completeRowSchema) => setAssignFiber(record),
        variant: 'secondary' as const,
        hidden: (record: V_ofc_connections_completeRowSchema) => !record.system_id || !canEdit,
      },
      {
        key: 'unlink',
        label: 'Unlink Service',
        icon: <Unlink className="h-4 w-4" />,
        onClick: (record: V_ofc_connections_completeRowSchema) => setFiberToUnlink(record),
        variant: 'danger' as const,
        hidden: (record: V_ofc_connections_completeRowSchema) => !record.system_id || !canEdit,
      },
      ...createStandardActions({
        onEdit: canEdit ? editModal.openEdit : undefined,
        onDelete: canDelete ? crudActions.handleDelete : undefined,
        onToggleStatus: canEdit ? crudActions.handleToggleStatus : undefined,
      }),
    ],
    [editModal.openEdit, crudActions.handleDelete, crudActions.handleToggleStatus, canEdit, canDelete, handleTraceClick]
  );

  const headerActions = useStandardHeaderActions({
    data: cableConnectionsData as V_ofc_connections_completeRowSchema[],
    onRefresh: async () => {
      await refetch();
      toast.success('Connections refreshed!');
    },
    onAddNew: canAdd ? editModal.openAdd : undefined,
    isLoading: isLoading,
    exportConfig: {
      tableName: 'v_ofc_connections_complete',
      fileName: `${routeDetails?.route.route_name}_connections`,
      filters: { ofc_id: { operator: 'eq', value: cableId as string } },
      orderBy: [{ column: 'fiber_no_sn', ascending: true }]
    },
  });

  if (canEdit) {
    headerActions.splice(1, 0, {
        label: isUploading ? 'Uploading...' : 'Upload Data', onClick: handleUploadClick,
        variant: 'outline', leftIcon: <Upload className="w-4 h-4" />, disabled: isUploading || isLoading,
        hideTextOnMobile: true
    });
  }

  const headerStats: StatProps[] = useMemo(() => {
    const utilPercent = utilization?.utilization_percent ?? 0;
    return [
      { value: utilization?.capacity ?? 0, label: 'Total Capacity', color: 'default' },
      { value: utilization?.used_fibers ?? 0, label: 'Utilized', color: 'primary' },
      { value: utilization?.available_fibers ?? 0, label: 'Available', color: 'success' },
      {
        value: `${utilPercent}%`,
        label: 'Utilization',
        color: utilPercent > 80 ? 'warning' : 'default',
      },
    ];
  }, [utilization]);

  const renderMobileItem = useCallback(
    (record: Row<'v_ofc_connections_complete'>, actions: React.ReactNode) => {
      return (
        <FiberConnectionCard
          fiber={record as V_ofc_connections_completeRowSchema}
          actions={actions}
        />
      );
    },
    []
  );

  if (isLoading || isLoadingRouteDetails || isLoadingUtil) return <PageSpinner />;

  if (isRouteDetailsError || !routeDetails?.route) {
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
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv" />

      <PageHeader
        title="OFC Cable Details"
        description={`Managing connections for route: ${routeDetails.route.route_name}`}
        icon={<GitBranch />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
      />

      <OfcDetailsHeader cable={routeDetails.route as V_ofc_cables_completeRowSchema} />

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10 mb-4">
        <div className="w-full lg:w-96 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search fibers, systems..."
            value={search.searchQuery}
            onChange={(e) => search.setSearchQuery(e.target.value)}
            className="pl-10"
            fullWidth
            clearable
          />
        </div>

        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
          <div className="min-w-[150px]">
            <SelectFilter
              label=""
              filterKey="status"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              placeholder="All Status"
            />
          </div>
          <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0 self-end">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cableConnectionsData.map((fiber) => (
              <FiberConnectionCard key={fiber.id} fiber={fiber} actions={getCardActions(fiber)} />
            ))}
            {cableConnectionsData.length === 0 && (
              <div className="col-span-full">
                <FancyEmptyState
                  title="No fibers found"
                  description="Adjust filters to see results"
                />
              </div>
            )}
          </div>
        ) : (
          <DataTable<'v_ofc_connections_complete'>
            autoHideEmptyColumns={true}
            tableName="v_ofc_connections_complete"
            data={cableConnectionsData as Row<'v_ofc_connections_complete'>[]}
            columns={orderedColumns}
            loading={isLoading}
            actions={tableActions}
            selectable={canDelete}
            onCellEdit={crudActions.handleCellEdit}
            searchable={false}
            customToolbar={<></>}
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
        )}
      </div>

      <OfcConnectionsFormModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        editingOfcConnections={editModal.record as Ofc_connectionsRowSchema | null}
        onSubmit={crudActions.handleSave as unknown as (data: Ofc_connectionsInsertSchema) => void}
        isLoading={isMutating}
      />

      {canEdit && (
        <FiberAssignmentModal 
          isOpen={!!assignFiber}
          onClose={() => setAssignFiber(null)}
          fiber={assignFiber}
        />
      )}

      <ConfirmModal
        isOpen={!!fiberToUnlink}
        onConfirm={handleUnlink}
        onCancel={() => setFiberToUnlink(null)}
        title="Unlink Service"
        message={`Are you sure you want to unlink Fiber #${fiberToUnlink?.fiber_no_sn} from the service?`}
        confirmText="Unlink"
        type="danger"
        loading={isUnlinking}
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