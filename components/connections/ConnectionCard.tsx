// components/connections/ConnectionCard.tsx
import React from 'react';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { FiActivity, FiArrowRight, FiEye, FiMonitor, FiServer, FiMapPin, FiShield } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface ConnectionCardProps {
  connection: V_system_connections_completeRowSchema;
  onViewDetails: (conn: V_system_connections_completeRowSchema) => void;
  onViewPath: (conn: V_system_connections_completeRowSchema) => void;
  onGoToSystem?: (conn: V_system_connections_completeRowSchema) => void;
  isSystemContext?: boolean;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection, onViewDetails, onViewPath, onGoToSystem, isSystemContext = false
}) => {
  
  const hasPath = Array.isArray(connection.working_fiber_in_ids) && connection.working_fiber_in_ids.length > 0;
  const hasProtection = !!connection.system_protection_interface || !!connection.en_protection_interface;

  // Determine End A Name: Prefer SN Name, fallback to System Name
  const endAName = connection.sn_name || connection.system_name || 'Local System';
  const endBName = connection.en_name || 'External';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden">
      
      {/* Status Stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${connection.status ? 'bg-green-500' : 'bg-red-500'}`} />

      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 pl-5 flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
             <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {connection.connected_link_type_name && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        {connection.connected_link_type_name}
                    </span>
                )}
                {connection.bandwidth_allocated && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                        <FiActivity className="w-3 h-3" /> {connection.bandwidth_allocated}
                    </span>
                )}
             </div>
             <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                <TruncateTooltip text={connection.service_name || connection.connected_system_name || 'Unnamed Connection'} />
             </h3>
        </div>
        {!connection.status && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase">Inactive</span>}
      </div>

      {/* Connection Flow Body */}
      <div className="p-4 space-y-4 flex-1 text-sm pl-5">
         
         {/* Flow Visual Box */}
         <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 relative">
            
            <div className="flex justify-between items-center relative z-10">
                
                {/* END A (Left) */}
                <div className="flex flex-col items-start max-w-[42%]">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">END A</div>
                    
                    <div 
                        className="font-bold text-gray-800 dark:text-gray-200 truncate w-full text-sm mb-2" 
                        title={endAName}
                    >
                        {endAName}
                    </div>

                    <div className="inline-flex items-center justify-center font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-900 text-xs shadow-sm min-w-12">
                        {connection.system_working_interface || 'N/A'}
                    </div>
                    
                    {hasProtection && (
                         <div className="flex items-center gap-1 mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-mono" title="Protection Port">
                            <FiShield className="w-3 h-3" /> 
                            <span>{connection.system_protection_interface}</span>
                         </div>
                    )}
                </div>

                {/* Arrow (Center) */}
                <div className="flex flex-col items-center justify-center px-1">
                    <div className="p-1.5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 shadow-sm">
                        <FiArrowRight className="w-4 h-4" />
                    </div>
                </div>

                {/* END B (Right) */}
                <div className="flex flex-col items-end max-w-[42%] text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">END B</div>
                     
                     <div 
                        className="font-bold text-gray-800 dark:text-gray-200 truncate w-full text-sm mb-1" 
                        title={endBName}
                     >
                        {endBName}
                     </div>
                     
                     <div className="font-mono text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {connection.en_interface || 'N/A'}
                     </div>
                     
                     <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 truncate w-full">
                        <FiMapPin className="w-3 h-3 shrink-0" /> 
                        <span className="truncate">{connection.en_node_name || 'Unknown'}</span>
                     </div>
                </div>
            </div>
         </div>

         {/* Meta Grid */}
         <div className="grid grid-cols-2 gap-2 text-xs">
            {connection.vlan && (
                <div className="bg-white dark:bg-gray-700/30 px-3 py-2 rounded border border-gray-100 dark:border-gray-700 flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">VLAN</span>
                    <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{connection.vlan}</span>
                </div>
            )}
            {connection.media_type_name && (
                <div className="bg-white dark:bg-gray-700/30 px-3 py-2 rounded border border-gray-100 dark:border-gray-700 flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Media</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200 truncate">{connection.media_type_name}</span>
                </div>
            )}
         </div>
      </div>

      {/* Footer / Actions */}
      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 pl-5" onClick={(e) => e.stopPropagation()}>
         {onGoToSystem && !isSystemContext && (
             <Button size="xs" variant="ghost" onClick={() => onGoToSystem(connection)} title="Go To Host System">
                <FiServer className="w-4 h-4" />
             </Button>
         )}

         <div className="flex-1"></div>

         <Button size="xs" variant="secondary" onClick={() => onViewDetails(connection)} title="Full Details" className="flex-1 sm:flex-none">
            <FiMonitor className="w-3.5 h-3.5 mr-1" /> Details
         </Button>

         {hasPath && (
            <Button size="xs" variant="outline" onClick={() => onViewPath(connection)} title="Trace Fiber Path" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/20">
                <FiEye className="w-3.5 h-3.5 mr-1" /> Trace
            </Button>
         )}
      </div>
    </div>
  );
};