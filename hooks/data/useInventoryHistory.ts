// hooks/data/useInventoryHistory.ts
import { useCallback } from 'react';
import { V_inventory_transactions_extendedRowSchema } from "@/schemas/zod-schemas";
import { createClient } from "@/utils/supabase/client";
import { localDb } from "@/hooks/data/localDb";
import { useLocalFirstQuery } from "./useLocalFirstQuery";

export function useInventoryHistory(itemId: string | null) {
  const supabase = createClient();

  // 1. Online Fetcher (UPDATED: Uses RPC instead of direct Table Select)
  const onlineQueryFn = useCallback(async (): Promise<V_inventory_transactions_extendedRowSchema[]> => {
    if (!itemId) return [];

    // Use the secure RPC wrapper
    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_inventory_transactions_extended',
      p_limit: 100, // Fetch up to 100 history items
      p_offset: 0,
      p_filters: { inventory_item_id: itemId },
      p_order_by: 'created_at',
      p_order_dir: 'desc'
    });

    if (error) throw error;
    
    // Parse the JSONB response structure from get_paged_data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
  }, [itemId, supabase]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    if (!itemId) return Promise.resolve([]);
    // Filter locally since we sync the whole view
    return localDb.v_inventory_transactions_extended
      .where('inventory_item_id')
      .equals(itemId)
      .reverse() 
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