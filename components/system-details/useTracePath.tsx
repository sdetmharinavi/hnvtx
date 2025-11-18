import { useCallback } from "react";

// Types
interface FiberConnection {
  id: string;
  ofc_route_name: string;
  updated_fiber_no_sn: number;
  updated_fiber_no_en: number;
}

interface TraceRoutes {
  workingRx: string;
  workingTx: string;
  protectionRx: string;
  protectionTx: string;
}

interface ConnectionRecord {
  working_fiber_in_ids?: string[];
  working_fiber_out_ids?: string[];
  protection_fiber_in_ids?: string[];
  protection_fiber_out_ids?: string[];
}

export const useTracePath = (supabase: any) => {
  return useCallback(
    async (record: ConnectionRecord) => {
      try {
        // Helper function to fetch fiber details
        const fetchFiberDetails = async (
          ids: string[] | undefined
        ): Promise<FiberConnection[]> => {
          if (!ids || ids.length === 0) return [];

          const { data, error } = await supabase
            .from("v_ofc_connections_complete")
            .select("id, ofc_route_name, updated_fiber_no_sn, updated_fiber_no_en")
            .in("id", ids);

          if (error) throw error;
          return data || [];
        };

        // Helper function to format route string
        const formatRoute = (fibers: FiberConnection[]): string => {
          if (fibers.length === 0) return "No route configured";
          
          return fibers
            .map(
              (f) =>
                `${f.ofc_route_name}: ${f.updated_fiber_no_sn}/${f.updated_fiber_no_en}`
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
          workingRx: formatRoute(workingFiberIn),
          workingTx: formatRoute(workingFiberOut),
          protectionRx: formatRoute(protectionFiberIn),
          protectionTx: formatRoute(protectionFiberOut),
        };

        return traceRoutes;
      } catch (error: any) {
        console.error("Error tracing path:", error);
        throw new Error(error.message || "Failed to trace fiber path");
      }
    },
    [supabase]
  );
};