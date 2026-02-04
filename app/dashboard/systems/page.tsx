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
  FiCpu,
  FiMapPin,
  FiActivity,
  FiGrid,
  FiTag,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { Button, ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';
import {
  useRpcMutation,
  RpcFunctionArgs,
  buildRpcFilters,
  Row,
  TableOrViewName,
  EnhancedUploadResult,
} from '@/hooks/database';
import { useCrudManager } from '@/hooks/useCrudManager';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
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
import { formatDate, formatIP } from '@/utils/formatters';
import { useSystemsData } from '@/hooks/data/useSystemsData';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { ActionButton } from '@/components/common/page-header';
import { DataGrid } from '@/components/common/DataGrid';

import dynamic from 'next/dynamic';
import { PageSpinner } from '@/components/common/ui';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { CiCalendarDate } from 'react-icons/ci';
import GenericRemarks from '@/components/common/GenericRemarks';

const SystemModal = dynamic(
  () => import('@/components/systems/SystemModal').then((mod) => mod.SystemModal),
  { loading: () => <PageSpinner text='Loading Form...' /> },
);

const SystemPortsManagerModal = dynamic(
  () =>
    import('@/components/systems/SystemPortsManagerModal').then(
      (mod) => mod.SystemPortsManagerModal,
    ),
  { loading: () => <PageSpinner text='Loading Ports...' /> },
);

const UploadResultModal = dynamic(
  () => import('@/components/common/ui/UploadResultModal').then((mod) => mod.UploadResultModal),
  { ssr: false },
);

export default function SystemsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [uploadResult, setUploadResult] = useState<EnhancedUploadResult | null>(null);
  const [isUploadResultOpen, setIsUploadResultOpen] = useState(false);

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
    syncTables: [
      'systems',
      'v_systems_complete',
      'ring_based_systems',
      'ports_management',
      'v_ports_management_complete',
      'system_connections',
      'v_system_connections_complete',
    ],
  });

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

  const { options: systemTypeOptions, isLoading: loadingTypes } =
    useLookupTypeOptions('SYSTEM_TYPES');
  const { options: capacityOptions, isLoading: loadingCaps } =
    useLookupTypeOptions('SYSTEM_CAPACITY');

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'system_type_id',
        type: 'multi-select' as const,
        options: systemTypeOptions,
        isLoading: loadingTypes,
        placeholder: 'All Types',
      },
      {
        key: 'system_capacity_id',
        type: 'multi-select' as const,
        options: capacityOptions,
        isLoading: loadingCaps,
        placeholder: 'All Capacities',
      },
      {
        key: 'status',
        type: 'native-select' as const,
        placeholder: 'All Status',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
      },
      {
        key: 'sortBy',
        type: 'native-select' as const,
        options: [
          { value: 'name', label: 'Name (A-Z)' },
          { value: 'last_activity', label: 'Last Activity' },
        ],
        placeholder: 'Sort By',
      },
    ],
    [systemTypeOptions, capacityOptions, loadingTypes, loadingCaps],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const { mutate: uploadSystems, isPending: isUploading } = useSystemExcelUpload(supabase, {
    showToasts: false,
    onSuccess: (result) => {
      setUploadResult(result);
      setIsUploadResultOpen(true);
      if (result.successCount > 0) {
        refetch();
        toast.success(`Processed ${result.totalRows} rows.`);
      } else {
        toast.warning('Upload completed with no successful inserts.');
      }
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
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

  const handleView = useCallback(
    (system: V_systems_completeRowSchema) => {
      if (system.id) router.push(`/dashboard/systems/${system.id}`);
      else toast.info('System needs to be created before managing connections.');
    },
    [router],
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

  const isBusy = isLoading || isFetching;

  const headerActions = useMemo((): ActionButton[] => {
    const actions: ActionButton[] = [
      {
        label: 'Refresh',
        onClick: () => {
          refetch();
          toast.success('Systems refreshed.');
        },
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isBusy ? 'animate-spin' : ''} />,
        disabled: isBusy,
      },
    ];
    if (canEdit) {
      actions.push({
        label: isExporting ? 'Exporting...' : 'Export',
        onClick: handleExport,
        variant: 'outline',
        leftIcon: <FiDownload />,
        disabled: isExporting || isBusy,
        hideTextOnMobile: true,
      });
      actions.splice(1, 0, {
        label: isUploading ? 'Uploading...' : 'Upload',
        onClick: handleUploadClick,
        variant: 'outline',
        leftIcon: <FiUpload />,
        disabled: isUploading || isBusy,
        hideTextOnMobile: true,
      });
      actions.push({
        label: 'Add New',
        onClick: editModal.openAdd,
        variant: 'primary',
        leftIcon: <FiDatabase />,
        disabled: isBusy,
      });
    }
    return actions;
  }, [
    isBusy,
    isUploading,
    isExporting,
    refetch,
    handleUploadClick,
    handleExport,
    editModal.openAdd,
    canEdit,
  ]);

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
        p_asset_no: formData.asset_no || undefined,
        p_system_capacity_id: formData.system_capacity_id || undefined,
        p_ring_associations:
          formData.ring_id && formData.order_in_ring != null
            ? [{ ring_id: formData.ring_id, order_in_ring: formData.order_in_ring }]
            : null,
      };
      upsertSystemMutation.mutate(payload);
    },
    [editModal.record, upsertSystemMutation],
  );

  const renderItem = useCallback(
    (sys: V_systems_completeRowSchema) => (
      <GenericEntityCard
        key={sys.id}
        entity={sys}
        title={sys.system_name || 'Unnamed System'}
        status={sys.status}
        showStatusLabel={false}
        subBadge={
          <div className='flex items-center gap-2 mb-2 flex-wrap'>
            <span className='inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-300 dark:border-blue-800/50'>
              {sys.system_type_code || sys.system_type_name}
            </span>
            {sys.is_hub && (
              <span className='inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/20 dark:text-purple-300 dark:border-purple-800/50'>
                HUB
              </span>
            )}
          </div>
        }
        dataItems={[
          { icon: FiMapPin, label: 'Location', value: sys.node_name, optional: true },
          {
            icon: FiActivity,
            label: 'IP Address',
            value: formatIP(sys.ip_address),
            optional: true,
          },
          { icon: FiCpu, label: 'Capacity', value: sys.system_capacity_name, optional: true },
          { icon: FiTag, label: 'Asset No', value: sys.asset_no, optional: true },
          {
            icon: CiCalendarDate,
            label: 'Commissioning Date',
            value: sys.commissioned_on,
            optional: true,
          },
        ]}
        customFooter={
          <div className='w-full'>
            <GenericRemarks remark={sys.remark || ''} />
          </div>
        }
        extraActions={
          <Button
            size='xs'
            variant='secondary'
            onClick={() => handleManagePorts(sys)}
            title='Manage Ports'
            className='font-medium'>
            <FiGrid className='w-4 h-4' />
            <span className='ml-1.5 hidden sm:inline'>Ports</span>
          </Button>
        }
        onView={handleView}
        onEdit={editModal.openEdit}
        onDelete={crudActions.handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    ),
    [
      handleManagePorts,
      handleView,
      editModal.openEdit,
      crudActions.handleDelete,
      canEdit,
      canDelete,
    ],
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={systems}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={systems.length === 0 && !isLoading}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        }}
      />
    ),
    [systems, renderItem, isLoading, pagination, totalCount],
  );

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'System Management',
        description: 'Manage all network systems, including CPAN, MAAN, SDH, DWDM etc.',
        icon: <FiDatabase />,
        stats: [
          { value: totalCount, label: 'Total Systems' },
          { value: activeCount, label: 'Active', color: 'success' },
          { value: inactiveCount, label: 'Inactive', color: 'danger' },
        ],
        actions: headerActions,
        isLoading: isInitialLoad,
        isFetching: isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search system, node, IP...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      setFilters={filters.setFilters}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={{
        selectedCount: bulkActions.selectedCount,
        isOperationLoading: isMutating,
        onBulkDelete: bulkActions.handleBulkDelete,
        onBulkUpdateStatus: bulkActions.handleBulkUpdateStatus,
        onClearSelection: bulkActions.handleClearSelection,
        entityName: 'system',
        showStatusUpdate: true,
        canDelete: () => canDelete,
      }}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_systems_complete',
        data: systems,
        columns: orderedSystems,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: tableActions,
        selectable: canDelete,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (row): row is V_systems_completeRowSchema & { id: string } => !!row.id,
          );
          bulkActions.handleRowSelect(validRows);
        },
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={systems.length === 0 && !isLoading}
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
            title='Systems Upload Report'
          />

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
            title='Confirm Deletion'
            message={deleteModal.message}
            loading={deleteModal.loading}
            type='danger'
          />
        </>
      }
    />
  );
}
