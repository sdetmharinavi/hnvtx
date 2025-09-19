// components/maintenance-areas/useMaintenanceAreasMutations.ts
import { createClient } from "@/utils/supabase/client";
import { useTableInsert, useTableUpdate, useToggleStatus } from "@/hooks/database";
import { Maintenance_areasInsertSchema, Maintenance_areasUpdateSchema } from "@/schemas/zod-schemas";

export function useMaintenanceAreasMutations(
  supabase: ReturnType<typeof createClient>,
  onSuccess: () => void
) {
  const createAreaMutation = useTableInsert(supabase, "maintenance_areas", { onSuccess });
  const updateAreaMutation = useTableUpdate(supabase, "maintenance_areas", { onSuccess });
  const toggleStatusMutation = useToggleStatus(supabase, "maintenance_areas", { onSuccess });

  const handleFormSubmit = (
    data: Maintenance_areasInsertSchema,
    editingArea?: { id: string } | null
  ) => {
    if (editingArea?.id) {
      updateAreaMutation.mutate({ id: editingArea.id, data: data as Maintenance_areasUpdateSchema });
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