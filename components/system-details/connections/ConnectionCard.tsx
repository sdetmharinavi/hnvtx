// path: components/system-details/connections/ConnectionCard.tsx
import React, { useMemo } from 'react';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { FiActivity, FiArrowRight, FiEye, FiMonitor, FiServer, FiShield, FiEdit2, FiTrash2, FiMapPin, FiChevronsRight } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { formatIP } from '@/utils/formatters';

// Extend the schema type to include the new fields from the migration
// This prevents TS errors before you run your codegen script
type ExtendedConnection = V_system_connections_completeRowSchema & {
  service_end_node_name?: string | null;
  service_node_name?: string | null;
  services_ip?: unknown;
  en_protection_interface?: string | null;
};

interface ConnectionCardProps {
  connection: ExtendedConnection;
  parentSystemId?: string; 
  onViewDetails: (conn: V_system_connections_completeRowSchema) => void;
  onViewPath: (conn: V_system_connections_completeRowSchema) => void;
  onGoToSystem?: (conn: V_system_connections_completeRowSchema) => void;
  onEdit?: (conn: V_system_connections_completeRowSchema) => void;
  onDelete?: (conn: V_system_connections_completeRowSchema) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isSystemContext?: boolean;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection, 
  parentSystemId,
  onViewDetails, 
  onViewPath, 
  onGoToSystem, 
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  isSystemContext = false
}) => {
  
  const hasPath = Array.isArray(connection.working_fiber_in_ids) && connection.working_fiber_in_ids.length > 0;
  
  const { endA, endB } = useMemo(() => {
    // If we are in a specific system's context, ensure "End A" is always the current system
    const isFlipped = isSystemContext && parentSystemId && connection.en_id === parentSystemId;

    const endAData = {
        name: isFlipped ? connection.en_name : (connection.sn_name || connection.system_name),
        ip: formatIP(isFlipped ? connection.en_ip : (connection.sn_ip || connection.services_ip)),
        // Map the correct node name
        location: isFlipped ? connection.en_node_name : connection.sn_node_name,
        workingPort: isFlipped ? connection.en_interface : (connection.system_working_interface || connection.sn_interface),
        protectionPort: isFlipped ? connection.en_protection_interface : connection.system_protection_interface,
    };
    
    const endBData = {
        name: isFlipped ? (connection.system_name || connection.sn_name) : connection.en_name,
        ip: formatIP(isFlipped ? (connection.sn_ip || connection.services_ip) : connection.en_ip),
        // Map the correct node name
        location: isFlipped ? connection.sn_node_name : connection.en_node_name,
        workingPort: isFlipped ? (connection.system_working_interface || connection.sn_interface) : connection.en_interface,
        protectionPort: isFlipped ? connection.system_protection_interface : connection.en_protection_interface,
    };

    return {
        endA: endAData,
        endB: endBData,
    };
  }, [connection, isSystemContext, parentSystemId]);

  return (
    <div 
      onClick={() => onViewDetails(connection)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full group cursor-pointer relative"
    >
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
             <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight cursor-text">
                <TruncateTooltip 
                  text={connection.service_name || connection.connected_system_name || 'Unnamed Connection'} 
                  copyOnDoubleClick={true} 
                />
             </h3>
        </div>
        {!connection.status && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase">Inactive</span>}
      </div>

      <div className="p-4 space-y-4 flex-1 text-sm pl-5">
         
         {/* LOGICAL SERVICE ROUTE (New Section) */}
         {(connection.service_node_name || connection.service_end_node_name) && (
           <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
             <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
               Service Route
             </div>
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                   <div className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-100 dark:ring-green-900/30 shrink-0" title="Start Node" />
                   <div className="text-xs">
                      <span className="text-gray-500 dark:text-gray-400 font-medium mr-1.5">START</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {connection.service_node_name || 'N/A'}
                      </span>
                   </div>
                </div>
                
                {/* Vertical Connector Line */}
                <div className="ml-[3px] w-0.5 h-2 bg-gray-200 dark:bg-gray-700 -my-1"></div>

                <div className="flex items-center gap-2.5">
                   <div className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-100 dark:ring-red-900/30 shrink-0" title="End Node" />
                   <div className="text-xs">
                      <span className="text-gray-500 dark:text-gray-400 font-medium mr-1.5">END</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {connection.service_end_node_name || 'N/A'}
                      </span>
                   </div>
                </div>
             </div>
           </div>
         )}

         {/* PHYSICAL LINK DETAILS */}
         <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800 relative">
            <div className="flex justify-between items-start relative z-10">
                
                {/* END A */}
                <div className="flex flex-col items-start max-w-[45%]">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-1">
                      {isSystemContext ? "THIS END" : "END A"}
                    </div>
                    
                    <div className="font-bold text-gray-800 dark:text-gray-200 truncate w-full text-sm mb-0.5" title={endA.name || ''}>
                      {endA.name}
                    </div>
                    
                    {endA.location && (
                       <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1 truncate w-full" title={endA.location}>
                          <FiMapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{endA.location}</span>
                       </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">{endA.ip}</div>
                    
                    <div className="inline-flex items-center justify-center font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-[10px] shadow-sm min-w-12">
                        {endA.workingPort || 'N/A'}
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center justify-center px-1 pt-6 text-gray-300 dark:text-gray-700">
                     <FiChevronsRight className="w-4 h-4" />
                </div>

                {/* END B */}
                <div className="flex flex-col items-end max-w-[45%] text-right">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider mb-1">
                       {isSystemContext ? "FAR END" : "END B"}
                    </div>
                    
                    <div className="font-bold text-gray-800 dark:text-gray-200 truncate w-full text-sm mb-0.5" title={endB.name || ''}>
                      {endB.name}
                    </div>

                    {endB.location && (
                       <div className="flex items-center justify-end gap-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1 truncate w-full" title={endB.location}>
                          <span className="truncate">{endB.location}</span>
                          <FiMapPin className="w-3 h-3 shrink-0" />
                       </div>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">{endB.ip}</div>
                     
                    <div className="inline-flex items-center justify-center font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-[10px] shadow-sm min-w-12">
                        {endB.workingPort || 'N/A'}
                     </div>
                </div>
            </div>
         </div>

         {/* Technical Info Row */}
         <div className="grid grid-cols-2 gap-2 text-xs">
            {connection.vlan && (
                <div className="bg-white dark:bg-gray-700/30 px-2.5 py-1.5 rounded border border-gray-100 dark:border-gray-700 flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">VLAN</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{connection.vlan}</span>
                </div>
            )}
            {connection.media_type_name && (
                <div className="bg-white dark:bg-gray-700/30 px-2.5 py-1.5 rounded border border-gray-100 dark:border-gray-700 flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Media</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200 truncate">{connection.media_type_name}</span>
                </div>
            )}
         </div>
      </div>
      
      {/* Footer Actions */}
      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-1 pl-5" onClick={(e) => e.stopPropagation()}>
         {onGoToSystem && !isSystemContext && (
             <Button size="xs" variant="ghost" onClick={() => onGoToSystem(connection)} title="Go To Host System">
                <FiServer className="w-4 h-4" />
             </Button>
         )}
         <div className="flex-1"></div>
         <Button size="xs" variant="secondary" onClick={() => onViewDetails(connection)} title="Full Details">
            <FiMonitor className="w-3.5 h-3.5" />
         </Button>
         {hasPath && (
            <Button size="xs" variant="outline" onClick={() => onViewPath(connection)} title="Trace Fiber Path" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 dark:hover:bg-blue-900/20">
                <FiEye className="w-3.5 h-3.5" />
            </Button>
         )}
         {canEdit && onEdit && (
            <Button size="xs" variant="ghost" onClick={() => onEdit(connection)} title="Edit Connection">
                <FiEdit2 className="w-3.5 h-3.5" />
            </Button>
         )}
         {canDelete && onDelete && (
            <Button size="xs" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(connection)} title="Delete Connection">
                <FiTrash2 className="w-3.5 h-3.5" />
            </Button>
         )}
      </div>
    </div>
  );
};