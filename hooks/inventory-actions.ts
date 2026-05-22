// hooks/inventory-actions.ts
// 'use client';

// import { z } from 'zod';
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { createClient } from '@/utils/supabase/client';
// import { toast } from 'sonner';
// // THE FIX: Import master invalidator
// import { invalidateRelatedCaches } from '@/hooks/database/cache-performance';

// export const issueItemSchema = z.object({
//   item_id: z.uuid(),
//   quantity: z.number().min(1, 'Quantity must be at least 1'),
//   issued_to: z.string().min(1, 'Issued To is required'),
//   issue_reason: z.string().min(1, 'Reason is required'),
//   issued_date: z.string(), // ISO Date YYYY-MM-DD
// });

// export type IssueItemFormData = z.infer<typeof issueItemSchema>;

// export function useIssueInventoryItem() {
//   const supabase = createClient();
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (data: IssueItemFormData) => {
//       const { data: result, error } = await supabase.rpc('issue_inventory_item', {
//         p_item_id: data.item_id,
//         p_quantity: data.quantity,
//         p_issued_to: data.issued_to,
//         p_issue_reason: data.issue_reason,
//         p_issued_date: data.issued_date,
//       });

//       if (error) throw error;
//       return result;
//     },
//     onSuccess: (data) => {
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       const res = data as any;
//       toast.success(`Successfully issued ${res.item_name}. New Qty: ${res.new_quantity}`);

//       // THE FIX: Force sync of both tables affected by the RPC
//       invalidateRelatedCaches(queryClient, 'inventory_items');
//       invalidateRelatedCaches(queryClient, 'inventory_transactions');
//     },
//     onError: (err: Error) => {
//       toast.error(`Failed to issue item: ${err.message}`);
//     },
//   });
// }

// hooks/inventory-actions.ts
'use client';

import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { invalidateRelatedCaches } from '@/hooks/database/cache-performance';

// --- ISSUE ITEM SCHEMA ---
export const issueItemSchema = z.object({
  item_id: z.uuid(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  issued_to: z.string().min(1, 'Issued To is required'),
  issue_reason: z.string().min(1, 'Reason is required'),
  issued_date: z.string(), // ISO Date YYYY-MM-DD
});

export type IssueItemFormData = z.infer<typeof issueItemSchema>;

export function useIssueInventoryItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IssueItemFormData) => {
      const { data: result, error } = await supabase.rpc('issue_inventory_item', {
        p_item_id: data.item_id,
        p_quantity: data.quantity,
        p_issued_to: data.issued_to,
        p_issue_reason: data.issue_reason,
        p_issued_date: data.issued_date,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = data as any;
      toast.success(`Successfully issued ${res.item_name}. New Qty: ${res.new_quantity}`);
      invalidateRelatedCaches(queryClient, 'inventory_items');
      invalidateRelatedCaches(queryClient, 'inventory_transactions');
    },
    onError: (err: Error) => {
      toast.error(`Failed to issue item: ${err.message}`);
    },
  });
}

// --- ADD / RESTOCK ITEM SCHEMA ---
export const restockItemSchema = z.object({
  item_id: z.uuid(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  source: z.string().optional(), // Vendor / Source
  reason: z.string().min(1, 'Reason / PO Number is required'),
  restock_date: z.string(), // ISO Date YYYY-MM-DD
  unit_cost: z.number().min(0).optional(),
});

export type RestockItemFormData = z.infer<typeof restockItemSchema>;

export function useRestockInventoryItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RestockItemFormData) => {
      // Using `as any` because the auto-generated types haven't caught up with the new RPC yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await supabase.rpc('restock_inventory_item' as any, {
        p_item_id: data.item_id,
        p_quantity: data.quantity,
        p_source: data.source || null,
        p_reason: data.reason,
        p_date: data.restock_date,
        p_unit_cost: data.unit_cost || null,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = data as any;
      toast.success(`Successfully added stock to ${res.item_name}. New Qty: ${res.new_quantity}`);
      invalidateRelatedCaches(queryClient, 'inventory_items');
      invalidateRelatedCaches(queryClient, 'inventory_transactions');
    },
    onError: (err: Error) => {
      toast.error(`Failed to add stock: ${err.message}`);
    },
  });
}
