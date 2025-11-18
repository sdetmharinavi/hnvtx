import { useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";

// Types
interface FiberConnection {
  id: string;
  ofc_route_name: string | null;
  fiber_no_sn: number | null;
  updated_fiber_no_sn: number | null;
  updated_fiber_no_en: number | null;
}

export interface TraceRoutes {
  workingRx: string;
  workingTx: string;
  protectionRx: string;
  protectionTx: string;
}

interface ConnectionRecord {
  working_fiber_in_ids?: (string | null)[] | null;
  working_fiber_out_ids?: (string | null)[] | null;
  protection_fiber_in_ids?: (string | null)[] | null;
  protection_fiber_out_ids?: (string | null)[] | null;
}

export const useTracePath = (supabase: SupabaseClient<Database>) => {
  return useCallback(
    async (record: ConnectionRecord): Promise<TraceRoutes> => {
      try {
        // Helper function to fetch fiber details
        const fetchFiberDetails = async (
          ids: (string | null)[] | null | undefined
        ): Promise<FiberConnection[]> => {
          if (!ids || ids.length === 0) return [];
          const validIds = ids.filter((id): id is string => id !== null);
          if (validIds.length === 0) return [];

          const { data, error } = await supabase
            .from("v_ofc_connections_complete")
            .select("id, ofc_route_name, fiber_no_sn, updated_fiber_no_sn, updated_fiber_no_en")
            .in("id", validIds);

          if (error) throw error;

          // Order the results based on the original ID array order
          const dataMap = new Map(data.map((item) => [item.id, item]));
          return validIds.map((id) => dataMap.get(id)).filter(Boolean) as FiberConnection[];
        };

        // Helper function to format route string
        const formatRoute = (fibers: FiberConnection[]): string => {
          if (fibers.length === 0) return "No route configured";

          return fibers
            .map((f) =>
              f.updated_fiber_no_sn && f.updated_fiber_no_en
                ? `${f.ofc_route_name || "Unknown Route"} (F${f.updated_fiber_no_sn}/${
                    f.updated_fiber_no_en
                  })`
                : `${f.ofc_route_name || "Unknown Route"} (F${f.fiber_no_sn})`
            )
            .join(" → ");
        };

        // Fetch all fiber details in parallel
        const [workingFiberIn, workingFiberOut, protectionFiberIn, protectionFiberOut] =
          await Promise.all([
            fetchFiberDetails(record.working_fiber_in_ids),
            fetchFiberDetails(record.working_fiber_out_ids),
            fetchFiberDetails(record.protection_fiber_in_ids),
            fetchFiberDetails(record.protection_fiber_out_ids),
          ]);

        // Build trace routes
        const traceRoutes: TraceRoutes = {
          workingTx: formatRoute(workingFiberIn),
          workingRx: formatRoute(workingFiberOut),
          protectionTx: formatRoute(protectionFiberIn),
          protectionRx: formatRoute(protectionFiberOut),
        };

        return traceRoutes;
      } catch (error) {
        const err = error as Error;
        console.error("Error tracing path:", err);
        throw new Error(err.message || "Failed to trace fiber path");
      }
    },
    [supabase]
  );
};
