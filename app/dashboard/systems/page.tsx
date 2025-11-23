// app/dashboard/systems/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, useRef } from 'react';
import { FiDatabase, FiUpload, FiDownload, FiRefreshCw, FiServer } from 'react-icons/fi';
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
import { Lookup_typesRowSchema, V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { SystemModal } from '@/components/systems/SystemModal';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SystemFormData } from '@/schemas/system-schemas';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { buildColumnConfig, TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { buildUploadConfig } from '@/constants/table-column-keys';
import { useSystemExcelUpload } from '@/hooks/database/excel-queries/useSystemExcelUpload';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { createStandardActions } from '@/components/table/action-helpers';
import { formatDate } from '@/utils/formatters';
import { SystemPortsManagerModal } from '@/components/systems/SystemPortsManagerModal';
import { useSystemsData } from '@/hooks/data/useSystemsData';

export default function SystemsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    actions: crudActions,
  } = useCrudManager<'systems', V_systems_completeRowSchema>({
    tableName: 'systems',
    dataQueryHook: useSystemsData,
    searchColumn: ['system_name', 'system_type_name', 'node_name', 'ip_address'],
    displayNameField: 'system_name',
  });

  const { mutate: uploadSystems, isPending: isUploading } = useSystemExcelUpload(supabase, {
    onSuccess: (result) => {
      if (result.successCount > 0) refetch();
    },
  });

  const { mutate: exportSystems, isPending: isExporting } = useRPCExcelDownload(supabase);

  const allExportColumns = useMemo(() => buildColumnConfig('v_systems_complete'), []);
  const orderedSystems = useOrderedColumns(SystemsTableColumns(systems), [
    ...TABLE_COLUMN_KEYS.v_systems_complete,
  ]);

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

  const { data: systemTypesResult } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['system-types-for-filter'],
    async () =>
      (await createClient().from('lookup_types').select('*').eq('category', 'SYSTEM_TYPES')).data ??
      [],
    async () => await localDb.lookup_types.where({ category: 'SYSTEM_TYPES' }).toArray()
  );
  const systemTypes = useMemo(() => systemTypesResult || [], [systemTypesResult]);

  const handleView = useCallback(
    (system: V_systems_completeRowSchema) => {
      if (system.id) {
        router.push(`/dashboard/systems/${system.id}`);
      } else {
        toast.info('System needs to be created before managing connections.');
      }
    },
    [router]
  );

  const handleManagePorts = useCallback((system: V_systems_completeRowSchema) => {
    setSelectedSystemForPorts(system);
    setIsPortsModalOpen(true);
  }, []);

  const tableActions = useMemo(() => {
    const actions = createStandardActions<V_systems_completeRowSchema>({
      onEdit: editModal.openEdit,
      onView: handleView,
      onDelete: crudActions.handleDelete,
      onToggleStatus: crudActions.handleToggleStatus,
    });

    actions.unshift({
      key: 'manage-ports',
      label: 'Manage Ports',
      icon: <FiServer />,
      onClick: handleManagePorts,
      variant: 'secondary',
    });

    return actions;
  }, [editModal.openEdit, handleView, crudActions, handleManagePorts]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const uploadConfig = buildUploadConfig('v_systems_complete');
      uploadSystems({ file, columns: uploadConfig.columnMapping });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = useCallback(() => {
    exportSystems({
      fileName: `${formatDate(new Date(), {
        format: 'dd-mm-yyyy',
      })}-systems-export.xlsx`,
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

  const headerActions = useMemo(
    (): ActionButton[] => [
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
      {
        label: isUploading ? 'Uploading...' : 'Upload Systems',
        onClick: handleUploadClick,
        variant: 'outline',
        leftIcon: <FiUpload />,
        disabled: isUploading || isLoading,
      },
      {
        label: isExporting ? 'Exporting...' : 'Export All Data',
        onClick: handleExport,
        variant: 'outline',
        leftIcon: <FiDownload />,
        disabled: isExporting || isLoading,
      },
      {
        label: 'Add New',
        onClick: editModal.openAdd,
        variant: 'primary',
        leftIcon: <FiDatabase />,
        disabled: isLoading,
      },
    ],
    [
      isLoading,
      isUploading,
      isExporting,
      refetch,
      handleUploadClick,
      handleExport,
      editModal.openAdd,
    ]
  );

  const headerStats = [
    { value: totalCount, label: 'Total Systems' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const handleSave = useCallback(
    (formData: SystemFormData) => {
      const selectedSystemType = systemTypes.find((st) => st.id === formData.system_type_id);
      const isRingBased = selectedSystemType?.is_ring_based;

      const payload: RpcFunctionArgs<'upsert_system_with_details'> = {
        p_id: editModal.record?.id ?? undefined,
        p_system_name: formData.system_name!,
        p_system_type_id: formData.system_type_id!,
        p_node_id: formData.node_id!,
        p_status: formData.status ?? true,
        p_is_hub: formData.is_hub ?? false,
        p_maan_node_id: formData.maan_node_id || undefined,
        p_ip_address: formData.ip_address || undefined,
        p_maintenance_terminal_id: formData.maintenance_terminal_id || undefined,
        p_commissioned_on: formData.commissioned_on || undefined,
        p_s_no: formData.s_no || undefined,
        p_remark: formData.remark || undefined,
        p_make: formData.make || undefined,
        p_ring_associations:
          isRingBased && formData.ring_id
            ? [{ ring_id: formData.ring_id, order_in_ring: formData.order_in_ring }]
            : null,
      };

      upsertSystemMutation.mutate(payload);
    },
    [editModal.record, upsertSystemMutation, systemTypes]
  );

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <div className="p-6 space-y-6">
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

      <DataTable
        tableName="v_systems_complete"
        data={systems}
        columns={orderedSystems}
        loading={isLoading}
        isFetching={isFetching || isMutating}
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
        customToolbar={
          <SearchAndFilters
            searchTerm={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((p) => !p)}
            onClearFilters={() => {
              search.setSearchQuery('');
              filters.setFilters({});
            }}
            hasActiveFilters={Object.values(filters.filters).some(Boolean) || !!search.searchQuery}
            activeFilterCount={Object.values(filters.filters).filter(Boolean).length}
            searchPlaceholder="Search by system name or type..."
          >
            <SelectFilter
              label="System Type"
              filterKey="system_type_name"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={(systemTypes || [])
                .filter((s) => s.name !== 'DEFAULT')
                .map((t) => ({
                  value: t.name,
                  label: t.code || t.name,
                }))}
            />
            <SelectFilter
              label="Capacity"
              filterKey="port_capacity"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={[
                { value: '1G', label: '1G' },
                { value: '10G', label: '10G' },
                { value: '100G', label: '100G' },
                { value: '400G', label: '400G' },
              ]}
            />
            <SelectFilter
              label="Status"
              filterKey="status"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
          </SearchAndFilters>
        }
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
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />
    </div>
  );
}
