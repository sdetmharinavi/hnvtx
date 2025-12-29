// components/nodes/NodeCard.tsx
import React from 'react';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { FiEdit2, FiTrash2, FiMapPin, FiNavigation, FiInfo, FiMessageSquare } from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface NodeCardProps {
  node: V_nodes_completeRowSchema;
  onEdit: (node: V_nodes_completeRowSchema) => void;
  onDelete: (node: V_nodes_completeRowSchema) => void;
  onView: (node: V_nodes_completeRowSchema) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  onEdit,
  onDelete,
  onView,
  canEdit,
  canDelete,
}) => {
  // Determine icon based on node type
  const icon = getNodeIcon(null, node.node_type_name, false);

  // Format coordinates for display
  const coords =
    node.latitude && node.longitude
      ? `${node.latitude.toFixed(5)}, ${node.longitude.toFixed(5)}`
      : 'No Coordinates';

  const hasCoordinates = node.latitude && node.longitude;

  return (
    <div
      onClick={() => onView(node)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 flex flex-col h-full group cursor-pointer overflow-hidden"
    >
      {/* Header with linear Background */}
      <div className="relative bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 p-5 border-b border-gray-200 dark:border-gray-700">
        {/* Status Badge - Top Right */}
        <div className="absolute top-4 right-4">
          <StatusBadge status={node.status ?? false} />
        </div>

        <div className="flex items-start gap-3 pr-16">
          {/* Enhanced Icon Container */}
          <div className="relative">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              {/* Icon rendering logic */}
              {icon instanceof L.DivIcon ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: ((icon.options as L.DivIconOptions).html || '') as string,
                  }}
                  className="scale-90 origin-center"
                />
              ) : icon instanceof L.Icon && (icon.options as L.IconOptions).iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(icon.options as L.IconOptions).iconUrl!}
                  alt="Node Icon"
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <FiMapPin className="w-7 h-7 text-gray-900 dark:text-gray-100" />
              )}
            </div>
            {/* Decorative ring */}
            <div className="absolute inset-0 rounded-xl ring-2 ring-blue-200 dark:ring-blue-800 animate-pulse" />
          </div>

          {/* Title & Type */}
          <div className="min-w-0 flex-1 pt-1">
            <h3
              className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              title={node.name || ''}
            >
              <TruncateTooltip text={node.name || ''} />
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {node.node_type_name || node.node_type_code || 'Unknown Type'}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3 flex-1">
        {/* Maintenance Area */}
        <div className="group/area">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0 group-hover/area:scale-110 transition-transform">
              <FiMapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider mb-1">
                Maintenance Area
              </div>
              <div
                className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate"
                title={node.maintenance_area_name || ''}
              >
                {node.maintenance_area_name || 'Unassigned'}
              </div>
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div
          className={`group/coords flex items-center gap-3 p-3 rounded-xl border transition-all ${
            hasCoordinates
              ? 'bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700'
              : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm shrink-0 group-hover/coords:scale-110 transition-transform ${
              hasCoordinates
                ? 'bg-linear-to-br from-emerald-500 to-emerald-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
          >
            <FiNavigation className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider mb-1">
              Coordinates
            </div>
            <div
              className={`font-mono text-xs font-medium truncate ${
                hasCoordinates
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {coords}
            </div>
          </div>
        </div>

        {/* Remark/Notes */}
        {node.remark && (
          <div className="group/remark">
            <div className="flex gap-3 p-3 rounded-xl bg-linear-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200 dark:border-amber-800">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shrink-0 group-hover/remark:scale-110 transition-transform">
                <FiMessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="text-[10px] uppercase text-gray-500 dark:text-gray-400 font-bold tracking-wider mb-1">
                  Notes
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                  {node.remark}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* View Details Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(node)}
          className="flex-1 group/btn hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
          title="View Details"
        >
          <FiInfo className="w-4 h-4 mr-1.5 group-hover/btn:scale-110 transition-transform" />
          Details
        </Button>

        {/* Edit & Delete Buttons */}
        <div className="flex gap-2">
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(node)}
              className="group/btn hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
              title="Edit Node"
            >
              <FiEdit2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </Button>
          )}

          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 group/btn"
              onClick={() => onDelete(node)}
              title="Delete Node"
            >
              <FiTrash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
