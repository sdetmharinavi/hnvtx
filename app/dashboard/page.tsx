"use client";

import { tableQueryUtils, useDashboardOverview, useQueryPerformance } from "@/hooks/database";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/common/ui";

export default function DashboardPage() {
  const { getQueryStats, clearStaleQueries, prefetchCriticalData } = useQueryPerformance();
  const queryClient = useQueryClient();
  const supabase = createClient();
  // const { data } = useDashboardOverview(supabase, {});

  const stats = getQueryStats();

  const handleOptimizeCache = async () => {
    // Clear stale queries
    clearStaleQueries();

    // Remove old queries
    tableQueryUtils.removeStaleQueries(queryClient, 5 * 60 * 1000); // 5 minutes

    // Prefetch critical data
    await prefetchCriticalData(supabase, ['lookup_types', 'employees', 'employee_designations']);

    // Get cache stats for specific table
    const lookupTypesCacheStats = tableQueryUtils.getTableCacheStats(queryClient, 'lookup_types');
    console.log('Lookup Types cache stats:', lookupTypesCacheStats);

    const employeesCacheStats = tableQueryUtils.getTableCacheStats(queryClient, 'employees');
    console.log('Employees cache stats:', employeesCacheStats);

    const employeeDesignationsCacheStats = tableQueryUtils.getTableCacheStats(queryClient, 'employee_designations');
    console.log('Employee Designations cache stats:', employeeDesignationsCacheStats);

    // console.log('Dashboard Overview:', data);
  };
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Button onClick={handleOptimizeCache}>Optimize Cache</Button>
      <h2 className="mb-4 text-2xl font-bold text-gray-600 dark:text-gray-300">Welcome to your dashboard</h2>
      <p className="text-gray-600 dark:text-gray-300">
        Select an item from the sidebar to get started.
      </p>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
      <div>
      <h3>Query Performance</h3>
      <p>Total Queries: {stats.totalQueries}</p>
      <p>Stale Queries: {stats.staleQueries}</p>
      <p>Cache Size: {(stats.cacheSizeBytes / 1024 / 1024).toFixed(2)} MB</p>
      <button onClick={handleOptimizeCache}>Optimize Cache</button>
    </div>
    </div>
  );
}
