// components/maintenance-areas/useMaintenanceAreasMutations.ts
import { createClient } from "@/utils/supabase/client";
import { useTableInsert, useTableUpdate, useToggleStatus } from "@/hooks/database";
import { TablesInsert, TablesUpdate } from "@/types/supabase-types";

export function useMaintenanceAreasMutations(
  supabase: ReturnType<typeof createClient>,
  onSuccess: () => void
) {
  const createAreaMutation = useTableInsert(supabase, "maintenance_areas", { onSuccess });
  const updateAreaMutation = useTableUpdate(supabase, "maintenance_areas", { onSuccess });
  const toggleStatusMutation = useToggleStatus(supabase, "maintenance_areas", { onSuccess });

  const handleFormSubmit = (
    data: TablesInsert<"maintenance_areas">,
    editingArea?: { id: string } | null
  ) => {
    if (editingArea?.id) {
      updateAreaMutation.mutate({ id: editingArea.id, data: data as TablesUpdate<"maintenance_areas"> });
    } else {
      createAreaMutation.mutate(data);
    }
  };

  return {
    createAreaMutation,
    updateAreaMutation,
    toggleStatusMutation,
    handleFormSubmit: (data: TablesInsert<"maintenance_areas">, editingArea?: { id: string } | null) => handleFormSubmit(data, editingArea)
  };
}