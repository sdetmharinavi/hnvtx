// components/nodes/NodeCard.tsx
import React from 'react';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { FiEdit2, FiTrash2, FiMapPin, FiNavigation, FiInfo } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';

interface NodeCardProps {
  node: V_nodes_completeRowSchema;
  onEdit: (node: V_nodes_completeRowSchema) => void;
  onDelete: (node: V_nodes_completeRowSchema) => void;
  onView: (node: V_nodes_completeRowSchema) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const NodeCard: React.FC<NodeCardProps> = ({ 
  node, onEdit, onDelete, onView, canEdit, canDelete 
}) => {
  
  // Determine icon based on node type
  // This returns either an L.DivIcon (SVG inside HTML) or L.Icon (Image URL)
  const icon = getNodeIcon(null, node.node_type_name, false);
  
  // Format coordinates for display
  const coords = node.latitude && node.longitude 
    ? `${node.latitude.toFixed(5)}, ${node.longitude.toFixed(5)}`
    : 'No Coordinates';

  return (
    <div 
      onClick={() => onView(node)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full group cursor-pointer overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 min-w-0">
            {/* Icon Box */}
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center border border-gray-100 dark:border-gray-600 shrink-0 overflow-hidden p-1">
                 {/* Logic to handle both SVG (DivIcon) and Image (Icon) Leaflet markers */}
                 {icon instanceof L.DivIcon ? (
                     // SVG/HTML Icon (DivIcon)
                     <div
                       dangerouslySetInnerHTML={{ __html: ((icon.options as L.DivIconOptions).html || '') as string }}
                       className="scale-75 origin-center"
                     />
                 ) : icon instanceof L.Icon && (icon.options as L.IconOptions).iconUrl ? (
                     // Image Icon (Standard L.Icon) e.g. PNGs
                     // eslint-disable-next-line @next/next/no-img-element
                     <img
                        src={(icon.options as L.IconOptions).iconUrl!}
                        alt="Node Icon"
                        className="w-full h-full object-contain"
                     />
                 ) : (
                     // Fallback
                     <FiMapPin className="w-5 h-5 text-gray-400" />
                 )}
            </div>
            
            <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate" title={node.name || ''}>
                    {node.name}
                </h3>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                    {node.node_type_name || node.node_type_code || 'Unknown Type'}
                </div>
            </div>
        </div>
        <StatusBadge status={node.status ?? false} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1 text-sm">
         
         <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
            <FiMapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase text-gray-400 font-bold">Maintenance Area</div>
                <div className="font-medium truncate" title={node.maintenance_area_name || ''}>
                    {node.maintenance_area_name || 'Unassigned'}
                </div>
            </div>
         </div>

         <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-mono">
            <FiNavigation className="w-3.5 h-3.5 shrink-0" />
            <span>{coords}</span>
         </div>

         {node.remark && (
             <div className="text-xs text-gray-500 italic line-clamp-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                 {node.remark}
             </div>
         )}
      </div>

      {/* Footer / Actions */}
      <div className="p-3 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
         <Button size="xs" variant="ghost" onClick={() => onView(node)} title="View Details">
            <FiInfo className="w-4 h-4" />
         </Button>

         {canEdit && (
            <Button size="xs" variant="ghost" onClick={() => onEdit(node)} title="Edit Node">
                <FiEdit2 className="w-4 h-4" />
            </Button>
         )}
         
         {canDelete && (
            <Button size="xs" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(node)} title="Delete Node">
                <FiTrash2 className="w-4 h-4" />
            </Button>
         )}
      </div>
    </div>
  );
};