"use client";

import { useMemo, useState } from "react";
import { ConfirmModal } from "@/components/common/ui/Modal";
import { useTableWithRelations, useTableInsert, useTableUpdate, useToggleStatus, Filters } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { useDelete } from "@/hooks/useDelete";
import { DesignationFormModal } from "@/components/designations/DesignationFormModal";
import { PageHeader, useStandardHeaderActions } from "@/components/common/PageHeader";
import { ErrorDisplay } from "@/components/common/ui";
import { toast } from "sonner";
import { ImUserTie } from "react-icons/im";
import { EntityManagementComponent } from "@/components/common/entity-management/EntityManagementComponent";
import { designationConfig } from "@/config/designations";
import { Employee_designationsInsertSchema, Employee_designationsUpdateSchema } from "@/schemas/zod-schemas";

export interface DesignationWithRelations extends Omit<Employee_designationsInsertSchema, "id"> {
  id: string;
  parent_designation: DesignationWithRelations | null;
  child_designations: DesignationWithRelations[];
  status: boolean | null;
}

export default function DesignationManagerPage() {
  const supabase = createClient();

  // State management
  const [filters, setFilters] = useState<{ status?: string }>({});
  const [selectedDesignationId, setSelectedDesignationId] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DesignationWithRelations | null>(null);
  // Data queries
  const serverFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.status) f.status = filters.status === "true";
    return f;
  }, [filters]);

  const designationsQuery = useTableWithRelations<"employee_designations", DesignationWithRelations[]>(supabase, "employee_designations", ["parent_designation:parent_id(id, name)"], {
    filters: serverFilters,
    orderBy: [{ column: "name", ascending: true }],
  });

  const { refetch, error, data } = designationsQuery;

  const totalCount = data?.length || 0;

  // Data mutations
  const onMutationSuccess = () => {
    designationsQuery.refetch();
    setFormOpen(false);
    setEditingDesignation(null);
  };

  const createDesignationMutation = useTableInsert(supabase, "employee_designations", { onSuccess: onMutationSuccess });
  const updateDesignationMutation = useTableUpdate(supabase, "employee_designations", { onSuccess: onMutationSuccess });
  const toggleStatusMutation = useToggleStatus(supabase, "employee_designations", { onSuccess: onMutationSuccess });

  const deleteManager = useDelete({
    tableName: "employee_designations",
    onSuccess: () => {
      if (selectedDesignationId === deleteManager.itemToDelete?.id) {
        setSelectedDesignationId(null);
      }
      designationsQuery.refetch();
    },
  });

  // Derived state
  const allDesignations = useMemo(() => (designationsQuery.data as DesignationWithRelations[]) || [], [designationsQuery.data]);

  // Event handlers
  const handleOpenCreateForm = () => {
    setEditingDesignation(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (designation: DesignationWithRelations) => {
    setEditingDesignation(designation);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: Employee_designationsInsertSchema) => {
    if (editingDesignation) {
      updateDesignationMutation.mutate({
        id: editingDesignation.id || "",
        data: data as Employee_designationsUpdateSchema,
      });
    } else {
      createDesignationMutation.mutate(data);
    }
  };

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    data: designationsQuery.data?.map((d) => ({
      id: d.id,
      name: d.name,
      created_at: d.created_at ?? null,
      updated_at: d.updated_at ?? null,
      parent_id: d.parent_id ?? null,
      status: d.status ?? null,
    })),
    onRefresh: async () => {
      await refetch();
      toast.success("Refreshed successfully!");
    },
    // onAddNew: placeholder ToDo,
    isLoading: designationsQuery.isLoading,
    exportConfig: { tableName: "employee_designations" },
  });

  const headerStats = [
    { value: totalCount, label: "Total Designations" },
    {
      value: allDesignations.filter((r) => r.status).length,
      label: "Active",
      color: "success" as const,
    },
    {
      value: allDesignations.filter((r) => !r.status).length,
      label: "Inactive",
      color: "danger" as const,
    },
  ];

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: "Retry",
            onClick: refetch,
            variant: "primary",
          },
        ]}
      />
    );
  }

  const isLoading = designationsQuery.isLoading || createDesignationMutation.isPending || updateDesignationMutation.isPending || toggleStatusMutation.isPending;

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden'>
      <PageHeader title='Designation Management' description='Manage designations and their related information.' icon={<ImUserTie />} stats={headerStats} actions={headerActions} isLoading={isLoading} className="mb-4" />
      <EntityManagementComponent<DesignationWithRelations>
        config={designationConfig}
        entitiesQuery={designationsQuery}
        toggleStatusMutation={toggleStatusMutation}
        onEdit={handleOpenEditForm}
        onDelete={deleteManager.deleteSingle}
        onCreateNew={handleOpenCreateForm}
      />

      {/* Modals */}
      {isFormOpen && (
        <DesignationFormModal
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
          designation={editingDesignation}
          allDesignations={allDesignations.map((d) => ({
            id: d.id ?? "",
            name: d.name,
            created_at: d.created_at ?? null,
            updated_at: d.updated_at ?? null,
            parent_id: d.parent_id ?? null,
            status: d.status ?? null,
          }))}
          isLoading={createDesignationMutation.isPending || updateDesignationMutation.isPending}
        />
      )}
      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title='Confirm Deletion'
        message={deleteManager.confirmationMessage}
        confirmText='Delete'
        cancelText='Cancel'
        type='danger'
        showIcon
        closeOnBackdrop
        closeOnEscape
        loading={deleteManager.isPending}
        size='md'
      />
    </div>
  );
}
