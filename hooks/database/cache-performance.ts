// hooks/database/cache-performance.ts
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import {
  Filters,
  RpcFunctionArgs,
  RpcFunctionName,
  RpcFunctionReturns,
  PublicTableName,
  TableRow,
  UseTableQueryOptions,
} from './queries-type-helpers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import {
  applyFilters,
  applyOrdering,
  createQueryKey,
  createRpcQueryKey,
} from './utility-functions';
import { DEFAULTS } from '@/constants/constants';

// ============================================================================
// MASTER DEPENDENCY MAP
// Maps a physical database table to ALL React Query keys and Views that rely on it.
// This guarantees "Change anywhere, update everywhere" synchronization.
// ============================================================================
export const TABLE_DEPENDENCY_MAP: Record<string, string[]> = {
  users: ['admin-users', 'user-full-profile'],
  user_profiles: [
    'user_profiles-data',
    'v_user_profiles_extended',
    'user-full-profile',
    'admin-users-list',
  ],
  employees: [
    'employees-data',
    'v_employees',
    'employee-options',
    'advances-data',
    'v_advances_complete',
    'expenses-data',
    'v_expenses_complete',
    'v_file_movements_extended',
    'v_e_files_extended',
    'e-files',
    'e-file-details',
  ],
  employee_designations: [
    'employee_designations-data',
    'v_employee_designations',
    'employees-data',
    'v_employees',
    'dropdown-options',
    'employee-options',
  ],
  maintenance_areas: [
    'maintenance_areas-data',
    'v_maintenance_areas',
    'dropdown-options',
    'v_nodes_complete',
    'nodes-data',
    'v_systems_complete',
    'systems-data',
    'v_ofc_cables_complete',
    'ofc_cables-data',
    'v_rings',
    'rings-manager-data',
    'dashboard-overview',
    'employee-options',
    'v_employees',
    'employees-data',
  ],
  lookup_types: [
    'lookup_types-data',
    'v_lookup_types',
    'categories-data-all',
    'dropdown-options',
    'v_systems_complete',
    'systems-data',
    'v_nodes_complete',
    'nodes-data',
    'v_ofc_cables_complete',
    'ofc_cables-data',
    'v_system_connections_complete',
    'system_connections-data',
    'v_services',
    'services-data',
    'v_rings',
    'rings-manager-data',
    'dashboard-overview',
    'v_ports_management_complete',
    'ports_management-data',
    'v_inventory_items',
    'inventory_items-data',
    'port-options',
  ],
  nodes: [
    'nodes-data',
    'v_nodes_complete',
    'v_systems_complete',
    'systems-data',
    'v_ofc_cables_complete',
    'ofc_cables-data',
    'v_system_connections_complete',
    'system_connections-data',
    'v_services',
    'services-data',
    'v_junction_closures_complete',
    'v_cable_segments_at_jc',
    'v_ring_nodes',
    'active-node-options',
    'dropdown-options',
    'dashboard-overview',
    'ring-nodes-detail',
    'route-details',
  ],
  systems: [
    'systems-data',
    'v_systems_complete',
    'v_system_connections_complete',
    'system_connections-data',
    'v_ring_nodes',
    'system-options',
    'dashboard-overview',
    'v_ports_management_complete',
    'ports_management-data',
    'ring-systems-data',
    'ring-nodes-detail',
  ],
  ofc_cables: [
    'ofc_cables-data',
    'v_ofc_cables_complete',
    'ofc-routes-for-selection',
    'v_cable_utilization',
    'dashboard-overview',
    'route-details',
    'available-cables',
    'ofc_connections-data',
    'v_ofc_connections_complete',
  ],
  ofc_cable_links: ['ofc_cables-data', 'v_ofc_cables_complete', 'route-details'],
  ofc_connections: [
    'ofc_connections-data',
    'v_ofc_connections_complete',
    'available-fibers',
    'v_cable_utilization',
    'route-details',
    'system_connections-data',
    'v_system_connections_complete',
    'service-path-display',
    'fiber-trace',
  ],
  system_connections: [
    'system_connections-data',
    'v_system_connections_complete',
    'all-system-connections',
    'dashboard-overview',
    'v_services',
    'services-data',
    'ring-all-logical-paths',
    'service-path-display',
    'ports_management-data',
    'v_ports_management_complete',
  ],
  sdh_connections: ['system_connections-data', 'v_system_connections_complete'],
  rings: [
    'rings-manager-data',
    'v_rings',
    'v_ring_nodes',
    'dropdown-options',
    'ring-path-config',
    'dashboard-overview',
    'ring-systems-data',
  ],
  ring_based_systems: [
    'ring-systems-data',
    'v_rings',
    'rings-manager-data',
    'v_ring_nodes',
    'v_systems_complete',
    'systems-data',
    'ring-nodes-detail',
  ],
  services: [
    'services-data',
    'v_services',
    'v_system_connections_complete',
    'system_connections-data',
    'ring-services',
    'dashboard-overview',
    'logical_paths',
    'logical_fiber_paths',
    'ring-connection-paths',
  ],
  ports_management: [
    'ports_management-data',
    'v_ports_management_complete',
    'port-options',
    'dashboard-overview',
  ],
  logical_paths: ['ring-connection-paths', 'ring-path-config', 'logical_paths'],
  logical_fiber_paths: [
    'logical_fiber_paths',
    'v_end_to_end_paths',
    'dashboard-overview',
    'ring-all-logical-paths',
    'service-path-display',
    'system_connections-data',
    'v_system_connections_complete',
    'ofc_connections-data',
    'v_ofc_connections_complete',
  ],
  logical_path_segments: ['v_end_to_end_paths', 'logical_fiber_paths', 'route-details'],
  cable_segments: ['route-details', 'v_cable_segments_at_jc', 'jc-splicing-details', 'fiber-trace'],
  junction_closures: [
    'route-details',
    'v_junction_closures_complete',
    'v_cable_segments_at_jc',
    'jc-splicing-details',
  ],
  fiber_splices: ['route-details', 'jc-splicing-details', 'fiber-trace'],
  advances: ['advances-data', 'v_advances_complete', 'v_expenses_complete', 'expenses-data'],
  expenses: ['expenses-data', 'v_expenses_complete', 'v_advances_complete', 'advances-data'],
  e_files: ['e-files', 'e-file-details', 'v_e_files_extended'],
  file_movements: ['e-file-details', 'v_file_movements_extended', 'v_e_files_extended', 'e-files'],
  inventory_items: ['inventory_items-data', 'v_inventory_items', 'inventory-history'],
  inventory_transactions: [
    'inventory-history',
    'v_inventory_transactions_extended',
    'v_inventory_items',
    'inventory_items-data',
  ],
  diary_notes: ['diary_data-for-month'],
  technical_notes: ['technical_notes-data', 'v_technical_notes'],
  folders: ['folders', 'files'],
  files: ['files'],
};

