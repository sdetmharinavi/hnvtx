// hooks/data/useInventoryHistory.ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { V_inventory_transactions_extendedRowSchema } from "@/schemas/zod-schemas";

export function useInventoryHistory(itemId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["inventory-history", itemId],
    queryFn: async () => {
      if (!itemId) return [];

      const { data, error } = await supabase
        .from("v_inventory_transactions_extended")
        .select("*")
        .eq("inventory_item_id", itemId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as V_inventory_transactions_extendedRowSchema[];
    },
    enabled: !!itemId,
  });
}