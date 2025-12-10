// components/systems/PortHeatmap.tsx
import React, { useMemo } from 'react';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';

interface PortHeatmapProps {
  ports: V_ports_management_completeRowSchema[];
  onPortClick: (port: V_ports_management_completeRowSchema) => void;
}

export const PortHeatmap = ({ ports, onPortClick }: PortHeatmapProps) => {
  
  // Sort ports naturally (1, 2, 10 instead of 1, 10, 2)
  const sortedPorts = useMemo(() => {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    return [...ports].sort((a, b) => collator.compare(a.port || '', b.port || ''));
  }, [ports]);

  const getPortStatusColor = (p: V_ports_management_completeRowSchema) => {
    if (!p.port_admin_status) return 'bg-red-500 hover:bg-red-600 border-red-600'; // Admin Down
    if (p.port_utilization) return 'bg-blue-500 hover:bg-blue-600 border-blue-600'; // In Use
    return 'bg-green-500 hover:bg-green-600 border-green-600'; // Available
  };

  const formatPortLabel = (name: string | null) => {
      if (!name) return '?';
      // Remove common prefixes like 'ETH-', 'Gi', etc. and keep the numbers
      // e.g. "ETH-1-1-10" -> "1-1-10", "Gi0/1" -> "0/1"
      return name.replace(/^(ETH-|Gi|Te|Fa|Eth|TenGig|Gig)[a-zA-Z]*[-]?/i, '');
  };

  if (ports.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Port Status Map</h4>
        
        {/* Legend */}
        <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div> 
                <span className="text-gray-600 dark:text-gray-400">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div> 
                <span className="text-gray-600 dark:text-gray-400">Allocated</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div> 
                <span className="text-gray-600 dark:text-gray-400">Admin Down</span>
            </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedPorts.map((port) => (
          <button
            key={port.id}
            onClick={() => onPortClick(port)}
            type="button"
            // THE FIX: Changed from fixed w-10 to variable width with min-width and padding
            className={`
              h-9 w-auto min-w-[2.5rem] px-2 flex items-center justify-center rounded-md border 
              text-[11px] font-bold text-white transition-all duration-200 
              hover:scale-105 hover:shadow-md focus:ring-2 focus:ring-offset-1 focus:outline-none
              ${getPortStatusColor(port)}
            `}
            title={`Port: ${port.port}\nStatus: ${port.port_admin_status ? 'UP' : 'DOWN'}\nUtilized: ${port.port_utilization ? 'Yes' : 'No'}`}
          >
            {formatPortLabel(port.port)}
          </button>
        ))}
      </div>
    </div>
  );
};