// components/bsnl/DashboardStatsGrid.tsx
'use client';

import React, { useMemo } from 'react';
import { Network, Activity, AlertTriangle, Cable } from 'lucide-react';
import { Card } from '@/components/common/ui';
import { BsnlNode, BsnlCable, BsnlSystem } from './types';
import { ExtendedOfcCable } from '@/schemas/custom-schemas';

// Updated interface to accept data AND filter callback
interface DashboardStatsGridProps {
  data: {
    nodes: BsnlNode[];
    ofcCables: ExtendedOfcCable[];
    systems: BsnlSystem[];
  };
  onStatusClick: (status: 'active' | 'inactive' | 'all') => void;
  currentStatusFilter?: string;
}

// Interactive StatCard
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ icon, label, value, subtext, color, isActive, onClick }) => (
  <Card
    className={`
      p-4 border-l-4 ${color} 
      bg-white dark:bg-gray-800 dark:border-l-4 h-full shadow-xs 
      hover:shadow-md transition-all relative overflow-visible cursor-pointer
      ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}
    `}
    onClick={onClick}
  >
    <div className='flex items-center justify-between'>
      <div className='flex items-center'>
        <div className='p-3 rounded-full bg-gray-100 dark:bg-gray-700 mr-4 shrink-0'>{icon}</div>
        <div>
          <p className='text-sm font-medium text-gray-500 dark:text-gray-400 truncate'>{label}</p>
          <p className='text-2xl font-bold text-gray-900 dark:text-white'>{value}</p>
          {subtext && <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>{subtext}</p>}
        </div>
      </div>
    </div>
  </Card>
);

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  data,
  onStatusClick,
  currentStatusFilter,
}) => {
  const { nodes, ofcCables, systems } = data;

  const stats = useMemo(() => {
    // Note: 'data' passed here is ALREADY filtered by the hook in parent.
    // If we want "global" stats to remain visible even when filtered, we'd need the raw unfiltered counts passed down.
    // However, the standard behavior in other pages is that the stats refect the current view (mostly),
    // OR they reflect the global counts depending on how the hook returns data.
    // Since useBsnlDashboardData returns filtered data, these numbers will change as you filter.
    // To implement "Click to filter", we usually want the numbers to represent the counts for THAT status.

    // BUT: If the data is already filtered to 'active', then 'inactive' count will be 0.
    // This is a UI limitation of using the same data source for both display and counting.
    // For this specific dashboard, we will just use the current counts, accepting that clicking one might zero out the others visually until cleared.
    // Ideally, we'd pass 'stats' object from `useDashboardOverview` which IS global.

    // Let's use the counts from the passed data for now as it's consistent with "what you see".
    const sysActive = systems.filter((s) => s.status).length;
    const sysInactive = systems.length - sysActive;
    const nodeActive = nodes.filter((n) => n.status).length;
    const cableTotal = ofcCables.length;

    // Utilization
    const cableUtil = ofcCables.reduce((acc, c) => acc + (c.capacity || 0), 0);
    const avgCapacity = cableTotal > 0 ? Math.round(cableUtil / cableTotal) : 0;

    return {
      sysActive,
      sysInactive,
      nodeActive,
      cableTotal,
      avgCapacity,
    };
  }, [systems, nodes, ofcCables]);

  return (
    <div className='space-y-4'>
      {/* Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          icon={<Network className='h-6 w-6 text-blue-500' />}
          label='Active Systems'
          value={stats.sysActive.toLocaleString()}
          subtext='Operational'
          color='border-blue-500'
          onClick={() => onStatusClick('active')}
          isActive={currentStatusFilter === 'active'}
        />
        <StatCard
          icon={<AlertTriangle className='h-6 w-6 text-red-500' />}
          label='Inactive Systems'
          value={stats.sysInactive.toLocaleString()}
          subtext='Maintenance'
          color='border-red-500'
          onClick={() => onStatusClick('inactive')}
          isActive={currentStatusFilter === 'inactive'}
        />
        <StatCard
          icon={<Activity className='h-6 w-6 text-green-500' />}
          label='Active Nodes'
          value={stats.nodeActive.toLocaleString()}
          subtext='Locations'
          color='border-green-500'
          onClick={() => onStatusClick('active')}
          // Note: Reusing 'active' filter for nodes too
        />
        <StatCard
          icon={<Cable className='h-6 w-6 text-cyan-500' />}
          label='Total Cables'
          value={stats.cableTotal.toLocaleString()}
          subtext={`Avg Cap: ${stats.avgCapacity}F`}
          color='border-cyan-500'
          onClick={() => onStatusClick('all')}
          isActive={!currentStatusFilter}
        />
      </div>
    </div>
  );
};
