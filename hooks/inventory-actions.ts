// hooks/database/inventory-actions.ts
"use client";

import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

// --- Validation Schema for the Form ---
export const issueItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  issued_to: z.string().min(1, "Issued To is required"),
  issue_reason: z.string().min(1, "Reason is required"),
  issued_date: z.string(), // ISO Date YYYY-MM-DD
});

export type IssueItemFormData = z.infer<typeof issueItemSchema>;

export function useIssueInventoryItem() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IssueItemFormData) => {
      const { data: result, error } = await supabase.rpc("issue_inventory_item", {
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
      toast.success(
        `Successfully issued ${res.item_name}. New Qty: ${res.new_quantity}`
      );
      // Invalidate the main inventory list so the quantity updates immediately
      queryClient.invalidateQueries({ queryKey: ["inventory_items-data"] });
      queryClient.invalidateQueries({ queryKey: ["v_inventory_items"] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to issue item: ${err.message}`);
    },
  });
}