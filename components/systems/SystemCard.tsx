// components/systems/SystemCard.tsx
import React from 'react';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { FiActivity, FiEdit2, FiMapPin, FiTrash2, FiServer, FiInfo, FiCpu, FiGrid } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { formatIP } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface SystemCardProps {
  system: V_systems_completeRowSchema;
  onView: (system: V_systems_completeRowSchema) => void;
  onEdit: (system: V_systems_completeRowSchema) => void;
  onDelete: (system: V_systems_completeRowSchema) => void;
  onManagePorts: (system: V_systems_completeRowSchema) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const SystemCard: React.FC<SystemCardProps> = ({
  system, onView, onEdit, onDelete, onManagePorts, canEdit, canDelete
}) => {
  
  const displayIP = system.ip_address ? formatIP(system.ip_address) : 'No IP';

  return (
    <div 
      onClick={() => onView(system)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full group cursor-pointer relative"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                    {system.system_type_code || system.system_type_name}
                </span>
                {system.is_hub && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                        HUB
                    </span>
                )}
             </div>
             <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-base" title={system.system_name || ''}>
                {system.system_name}
             </h3>
        </div>
        <StatusBadge status={system.status ?? false} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1 text-sm">
         
         <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FiMapPin className="w-4 h-4 shrink-0 text-gray-400" />
                <span className="truncate font-medium"><TruncateTooltip text={system.node_name || 'Unknown Location'} /></span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono text-xs">
                <FiActivity className="w-4 h-4 shrink-0 text-gray-400" />
                <span>{displayIP}</span>
            </div>
         </div>

         <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
             <div className="flex items-center gap-1.5">
                 <FiCpu className="w-3.5 h-3.5" />
                 <span>{system.system_capacity_name || 'Unknown Cap'}</span>
             </div>
             {system.s_no && (
                 <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    S/N: {system.s_no}
                 </span>
             )}
         </div>
      </div>

      {/* Footer / Actions */}
      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
         
         <Button size="xs" variant="secondary" onClick={() => onManagePorts(system)} title="Manage Ports">
            <FiGrid className="w-3.5 h-3.5 mr-1" /> Ports
         </Button>

         <div className="flex-1"></div>

         <Button size="xs" variant="ghost" onClick={() => onView(system)} title="View Details">
            <FiInfo className="w-4 h-4" />
         </Button>

         {canEdit && (
            <Button size="xs" variant="ghost" onClick={() => onEdit(system)} title="Edit System">
                <FiEdit2 className="w-4 h-4" />
            </Button>
         )}
         
         {canDelete && (
            <Button size="xs" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(system)} title="Delete System">
                <FiTrash2 className="w-4 h-4" />
            </Button>
         )}
      </div>
    </div>
  );
};