// app/dashboard/services/page.tsx
"use client";

import { useMemo, useState } from "react";
import { PageHeader, useStandardHeaderActions } from "@/components/common/page-header";
import { DataTable } from "@/components/table";
import { useCrudManager } from "@/hooks/useCrudManager";
import { useServicesData } from "@/hooks/data/useServicesData";
import { ServicesTableColumns } from "@/config/table-columns/ServicesTableColumns";
import { createStandardActions } from "@/components/table/action-helpers";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";
import { toast } from "sonner";
import { Database as DatabaseIcon } from "lucide-react";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { V_servicesRowSchema, Lookup_typesRowSchema } from "@/schemas/zod-schemas";
import { Row } from "@/hooks/database";
import { useOfflineQuery } from "@/hooks/data/useOfflineQuery";
import { localDb } from "@/hooks/data/localDb";
import { SearchAndFilters } from "@/components/common/filters/SearchAndFilters";
import { SelectFilter } from "@/components/common/filters/FilterInputs";

export default function ServicesPage() {
  const supabase = createClient();
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    data, totalCount, isLoading, isFetching, error, refetch,
    pagination, search, filters, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'services', V_servicesRowSchema>({
    tableName: 'services', 
    localTableName: 'v_services',
    dataQueryHook: useServicesData, 
    displayNameField: 'name',
  });

  // Fetch Link Types for Filtering
  const { data: linkTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['link-types-for-filter'],
    async () => 
      (await supabase.from('lookup_types').select('*').eq('category', 'LINK_TYPES')).data ?? [],
    async () => 
      await localDb.lookup_types.where({ category: 'LINK_TYPES' }).toArray()
  );
  
  const linkTypeOptions = useMemo(() => {
    return (linkTypesData || [])
      .filter(lt => lt.name !== 'DEFAULT')
      .map(lt => ({ value: lt.id, label: lt.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [linkTypesData]);

  const columns = ServicesTableColumns(data);

  const { mutate: insertService, isPending: isInserting } = useTableInsert(supabase, 'services', {
     onSuccess: () => { refetch(); editModal.close(); toast.success("Service created."); }
  });
  
  const { mutate: updateService, isPending: isUpdating } = useTableUpdate(supabase, 'services', {
     onSuccess: () => { refetch(); editModal.close(); toast.success("Service updated."); }
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

  const tableActions = useMemo(() => createStandardActions({
      onEdit: editModal.openEdit,
      onDelete: crudActions.handleDelete,
  }), [editModal.openEdit, crudActions.handleDelete]);

  const headerActions = useStandardHeaderActions({
      onRefresh: refetch,
      onAddNew: editModal.openAdd,
      isLoading,
      data: data as Row<'v_services'>[],
      exportConfig: {
          tableName: 'v_services',
          fileName: `All_Services`,
          // Include filters in export if present
          filters: filters.filters
      }
  });

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Service Management" 
        description="Manage logical services, customers, and link definitions."
        icon={<DatabaseIcon />}
        stats={[{ value: totalCount, label: "Total Services" }]}
        actions={headerActions}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      <DataTable
        tableName="v_services"
        data={data}
        columns={columns}
        loading={isLoading}
        isFetching={isFetching}
        actions={tableActions}
        pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            onChange: (p, s) => { pagination.setCurrentPage(p); pagination.setPageLimit(s); }
        }}
        searchable={false} // We use custom toolbar for search
        customToolbar={
            <SearchAndFilters
                searchTerm={search.searchQuery}
                onSearchChange={search.setSearchQuery}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onClearFilters={() => {
                    search.setSearchQuery('');
                    filters.setFilters({});
                }}
                hasActiveFilters={Object.keys(filters.filters).length > 0 || !!search.searchQuery}
                activeFilterCount={Object.keys(filters.filters).length}
                searchPlaceholder="Search by Service Name, Node, or Description..."
            >
                <SelectFilter
                    label="Link Type"
                    filterKey="link_type_id"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={linkTypeOptions}
                />
                <SelectFilter
                    label="Status"
                    filterKey="status"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={[
                        { value: "true", label: "Active" },
                        { value: "false", label: "Inactive" }
                    ]}
                />
            </SearchAndFilters>
        }
      />

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
        message="Are you sure? This will remove the service and unlink it from any connections."
        type="danger"
        loading={deleteModal.loading}
      />
    </div>
  );
}