// ============================================================================
// GLOBAL CACHE INVALIDATOR
// Safely refetches exact tables, views, RPCs, and dropdowns without spamming the network.
// ============================================================================
export const invalidateRelatedCaches = (queryClient: QueryClient, tableName: string) => {
  // 1. Base table & generated views
  queryClient.invalidateQueries({ queryKey: ['table', tableName] });
  queryClient.invalidateQueries({ queryKey: ['unique', tableName] });
  queryClient.invalidateQueries({ queryKey: ['table', `v_${tableName}`] });
  queryClient.invalidateQueries({ queryKey: [`${tableName}-data`] });
  queryClient.invalidateQueries({ queryKey: [`v_${tableName}-data`] });
  queryClient.invalidateQueries({ queryKey: ['paged-data', tableName] });
  queryClient.invalidateQueries({ queryKey: ['paged-data', `v_${tableName}`] });
  queryClient.invalidateQueries({ queryKey: ['rpc-record', tableName] });
  queryClient.invalidateQueries({ queryKey: ['rpc-record', `v_${tableName}`] });

  // 2. Resolve relational dependencies
  const relatedKeys = TABLE_DEPENDENCY_MAP[tableName] || [];
  relatedKeys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });

    // THE FIX: Explicitly invalidate the view/table "-data" queries generated by useGenericDataQuery
    queryClient.invalidateQueries({ queryKey: [`${key}-data`] });

    // If the dependency key happens to be a view/table name used in RPCs, hit it directly
    queryClient.invalidateQueries({ queryKey: ['paged-data', key] });
    queryClient.invalidateQueries({ queryKey: ['rpc-record', key] });
  });

  // 3. Broad Catch-Alls for generic lookups
  queryClient.invalidateQueries({ queryKey: ['dropdown-options'] });
  queryClient.invalidateQueries({ queryKey: ['employee-options'] });
  queryClient.invalidateQueries({ queryKey: ['system-options'] });
  queryClient.invalidateQueries({ queryKey: ['port-options'] });
};

