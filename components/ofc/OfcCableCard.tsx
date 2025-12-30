// components/ofc/OfcCableCard.tsx
import React from 'react';
import { V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import {
  FiActivity,
  FiEdit2,
  FiMapPin,
  FiTrash2,
  FiInfo,
  FiLayers,
  FiDatabase,
} from 'react-icons/fi';
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
  cable,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  return (
    <div
      onClick={() => onView(cable)}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col h-full group cursor-pointer relative overflow-hidden"
    >
      {/* Status Indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
          cable.status
            ? 'bg-linear-to-b from-emerald-500 to-emerald-600'
            : 'bg-linear-to-b from-red-500 to-red-600'
        }`}
      />

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-linear-to-b from-gray-50/50 to-transparent dark:from-gray-900/20">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-snug mb-2"
              title={cable.route_name || ''}
            >
              {cable.route_name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200 dark:from-purple-900/40 dark:to-purple-900/20 dark:text-purple-300 dark:border-purple-800/50">
                {cable.ofc_type_name || 'Unknown Type'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-linear-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
                <FiLayers className="w-3.5 h-3.5" />
                {cable.capacity}F
              </span>
            </div>
          </div>
          <StatusBadge status={cable.status ?? false} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3 flex-1">
        {/* Route Visual */}
        <div className="bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            {/* Start Node */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Start Node
              </div>
              <div
                className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate"
                title={cable.sn_name || ''}
              >
                {cable.sn_name || 'Unknown'}
              </div>
            </div>

            {/* Distance Indicator */}
            <div className="flex flex-col items-center gap-1.5 px-3">
              <div className="font-mono font-semibold text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/50 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm whitespace-nowrap">
                {cable.current_rkm} km
              </div>
              <div className="relative w-16 h-1 bg-linear-to-r from-blue-200 via-blue-400 to-blue-200 dark:from-blue-800 dark:via-blue-600 dark:to-blue-800 rounded-full">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
              </div>
            </div>

            {/* End Node */}
            <div className="flex-1 min-w-0 text-right">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                End Node
              </div>
              <div
                className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate"
                title={cable.en_name || ''}
              >
                {cable.en_name || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Cable Information */}
        <div className="grid grid-cols-2 gap-3">
          {cable.asset_no && (
            <div className="bg-white dark:bg-gray-800/50 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <FiActivity className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Asset No.
                </span>
              </div>
              <div
                className="font-mono font-medium text-gray-900 dark:text-gray-100 text-sm truncate"
                title={cable.asset_no}
              >
                {cable.asset_no}
              </div>
            </div>
          )}

          {cable.transnet_id && (
            <div className="bg-white dark:bg-gray-800/50 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <FiDatabase className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Transnet ID
                </span>
              </div>
              <div
                className="font-mono font-medium text-gray-900 dark:text-gray-100 text-sm truncate"
                title={cable.transnet_id}
              >
                {cable.transnet_id}
              </div>
            </div>
          )}
        </div>

        {/* Maintenance Area & Remarks */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-md bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <FiMapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-1.5">
                Area:
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {cable.maintenance_area_name || 'Unassigned Area'}
              </span>
            </div>
          </div>
          {cable.commissioned_on && (
            <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800/50">
              <div className="flex items-start gap-2">
                <FiInfo className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-green-700 dark:text-green-400 font-medium mb-0.5">
                    Commissioned On
                  </div>
                  <div
                    className="text-sm text-green-900 dark:text-green-200 line-clamp-2"
                    title={cable.commissioned_on}
                  >
                    {cable.commissioned_on}
                  </div>
                </div>
              </div>
            </div>
          )}
          {cable.remark && (
            <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-start gap-2">
                <FiInfo className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-0.5">
                    Remarks
                  </div>
                  <div
                    className="text-sm text-amber-900 dark:text-amber-200 line-clamp-2"
                    title={cable.remark}
                  >
                    {cable.remark}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div
        className="px-4 py-3 bg-linear-to-t from-gray-50 to-transparent dark:from-gray-900/30 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-end gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="xs"
          variant="secondary"
          onClick={() => onView(cable)}
          title="View Details"
          className="font-medium"
        >
          <FiInfo className="w-4 h-4" />
          <span className="ml-1.5">Details</span>
        </Button>

        {canEdit && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onEdit(cable)}
            title="Edit Cable"
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
            onClick={() => onDelete(cable)}
            title="Delete Cable"
          >
            <FiTrash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
