// path: components/bsnl/DashboardStatsGrid.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Network, Activity, AlertTriangle, CheckCircle, GitBranch, Cable, Server, Zap, Filter } from 'lucide-react';
import { Card } from '@/components/common/ui';
import { useDashboardOverview } from '@/hooks/data/useDashboardOverview';
import { MultiSelectFilter } from '@/components/common/filters/MultiSelectFilter';
import { Filters } from '@/hooks/database';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';

interface DashboardStatsGridProps {
  filters?: BsnlSearchFilters; // Accepts page-level filters
}

// ... StatCard and StatsGridSkeleton remain the same ...
const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  subtext?: string; 
  color: string;
  action?: React.ReactNode; 
}> = ({ icon, label, value, subtext, color, action }) => (
  <Card className={`p-4 border-l-4 ${color} bg-white dark:bg-gray-800 dark:border-l-4 h-full shadow-xs hover:shadow-md transition-shadow relative overflow-visible`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 mr-4 shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>}
        </div>
      </div>
      {action && <div className="self-start -mt-1 -mr-1">{action}</div>}
    </div>
  </Card>
);

const StatsGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-24"></div>
    ))}
  </div>
);

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ filters: pageFilters }) => {
  // Pass the page filters to the hook
  const { data, isLoading, isError, error } = useDashboardOverview(pageFilters);
  
  // Local state for the Port Type MultiSelect
  const [portFilters, setPortFilters] = useState<Filters>({
    type_code: ['GE(O)', 'GE(E)'] 
  });

  const typeOptions: Option[] = useMemo(() => {
    return (data?.port_utilization_by_type || [])
      .map(p => ({
        value: p.type_code || 'Unknown',
        label: p.type_code || 'Unknown'
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const utilizationStats = useMemo(() => {
    if (!data?.port_utilization_by_type) return { utilization: 0, activeCount: 0, count: 0 };

    const selectedTypes = (portFilters['type_code'] as string[]) || [];

    const filtered = data.port_utilization_by_type.filter(p => 
      selectedTypes.length > 0 ? selectedTypes.includes(p.type_code || '') : false
    );

    const totalActive = filtered.reduce((acc, curr) => acc + (curr?.active || 0), 0);
    const totalUsed = filtered.reduce((acc, curr) => acc + (curr?.used || 0), 0);

    return {
      count: selectedTypes.length,
      activeCount: totalActive,
      utilization: totalActive > 0 ? (totalUsed / totalActive) * 100 : 0
    };
  }, [data, portFilters]);

  if (isLoading) return <StatsGridSkeleton />;
  if (isError) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data) return null;

  const { system_status_counts, node_status_counts, cable_utilization_summary } = data;

  return (
    <div className="space-y-4">
      {/* 
         Optional: Show active page filters summary here if needed 
         e.g. "Showing stats for Region: North"
      */}

      {/* Port Type Filter Bar (Local to this grid component) */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-auto">
           <Filter className="w-4 h-4" />
           <span>Utilization Filters</span>
        </div>
        
        <div className="w-full sm:w-72">
          <MultiSelectFilter 
            label="" 
            filterKey="type_code"
            filters={portFilters}
            setFilters={setPortFilters}
            options={typeOptions}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
            icon={<Network className="h-6 w-6 text-blue-500" />}
            label="Active Systems"
            value={system_status_counts?.Active?.toLocaleString() ?? 0}
            subtext="Operational"
            color="border-blue-500"
        />
        <StatCard
            icon={<Server className="h-6 w-6 text-indigo-500" />}
            label="Active Ports"
            value={utilizationStats.activeCount.toLocaleString()}
            subtext={`Type (${utilizationStats.count > 0 ? utilizationStats.count : 'None'} Selected)`}
            color="border-indigo-500"
        />
        <StatCard
            icon={<Zap className="h-6 w-6 text-purple-500" />}
            label="System Utilization"
            value={`${utilizationStats.utilization.toFixed(1)}%`}
            subtext="Filtered Usage"
            color="border-purple-500"
        />
        <StatCard
            icon={<Activity className="h-6 w-6 text-green-500" />}
            label="Active Nodes"
            value={node_status_counts?.Active?.toLocaleString() ?? 0}
            subtext="Locations"
            color="border-green-500"
        />
        <StatCard
            icon={<Cable className="h-6 w-6 text-cyan-500" />}
            label="Total Cables"
            value={cable_utilization_summary?.total_cables?.toLocaleString() ?? 0}
            subtext="Fiber Routes"
            color="border-cyan-500"
        />
        <StatCard
            icon={<CheckCircle className="h-6 w-6 text-emerald-500" />}
            label="Cable Utilization"
            value={`${(cable_utilization_summary?.average_utilization_percent ?? 0).toFixed(1)}%`}
            subtext="Avg. per Cable"
            color="border-emerald-500"
        />
        <StatCard
            icon={<GitBranch className="h-6 w-6 text-yellow-500" />}
            label="High Traffic"
            value={cable_utilization_summary?.high_utilization_count?.toLocaleString() ?? 0}
            subtext="Cables > 80%"
            color="border-yellow-500"
        />
        <StatCard
            icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
            label="Inactive Systems"
            value={system_status_counts?.Inactive?.toLocaleString() ?? 0}
            subtext="Maintenance"
            color="border-red-500"
        />
      </div>
    </div>
  );
};