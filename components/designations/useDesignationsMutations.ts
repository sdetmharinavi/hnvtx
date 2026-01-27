// components/designations/useDesignationsMutations.ts
import { createClient } from "@/utils/supabase/client";
import { useTableInsert, useTableUpdate, useToggleStatus } from "@/hooks/database";
import { Employee_designationsInsertSchema, Employee_designationsUpdateSchema } from "@/schemas/zod-schemas";
import { toast } from "sonner";

export function useDesignationsMutations(
  supabase: ReturnType<typeof createClient>,
  onSuccess: () => void
) {
  const createDesignationMutation = useTableInsert(supabase, "employee_designations", {
    onSuccess,
    onError: (error) => {
      toast.error(`Failed to create designation: ${error.message}`);
    }
  });

  const updateDesignationMutation = useTableUpdate(supabase, "employee_designations", {
    onSuccess,
    onError: (error) => {
      toast.error(`Failed to update designation: ${error.message}`);
    }
  });

  const toggleStatusMutation = useToggleStatus(supabase, "employee_designations", {
    onSuccess,
    onError: (error) => {
      toast.error(`Failed to toggle status: ${error.message}`);
    }
  });

  const handleFormSubmit = (
    data: Employee_designationsInsertSchema,
    editingDesignation?: { id: string } | null
  ) => {
    if (editingDesignation?.id) {
      const { id: _omitId, ...updateData } = data;
      void _omitId;

      updateDesignationMutation.mutate({
        id: editingDesignation.id,
        data: updateData as Employee_designationsUpdateSchema
      });
    } else {
      createDesignationMutation.mutate(data);
    }
  };

  return {
    createDesignationMutation,
    updateDesignationMutation,
    toggleStatusMutation,
    handleFormSubmit: (data: Employee_designationsInsertSchema, editingDesignation?: { id: string } | null) => handleFormSubmit(data, editingDesignation)
  };
}