// app/dashboard/services/page.tsx
"use client";

import { useMemo, useState, useCallback } from "react";
import { PageHeader, useStandardHeaderActions, type ActionButton } from "@/components/common/page-header";
import { DataTable } from "@/components/table";
import { useCrudManager } from "@/hooks/useCrudManager";
import { useServicesData } from "@/hooks/data/useServicesData";
import { ServicesTableColumns } from "@/config/table-columns/ServicesTableColumns";
import { createStandardActions } from "@/components/table/action-helpers";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";
import { toast } from "sonner";
import { Copy, Database as DatabaseIcon } from "lucide-react";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { ConfirmModal, ErrorDisplay, StatusBadge } from "@/components/common/ui";
import { V_servicesRowSchema, Lookup_typesRowSchema } from "@/schemas/zod-schemas";
import { Row } from "@/hooks/database";
import { useOfflineQuery } from "@/hooks/data/useOfflineQuery";
import { localDb } from "@/hooks/data/localDb";
import { SearchAndFilters } from "@/components/common/filters/SearchAndFilters";
import { SelectFilter } from "@/components/common/filters/FilterInputs";
import { useDuplicateFinder } from "@/hooks/useDuplicateFinder";
import { useUser } from "@/providers/UserProvider";
import { FiMapPin } from "react-icons/fi";

export default function ServicesPage() {
  const supabase = createClient();
  const [showFilters, setShowFilters] = useState(false);
  const { isSuperAdmin } = useUser();
  
  const {
    data, totalCount, isLoading, isFetching, error, refetch,
    pagination, search, filters, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'services', V_servicesRowSchema>({
    tableName: 'services', 
    localTableName: 'v_services',
    dataQueryHook: useServicesData, 
    displayNameField: 'name',
  });

  // --- DUPLICATE DETECTION LOGIC ---
  const duplicateIdentity = useCallback((item: V_servicesRowSchema) => {
    const name = item.name?.trim().toLowerCase() || '';
    const linkType = item.link_type_name?.trim().toLowerCase() || '';
    return `${name}|${linkType}`;
  }, []);

  const { 
    showDuplicates, 
    toggleDuplicates, 
    duplicateSet 
  } = useDuplicateFinder(data, duplicateIdentity, 'Services');

  const columns = ServicesTableColumns(data, duplicateSet);

  // --- FETCH LINK TYPES FOR FILTER ---
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

  // --- MUTATIONS ---
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
      onDelete: isSuperAdmin ? crudActions.handleDelete : undefined,
  }), [editModal.openEdit, isSuperAdmin, crudActions.handleDelete]);

  const headerActions = useStandardHeaderActions({
      onRefresh: refetch,
      onAddNew: editModal.openAdd,
      isLoading,
      data: data as Row<'v_services'>[],
      exportConfig: {
          tableName: 'v_services',
          fileName: `All_Services`,
          filters: filters.filters
      }
  });

  // Add "Find Duplicates" button to header actions
  const enhancedHeaderActions: ActionButton[] = [
      ...headerActions,
      {
        label: showDuplicates ? "Hide Duplicates" : "Find Duplicates",
        onClick: toggleDuplicates,
        variant: showDuplicates ? "secondary" : "outline",
        leftIcon: <Copy className="w-4 h-4" />,
      }
  ];
  // Reorder to ensure Add New is last
  const addNewAction = enhancedHeaderActions.pop(); 
  enhancedHeaderActions.splice(enhancedHeaderActions.length - 1, 0, addNewAction!);

  const renderMobileItem = useCallback((record: Row<'v_services'>, actions: React.ReactNode) => {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="max-w-[75%]">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm wrap-break-words">
              {record.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                 {record.link_type_name || 'Link'}
               </span>
               {record.bandwidth_allocated && (
                 <span className="text-xs text-gray-500 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">
                   {record.bandwidth_allocated}
                 </span>
               )}
            </div>
          </div>
          {actions}
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 space-y-1">
           <div className="flex items-start gap-1.5">
              <FiMapPin className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
              <span className="truncate">{record.node_name}</span>
           </div>
           {record.end_node_name && (
             <div className="flex items-start gap-1.5">
                <FiMapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                <span className="truncate">{record.end_node_name}</span>
             </div>
           )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
             <div className="text-xs text-gray-400 font-mono">
               ID: {record.unique_id || 'N/A'} {record.vlan ? `| V:${record.vlan}` : ''}
             </div>
             <StatusBadge status={record.status ?? false} />
        </div>
      </div>
    );
  }, []);

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-6 space-y-6">
       <PageHeader 
        title="Service Management" 
        description="Manage logical services, customers, and link definitions."
        icon={<DatabaseIcon />}
        stats={[{ value: totalCount, label: "Total Services" }]}
        actions={enhancedHeaderActions} 
        isLoading={isLoading}
        isFetching={isFetching}
      />

           <DataTable
      autoHideEmptyColumns={true}
        tableName="v_services"
        data={data}
        columns={columns}
        loading={isLoading}
        isFetching={isFetching}
        actions={tableActions}
        renderMobileItem={renderMobileItem}
        pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageLimit,
            total: totalCount,
            onChange: (p, s) => { pagination.setCurrentPage(p); pagination.setPageLimit(s); }
        }}
        searchable={false} // Disable default search as we use custom toolbar
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
                {/* Link Type Filter */}
                <SelectFilter
                    label="Link Type"
                    filterKey="link_type_id"
                    filters={filters.filters}
                    setFilters={filters.setFilters}
                    options={linkTypeOptions}
                />
                
                {/* Status Filter */}
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