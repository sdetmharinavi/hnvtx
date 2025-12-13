// components/connections/ConnectionCard.tsx
import React from 'react';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { FiActivity, FiArrowRight, FiCpu, FiEye, FiGlobe, FiMapPin, FiMonitor, FiServer } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { formatIP } from '@/utils/formatters';

interface ConnectionCardProps {
  connection: V_system_connections_completeRowSchema;
  onViewDetails: (conn: V_system_connections_completeRowSchema) => void;
  onViewPath: (conn: V_system_connections_completeRowSchema) => void;
  onGoToSystem: (conn: V_system_connections_completeRowSchema) => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection, onViewDetails, onViewPath, onGoToSystem
}) => {
  
  const hasPath = Array.isArray(connection.working_fiber_in_ids) && connection.working_fiber_in_ids.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                    {connection.connected_link_type_name || 'Link'}
                </span>
                {connection.bandwidth_allocated && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                        <FiActivity className="w-3 h-3" /> {connection.bandwidth_allocated}
                    </span>
                )}
             </div>
             <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-base" title={connection.service_name || connection.connected_system_name || ''}>
                {connection.service_name || connection.connected_system_name || 'Unnamed Connection'}
             </h3>
        </div>
        <StatusBadge status={connection.status ?? false} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1 text-sm">
         
         {/* Route Visual */}
         <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                <span>Source (Local)</span>
                <span>Dest (Remote)</span>
            </div>
            
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-700 dark:text-gray-300 truncate" title={connection.system_name || ''}>
                        {connection.system_name}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                        {connection.system_working_interface || '?'}
                    </div>
                </div>

                <div className="shrink-0 text-gray-300 dark:text-gray-600">
                    <FiArrowRight />
                </div>

                <div className="flex-1 min-w-0 text-right">
                    <div className="font-medium text-gray-700 dark:text-gray-300 truncate" title={connection.en_name || ''}>
                        {connection.en_name || 'External'}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                        {connection.en_interface || '?'}
                    </div>
                </div>
            </div>
         </div>

         {/* Technical Info */}
         <div className="grid grid-cols-2 gap-2 text-xs">
            {(connection.unique_id || connection.vlan) && (
                <div className="flex flex-col bg-blue-50/50 dark:bg-blue-900/10 p-1.5 rounded">
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase">VLAN/UNIQUE ID</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                        {connection.vlan || '-'} <span className="text-gray-400">/</span> {connection.unique_id || '-'}
                    </span>
                </div>
            )}
             {/* Use 'any' cast if services_ip is typed as unknown in schema, otherwise remove cast */}
             {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((connection as any).services_ip) && (
                <div className="flex flex-col bg-green-50/50 dark:bg-green-900/10 p-1.5 rounded">
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] uppercase">Service IP</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {formatIP((connection as any).services_ip)}
                    </span>
                </div>
            )}
         </div>
      </div>

      {/* Footer / Actions */}
      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
         <Button size="xs" variant="ghost" onClick={() => onGoToSystem(connection)} title="Go To Host System">
            <FiServer className="w-4 h-4" />
         </Button>

         <div className="flex-1"></div>

         <Button size="xs" variant="secondary" onClick={() => onViewDetails(connection)} title="Full Details">
            <FiMonitor className="w-4 h-4" /> Details
         </Button>

         {hasPath && (
            <Button size="xs" variant="outline" onClick={() => onViewPath(connection)} title="View Fiber Path">
                <FiEye className="w-4 h-4" /> Path
            </Button>
         )}
      </div>
    </div>
  );
};