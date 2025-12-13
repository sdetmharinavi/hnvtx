// path: hooks/data/useDashboardOverview.ts
"use client";

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { z } from 'zod';
import { localDb } from '@/hooks/data/localDb';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import {
    V_nodes_completeRowSchema,
    V_cable_utilizationRowSchema,
    V_systems_completeRowSchema,
    V_ports_management_completeRowSchema,
    V_ofc_cables_completeRowSchema
} from '@/schemas/zod-schemas';

// Schema remains the same
const dashboardOverviewSchema = z.object({
  system_status_counts: z.object({
    Active: z.number().optional(),
    Inactive: z.number().optional(),
  }).nullable(),
  node_status_counts: z.object({
    Active: z.number().optional(),
    Inactive: z.number().optional(),
  }).nullable(),
  path_operational_status: z.record(z.string(), z.number()).nullable(),
  cable_utilization_summary: z.object({
    average_utilization_percent: z.number().nullable(),
    high_utilization_count: z.number().nullable(),
    total_cables: z.number().nullable(),
  }).nullable(),
  port_utilization_by_type: z.array(z.object({
    type_code: z.string().nullable(),
    total: z.number(),
    active: z.number(),
    used: z.number()
  })).optional().nullable(),
  user_activity_last_30_days: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })).nullable(),
  systems_per_maintenance_area: z.record(z.string(), z.number()).nullable(),
});

export type DashboardOverviewData = z.infer<typeof dashboardOverviewSchema>;

// Offline Stats Calculation with Filters
const calculateLocalStats = async (filters?: BsnlSearchFilters): Promise<DashboardOverviewData> => {
  const [nodes, cableUtils, vSystems, ports, vCables] = await Promise.all([
    localDb.v_nodes_complete.toArray() as Promise<V_nodes_completeRowSchema[]>,
    localDb.v_cable_utilization.toArray() as Promise<V_cable_utilizationRowSchema[]>,
    localDb.v_systems_complete.toArray() as Promise<V_systems_completeRowSchema[]>,
    localDb.v_ports_management_complete.toArray() as Promise<V_ports_management_completeRowSchema[]>,
    localDb.v_ofc_cables_complete.toArray() as Promise<V_ofc_cables_completeRowSchema[]>
  ]);

  // Filter Logic
  const statusBool = filters?.status === 'active' ? true : filters?.status === 'inactive' ? false : null;
  const region = filters?.region;
  const type = filters?.type;
  const nodeType = filters?.nodeType;
  const query = filters?.query?.toLowerCase();

  const filterSystem = (s: V_systems_completeRowSchema) => {
    if (statusBool !== null && s.status !== statusBool) return false;
    if (type && s.system_type_name !== type) return false;
    if (region && s.system_maintenance_terminal_name !== region) return false;
    if (nodeType && s.node_type_name !== nodeType) return false;
    if (query && !s.system_name?.toLowerCase().includes(query)) return false;
    return true;
  };

  const filterNode = (n: V_nodes_completeRowSchema) => {
    if (statusBool !== null && n.status !== statusBool) return false;
    if (nodeType && n.node_type_name !== nodeType) return false;
    if (region && n.maintenance_area_name !== region) return false;
    if (query && !n.name?.toLowerCase().includes(query)) return false;
    return true;
  };

  // 1. Filtered Data Sets
  const filteredSystems = vSystems.filter(filterSystem);
  const filteredNodes = nodes.filter(filterNode);
  
  // For cables, we need to join v_ofc_cables_complete with utilization data
  // Build a map of cable_id -> utilization data
  const utilMap = new Map(cableUtils.map(u => [u.cable_id, u]));
  const filteredCables = vCables.filter(c => {
      if (statusBool !== null && c.status !== statusBool) return false;
      if (type && c.ofc_type_name !== type) return false;
      if (region && c.maintenance_area_name !== region) return false;
      if (query && !c.route_name?.toLowerCase().includes(query)) return false;
      return true;
  });

  // 2. Calculate Stats
  const sysActive = filteredSystems.filter(s => s.status === true).length;
  const sysInactive = filteredSystems.length - sysActive;

  const nodeActive = filteredNodes.filter(n => n.status === true).length;
  const nodeInactive = filteredNodes.length - nodeActive;

  // Cable Stats
  const highUtil = filteredCables.filter(c => {
      const u = utilMap.get(c.id);
      return (u?.utilization_percent || 0) > 80;
  }).length;
  
  const totalUtilPercent = filteredCables.reduce((acc, c) => {
      const u = utilMap.get(c.id);
      return acc + (u?.utilization_percent || 0);
  }, 0);
  const avgUtil = filteredCables.length > 0 ? totalUtilPercent / filteredCables.length : 0;

  // Port Stats (Filtered by System Filters)
  const systemIds = new Set(filteredSystems.map(s => s.id));
  const filteredPorts = ports.filter(p => systemIds.has(p.system_id));
  
  const portStatsMap = new Map<string, { total: number, active: number, used: number }>();
  filteredPorts.forEach(p => {
    const code = p.port_type_code || 'Unknown';
    if (!portStatsMap.has(code)) portStatsMap.set(code, { total: 0, active: 0, used: 0 });
    const s = portStatsMap.get(code)!;
    s.total++;
    if (p.port_admin_status) s.active++;
    if (p.port_utilization) s.used++;
  });

  const port_utilization_by_type = Array.from(portStatsMap.entries()).map(([type_code, stats]) => ({
    type_code, ...stats
  }));

  return {
     system_status_counts: { Active: sysActive, Inactive: sysInactive },
     node_status_counts: { Active: nodeActive, Inactive: nodeInactive },
     path_operational_status: {}, // Complex to filter locally efficiently without full graph
     cable_utilization_summary: {
        average_utilization_percent: Number(avgUtil.toFixed(2)),
        high_utilization_count: highUtil,
        total_cables: filteredCables.length
     },
     port_utilization_by_type,
     user_activity_last_30_days: [],
     systems_per_maintenance_area: {} // Not critical for top stats
  };
};

export function useDashboardOverview(filters?: BsnlSearchFilters) {
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['dashboard-overview', filters], // Include filters in key
    queryFn: async (): Promise<DashboardOverviewData | null> => {
      if (isOnline) {
        try {
          const { data, error } = await supabase.rpc('get_dashboard_overview', {
            p_status: filters?.status || null,
            p_type: filters?.type || null,
            p_region: filters?.region || null,
            p_node_type: filters?.nodeType || null,
            p_query: filters?.query || null
          });

          if (error) throw error;
          const parsed = dashboardOverviewSchema.safeParse(data);
          if (parsed.success) return parsed.data;
          console.error("Zod validation error:", parsed.error);
        } catch (err) {
           console.warn("Online fetch failed, falling back to local calculation:", err);
        }
      }

      // Fallback
      return calculateLocalStats(filters);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true 
  });
}