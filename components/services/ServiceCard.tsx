// components/services/ServiceCard.tsx
import React from 'react';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import {
  FiActivity,
  FiEdit2,
  FiHash,
  FiMapPin,
  FiTag,
  FiTrash2,
  FiGlobe,
  FiArrowRight,
  FiAlertTriangle,
} from 'react-icons/fi';
import { Button } from '@/components/common/ui/Button';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';

interface ServiceCardProps {
  service: V_servicesRowSchema;
  onEdit: (service: V_servicesRowSchema) => void;
  onDelete: (service: V_servicesRowSchema) => void;
  canEdit: boolean;
  canDelete: boolean;
  isDuplicate?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  isDuplicate,
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col h-full group relative overflow-hidden ${
        isDuplicate
          ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-200 dark:ring-amber-900/50'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {/* Duplicate Warning Banner */}
      {isDuplicate && (
        <div className="bg-linear-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 px-4 py-2 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
          <FiAlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
            Duplicate Service Name
          </span>
        </div>
      )}

      {/* Header with linear Background */}
      <div className="relative bg-linear-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 p-5 border-b border-gray-200 dark:border-gray-700">
        {/* Status Badge - Top Right */}
        <div className="absolute top-4 right-4">
          <StatusBadge status={service.status ?? false} />
        </div>

        <div className="pr-20">
          <h3
            className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-3 line-clamp-2 leading-tight"
            title={service.name || ''}
          >
            {service.name}
          </h3>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {service.link_type_name && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {service.link_type_name}
              </span>
            )}
            {service.bandwidth_allocated && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-linear-to-r from-purple-500 to-purple-600 text-white shadow-sm">
                <FiActivity className="w-3.5 h-3.5" />
                {service.bandwidth_allocated}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 flex-1">
        {/* Route Connection */}
        <div className="relative">
          <div className="bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
            {/* Start Node */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-md shrink-0">
                <FiMapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">
                  Origin Point
                </div>
                <div
                  className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm"
                  title={service.node_name || ''}
                >
                  {service.node_name || 'Unknown'}
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            {service.end_node_name && (
              <>
                <div className="flex items-center justify-center py-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-4 bg-linear-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500" />
                    <FiArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 rotate-90" />
                    <div className="w-px h-4 bg-linear-to-b from-gray-400 to-gray-300 dark:from-gray-500 dark:to-gray-600" />
                  </div>
                </div>

                {/* End Node */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <FiMapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">
                      Destination Point
                    </div>
                    <div
                      className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm"
                      title={service.end_node_name || ''}
                    >
                      {service.end_node_name}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Technical Details */}
        <div className="space-y-2">
          <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-2">
            Technical Details
          </div>

          <div className="grid grid-cols-2 gap-2">
            {service.vlan && (
              <div className="group/item flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover/item:scale-110 transition-transform shrink-0">
                  <FiTag className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold">
                    VLAN
                  </div>
                  <div className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                    {service.vlan}
                  </div>
                </div>
              </div>
            )}

            {service.unique_id && (
              <div className="group/item flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover/item:scale-110 transition-transform shrink-0">
                  <FiHash className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold">
                    UID
                  </div>
                  <div className="font-mono font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                    {service.unique_id}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LC ID */}
          {service.lc_id && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <FiGlobe className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] text-gray-500 dark:text-gray-400 uppercase font-bold">
                  LC ID
                </div>
                <div className="font-mono font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                  {service.lc_id}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {(canEdit || canDelete) && (
        <div
          className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(service)}
              className="group/btn hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
              title="Edit Service"
            >
              <FiEdit2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </Button>
          )}

          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-500 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:border-red-700 group/btn"
              onClick={() => onDelete(service)}
              title="Delete Service"
            >
              <FiTrash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
