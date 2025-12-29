// components/systems/SystemCard.tsx
import React from 'react';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { FiActivity, FiEdit2, FiMapPin, FiTrash2, FiInfo, FiCpu, FiGrid } from 'react-icons/fi';
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
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col h-full group cursor-pointer relative overflow-hidden"
    >
      {/* Status Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
        system.status 
          ? 'bg-linear-to-b from-emerald-500 to-emerald-600' 
          : 'bg-linear-to-b from-red-500 to-red-600'
      }`} />

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-linear-to-b from-gray-50/50 to-transparent dark:from-gray-900/20">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
                {system.system_type_code || system.system_type_name}
              </span>
              {system.is_hub && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/20 dark:text-purple-300 dark:border-purple-800/50">
                  HUB
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-snug" title={system.system_name || ''}>
              <TruncateTooltip text={system.system_name} copyOnDoubleClick={true} />
            </h3>
          </div>
          <StatusBadge status={system.status ?? false} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3 flex-1">
         
        {/* Location & IP Section */}
        <div className="bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 rounded-lg p-3.5 border border-gray-200 dark:border-gray-700/50 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <FiMapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Location</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate" title={system.node_name || 'Unknown Location'}>
                {system.node_name || 'Unknown Location'}
              </div>
            </div>
          </div>
          
          <div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
          
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <FiActivity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">IP Address</div>
              <div className="font-mono font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {displayIP}
              </div>
            </div>
          </div>
        </div>

        {/* System Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800/50 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <FiCpu className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Capacity</span>
            </div>
            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate" title={system.system_capacity_name || 'Unknown'}>
              {system.system_capacity_name || 'Unknown'}
            </div>
          </div>
          
          {system.s_no && (
            <div className="bg-white dark:bg-gray-800/50 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Serial Number</div>
              <div className="font-mono font-medium text-gray-900 dark:text-gray-100 text-sm truncate" title={system.s_no}>
                {system.s_no}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="px-4 py-3 bg-linear-to-t from-gray-50 to-transparent dark:from-gray-900/30 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
         
        <Button 
          size="xs" 
          variant="secondary" 
          onClick={() => onManagePorts(system)} 
          title="Manage Ports"
          className="font-medium"
        >
          <FiGrid className="w-4 h-4" />
          <span className="ml-1.5">Ports</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button 
            size="xs" 
            variant="ghost" 
            onClick={() => onView(system)} 
            title="View Details"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <FiInfo className="w-4 h-4" />
          </Button>

          {canEdit && (
            <Button 
              size="xs" 
              variant="ghost" 
              onClick={() => onEdit(system)} 
              title="Edit System"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <FiEdit2 className="w-4 h-4" />
            </Button>
          )}
         
          {canDelete && (
            <Button 
              size="xs" 
              variant="ghost" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" 
              onClick={() => onDelete(system)} 
              title="Delete System"
            >
              <FiTrash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};