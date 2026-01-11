// hooks/database/trace-hooks.ts
import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';

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

          // Query the TABLE 'ofc_connections' directly with explicit join
          const { data, error } = await supabase
            .from('ofc_connections')
            .select(
              `
              id,
              fiber_no_sn,
              updated_fiber_no_sn,
              updated_fiber_no_en,
              ofc_cables (
                route_name
              )
            `
            )
            .in('id', validIds);

          if (error) {
            console.error('Trace fetch error:', error);
            throw error;
          }

          if (!data || data.length === 0) {
            console.warn('Trace fetch returned no data for IDs:', validIds);
            return [];
          }

          // Map the nested join result to the flat structure expected
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const flattenedData = (data as any[]).map((item) => ({
            id: item.id,
            fiber_no_sn: item.fiber_no_sn,
            updated_fiber_no_sn: item.updated_fiber_no_sn,
            updated_fiber_no_en: item.updated_fiber_no_en,
            // Handle the joined relationship safely
            ofc_route_name: item.ofc_cables?.route_name || 'Unknown Route',
          }));

          // Order the results based on the original ID array order (critical for path sequence)
          const dataMap = new Map(flattenedData.map((item) => [item.id, item]));
          return validIds.map((id) => dataMap.get(id)).filter(Boolean) as FiberConnection[];
        };

        // Helper function to format route string
        const formatRoute = (fibers: FiberConnection[]): string => {
          if (fibers.length === 0) return 'No route configured';

          return fibers
            .map((f) => {
              // Use updated fiber numbers (logical path) if available, else physical
              const startFib = f.updated_fiber_no_sn ?? f.fiber_no_sn;
              const endFib = f.updated_fiber_no_en ?? f.fiber_no_sn;

              // THE FIX: Always show both start and end fiber numbers for clarity
              return `${f.ofc_route_name} (F${startFib}/${endFib})`;
            })
            .join(' → ');
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
        console.error('Error tracing path:', err);
        throw new Error(err.message || 'Failed to trace fiber path');
      }
    },
    [supabase]
  );
};
