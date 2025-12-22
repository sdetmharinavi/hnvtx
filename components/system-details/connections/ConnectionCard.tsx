// path: components/system-details/connections/ConnectionCard.tsx
import React, { useMemo } from 'react';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { FiActivity, FiArrowRight, FiEye, FiMonitor, FiServer, FiMapPin, FiShield, FiEdit2, FiTrash2, FiTag } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import TruncateTooltip from '@/components/common/TruncateTooltip';
import { formatIP } from '@/utils/formatters';

interface ConnectionCardProps {
  connection: V_system_connections_completeRowSchema;
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
  
  const { endA, endB, hasProtection } = useMemo(() => {
    const isFlipped = isSystemContext && parentSystemId && connection.en_id === parentSystemId;

    const endAData = {
        name: isFlipped ? connection.en_name : (connection.sn_name || connection.system_name),
        ip: formatIP(isFlipped ? connection.en_ip : (connection.sn_ip || (connection as V_system_connections_completeRowSchema & {services_ip: unknown}).services_ip)),
        location: isFlipped ? connection.en_node_name : connection.sn_node_name,
        workingPort: isFlipped ? connection.en_interface : (connection.system_working_interface || connection.sn_interface),
        protectionPort: isFlipped ? (connection as V_system_connections_completeRowSchema & { en_protection_interface?: string }).en_protection_interface : connection.system_protection_interface,
    };
    
    const endBData = {
        name: isFlipped ? (connection.system_name || connection.sn_name) : connection.en_name,
        ip: formatIP(isFlipped ? (connection.sn_ip || (connection as V_system_connections_completeRowSchema & {services_ip: unknown}).services_ip) : connection.en_ip),
        location: isFlipped ? connection.sn_node_name : connection.en_node_name,
        workingPort: isFlipped ? (connection.system_working_interface || connection.sn_interface) : connection.en_interface,
        protectionPort: isFlipped ? connection.system_protection_interface : (connection as V_system_connections_completeRowSchema & { en_protection_interface?: string }).en_protection_interface,
    };

    return {
        endA: endAData,
        endB: endBData,
        hasProtection: !!endAData.protectionPort || !!endBData.protectionPort,
    };
  }, [connection, isSystemContext, parentSystemId]);

  return (
    <div 
      onClick={() => onViewDetails(connection)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full group cursor-pointer relative"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${connection.status ? 'bg-green-500' : 'bg-red-500'}`} />
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

      <div className="p-4 space-y-3 flex-1 text-sm pl-5">
         
         <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 relative">
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col items-start max-w-[45%]">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">END A</div>
                    <div className="font-bold text-gray-800 dark:text-gray-200 truncate w-full text-sm mb-1" title={endA.name || ''}>{endA.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">{endA.ip}</div>
                    <div className="inline-flex items-center justify-center font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-900 text-xs shadow-sm min-w-12">
                        {endA.workingPort || 'N/A'}
                    </div>
                    {endA.protectionPort && (
                         <div className="flex items-center gap-1 mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-mono" title="Protection Port">
                            <FiShield className="w-3 h-3" /> 
                            <span>{endA.protectionPort}</span>
                         </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center px-1">
                    <div className="p-1.5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 shadow-sm">
                        <FiArrowRight className="w-4 h-4" />
                    </div>
                </div>

                <div className="flex flex-col items-end max-w-[45%] text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">END B</div>
                     <div className="font-bold text-gray-800 dark:text-gray-200 truncate w-full text-sm mb-1" title={endB.name || ''}>{endB.name}</div>
                     <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-mono">{endB.ip}</div>
                     <div className="inline-flex items-center justify-center font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-900 text-xs shadow-sm min-w-12">
                        {endB.workingPort || 'N/A'}
                     </div>
                     {endB.protectionPort && (
                         <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-mono" title="Protection Port">
                            <FiShield className="w-3 h-3" /> 
                            <span>{endB.protectionPort}</span>
                         </div>
                    )}
                </div>
            </div>
         </div>

         {/* THE FIX START: Updated layout to show both VLAN and Media Type */}
         <div className="grid grid-cols-2 gap-2 text-xs">
            {connection.vlan && (
                <div className="bg-white dark:bg-gray-700/30 px-3 py-2 rounded border border-gray-100 dark:border-gray-700 flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">VLAN</span>
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{connection.vlan}</span>
                </div>
            )}
            {connection.media_type_name && (
                <div className="bg-white dark:bg-gray-700/30 px-3 py-2 rounded border border-gray-100 dark:border-gray-700 flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Media</span>
                    <span className="font-medium text-gray-700 dark:text-gray-200 truncate">{connection.media_type_name}</span>
                </div>
            )}
         </div>
         {/* THE FIX END */}
      </div>
      
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