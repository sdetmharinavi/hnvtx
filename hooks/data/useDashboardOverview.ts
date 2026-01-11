// path: hooks/data/useDashboardOverview.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { z } from 'zod';
import { localDb } from '@/hooks/data/localDb';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  V_systems_completeRowSchema,
  V_nodes_completeRowSchema,
  V_ofc_cables_completeRowSchema,
  V_cable_utilizationRowSchema,
} from '@/schemas/zod-schemas';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';

const dashboardOverviewSchema = z.object({
  system_status_counts: z
    .object({
      Active: z.number().optional(),
      Inactive: z.number().optional(),
    })
    .nullable()
    .optional(),
  node_status_counts: z
    .object({
      Active: z.number().optional(),
      Inactive: z.number().optional(),
    })
    .nullable()
    .optional(),
  path_operational_status: z.record(z.string(), z.number()).nullable().optional(),
  cable_utilization_summary: z
    .object({
      average_utilization_percent: z.number().nullable().optional(),
      high_utilization_count: z.number().nullable().optional(),
      total_cables: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  port_utilization_by_type: z
    .array(
      z.object({
        type_code: z.string().nullable().optional(),
        total: z.number().optional(),
        active: z.number().optional(),
        used: z.number().optional(),
      })
    )
    .optional()
    .nullable(),
  user_activity_last_30_days: z
    .array(
      z.object({
        date: z.string().optional(),
        count: z.number().optional(),
      })
    )
    .nullable()
    .optional(),
  systems_per_maintenance_area: z.record(z.string(), z.number()).nullable().optional(),
});

export type DashboardOverviewData = z.infer<typeof dashboardOverviewSchema>;

// --- Helper Filters for Cursor Iteration ---
// These helpers allow us to check conditions on raw Dexie objects without full schema parsing

const matchesSystemFilters = (
  s: V_systems_completeRowSchema,
  filters: BsnlSearchFilters,
  statusBool: boolean | null,
  queryLower: string | undefined
) => {
  if (statusBool !== null && s.status !== statusBool) return false;
  if (filters.type && s.system_type_name !== filters.type) return false;
  // Note: ensure we check the correct field name from the view for region
  if (filters.region && s.system_maintenance_terminal_name !== filters.region) return false;
  if (filters.nodeType && s.node_type_name !== filters.nodeType) return false;
  if (queryLower && !s.system_name?.toLowerCase().includes(queryLower)) return false;
  return true;
};

const matchesNodeFilters = (
  n: V_nodes_completeRowSchema,
  filters: BsnlSearchFilters,
  statusBool: boolean | null,
  queryLower: string | undefined
) => {
  if (statusBool !== null && n.status !== statusBool) return false;
  if (filters.nodeType && n.node_type_name !== filters.nodeType) return false;
  if (filters.region && n.maintenance_area_name !== filters.region) return false;
  if (queryLower && !n.name?.toLowerCase().includes(queryLower)) return false;
  return true;
};

const matchesCableFilters = (
  c: V_ofc_cables_completeRowSchema,
  filters: BsnlSearchFilters,
  statusBool: boolean | null,
  queryLower: string | undefined
) => {
  if (statusBool !== null && c.status !== statusBool) return false;
  if (filters.type && c.ofc_type_name !== filters.type) return false;
  if (filters.region && c.maintenance_area_name !== filters.region) return false;
  if (queryLower && !c.route_name?.toLowerCase().includes(queryLower)) return false;
  return true;
};

// Optimized Local Calculation Function
const calculateLocalStats = async (
  filters: BsnlSearchFilters = {}
): Promise<DashboardOverviewData> => {
  const statusBool =
    filters.status === 'active' ? true : filters.status === 'inactive' ? false : null;
  const queryLower = filters.query?.toLowerCase();

  // Initialize Counters
  let sysActive = 0,
    sysInactive = 0;
  let nodeActive = 0,
    nodeInactive = 0;
  let cableHighUtil = 0,
    cableTotalUtil = 0,
    cableCount = 0;

  const systemsPerArea: Record<string, number> = {};
  const systemIds = new Set<string>(); // For port filtering

  // 1. Process Systems (Streaming)
  await localDb.v_systems_complete.each((sys) => {
    if (matchesSystemFilters(sys, filters, statusBool, queryLower)) {
      // Status Counts
      if (sys.status) sysActive++;
      else sysInactive++;

      // Area Counts
      if (sys.system_maintenance_terminal_name) {
        const area = sys.system_maintenance_terminal_name;
        systemsPerArea[area] = (systemsPerArea[area] || 0) + 1;
      }

      // Track ID for Port stats
      if (sys.id) systemIds.add(sys.id);
    }
  });

  // 2. Process Nodes (Streaming)
  await localDb.v_nodes_complete.each((node) => {
    if (matchesNodeFilters(node, filters, statusBool, queryLower)) {
      if (node.status) nodeActive++;
      else nodeInactive++;
    }
  });

  // 3. Process Cables & Utilization (Streaming)
  // We need to join utilization data manually
  // Fetch utilizations map first (smaller dataset usually)
  const utilMap = new Map<string, V_cable_utilizationRowSchema>();
  await localDb.v_cable_utilization.each((u) => {
    if (u.cable_id) utilMap.set(u.cable_id, u);
  });

  await localDb.v_ofc_cables_complete.each((cable) => {
    if (matchesCableFilters(cable, filters, statusBool, queryLower)) {
      cableCount++;
      const util = utilMap.get(cable.id!);
      const pct = util?.utilization_percent || 0;

      cableTotalUtil += pct;
      if (pct > 80) cableHighUtil++;
    }
  });

  const avgUtil = cableCount > 0 ? cableTotalUtil / cableCount : 0;

  // 4. Process Ports (Streaming)
  // Only count ports belonging to visible systems
  const portStatsMap = new Map<string, { total: number; active: number; used: number }>();

  await localDb.v_ports_management_complete.each((port) => {
    // Check if parent system is in our filtered set
    if (systemIds.has(port.system_id!)) {
      const code = port.port_type_code || 'Unknown';

      if (!portStatsMap.has(code)) {
        portStatsMap.set(code, { total: 0, active: 0, used: 0 });
      }

      const stats = portStatsMap.get(code)!;
      stats.total++;
      if (port.port_admin_status) stats.active++;
      if (port.port_utilization) stats.used++;
    }
  });

  const port_utilization_by_type = Array.from(portStatsMap.entries()).map(([type_code, stats]) => ({
    type_code,
    ...stats,
  }));

  return {
    system_status_counts: { Active: sysActive, Inactive: sysInactive },
    node_status_counts: { Active: nodeActive, Inactive: nodeInactive },
    path_operational_status: {}, // Not calculated locally for now
    cable_utilization_summary: {
      average_utilization_percent: Number(avgUtil.toFixed(2)),
      high_utilization_count: cableHighUtil,
      total_cables: cableCount,
    },
    port_utilization_by_type,
    user_activity_last_30_days: [], // Not available locally
    systems_per_maintenance_area: systemsPerArea,
  };
};

// Main Hook
export function useDashboardOverview(filters?: BsnlSearchFilters) {
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['dashboard-overview', filters],
    queryFn: async (): Promise<DashboardOverviewData | null> => {
      // 1. Online Path
      if (isOnline) {
        try {
          // Pass null for undefined filters to match RPC signature
          const { data, error } = await supabase.rpc('get_dashboard_overview', {
            p_status: filters?.status || null,
            p_type: filters?.type || null,
            p_region: filters?.region || null,
            p_node_type: filters?.nodeType || null,
            p_query: filters?.query || null,
          });

          if (error) throw error;

          // Verify schema integrity
          const parsed = dashboardOverviewSchema.safeParse(data);
          if (parsed.success) return parsed.data;

          console.warn('Dashboard overview schema mismatch', parsed.error);
          return data as DashboardOverviewData; // Fallback
        } catch (err) {
          console.warn('Online fetch failed, falling back to local calculation:', err);
        }
      }

      // 2. Offline / Fallback Path
      // Uses the new optimized iterator
      return calculateLocalStats(filters);
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
