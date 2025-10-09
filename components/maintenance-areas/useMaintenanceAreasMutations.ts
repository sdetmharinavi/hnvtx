// components/maintenance-areas/useMaintenanceAreasMutations.ts
import { createClient } from "@/utils/supabase/client";
import { useTableInsert, useTableUpdate, useToggleStatus } from "@/hooks/database";
import { Maintenance_areasInsertSchema, Maintenance_areasUpdateSchema } from "@/schemas/zod-schemas";
import { toast } from "sonner";

export function useMaintenanceAreasMutations(
  supabase: ReturnType<typeof createClient>,
  onSuccess: () => void
) {
  const createAreaMutation = useTableInsert(supabase, "maintenance_areas", { 
    onSuccess,
    onError: (error) => {
      toast.error(`Failed to create area: ${error.message}`);
    }
  });

  const updateAreaMutation = useTableUpdate(supabase, "maintenance_areas", { 
    onSuccess,
    onError: (error) => {
      toast.error(`Failed to update area: ${error.message}`);
    }
  });

  const toggleStatusMutation = useToggleStatus(supabase, "maintenance_areas", { 
    onSuccess,
    onError: (error) => {
      toast.error(`Failed to toggle status: ${error.message}`);
    }
  });

  const handleFormSubmit = (
    data: Maintenance_areasInsertSchema,
    editingArea?: { id: string } | null
  ) => {
    if (editingArea?.id) {
      const { id, ...updateData } = data;
      
      updateAreaMutation.mutate({ 
        id: editingArea.id, 
        data: updateData as Maintenance_areasUpdateSchema 
      });
    } else {
      createAreaMutation.mutate(data);
    }
  };

  return {
    createAreaMutation,
    updateAreaMutation,
    toggleStatusMutation,
    handleFormSubmit: (data: Maintenance_areasInsertSchema, editingArea?: { id: string } | null) => handleFormSubmit(data, editingArea)
  };
}