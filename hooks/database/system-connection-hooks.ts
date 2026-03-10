// hooks/database/system-connection-hooks.ts
"use client";

import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const pathDisplaySchema = z.record(z.string(), z.string()).nullable();
export type PathDisplayData = z.infer<typeof pathDisplaySchema>;

export function useServicePathDisplay(systemConnectionId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["service-path-display", systemConnectionId],
    queryFn: async () => {
      if (!systemConnectionId) return null;
      const { data, error } = await supabase.rpc("get_service_path_display", {
        p_system_connection_id: systemConnectionId,
      });
      if (error) throw error;

      const parsed = pathDisplaySchema.safeParse(data);
      if (!parsed.success) {
        console.error("Zod validation error for path display:", parsed.error);
        return null;
      }
      return parsed.data;
    },
    enabled: !!systemConnectionId,
  });
}
