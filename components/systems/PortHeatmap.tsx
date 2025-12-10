// components/systems/PortHeatmap.tsx
import React from 'react';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';

interface PortHeatmapProps {
  ports: V_ports_management_completeRowSchema[];
  onPortClick: (port: V_ports_management_completeRowSchema) => void;
}

export const PortHeatmap = ({ ports, onPortClick }: PortHeatmapProps) => {
  // Group ports by Slot/Card if name convention allows (e.g., 1.1, 1.2 -> Slot 1)
  // Fallback to simple grid if no convention detected
  
  const getPortStatusColor = (p: V_ports_management_completeRowSchema) => {
    if (!p.port_admin_status) return 'bg-red-500 hover:bg-red-600'; // Admin Down
    if (p.port_utilization) return 'bg-blue-500 hover:bg-blue-600'; // In Use
    return 'bg-green-500 hover:bg-green-600'; // Available
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Port Visualization</h4>
      
      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs">
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-xs"></div> Available</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-xs"></div> Utilized</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-xs"></div> Down</div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ports.map((port) => (
          <div
            key={port.id}
            onClick={() => onPortClick(port)}
            className={`
              w-10 h-10 flex items-center justify-center rounded cursor-pointer transition-all shadow-sm text-[10px] font-bold text-white
              ${getPortStatusColor(port)}
            `}
            title={`Port: ${port.port} | ${port.port_utilization ? 'Used' : 'Free'}`}
          >
            {port.port?.split('.').pop() || port.port?.slice(-2)} 
          </div>
        ))}
      </div>
    </div>
  );
};