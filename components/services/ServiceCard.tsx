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
      className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative ${
        isDuplicate
          ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-300 dark:ring-amber-900'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          {isDuplicate && (
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">
              Duplicate Name
            </div>
          )}
          <h3
            className="font-bold text-gray-900 dark:text-gray-100 truncate text-base"
            title={service.name || ''}
          >
            {service.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {service.link_type_name && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                {service.link_type_name}
              </span>
            )}
            {service.bandwidth_allocated && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                <FiActivity className="w-3 h-3" /> {service.bandwidth_allocated}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={service.status ?? false} />
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1 text-sm">
        {/* Route */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 space-y-2">
          <div className="flex items-start gap-2">
            <FiMapPin className="w-3.5 h-3.5 mt-0.5 text-green-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Start</div>
              <div
                className="font-medium text-gray-700 dark:text-gray-300 truncate"
                title={service.node_name || ''}
              >
                {service.node_name || 'Unknown'}
              </div>
            </div>
          </div>

          {service.end_node_name && (
            <>
              <div className="flex justify-center -my-1">
                <FiArrowRight className="w-3 h-3 text-gray-300 rotate-90" />
              </div>
              <div className="flex items-start gap-2">
                <FiMapPin className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">End</div>
                  <div
                    className="font-medium text-gray-700 dark:text-gray-300 truncate"
                    title={service.end_node_name || ''}
                  >
                    {service.end_node_name}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Technical IDs Grid */}
        <div className="grid grid-cols-2 gap-2">
          {service.vlan && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 px-2 py-1.5 rounded overflow-hidden">
              <FiTag className="w-3 h-3 shrink-0" />
              <span className="truncate">
                VLAN:{' '}
                <span className="font-mono font-medium text-gray-900 dark:text-gray-200">
                  {service.vlan}
                </span>
              </span>
            </div>
          )}
          {service.unique_id && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 px-2 py-1.5 rounded overflow-hidden">
              <FiHash className="w-3 h-3 shrink-0" />
              <span className="truncate">
                UID:{' '}
                <span className="font-mono font-medium text-gray-900 dark:text-gray-200">
                  {service.unique_id}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* LC ID if distinct */}
        {service.lc_id && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1">
            <FiGlobe className="w-3 h-3" />
            <span>LC ID: {service.lc_id}</span>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div
        className="p-3 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {canEdit && (
          <Button size="xs" variant="ghost" onClick={() => onEdit(service)} title="Edit Service">
            <FiEdit2 className="w-4 h-4" />
          </Button>
        )}

        {canDelete && (
          <Button
            size="xs"
            variant="ghost"
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => onDelete(service)}
            title="Delete Service"
          >
            <FiTrash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
