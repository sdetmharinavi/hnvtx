// path: hooks/data/useDashboardOverview.ts
"use client";

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { z } from 'zod';
import { localDb } from '@/hooks/data/localDb';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { 
    SystemsRowSchema, 
    NodesRowSchema, 
    Logical_fiber_pathsRowSchema, 
    Lookup_typesRowSchema,
    V_cable_utilizationRowSchema,
    V_systems_completeRowSchema
} from '@/schemas/zod-schemas';

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
  user_activity_last_30_days: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })).nullable(),
  systems_per_maintenance_area: z.record(z.string(), z.number()).nullable(),
});

export type DashboardOverviewData = z.infer<typeof dashboardOverviewSchema>;

// Helper to calculate stats from local Dexie tables
const calculateLocalStats = async (): Promise<DashboardOverviewData> => {
  // Explicitly type the Promise.all results to avoid 'any' type inference issues
  const [systems, nodes, paths, lookups, cableUtils, vSystems] = await Promise.all([
    localDb.systems.toArray() as Promise<SystemsRowSchema[]>,
    localDb.nodes.toArray() as Promise<NodesRowSchema[]>,
    localDb.logical_fiber_paths.toArray() as Promise<Logical_fiber_pathsRowSchema[]>,
    localDb.lookup_types.toArray() as Promise<Lookup_typesRowSchema[]>,
    localDb.v_cable_utilization.toArray() as Promise<V_cable_utilizationRowSchema[]>,
    localDb.v_systems_complete.toArray() as Promise<V_systems_completeRowSchema[]>
  ]);

  // 1. System Status
  const sysActive = systems.filter(s => s.status === true).length;
  const sysInactive = systems.length - sysActive;

  // 2. Node Status
  const nodeActive = nodes.filter(n => n.status === true).length;
  const nodeInactive = nodes.length - nodeActive;

  // 3. Path Status
  const lookupMap = new Map<string, string>(
      lookups.map(l => [l.id, l.name])
  );
  
  const pathStats: Record<string, number> = {};
  paths.forEach(p => {
     if(p.operational_status_id) {
         const name = lookupMap.get(p.operational_status_id) || 'Unknown';
         pathStats[name] = (pathStats[name] || 0) + 1;
     }
  });

  // 4. Cable Utilization
  const totalCables = cableUtils.length;
  const highUtil = cableUtils.filter(c => (c.utilization_percent || 0) > 80).length;
  const avgUtil = totalCables > 0 
     ? cableUtils.reduce((sum, c) => sum + (c.utilization_percent || 0), 0) / totalCables 
     : 0;

  // 5. Systems per Area
  const systemsPerArea: Record<string, number> = {};
  vSystems.forEach(s => {
     if(s.system_maintenance_terminal_name) {
        const area = s.system_maintenance_terminal_name;
        systemsPerArea[area] = (systemsPerArea[area] || 0) + 1;
     }
  });

  return {
     system_status_counts: { Active: sysActive, Inactive: sysInactive },
     node_status_counts: { Active: nodeActive, Inactive: nodeInactive },
     path_operational_status: pathStats,
     cable_utilization_summary: {
        average_utilization_percent: Number(avgUtil.toFixed(2)),
        high_utilization_count: highUtil,
        total_cables: totalCables
     },
     user_activity_last_30_days: [], // Not available offline
     systems_per_maintenance_area: systemsPerArea
  };
};

export function useDashboardOverview() {
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async (): Promise<DashboardOverviewData | null> => {
      // If online, try to fetch from the server
      if (isOnline) {
        try {
          const { data, error } = await supabase.rpc('get_dashboard_overview');
          
          if (error) throw error;
          
          const parsed = dashboardOverviewSchema.safeParse(data);
          if (parsed.success) {
            return parsed.data;
          } else {
             console.error("Zod validation error:", parsed.error);
          }
        } catch (err) {
           console.warn("Online fetch failed, falling back to local calculation:", err);
           // Don't throw, fall through to local calculation
        }
      }

      // Fallback to local calculation (Offline or Server Error)
      try {
        const localData = await calculateLocalStats();
        return localData;
      } catch (localErr) {
        console.error("Failed to calculate local stats:", localErr);
        throw new Error("Could not load dashboard data.");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true // Refetch when coming back online
  });
}