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
import { Database as DatabaseIcon } from "lucide-react";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { V_servicesRowSchema } from "@/schemas/zod-schemas"; // Ensure correct import
import { Row } from "@/hooks/database";

export default function ServicesPage() {
  const supabase = createClient();
  
  // 1. Setup Crud Manager with View Schema
  const {
    data, totalCount, isLoading, isFetching, error, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions
  } = useCrudManager<'services', V_servicesRowSchema>({
    tableName: 'services', // Mutations target the table
    localTableName: 'v_services', // Queries read from the view/cache
    dataQueryHook: useServicesData,
    displayNameField: 'name',
  });

  // 2. Generate Columns using the data from CrudManager
  // Since we updated ServicesTableColumns to accept V_servicesRowSchema[], this will now work.
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
  
  // Helper to safe-cast the view row for the form
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
          fileName: `All_Services`
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
        searchable
        onSearchChange={search.setSearchQuery}
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