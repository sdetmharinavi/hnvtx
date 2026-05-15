// path: hooks/data/useDashboardOverview.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { z } from 'zod';
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

// Main Hook
export function useDashboardOverview(filters?: BsnlSearchFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['dashboard-overview', filters],
    queryFn: async (): Promise<DashboardOverviewData | null> => {
      // Pass null for undefined filters to match RPC signature
      const { data, error } = await supabase.rpc('get_dashboard_overview', {
        p_status: filters?.status || null,
        // The RPC expects 'p_type', 'p_region' etc. as single strings for now based on previous SQL
        // If your filters support arrays, the RPC might need updates, but for now we pass the first value or join
        // casting to any to handle potential array vs string mismatch if schema allows arrays
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_type: Array.isArray(filters?.type) ? filters?.type[0] : (filters?.type as string) || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_region: Array.isArray(filters?.region) ? filters?.region[0] : (filters?.region as string) || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_node_type: Array.isArray(filters?.nodeType) ? filters?.nodeType[0] : (filters?.nodeType as string) || null,
        p_query: filters?.query || null,
      });

      if (error) throw error;

      // Verify schema integrity
      const parsed = dashboardOverviewSchema.safeParse(data);
      if (parsed.success) return parsed.data;

      console.warn('Dashboard overview schema mismatch', parsed.error);
      return data as DashboardOverviewData; // Fallback
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true,
  });
}