// app/dashboard/services/page.tsx
"use client";

import { useMemo } from "react";
import { PageHeader, useStandardHeaderActions } from "@/components/common/page-header";
import { DataTable } from "@/components/table";
import { useCrudManager } from "@/hooks/useCrudManager";
import { useServicesData } from "@/hooks/data/useServicesData";
import { ServicesTableColumns } from "@/config/table-columns/ServicesTableColumns";
import { createStandardActions } from "@/components/table/action-helpers";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";
import { toast } from "sonner";
import { Database } from "lucide-react";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { ConfirmModal } from "@/components/common/ui";
import { ServicesRowSchema } from "@/schemas/zod-schemas";

export default function ServicesPage() {
  const supabase = createClient();
  const {
    data, totalCount, isLoading, isFetching, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'services', ServicesRowSchema>({
    tableName: 'services',
    dataQueryHook: useServicesData,
    displayNameField: 'name',
  });

  // ... rest of the component code ...
  // (No other changes needed if the logic is the same)
  
  const columns = ServicesTableColumns(data);

  const { mutate: insertService, isPending: isInserting } = useTableInsert(supabase, 'services', {
     onSuccess: () => { refetch(); editModal.close(); toast.success("Service created."); }
  });
  
  const { mutate: updateService, isPending: isUpdating } = useTableUpdate(supabase, 'services', {
     onSuccess: () => { refetch(); editModal.close(); toast.success("Service updated."); }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = (formData: any) => {
      if (editModal.record) {
          updateService({ id: editModal.record.id, data: formData });
      } else {
          insertService(formData);
      }
  };

  const tableActions = useMemo(() => createStandardActions({
      onEdit: editModal.openEdit,
      onDelete: crudActions.handleDelete,
  }), [editModal.openEdit, crudActions.handleDelete]);

  const headerActions = useStandardHeaderActions({
      onRefresh: refetch,
      onAddNew: editModal.openAdd,
      isLoading
  });

  console.log(data);
  

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Service Management" 
        description="Manage logical services, customers, and link definitions."
        icon={<Database />}
        stats={[{ value: totalCount, label: "Total Services" }]}
        actions={headerActions}
      />

      <DataTable
        tableName="services" // Pass as string literal
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
        searchable
        onSearchChange={search.setSearchQuery}
      />

      {editModal.isOpen && (
        <ServiceFormModal 
            isOpen={editModal.isOpen} 
            onClose={editModal.close} 
            editingService={editModal.record} 
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