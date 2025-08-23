import { useCallback } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useTableQuery, useTableWithRelations } from "./database/core-queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePagedOfcConnectionsComplete } from "./database";

type OfcConnection = Database["public"]["Tables"]["ofc_connections"]["Insert"] & {
  id?: string;
};

interface UseOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
  // pagination and sorting options
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
}

export const useOfcConnection = ({ supabase, cableId, limit = 10, offset = 0, orderBy = "fiber_no_sn", orderDir = "asc" }: UseOfcConnectionProps) => {
  const queryClient = useQueryClient();

  // Get cable details
  type OfcCableWithJoins = Database["public"]["Tables"]["ofc_cables"]["Row"] & {
    maintenance_area: { id: string; name: string } | null;
    ofc_type: { id: string; name: string } | null;
  };

  const { data: cable, isLoading: isLoadingCable } = useTableWithRelations<
    "ofc_cables",
    OfcCableWithJoins[]
  >(supabase, "ofc_cables", [
    "maintenance_area:maintenance_terminal_id(id, name)",
    "ofc_type:ofc_type_id(id, name)",
  ], {
    filters: { id: cableId },
  });

  // Get existing connections for this cable with pagination
  // Also retrieve Total Count of Connections, activeCount, inactiveCount from the view
  const { data: existingConnections = [], isLoading: isLoadingOfcConnections, refetch: refetchOfcConnections } = usePagedOfcConnectionsComplete(supabase, {
    filters: { ofc_id: cableId },
    limit,
    offset,
    orderBy,
    orderDir,
  });

  const totalCount = existingConnections?.[0]?.total_count || 0;
  const activeCount = existingConnections?.[0]?.active_count || 0;
  const inactiveCount = existingConnections?.[0]?.inactive_count || 0;

  // Mutation for creating new connections
  const { mutateAsync: createConnections } = useMutation({
    mutationFn: async (newConnections: OfcConnection[]) => {
      const { data, error } = await supabase.from("ofc_connections").insert(newConnections);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the connections query after successful insertion
      queryClient.invalidateQueries({ queryKey: ["ofc_connections"] });
      refetchOfcConnections();
    },
  });

  const createMissingConnections = useCallback(async (): Promise<void> => {
    if (!cable || !cable[0]) return;

    // Get fresh connection count to avoid stale data
    const { data: currentConnections, error } = await supabase.from("ofc_connections").select("id").eq("ofc_id", cableId);

    if (error) {
      console.error("Failed to fetch current connections:", error);
      throw error;
    }

    const currentConnectionCount = currentConnections?.length || 0;
    const cableCapacity = cable[0].capacity as number;
    const missingCount = cableCapacity - currentConnectionCount;

    console.log(`Cable capacity: ${cableCapacity}, Current connections: ${currentConnectionCount}, Missing: ${missingCount}`);

    if (missingCount <= 0) {
      console.log("No missing connections to create");
      return;
    }

    // Create an array of new connections to insert
    const newConnections = Array.from({ length: missingCount }, (_, index) => {
      const connection: OfcConnection = {
        ofc_id: cableId,
        fiber_no_sn: currentConnectionCount + index + 1,
        connection_type: "straight", // Or a default value
        connection_category: "OFC_JOINT_TYPES", // Or a default value
        status: true,
        // --- All optional fields are explicitly set to null for clarity ---
        system_id: null, // <-- The only missing field, now added
        destination_port: null,
        source_port: null,
        en_dom: null,
        en_power_dbm: null,
        fiber_no_en: null,
        logical_path_id: null,
        otdr_distance_en_km: null,
        otdr_distance_sn_km: null,
        path_segment_order: null,
        remark: null,
        route_loss_db: null,
        sn_dom: null,
        sn_power_dbm: null,
        // created_at and updated_at are best handled by the database itself
      };
      return connection;
    });

    try {
      console.log(`Creating ${newConnections.length} new connections`);
      await createConnections(newConnections);
    } catch (error) {
      console.error("Failed to create connections:", error);
      throw error;
    }
  }, [cable, cableId, createConnections, supabase]);

  const ensureConnectionsExist = useCallback(async (): Promise<void> => {
    if (isLoadingCable || isLoadingOfcConnections) {
      console.log("Still loading data, skipping connection creation");
      return;
    }

    try {
      await createMissingConnections();
    } catch (error) {
      console.error("Error ensuring connections exist:", error);
      throw error;
    }
  }, [isLoadingCable, isLoadingOfcConnections, createMissingConnections]);

  return {
    cable: cable?.[0],
    existingConnections,
    isLoading: isLoadingCable || isLoadingOfcConnections,
    ensureConnectionsExist,
    createMissingConnections,
    totalCount,
    activeCount,
    inactiveCount,
  };
};
