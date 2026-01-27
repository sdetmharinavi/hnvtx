// path: components/bsnl/DashboardStatsGrid.tsx
'use client';

import React, { useMemo } from 'react';
import {
  Network,
  Activity,
  AlertTriangle,
  Cable,
} from 'lucide-react';
import { Card } from '@/components/common/ui';
import { BsnlNode, BsnlCable, BsnlSystem } from './types';

// Updated interface to accept data directly
interface DashboardStatsGridProps {
  data: {
    nodes: BsnlNode[];
    ofcCables: BsnlCable[];
    systems: BsnlSystem[];
  };
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  action?: React.ReactNode;
}> = ({ icon, label, value, subtext, color, action }) => (
  <Card
    className={`p-4 border-l-4 ${color} bg-white dark:bg-gray-800 dark:border-l-4 h-full shadow-xs hover:shadow-md transition-shadow relative overflow-visible`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 mr-4 shrink-0">{icon}</div>
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

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ data }) => {
  const { nodes, ofcCables, systems } = data;

  // Calculate stats based on the PASSED data (which is already filtered by the parent Page)
  const stats = useMemo(() => {
    const sysActive = systems.filter(s => s.status).length;
    const sysInactive = systems.length - sysActive;
    
    const nodeActive = nodes.filter(n => n.status).length;
    
    const cableTotal = ofcCables.length;
    // Calculate simple utilization if available (needs joining logic or pre-calculation)
    // For now, we use available properties
    const cableUtil = ofcCables.reduce((acc, c) => acc + (c.capacity || 0), 0);
    const avgCapacity = cableTotal > 0 ? Math.round(cableUtil / cableTotal) : 0;

    return {
      sysActive,
      sysInactive,
      nodeActive,
      cableTotal,
      avgCapacity
    };
  }, [systems, nodes, ofcCables]);

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Network className="h-6 w-6 text-blue-500" />}
          label="Active Systems"
          value={stats.sysActive.toLocaleString()}
          subtext="Operational"
          color="border-blue-500"
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
          label="Inactive Systems"
          value={stats.sysInactive.toLocaleString()}
          subtext="Maintenance"
          color="border-red-500"
        />
        <StatCard
          icon={<Activity className="h-6 w-6 text-green-500" />}
          label="Active Nodes"
          value={stats.nodeActive.toLocaleString()}
          subtext="Locations"
          color="border-green-500"
        />
        <StatCard
          icon={<Cable className="h-6 w-6 text-cyan-500" />}
          label="Total Cables"
          value={stats.cableTotal.toLocaleString()}
          subtext={`Avg Cap: ${stats.avgCapacity}F`}
          color="border-cyan-500"
        />
      </div>
    </div>
  );
};