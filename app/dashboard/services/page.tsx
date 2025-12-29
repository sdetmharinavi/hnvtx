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
import { Input, SearchableSelect } from '@/components/common/ui';
import { BulkActions } from '@/components/common/BulkActions';
import { ServiceCard } from '@/components/services/ServiceCard';
import { UserRole } from '@/types/user-roles';
import { FiGrid, FiList, FiSearch } from 'react-icons/fi';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';

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

  const { options: linkTypeOptions } = useLookupTypeOptions('LINK_TYPES');

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
          // THE FIX: Use RPC
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

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10">
        <div className="w-full lg:w-96">
          <Input
            placeholder="Search name, node, description..."
            value={search.searchQuery}
            onChange={(e) => search.setSearchQuery(e.target.value)}
            leftIcon={<FiSearch className="text-gray-400" />}
            fullWidth
            clearable
          />
        </div>

        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0">
          <div className="min-w-[180px]">
            <SearchableSelect
              placeholder="Link Type"
              options={linkTypeOptions}
              value={filters.filters.link_type_id as string}
              onChange={(v) => filters.setFilters((prev) => ({ ...prev, link_type_id: v }))}
              clearable
            />
          </div>
          <div className="min-w-[140px]">
            <select
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={(filters.filters.status as string) || ''}
              onChange={(e) => filters.setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
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
              <FiGrid size={16} />
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
              <FiList size={16} />
            </button>
          </div>
        </div>
      </div>

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
