// path: components/bsnl/DashboardStatsGrid.tsx
"use client";

import React from 'react';
import { Network, Activity, AlertTriangle, CheckCircle, GitBranch, Cable } from 'lucide-react';
import { Card } from '@/components/common/ui';
import { useDashboardOverview } from '@/hooks/data/useDashboardOverview';

// Stat Card subcomponent for consistent styling
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string; }> = ({ icon, label, value, color }) => (
  <Card className={`p-4 border-l-4 ${color} bg-white dark:bg-gray-800 dark:border-l-4`}>
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </Card>
);

// Skeleton loader for when data is being fetched
const StatsGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 mr-4 w-12 h-12"></div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const DashboardStatsGrid: React.FC = () => {
  const { data, isLoading, isError, error } = useDashboardOverview();

  if (isLoading) {
    return <StatsGridSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-lg">
        <h4 className="font-semibold">Error Loading Stats</h4>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
            No overview data available.
        </div>
    );
  }

  const { system_status_counts, node_status_counts, cable_utilization_summary } = data;

  const stats = [
    { icon: <Network className="h-6 w-6 text-blue-500" />, label: 'Active Systems', value: system_status_counts?.Active?.toLocaleString() ?? 0, color: 'border-blue-500' },
    { icon: <Activity className="h-6 w-6 text-green-500" />, label: 'Active Nodes', value: node_status_counts?.Active?.toLocaleString() ?? 0, color: 'border-green-500' },
    { icon: <Cable className="h-6 w-6 text-indigo-500" />, label: 'Total Cables', value: cable_utilization_summary?.total_cables?.toLocaleString() ?? 0, color: 'border-indigo-500' },
    { icon: <AlertTriangle className="h-6 w-6 text-red-500" />, label: 'Inactive Systems', value: system_status_counts?.Inactive?.toLocaleString() ?? 0, color: 'border-red-500' },
    { icon: <GitBranch className="h-6 w-6 text-yellow-500" />, label: 'High Utilization Cables', value: cable_utilization_summary?.high_utilization_count?.toLocaleString() ?? 0, color: 'border-yellow-500' },
    { icon: <CheckCircle className="h-6 w-6 text-purple-500" />, label: 'Avg. Utilization', value: `${(cable_utilization_summary?.average_utilization_percent ?? 0).toFixed(1)}%`, color: 'border-purple-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map(stat => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};