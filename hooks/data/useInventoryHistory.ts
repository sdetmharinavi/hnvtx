// hooks/data/useInventoryHistory.ts
import { useCallback } from 'react';
import { V_inventory_transactions_extendedRowSchema } from "@/schemas/zod-schemas";
import { createClient } from "@/utils/supabase/client";
import { localDb } from "@/hooks/data/localDb";
import { useLocalFirstQuery } from "./useLocalFirstQuery";

export function useInventoryHistory(itemId: string | null) {
  const supabase = createClient();

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_inventory_transactions_extendedRowSchema[]> => {
    if (!itemId) return [];
    const { data, error } = await supabase
      .from("v_inventory_transactions_extended")
      .select("*")
      .eq("inventory_item_id", itemId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as V_inventory_transactions_extendedRowSchema[];
  }, [itemId, supabase]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    if (!itemId) return Promise.resolve([]);
    // Filter locally since we sync the whole view
    return localDb.v_inventory_transactions_extended
      .where('inventory_item_id')
      .equals(itemId)
      .reverse() // Sort by primary key (id) effectively, though created_at would be better if indexed
      .sortBy('created_at'); 
  }, [itemId]);

  // 3. Local First Query Hook
  const { data, isLoading, error, refetch } = useLocalFirstQuery<'v_inventory_transactions_extended'>({
    queryKey: ["inventory-history", itemId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_inventory_transactions_extended,
    enabled: !!itemId,
    localQueryDeps: [itemId]
  });

  return { data, isLoading, error, refetch };
}