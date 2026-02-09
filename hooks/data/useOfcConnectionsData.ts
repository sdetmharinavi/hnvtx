// hooks/data/useOfcConnectionsData.ts
import { useMemo } from 'react';
import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useOfcConnectionsData = (cableId: string | null) => {
  const hook = useMemo(() => createGenericDataQuery<'v_ofc_connections_complete'>({
    tableName: 'v_ofc_connections_complete',

    // Inject the cable ID as a mandatory server-side filter
    baseFilters: cableId ? { ofc_id: cableId } : {},

    // Use an indexed query for local data fetching optimization
    // THE FIX: Do NOT call .sortBy() here. Return the Collection.
    // The generic hook will handle sorting via performClientSort.
    getLocalCollection: (table) => {
        if (!cableId) return table.limit(0); // Return empty if no ID
        return table.where('ofc_id').equals(cableId);
    },

    searchFields: [
      'system_name',
      'connection_type',
      'updated_sn_name',
      'updated_en_name',
      'remark',
    ],

    // Specific casts for the RPC OR search
    serverSearchFields: [
      'system_name',
      'connection_type',
      'updated_sn_name',
      'updated_en_name',
      'remark::text',
      'updated_fiber_no_en::text',
      'updated_fiber_no_sn::text',
    ],

    defaultSortField: 'fiber_no_sn',
    rpcLimit: DEFAULTS.PAGE_SIZE,

    filterFn: (c, filters) => {
      // 1. Media/Link Type Filters
      if (filters.ofc_type_name && c.ofc_type_name !== filters.ofc_type_name) return false;

      // 2. Status Filter
      if (filters.status) {
        const statusBool = filters.status === 'true';
        if (c.status !== statusBool) return false;
      }

      // 3. Custom Allocation Status Logic (Ported from original hook)
      if (filters.allocation_status) {
        const filterVal = filters.allocation_status;

        if (filterVal === 'faulty') {
          return !c.status;
        } else if (filterVal === 'available') {
          return !!c.status && !c.system_id && !c.logical_path_id;
        } else if (filterVal === 'allocated') {
          return !!c.status && (!!c.system_id || !!c.logical_path_id);
        }
      }

      return true;
    },
  }), [cableId]);

  return hook;
};