// Performance monitoring hook
export function useQueryPerformance() {
  const queryClient = useQueryClient();

  const getQueryStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      inactiveQueries: queries.filter((q) => q.getObserversCount() === 0).length,
      fetchingQueries: queries.filter((q) => q.state.status === 'pending').length,
      cacheSizeBytes: JSON.stringify(cache).length,
    };
  };

  const clearStaleQueries = () => {
    queryClient.removeQueries({
      predicate: (query) => query.isStale() && query.state.status !== 'pending',
    });
  };

  const prefetchCriticalData = async (
    supabase: SupabaseClient<Database>,
    criticalTables: PublicTableName[],
  ) => {
    const promises = criticalTables.map((tableName) =>
      queryClient.prefetchQuery({
        queryKey: ['table', tableName],
        queryFn: async () => {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(DEFAULTS.PAGE_SIZE);
          if (error) throw error;
          return data;
        },
        staleTime: DEFAULTS.CACHE_TIME,
      }),
    );

    await Promise.all(promises);
  };

  return {
    getQueryStats,
    clearStaleQueries,
    prefetchCriticalData,
  };
}

export const tableQueryUtils = {
  invalidateTable: (queryClient: QueryClient, tableName: string) => {
    invalidateRelatedCaches(queryClient, tableName);
  },

  invalidateAllTables: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['table'] });
    queryClient.invalidateQueries({ queryKey: ['unique'] });
  },

  invalidateRpc: (queryClient: QueryClient, functionName: string) => {
    queryClient.invalidateQueries({ queryKey: ['rpc', functionName] });
  },

  invalidateAllRpc: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['rpc'] });
  },

  prefetchTable: async <T extends PublicTableName>(
    queryClient: QueryClient,
    supabase: SupabaseClient<Database>,
    tableName: T,
    options?: UseTableQueryOptions<T>,
  ) => {
    return queryClient.prefetchQuery({
      queryKey: createQueryKey(
        tableName,
        options?.filters,
        options?.columns,
        options?.orderBy,
        undefined,
        options?.limit,
        options?.offset,
      ),
      queryFn: async (): Promise<TableRow<T>[]> => {
        let query = supabase.from(tableName).select(options?.columns || '*');

        if (options?.filters) {
          query = applyFilters(query, options.filters);
        }

        if (options?.orderBy) {
          query = applyOrdering(query, options.orderBy);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data as TableRow<T>[]) || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  },

  prefetchRpc: async <T extends RpcFunctionName>(
    queryClient: QueryClient,
    supabase: SupabaseClient<Database>,
    functionName: T,
    args?: RpcFunctionArgs<T>,
  ) => {
    return queryClient.prefetchQuery({
      queryKey: createRpcQueryKey(functionName, args),
      queryFn: async (): Promise<RpcFunctionReturns<T>> => {
        const { data, error } = await supabase.rpc(
          functionName,
          args || ({} as RpcFunctionArgs<T>),
        );
        if (error) throw error;
        return data as RpcFunctionReturns<T>;
      },
      staleTime: 3 * 60 * 1000,
    });
  },

  setQueryData: <T extends PublicTableName>(
    queryClient: QueryClient,
    tableName: T,
    data: TableRow<T>[],
    filters?: Filters,
    columns?: string,
  ) => {
    queryClient.setQueryData(createQueryKey(tableName, filters, columns), data);
  },

  getQueryData: <T extends PublicTableName>(
    queryClient: QueryClient,
    tableName: T,
    filters?: Filters,
    columns?: string,
  ): TableRow<T>[] | undefined => {
    return queryClient.getQueryData(createQueryKey(tableName, filters, columns));
  },

  getTableCacheStats: (queryClient: QueryClient, tableName: string) => {
    const cache = queryClient.getQueryCache();
    const tableQueries = cache.findAll({
      queryKey: ['table', tableName],
    });

    return {
      queryCount: tableQueries.length,
      staleCount: tableQueries.filter((q) => q.isStale()).length,
      fetchingCount: tableQueries.filter((q) => q.state.status === 'pending').length,
      errorCount: tableQueries.filter((q) => q.state.status === 'error').length,
      totalDataSize: tableQueries.reduce((acc, query) => {
        const data = query.state.data;
        return acc + (data ? JSON.stringify(data).length : 0);
      }, 0),
    };
  },

  removeStaleQueries: (queryClient: QueryClient, maxAge = 10 * 60 * 1000) => {
    queryClient.removeQueries({
      predicate: (query) => {
        const isOld = Date.now() - query.state.dataUpdatedAt > maxAge;
        return isOld && query.isStale() && query.state.status !== 'pending';
      },
    });
  },

  batchInvalidate: (
    queryClient: QueryClient,
    operations: Array<{ type: 'table' | 'rpc'; name: string }>,
  ) => {
    operations.forEach(({ type, name }) => {
      queryClient.invalidateQueries({ queryKey: [type, name] });
    });
  },
};
