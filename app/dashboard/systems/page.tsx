// app/dashboard/systems/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useRef } from 'react';
import {
  FiDatabase,
  FiUpload,
  FiDownload,
  FiRefreshCw,
  FiServer,
  FiSearch,
  FiGrid,
  FiList,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { PageHeader, ActionButton } from '@/components/common/page-header';
import { ErrorDisplay, ConfirmModal } from '@/components/common/ui';
import { DataTable } from '@/components/table';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';
import {
  useRpcMutation,
  RpcFunctionArgs,
  buildRpcFilters,
  Row,
  TableOrViewName,
} from '@/hooks/database';
import { useCrudManager } from '@/hooks/useCrudManager';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { SystemModal } from '@/components/systems/SystemModal';
import { SystemFormData } from '@/schemas/system-schemas';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import {
  buildUploadConfig,
  buildColumnConfig,
  TABLE_COLUMN_KEYS,
} from '@/constants/table-column-keys';
import { useSystemExcelUpload } from '@/hooks/database/excel-queries/useSystemExcelUpload';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { createStandardActions } from '@/components/table/action-helpers';
import { formatDate } from '@/utils/formatters';
import { SystemPortsManagerModal } from '@/components/systems/SystemPortsManagerModal';
import { useSystemsData } from '@/hooks/data/useSystemsData';
import { useUser } from '@/providers/UserProvider';
import { Input, SearchableSelect } from '@/components/common/ui';
import { BulkActions } from '@/components/common/BulkActions';
import { SystemCard } from '@/components/systems/SystemCard';
import { UserRole } from '@/types/user-roles';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';

export default function SystemsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const { isSuperAdmin, role } = useUser();

  const {
    data: systems,
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
    bulkActions,
    actions: crudActions,
  } = useCrudManager<'systems', V_systems_completeRowSchema>({
    tableName: 'systems',
    localTableName: 'v_systems_complete',
    dataQueryHook: useSystemsData,
    searchColumn: ['system_name', 'system_type_name', 'node_name', 'ip_address'],
    displayNameField: 'system_name',
  });

  // --- PERMISSIONS ---
  const canEdit =
    !!isSuperAdmin ||
    [
      UserRole.ADMIN,
      UserRole.ADMINPRO,
      UserRole.CPANADMIN,
      UserRole.MAANADMIN,
      UserRole.SDHADMIN,
    ].includes(role as UserRole);
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  // --- UPLOAD / EXPORT ---
  const { mutate: uploadSystems, isPending: isUploading } = useSystemExcelUpload(supabase, {
    onSuccess: (result) => {
      if (result.successCount > 0) refetch();
    },
  });
  const { mutate: exportSystems, isPending: isExporting } = useRPCExcelDownload(supabase);
  const allExportColumns = useMemo(() => buildColumnConfig('v_systems_complete'), []);

  const [isPortsModalOpen, setIsPortsModalOpen] = useState(false);
  const [selectedSystemForPorts, setSelectedSystemForPorts] =
    useState<V_systems_completeRowSchema | null>(null);

  const isInitialLoad = isLoading && systems.length === 0;

  const upsertSystemMutation = useRpcMutation(supabase, 'upsert_system_with_details', {
    onSuccess: () => {
      toast.success(`System ${editModal.record ? 'updated' : 'created'} successfully.`);
      refetch();
      editModal.close();
    },
    onError: (err) => toast.error(`Failed to save system: ${err.message}`),
  });

  // --- DROPDOWNS ---
  const { options: systemTypeOptions } = useLookupTypeOptions('SYSTEM_TYPES');
  const { options: capacityOptions } = useLookupTypeOptions('SYSTEM_CAPACITY');

  const handleView = useCallback(
    (system: V_systems_completeRowSchema) => {
      if (system.id) router.push(`/dashboard/systems/${system.id}`);
      else toast.info('System needs to be created before managing connections.');
    },
    [router]
  );

  const handleManagePorts = useCallback((system: V_systems_completeRowSchema) => {
    setSelectedSystemForPorts(system);
    setIsPortsModalOpen(true);
  }, []);

  const columns = SystemsTableColumns(systems);
  const orderedSystems = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_systems_complete]);

  const tableActions = useMemo(() => {
    const actions = createStandardActions<V_systems_completeRowSchema>({
      onEdit: canEdit ? editModal.openEdit : undefined,
      onView: handleView,
      onDelete: canDelete ? crudActions.handleDelete : undefined,
      onToggleStatus: canDelete ? crudActions.handleToggleStatus : undefined,
    });
    actions.unshift({
      key: 'manage-ports',
      label: 'Manage Ports',
      icon: <FiServer />,
      onClick: handleManagePorts,
      variant: 'secondary',
    });
    return actions;
  }, [editModal.openEdit, handleView, crudActions, handleManagePorts, canEdit, canDelete]);

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const uploadConfig = buildUploadConfig('v_systems_complete');
      uploadSystems({ file, columns: uploadConfig.columnMapping });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = useCallback(() => {
    exportSystems({
      fileName: `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}-systems-export.xlsx`,
      sheetName: 'Systems',
      columns: allExportColumns as Column<Row<TableOrViewName>>[],
      rpcConfig: {
        functionName: 'get_paged_data',
        parameters: {
          p_view_name: 'v_systems_complete',
          p_limit: 50000,
          p_offset: 0,
          p_filters: buildRpcFilters(filters.filters),
        },
      },
    });
  }, [exportSystems, allExportColumns, filters.filters]);

  const headerActions = useMemo((): ActionButton[] => {
    const actions: ActionButton[] = [
      {
        label: 'Refresh',
        onClick: () => {
          refetch();
          toast.success('Systems refreshed.');
        },
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />,
        disabled: isLoading,
      },
    ];
    if (canEdit) {
      actions.push({
        label: isExporting ? 'Exporting...' : 'Export',
        onClick: handleExport,
        variant: 'outline',
        leftIcon: <FiDownload />,
        disabled: isExporting || isLoading,
        hideTextOnMobile: true,
      });
      actions.splice(1, 0, {
        label: isUploading ? 'Uploading...' : 'Upload',
        onClick: handleUploadClick,
        variant: 'outline',
        leftIcon: <FiUpload />,
        disabled: isUploading || isLoading,
        hideTextOnMobile: true,
      });
      actions.push({
        label: 'Add New',
        onClick: editModal.openAdd,
        variant: 'primary',
        leftIcon: <FiDatabase />,
        disabled: isLoading,
      });
    }
    return actions;
  }, [
    isLoading,
    isUploading,
    isExporting,
    refetch,
    handleUploadClick,
    handleExport,
    editModal.openAdd,
    canEdit,
  ]);

  const headerStats = [
    { value: totalCount, label: 'Total Systems' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const handleSave = useCallback(
    (formData: SystemFormData) => {
      const payload: RpcFunctionArgs<'upsert_system_with_details'> = {
        p_id: editModal.record?.id ?? undefined,
        p_system_name: formData.system_name!,
        p_system_type_id: formData.system_type_id!,
        p_node_id: formData.node_id!,
        p_status: formData.status ?? true,
        p_is_hub: formData.is_hub ?? false,
        p_maan_node_id: formData.maan_node_id || undefined,
        p_ip_address: formData.ip_address ? formData.ip_address.split('/')[0] : undefined,
        p_maintenance_terminal_id: formData.maintenance_terminal_id || undefined,
        p_commissioned_on: formData.commissioned_on || undefined,
        p_s_no: formData.s_no || undefined,
        p_remark: formData.remark || undefined,
        p_make: formData.make || undefined,
        p_system_capacity_id: formData.system_capacity_id || undefined,
        p_ring_associations:
          formData.ring_id && formData.order_in_ring != null
            ? [{ ring_id: formData.ring_id, order_in_ring: formData.order_in_ring }]
            : null,
      };
      upsertSystemMutation.mutate(payload);
    },
    [editModal.record, upsertSystemMutation]
  );

  const renderMobileItem = useCallback(
    (record: Row<'v_systems_complete'>) => {
      return (
        <SystemCard
          system={record as V_systems_completeRowSchema}
          onView={handleView}
          onEdit={editModal.openEdit}
          onDelete={crudActions.handleDelete}
          onManagePorts={handleManagePorts}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      );
    },
    [
      handleView,
      editModal.openEdit,
      crudActions.handleDelete,
      handleManagePorts,
      canEdit,
      canDelete,
    ]
  );

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PageHeader
        title="System Management"
        description="Manage all network systems, including CPAN, MAAN, SDH, DWDM etc."
        icon={<FiDatabase />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10">
        <div className="w-full lg:w-96">
          <Input
            placeholder="Search system, node, IP..."
            value={search.searchQuery}
            onChange={(e) => search.setSearchQuery(e.target.value)}
            leftIcon={<FiSearch className="text-gray-400" />}
            fullWidth
            clearable
          />
        </div>

        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
          <div className="min-w-[160px]">
            <SearchableSelect
              placeholder="System Type"
              options={systemTypeOptions}
              // FIX: Use ID key for filter value
              value={filters.filters.system_type_id as string}
              onChange={(v) => filters.setFilters((prev) => ({ ...prev, system_type_id: v }))}
              clearable
            />
          </div>
          <div className="min-w-[160px]">
            <SearchableSelect
              placeholder="Capacity"
              options={capacityOptions}
              // FIX: Use ID key for filter value
              value={filters.filters.system_capacity_id as string}
              onChange={(v) => filters.setFilters((prev) => ({ ...prev, system_capacity_id: v }))}
              clearable
            />
          </div>
          <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <FiGrid />
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
              <FiList />
            </button>
          </div>
        </div>
      </div>

      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="system"
        showStatusUpdate={true}
        canDelete={() => canDelete}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {systems.map((sys) => (
            <SystemCard
              key={sys.id}
              system={sys}
              onView={handleView}
              onEdit={editModal.openEdit}
              onDelete={crudActions.handleDelete}
              onManagePorts={handleManagePorts}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
          {systems.length === 0 && !isLoading && (
            <div className="col-span-full py-16 text-center text-gray-500">
              <FiDatabase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No systems found matching your criteria.</p>
            </div>
          )}
        </div>
      ) : (
        <DataTable
          autoHideEmptyColumns={true}
          tableName="v_systems_complete"
          data={systems}
          columns={orderedSystems}
          loading={isLoading}
          isFetching={isFetching || isMutating}
          actions={tableActions}
          selectable={canDelete}
          onRowSelect={(rows) => {
            const validRows = rows.filter(
              (row): row is V_systems_completeRowSchema & { id: string } => row.id != null
            );
            bulkActions.handleRowSelect(validRows);
          }}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            showSizeChanger: true,
            onChange: (p, s) => {
              pagination.setCurrentPage(p);
              pagination.setPageLimit(s);
            },
          }}
          customToolbar={<></>}
          renderMobileItem={renderMobileItem}
        />
      )}

      <SystemModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        rowData={editModal.record}
        onSubmit={handleSave}
        isLoading={upsertSystemMutation.isPending}
      />
      <SystemPortsManagerModal
        isOpen={isPortsModalOpen}
        onClose={() => setIsPortsModalOpen(false)}
        system={selectedSystemForPorts}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />
    </div>
  );
}
