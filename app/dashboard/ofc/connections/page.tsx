// app/dashboard/ofc/connections/page.tsx
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { TableAction } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import {
  V_ofc_connections_completeRowSchema,
  Ofc_connectionsInsertSchema,
  Cable_segmentsRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildUploadConfig, TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { FiActivity, FiUpload, FiGitCommit } from 'react-icons/fi';
import { Link as LinkIcon, Unlink } from 'lucide-react';
import { useAllOfcConnectionsData } from '@/hooks/data/useAllOfcConnectionsData';
import { OfcDetailsTableColumns } from '@/config/table-columns/OfcDetailsTableColumns';
import { useOfcConnectionsExcelUpload } from '@/hooks/database/excel-queries/useOfcConnectionsExcelUpload';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { EnhancedUploadResult, Row } from '@/hooks/database';
import { UploadResultModal } from '@/components/common/ui/UploadResultModal';
import { useReleaseFiber } from '@/hooks/database/fiber-assignment-hooks';
import dynamic from 'next/dynamic';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { StatProps } from '@/components/common/page-header/StatCard';
import { FiberAssignmentModal } from '@/components/ofc-details/FiberAssignmentModal';
import { createStandardActions } from '@/components/table/action-helpers';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';

const FiberTraceModal = dynamic(
  () => import('@/components/ofc-details/FiberTraceModal').then((mod) => mod.FiberTraceModal),
  { ssr: false, loading: () => <PageSpinner /> },
);

const OfcConnectionsFormModal = dynamic(
  () =>
    import('@/components/ofc-details/OfcConnectionsFormModal').then(
      (mod) => mod.OfcConnectionsFormModal,
    ),
  { loading: () => <PageSpinner text='Loading Form...' /> },
);

export default function GlobalOfcConnectionsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSuperAdmin, role } = useUser();

  const canEdit =
    !!isSuperAdmin ||
    [UserRole.ADMIN, UserRole.ADMINPRO, UserRole.OFCADMIN, UserRole.ASSETADMIN].includes(
      role as UserRole,
    );
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  // --- LOCAL STATE ---
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [assignFiber, setAssignFiber] = useState<V_ofc_connections_completeRowSchema | null>(null);
  const [fiberToUnlink, setFiberToUnlink] = useState<V_ofc_connections_completeRowSchema | null>(
    null,
  );
  const [tracingFiber, setTracingFiber] = useState<{
    segments: Cable_segmentsRowSchema[];
    record: V_ofc_connections_completeRowSchema;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTracing, setIsTracing] = useState(false);
  const [uploadResult, setUploadResult] = useState<EnhancedUploadResult | null>(null);
  const [isUploadResultOpen, setIsUploadResultOpen] = useState(false);

  // --- HOOKS ---
  const crud = useCrudManager<'ofc_connections', V_ofc_connections_completeRowSchema>({
    tableName: 'ofc_connections',
    localTableName: 'v_ofc_connections_complete',
    dataQueryHook: useAllOfcConnectionsData,
    displayNameField: 'ofc_route_name',
    searchColumn: ['ofc_route_name', 'system_name'],
    syncTables: ['ofc_connections', 'v_ofc_connections_complete', 'ofc_cables', 'cable_segments'],
  });

  const {
    data: fibers,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    deleteModal,
    bulkActions, // Destructure bulkActions correctly
    actions: crudActions,
  } = crud;

  const { mutate: unlinkFiber, isPending: isUnlinking } = useReleaseFiber();
  const { mutate: uploadConnections, isPending: isUploading } = useOfcConnectionsExcelUpload(
    supabase,
    {
      showToasts: false,
      onSuccess: (result) => {
        setUploadResult(result);
        setIsUploadResultOpen(true);
        if (result.successCount > 0) refetch();
      },
      onError: (err) => toast.error(err.message),
    },
  );

  // --- HANDLERS ---
  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const uploadConfig = buildUploadConfig('v_ofc_connections_complete');
        uploadConnections({ file, columns: uploadConfig.columnMapping });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadConnections],
  );

  const handleTraceClick = useCallback(
    async (record: V_ofc_connections_completeRowSchema) => {
      if (!record.ofc_id || record.fiber_no_sn === null) {
        toast.error('Invalid fiber data for tracing.');
        return;
      }
      setIsTracing(true);
      try {
        const { data, error: segmentError } = await supabase
          .from('cable_segments')
          .select('*')
          .eq('original_cable_id', record.ofc_id)
          .order('segment_order', { ascending: true });
        if (segmentError) throw segmentError;
        setTracingFiber({ segments: data || [], record });
      } catch (err) {
        console.error('Trace error', err);
        toast.error('Failed to prepare trace data.');
      } finally {
        setIsTracing(false);
      }
    },
    [supabase],
  );

  const handleUnlink = () => {
    if (fiberToUnlink?.id) {
      unlinkFiber(fiberToUnlink.id, { onSuccess: () => setFiberToUnlink(null) });
    }
  };

  // --- CONFIGS & MEMOS ---
  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'native-select',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
    ],
    [],
  );

  const columns = OfcDetailsTableColumns(fibers);
  const orderedColumns = useOrderedColumns(columns, [
    'ofc_route_name',
    'fiber_no_sn',
    ...TABLE_COLUMN_KEYS.v_ofc_connections_complete,
  ]);

  const tableActions: TableAction<'v_ofc_connections_complete'>[] = useMemo(
    () => [
      {
        key: 'trace',
        label: 'Trace Path',
        icon: <FiGitCommit className='w-4 h-4' />,
        onClick: (record) => handleTraceClick(record as V_ofc_connections_completeRowSchema),
        variant: 'secondary',
      },
      {
        key: 'link',
        label: 'Link Service',
        icon: <LinkIcon className='w-4 h-4' />,
        onClick: (record) => setAssignFiber(record as V_ofc_connections_completeRowSchema),
        hidden: (record) => !!record.system_id || !canEdit,
        variant: 'primary',
      },
      {
        key: 'edit-link',
        label: 'Edit Link',
        icon: <LinkIcon className='w-4 h-4' />,
        onClick: (record) => setAssignFiber(record as V_ofc_connections_completeRowSchema),
        hidden: (record) => !record.system_id || !canEdit,
        variant: 'secondary',
      },
      {
        key: 'unlink',
        label: 'Unlink Service',
        icon: <Unlink className='w-4 h-4' />,
        onClick: (record) => setFiberToUnlink(record as V_ofc_connections_completeRowSchema),
        hidden: (record) => !record.system_id || !canEdit,
        variant: 'danger',
      },
      ...createStandardActions<V_ofc_connections_completeRowSchema>({
        onEdit: canEdit ? (rec) => editModal.openEdit(rec) : undefined,
        onDelete: canDelete ? (rec) => crudActions.handleDelete(rec) : undefined,
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, canDelete, editModal.openEdit, crudActions.handleDelete, handleTraceClick],
  );

  const headerActions = useStandardHeaderActions({
    data: fibers,
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed!');
    },
    isLoading,
    isFetching,
    exportConfig: canEdit
      ? {
          tableName: 'v_ofc_connections_complete',
          fileName: 'All_Physical_Fibers',
          useRpc: true,
          orderBy: [{ column: 'ofc_route_name' }, { column: 'fiber_no_sn' }],
          maxRows: 50000,
        }
      : undefined,
  });

  if (canEdit) {
    headerActions.splice(1, 0, {
      label: isUploading ? 'Uploading...' : 'Upload Data',
      onClick: handleUploadClick,
      variant: 'outline',
      leftIcon: <FiUpload />,
      disabled: isUploading || isLoading,
      hideTextOnMobile: true,
    });
  }

  // --- INTERACTIVE STATS ---
  const headerStats = useMemo<StatProps[]>(() => {
    // Use the filters directly from the crud manager
    const currentStatus = filters.filters.status;

    return [
      {
        value: totalCount,
        label: 'Total Fibers',
        color: 'default',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: 'Active',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Inactive/Faulty',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

  // Bulk Actions Handlers
  const handleBulkDelete = async () => {
    if (bulkActions.selectedCount === 0) return;
    await bulkActions.handleBulkDelete();
  };

  const handleBulkUpdateStatus = async (status: 'active' | 'inactive') => {
    if (bulkActions.selectedCount === 0) return;
    await bulkActions.handleBulkUpdateStatus(status);
  };

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <DashboardPageLayout
      header={{
        title: 'Global Fiber Connections',
        description: 'View, search, and manage all physical fiber connections across all cables.',
        icon: <FiActivity />,
        stats: headerStats, // Interactive Stats
        actions: headerActions,
        isLoading: isLoading && fibers.length === 0,
        isFetching: isFetching,
      }}
      crud={crud} // Pass crud to layout for auto-wiring if needed
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search by route, system, or node...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={{
        selectedCount: bulkActions.selectedCount,
        isOperationLoading: isMutating,
        onBulkDelete: handleBulkDelete,
        onBulkUpdateStatus: handleBulkUpdateStatus,
        onClearSelection: bulkActions.handleClearSelection,
        entityName: 'connection',
        showStatusUpdate: true,
        canDelete: () => canDelete,
      }}
      // We are NOT using renderGrid here, forcing table view
      renderGrid={undefined}
      tableProps={{
        tableName: 'v_ofc_connections_complete',
        data: fibers,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: tableActions,
        searchable: false,
        selectable: canDelete, // Allow selection if can delete
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (r): r is Row<'v_ofc_connections_complete'> & { id: string } => !!r.id,
          );
          bulkActions.handleRowSelect(validRows);
        },
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (p, s) => {
            pagination.setCurrentPage(p);
            pagination.setPageLimit(s);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={fibers.length === 0 && !isLoading}
      modals={
        <>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            className='hidden'
            accept='.xlsx, .xls, .csv'
          />

          <UploadResultModal
            isOpen={isUploadResultOpen}
            onClose={() => setIsUploadResultOpen(false)}
            result={uploadResult}
            title='Fiber Connections Upload Report'
          />

          {editModal.isOpen && (
            <OfcConnectionsFormModal
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              editingOfcConnections={
                editModal.record && editModal.record.id && editModal.record.ofc_id
                  ? {
                      id: editModal.record.id,
                      ofc_id: editModal.record.ofc_id,
                      connection_category: editModal.record.connection_category || 'SPLICE_TYPES',
                      connection_type: editModal.record.connection_type || 'straight',
                      fiber_no_en: editModal.record.fiber_no_en || 1,
                      fiber_no_sn: editModal.record.fiber_no_sn || 1,
                      created_at: editModal.record.created_at,
                      destination_port: editModal.record.destination_port,
                      en_dom: editModal.record.en_dom,
                      en_power_dbm: editModal.record.en_power_dbm,
                      fiber_role: editModal.record.fiber_role,
                      logical_path_id: editModal.record.logical_path_id,
                      otdr_distance_en_km: editModal.record.otdr_distance_en_km,
                      otdr_distance_sn_km: editModal.record.otdr_distance_sn_km,
                      path_direction: editModal.record.path_direction,
                      path_segment_order: editModal.record.path_segment_order,
                      remark: editModal.record.remark,
                      route_loss_db: editModal.record.route_loss_db,
                      sn_dom: editModal.record.sn_dom,
                      sn_power_dbm: editModal.record.sn_power_dbm,
                      source_port: editModal.record.source_port,
                      status: editModal.record.status ?? true,
                      system_id: editModal.record.system_id,
                      updated_at: editModal.record.updated_at,
                      updated_en_id: editModal.record.updated_en_id,
                      updated_fiber_no_en: editModal.record.updated_fiber_no_en,
                      updated_fiber_no_sn: editModal.record.updated_fiber_no_sn,
                      updated_sn_id: editModal.record.updated_sn_id,
                    }
                  : null
              }
              onSubmit={crudActions.handleSave as (data: Ofc_connectionsInsertSchema) => void}
              isLoading={isMutating}
            />
          )}

          {/* ADDED: Link/Unlink Modals */}
          {!!assignFiber && (
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
            title='Unlink Service'
            message={`Are you sure you want to unlink Fiber #${fiberToUnlink?.fiber_no_sn}? This will release it from its service.`}
            confirmText='Unlink'
            type='danger'
            loading={isUnlinking}
          />

          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title='Confirm Deletion'
            message={deleteModal.message}
            type='danger'
            loading={deleteModal.loading}
          />

          {tracingFiber && (
            <FiberTraceModal
              isOpen={!!tracingFiber}
              onClose={() => setTracingFiber(null)}
              segments={tracingFiber.segments}
              fiberNoSn={tracingFiber.record.fiber_no_sn}
              fiberNoEn={tracingFiber.record.fiber_no_en}
              allCables={undefined} // Not needed for this context
              record={tracingFiber.record}
              refetch={refetch}
              cableName={tracingFiber.record.ofc_route_name || undefined}
            />
          )}
        </>
      }
    />
  );
}
