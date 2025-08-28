import { useCallback, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  usePagedOfcCablesComplete,
  usePagedOfcConnectionsComplete,
} from './database';
import { useSorting, SortDirection } from '@/hooks/useSorting';

type OfcConnection =
  Database['public']['Tables']['ofc_connections']['Insert'] & {
    id?: string;
  };

interface UseOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
  // pagination and sorting options
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  // optional server-side search query
  search?: string;
  // NEW: Optional client-side sorting enhancement
  enableClientSorting?: boolean;
}

// Define sortable keys for better type safety (optional)
type OfcConnectionSortableKeys =
  | 'fiber_no_sn'
  | 'connection_type'
  | 'connection_category'
  | 'status'
  | 'destination_port'
  | 'source_port'
  | 'en_power_dbm'
  | 'sn_power_dbm'
  | 'route_loss_db'
  | 'created_at'
  | 'updated_at';

export const useOfcConnection = ({
  supabase,
  cableId,
  limit = 10,
  offset = 0,
  orderBy = 'fiber_no_sn',
  orderDir = 'asc',
  search,
  enableClientSorting = false, // Default to false to maintain existing behavior
}: UseOfcConnectionProps) => {
  const queryClient = useQueryClient();

  const { data: cable, isLoading: isLoadingCable } = usePagedOfcCablesComplete(
    supabase,
    {
      filters: { id: cableId },
      limit: 1,
      offset: 0,
    }
  );

  // Get existing connections for this cable with pagination
  const {
    data: rawConnections = [],
    isLoading: isLoadingOfcConnections,
    refetch: refetchOfcConnections,
  } = usePagedOfcConnectionsComplete(supabase, {
    filters: { ofc_id: cableId, ...(search ? { search } : {}) },
    limit,
    offset,
    orderBy,
    orderDir,
  });

  // Extract counts and debug info
  const { totalCount, activeCount, inactiveCount } = useMemo(() => {
    if (rawConnections && rawConnections.length > 0) {
      return {
        totalCount: rawConnections[0]?.total_count || 0,
        activeCount: rawConnections[0]?.active_count || 0,
        inactiveCount: rawConnections[0]?.inactive_count || 0,
      };
    }
    return { totalCount: 0, activeCount: 0, inactiveCount: 0 };
  }, [rawConnections]);

  // NEW: Optional client-side sorting (only used if enabled)
  const {
    sortedData: clientSortedConnections,
    sortConfig,
    handleSort,
    resetSort,
    isSorted,
    getSortDirection,
  } = useSorting({
    data: rawConnections || [], // Handle null case
    defaultSortKey: orderBy,
    defaultDirection: orderDir as SortDirection,
    options: {
      caseSensitive: false,
      numericSort: true,
    },
  });

  // Return the appropriate data based on sorting preference
  const existingConnections = useMemo(() => {
    const connections = rawConnections || [];
    return enableClientSorting ? clientSortedConnections : connections;
  }, [enableClientSorting, clientSortedConnections, rawConnections]);

  // NEW: Enhanced sort handler (optional, only exposed if client sorting is enabled)
  const handleSortColumn = useCallback(
    (key: OfcConnectionSortableKeys) => {
      if (!enableClientSorting) {
        console.warn(
          'Client-side sorting is disabled. Use server-side orderBy/orderDir props instead.'
        );
        return;
      }
      handleSort(key);
    },
    [enableClientSorting, handleSort]
  );

  // Mutation for creating new connections (unchanged)
  const { mutateAsync: createConnections } = useMutation({
    mutationFn: async (newConnections: OfcConnection[]) => {
      const { data, error } = await supabase
        .from('ofc_connections')
        .insert(newConnections);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the connections query after successful insertion
      queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      refetchOfcConnections();
    },
  });

  // createMissingConnections (unchanged)
  const createMissingConnections = useCallback(async (): Promise<void> => {
    if (!cable || !cable[0]) return;

    // Get fresh connection count to avoid stale data
    const { data: currentConnections, error } = await supabase
      .from('ofc_connections')
      .select('id')
      .eq('ofc_id', cableId);

    if (error) {
      console.error('Failed to fetch current connections:', error);
      throw error;
    }

    const currentConnectionCount = currentConnections?.length || 0;
    const cableCapacity = cable[0].capacity as number;
    const missingCount = cableCapacity - currentConnectionCount;

    if (missingCount <= 0) {
      console.log('No missing connections to create');
      return;
    }

    // Create an array of new connections to insert
    const newConnections = Array.from({ length: missingCount }, (_, index) => {
      const connection: OfcConnection = {
        ofc_id: cableId,
        fiber_no_sn: currentConnectionCount + index + 1,
        connection_type: 'straight', // Or a default value
        connection_category: 'OFC_JOINT_TYPES', // Or a default value
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
      console.error('Failed to create connections:', error);
      throw error;
    }
  }, [cable, cableId, createConnections, supabase]);

  // ensureConnectionsExist (unchanged)
  const ensureConnectionsExist = useCallback(async (): Promise<void> => {
    if (isLoadingCable || isLoadingOfcConnections) {
      console.log('Still loading data, skipping connection creation');
      return;
    }

    try {
      await createMissingConnections();
    } catch (error) {
      console.error('Error ensuring connections exist:', error);
      throw error;
    }
  }, [isLoadingCable, isLoadingOfcConnections, createMissingConnections]);

  return {
    // EXISTING API (unchanged)
    cable: cable?.[0],
    existingConnections, // Now optionally client-sorted, but maintains same structure
    isLoading: isLoadingCable || isLoadingOfcConnections,
    ensureConnectionsExist,
    createMissingConnections,
    totalCount,
    activeCount,
    inactiveCount,

    // NEW: Optional sorting enhancements (only available if enableClientSorting is true)
    ...(enableClientSorting && {
      sortConfig,
      handleSortColumn,
      resetSort,
      isSorted,
      getSortDirection,
      isClientSorting: true,
    }),
  };
};
