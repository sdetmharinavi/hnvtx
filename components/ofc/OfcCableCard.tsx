// components/ofc/OfcCableCard.tsx
import React from 'react';
import { V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { FiActivity, FiEdit2, FiMapPin, FiTrash2, FiInfo, FiLayers } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';

interface OfcCableCardProps {
  cable: V_ofc_cables_completeRowSchema;
  onView: (cable: V_ofc_cables_completeRowSchema) => void;
  onEdit: (cable: V_ofc_cables_completeRowSchema) => void;
  onDelete: (cable: V_ofc_cables_completeRowSchema) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const OfcCableCard: React.FC<OfcCableCardProps> = ({
  cable, onView, onEdit, onDelete, canEdit, canDelete
}) => {
  
  return (
    <div 
        onClick={() => onView(cable)}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full group cursor-pointer relative"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
             <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-base" title={cable.route_name || ''}>
                {cable.route_name}
             </h3>
             <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                    {cable.ofc_type_name || 'Unknown Type'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1">
                    <FiLayers className="w-3 h-3" /> {cable.capacity}F
                </span>
             </div>
        </div>
        <StatusBadge status={cable.status ?? false} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1 text-sm">
         
         {/* Route Visual */}
         <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Start Node</div>
                    <div className="font-medium text-gray-700 dark:text-gray-300 truncate" title={cable.sn_name || ''}>
                        {cable.sn_name || 'Unknown'}
                    </div>
                </div>
                <div className="flex flex-col items-center px-1">
                    <span className="text-[10px] font-mono text-gray-400 bg-white dark:bg-gray-700 px-1 rounded border dark:border-gray-600 mb-0.5">
                        {cable.current_rkm}km
                    </span>
                    <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600 relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                </div>
                <div className="flex-1 min-w-0 text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">End Node</div>
                    <div className="font-medium text-gray-700 dark:text-gray-300 truncate" title={cable.en_name || ''}>
                        {cable.en_name || 'Unknown'}
                    </div>
                </div>
            </div>
         </div>

         {/* Meta Info */}
         <div className="grid grid-cols-2 gap-2 text-xs">
            {cable.asset_no && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <FiActivity className="w-3 h-3 text-gray-400" />
                    <span className="truncate">Asset: <span className="font-mono">{cable.asset_no}</span></span>
                </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 col-span-2">
                <FiMapPin className="w-3 h-3 text-gray-400" />
                <span className="truncate">{cable.maintenance_area_name || 'Unassigned Area'}</span>
            </div>
         </div>
      </div>

      {/* Footer / Actions */}
      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
         <Button size="xs" variant="ghost" onClick={() => onView(cable)} title="View Connections">
            <FiInfo className="w-4 h-4" /> Details
         </Button>

         {canEdit && (
            <Button size="xs" variant="ghost" onClick={() => onEdit(cable)} title="Edit Cable">
                <FiEdit2 className="w-4 h-4" />
            </Button>
         )}
         
         {canDelete && (
            <Button size="xs" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(cable)} title="Delete Cable">
                <FiTrash2 className="w-4 h-4" />
            </Button>
         )}
      </div>
    </div>
  );
};