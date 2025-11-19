// path: hooks/data/useDashboardOverview.ts
"use client";

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { z } from 'zod';

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

export function useDashboardOverview() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async (): Promise<DashboardOverviewData | null> => {
      const { data, error } = await supabase.rpc('get_dashboard_overview');
      
      if (error) {
        console.error("Error fetching dashboard overview:", error);
        throw new Error(error.message);
      }
      
      const parsed = dashboardOverviewSchema.safeParse(data);
      if (!parsed.success) {
        console.error("Zod validation error for dashboard overview:", parsed.error);
        throw new Error("Received invalid data structure from dashboard overview function.");
      }

      return parsed.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}