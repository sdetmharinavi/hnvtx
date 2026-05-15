// hooks/data/useInventoryHistory.ts
import { useQuery } from '@tanstack/react-query';
import { V_inventory_transactions_extendedRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';

export function useInventoryHistory(itemId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['inventory-history', itemId],
    queryFn: async (): Promise<V_inventory_transactions_extendedRowSchema[]> => {
      if (!itemId) return [];

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_inventory_transactions_extended',
        p_limit: 100,
        p_offset: 0,
        p_filters: { inventory_item_id: itemId },
        p_order_by: 'created_at',
        p_order_dir: 'desc',
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any)?.data || []) as V_inventory_transactions_extendedRowSchema[];
    },
    enabled: !!itemId,
    staleTime: 5 * 60 * 1000
  });
}