// path: hooks/database/system-connection-hooks.ts
"use client";
import { useRpcMutation } from "@/hooks/database/rpc-queries";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { RpcFunctionArgs } from "./queries-type-helpers";

export function useUpsertSystemConnection() {
  const supabase = createClient();
  return useRpcMutation(supabase, 'upsert_system_connection_with_details', {
    onSuccess: (_, variables) => {
      const action = variables.p_id ? 'updated' : 'created';
      toast.success(`System connection ${action} successfully.`);
    },
    onError: (err) => {
      toast.error(`Failed to save connection: ${err.message}`);
    },
    invalidateQueries: false,
  });
}

// THE FIX: The payload type must match the RPC function's arguments exactly, not partially.
export type SystemConnectionFormData = RpcFunctionArgs<'upsert_system_connection_with_details'>;