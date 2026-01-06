// app/dashboard/services/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  PageHeader,
  useStandardHeaderActions,
  type ActionButton,
} from '@/components/common/page-header';
import { DataTable } from '@/components/table';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useServicesData } from '@/hooks/data/useServicesData';
import { ServicesTableColumns } from '@/config/table-columns/ServicesTableColumns';
import { createStandardActions } from '@/components/table/action-helpers';
import { ServiceFormModal } from '@/components/services/ServiceFormModal';
import { toast } from 'sonner';
import { Copy, Database as DatabaseIcon } from 'lucide-react';
import { useTableInsert, useTableUpdate } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import { Row } from '@/hooks/database';
import { useDuplicateFinder } from '@/hooks/useDuplicateFinder';
import { useUser } from '@/providers/UserProvider';
import { BulkActions } from '@/components/common/BulkActions';
import { ServiceCard } from '@/components/services/ServiceCard';
import { UserRole } from '@/types/user-roles';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { FilterConfig, GenericFilterBar } from '@/components/common/filters/GenericFilterBar'; // IMPORT

export default function ServicesPage() {
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { isSuperAdmin, role } = useUser();

  const {
    data,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    isMutating,
    pagination,
    search,
    filters,
    editModal,
    deleteModal,
    bulkActions,
    actions: crudActions,
  } = useCrudManager<'services', V_servicesRowSchema>({
    tableName: 'services',
    localTableName: 'v_services',
    dataQueryHook: useServicesData,
    displayNameField: 'name',
  });

  const canEdit =
    !!isSuperAdmin ||
    [UserRole.ADMIN, UserRole.ADMINPRO, UserRole.MAANADMIN, UserRole.CPANADMIN].includes(
      role as UserRole
    );
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  const duplicateIdentity = useCallback((item: V_servicesRowSchema) => {
    const name = item.name?.trim().toLowerCase() || '';
    const linkType = item.link_type_name?.trim().toLowerCase() || '';
    return `${name}|${linkType}`;
  }, []);

  const { showDuplicates, toggleDuplicates, duplicateSet } = useDuplicateFinder(
    data,
    duplicateIdentity,
    'Services'
  );

  const columns = ServicesTableColumns(data, duplicateSet);

  const { options: linkTypeOptions, isLoading: loadingLinks } = useLookupTypeOptions('LINK_TYPES');

  // --- DRY FILTER CONFIG ---
  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'link_type_id',
        label: 'Link Type',
        options: linkTypeOptions,
        isLoading: loadingLinks,
      },
      {
        key: 'allocation_status',
        label: 'Allocation',
        type: 'native-select',
        options: [
          { value: 'allocated', label: 'Allocated' },
          { value: 'unallocated', label: 'Unallocated' },
        ],
      },
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
    [linkTypeOptions, loadingLinks]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters]
  );
  // -------------------------

  const { mutate: insertService, isPending: isInserting } = useTableInsert(supabase, 'services', {
    onSuccess: () => {
      refetch();
      editModal.close();
      toast.success('Service created.');
    },
  });

  const { mutate: updateService, isPending: isUpdating } = useTableUpdate(supabase, 'services', {
    onSuccess: () => {
      refetch();
      editModal.close();
      toast.success('Service updated.');
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (formData: any) => {
    if (editModal.record?.id) {
      updateService({ id: editModal.record.id, data: formData });
    } else {
      insertService(formData);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getEditingService = (record: V_servicesRowSchema | null): any | null => {
    if (!record) return null;
    return record;
  };

  const tableActions = useMemo(
    () =>
      createStandardActions({
        onEdit: canEdit ? editModal.openEdit : undefined,
        onDelete: canDelete ? crudActions.handleDelete : undefined,
      }),
    [editModal.openEdit, canEdit, canDelete, crudActions.handleDelete]
  );

  const headerActions = useStandardHeaderActions({
    onRefresh: refetch,
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading,
    data: data as Row<'v_services'>[],
    exportConfig: canEdit
      ? {
          tableName: 'v_services',
          fileName: `All_Services`,
          filters: filters.filters,
          useRpc: true,
        }
      : undefined,
  });

  const enhancedHeaderActions: ActionButton[] = [
    ...headerActions,
    {
      label: showDuplicates ? 'Hide Duplicates' : 'Find Duplicates',
      onClick: toggleDuplicates,
      variant: showDuplicates ? 'secondary' : 'outline',
      leftIcon: <Copy className="w-4 h-4" />,
      hideTextOnMobile: true,
    },
  ];

  const addNewAction = enhancedHeaderActions.pop();
  if (addNewAction) enhancedHeaderActions.splice(enhancedHeaderActions.length - 1, 0, addNewAction);

  const renderMobileItem = useCallback(
    (record: Row<'v_services'>) => {
      return (
        <ServiceCard
          service={record as V_servicesRowSchema}
          onEdit={editModal.openEdit}
          onDelete={crudActions.handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          isDuplicate={duplicateSet.has(
            `${record.name?.trim().toLowerCase()}|${record.link_type_name?.trim().toLowerCase()}`
          )}
        />
      );
    },
    [editModal.openEdit, crudActions.handleDelete, canEdit, canDelete, duplicateSet]
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
        title="Service Management"
        description="Manage logical services, customers, and link definitions."
        icon={<DatabaseIcon />}
        stats={[
          { value: totalCount, label: 'Total Services' },
          { value: activeCount, label: 'Active', color: 'success' },
          { value: inactiveCount, label: 'Inactive', color: 'danger' },
        ]}
        actions={enhancedHeaderActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      {/* REUSABLE FILTER BAR */}
      <GenericFilterBar
        searchQuery={search.searchQuery}
        onSearchChange={search.setSearchQuery}
        searchPlaceholder="Search name, node, description..."
        filters={filters.filters}
        onFilterChange={handleFilterChange}
        filterConfigs={filterConfigs}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={() => {}}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="service"
        showStatusUpdate={false}
        canDelete={() => canDelete}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={editModal.openEdit}
              onDelete={crudActions.handleDelete}
              canEdit={canEdit}
              canDelete={canDelete}
              isDuplicate={duplicateSet.has(
                `${service.name?.trim().toLowerCase()}|${service.link_type_name
                  ?.trim()
                  .toLowerCase()}`
              )}
            />
          ))}
          {data.length === 0 && !isLoading && (
            <div className="col-span-full py-16 text-center text-gray-500">
              <DatabaseIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No services found matching your criteria.</p>
            </div>
          )}
        </div>
      ) : (
        <DataTable
          autoHideEmptyColumns={true}
          tableName="v_services"
          data={data}
          columns={columns}
          loading={isLoading}
          isFetching={isFetching}
          actions={tableActions}
          selectable={canDelete}
          onRowSelect={(rows) => {
            const validRows = rows.filter(
              (row): row is V_servicesRowSchema & { id: string } => row.id != null
            );
            bulkActions.handleRowSelect(validRows);
          }}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            onChange: (p, s) => {
              pagination.setCurrentPage(p);
              pagination.setPageLimit(s);
            },
          }}
          customToolbar={<></>}
          renderMobileItem={renderMobileItem}
        />
      )}

      {editModal.isOpen && (
        <ServiceFormModal
          isOpen={editModal.isOpen}
          onClose={editModal.close}
          editingService={getEditingService(editModal.record)}
          onSubmit={handleSave}
          isLoading={isInserting || isUpdating}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Delete"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.loading}
      />
    </div>
  );
}
