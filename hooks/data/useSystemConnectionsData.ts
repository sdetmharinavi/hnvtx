// hooks/data/useSystemConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from './useLocalFirstQuery';

/**
 * Helper to flip the connection perspective.
 * If the current system is the "End Node" (Destination), we swap SN/EN fields
 * so the UI always shows "Remote System" correctly relative to the current page.
 */
const transformConnectionPerspective = (
  conn: V_system_connections_completeRowSchema,
  currentSystemId: string | null
): V_system_connections_completeRowSchema => {
  if (!currentSystemId || conn.system_id === currentSystemId) {
    return conn;
  }

  // If the current system is the Destination (en_id), flip the record.
  if (conn.en_id === currentSystemId) {
    return {
      ...conn,
      // Flip IDs and Names
      system_id: conn.en_id,
      system_name: conn.en_name,
      system_type_name: conn.en_system_type_name,
      
      // Flip Interfaces
      system_working_interface: conn.en_interface,
      system_protection_interface: conn.en_protection_interface, // Assumes symmetrical protection field usage if exists
      
      en_id: conn.system_id,
      en_name: conn.system_name,
      en_system_type_name: conn.system_type_name,
      en_interface: conn.system_working_interface,
      
      // Flip Connected System Display
      connected_system_name: conn.system_name,
      connected_system_type_name: conn.system_type_name,
      
      // Flip Nodes
      sn_id: conn.en_node_id,
      sn_name: conn.en_node_name,
      en_node_id: conn.sn_node_id,
      en_node_name: conn.sn_node_name,
      
      // Flip IPs
      sn_ip: conn.en_ip,
      en_ip: conn.sn_ip
    };
  }

  return conn;
};

export const useSystemConnectionsData = (
  systemId: string | null
) => {
  return function useData(params: DataQueryHookParams): DataQueryHookReturn<V_system_connections_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;

    // 1. Online Fetcher (RPC)
    // The RPC 'get_paged_system_connections' fetches both incoming and outgoing connections
    const onlineQueryFn = useCallback(async (): Promise<V_system_connections_completeRowSchema[]> => {
      if (!systemId) return [];

      const { data, error } = await createClient().rpc('get_paged_system_connections', {
        p_system_id: systemId,
        p_limit: 5000, // Fetch all related to this system to allow client filtering
        p_offset: 0,
        p_search_query: null // We'll search on client to be consistent with filters
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = (data as any)?.data || [];

      return rawData.map((row: V_system_connections_completeRowSchema) =>
        transformConnectionPerspective(row, systemId)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemId]);

    // 2. Offline Fetcher
    const localQueryFn = useCallback(() => {
      if (!systemId) {
        return localDb.v_system_connections_complete.limit(0).toArray();
      }
      return Promise.all([
          localDb.v_system_connections_complete.where('system_id').equals(systemId).toArray(),
          localDb.v_system_connections_complete.where('en_id').equals(systemId).toArray()
      ]).then(([source, dest]) => {
          const combined = [...source, ...dest];
          // Dedup by ID
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique.map(row => transformConnectionPerspective(row, systemId));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemId]);

    // 3. Local First Query
    const {
      data: allConnections = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useLocalFirstQuery<'v_system_connections_complete', V_system_connections_completeRowSchema>({
      queryKey: ['system_connections-data', systemId], // specific key for this system
      onlineQueryFn,
      localQueryFn,
      dexieTable: localDb.v_system_connections_complete,
      localQueryDeps: [systemId],
    });

    // 4. Client-Side Processing
    const processedData = useMemo(() => {
      if (!allConnections || !systemId) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
      }

      let filtered = allConnections;

      // 1. Text Search
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((conn) =>
          conn.service_name?.toLowerCase().includes(lowerQuery) ||
          conn.system_name?.toLowerCase().includes(lowerQuery) ||
          conn.connected_system_name?.toLowerCase().includes(lowerQuery) ||
          conn.bandwidth_allocated?.toLowerCase().includes(lowerQuery) ||
          conn.unique_id?.toLowerCase().includes(lowerQuery) ||
          conn.lc_id?.toLowerCase().includes(lowerQuery)
        );
      }

      // 2. Filter Logic
      if (filters.media_type_id) {
        filtered = filtered.filter(c => c.media_type_id === filters.media_type_id);
      }
      if (filters.connected_link_type_id) {
        filtered = filtered.filter(c => c.connected_link_type_id === filters.connected_link_type_id);
      }
      if (filters.bandwidth) {
        filtered = filtered.filter(c => c.bandwidth === filters.bandwidth);
      }
      if (filters.status) {
        const statusBool = filters.status === 'true';
        filtered = filtered.filter(c => c.status === statusBool);
      }

      // THE FIX: Explicit Alphabetical Sort (Ascending)
      // Priority: Service Name -> Remote System Name -> Created Date
      filtered.sort((a, b) => {
        const nameA = a.service_name || a.connected_system_name || '';
        const nameB = b.service_name || b.connected_system_name || '';
        
        const nameComparison = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        if (nameComparison !== 0) return nameComparison;

        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      const totalCount = filtered.length;
      const activeCount = filtered.filter((c) => !!c.status).length;
      const inactiveCount = totalCount - activeCount;

      const start = (currentPage - 1) * pageLimit;
      const end = start + pageLimit;
      const paginatedData = filtered.slice(start, end);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConnections, searchQuery, filters, currentPage, pageLimit, systemId]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};