import React from 'react';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { FiChevronsRight, FiInfo, FiZap, FiArrowRight } from 'react-icons/fi';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface FiberConnectionCardProps {
  fiber: V_ofc_connections_completeRowSchema;
  actions?: React.ReactNode;
}

export const FiberConnectionCard: React.FC<FiberConnectionCardProps> = ({ fiber, actions }) => {
  const isAllocated = !!fiber.system_name;
  const isFaulty = !fiber.status;

  const startNodeName = fiber.updated_sn_name || fiber.sn_name || 'Start Node';
  const endNodeName = fiber.updated_en_name || fiber.en_name || 'End Node';

  const startFiberNo = fiber.updated_fiber_no_sn || fiber.fiber_no_sn;
  const endFiberNo = fiber.updated_fiber_no_en || fiber.fiber_no_en;

  const startDom = fiber.sn_dom ? formatDate(fiber.sn_dom, { format: 'dd-mm-yyyy' }) : null;
  const endDom = fiber.en_dom ? formatDate(fiber.en_dom, { format: 'dd-mm-yyyy' }) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col group relative overflow-hidden">
      {/* Status Indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${
          fiber.status
            ? 'bg-linear-to-b from-emerald-500 to-emerald-600'
            : 'bg-linear-to-b from-red-500 to-red-600'
        }`}
      />

      {/* Header */}
      <div className="px-3 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-linear-to-b from-gray-50/50 to-transparent dark:from-gray-900/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Fiber Number Display - Responsive sizing */}
            <div className="font-mono font-bold text-sm sm:text-base bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-blue-700 dark:text-blue-300 shadow-sm flex items-center gap-1.5 sm:gap-2">
              <span className="whitespace-nowrap">F-{startFiberNo}</span>
              {startFiberNo !== endFiberNo && (
                <>
                  <FiArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="whitespace-nowrap">F-{endFiberNo}</span>
                </>
              )}
            </div>

            {/* Allocation Status Badge - Responsive */}
            {isAllocated ? (
              <div className="grid grid-flow-row">
                <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-0.5">
                  Allocated
                </span>
                <TruncateTooltip
                  className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white max-w-[90px] sm:max-w-[110px]"
                  text={fiber.system_name || ''}
                />
              </div>
            ) : isFaulty ? (
              <span className="inline-flex items-center text-xs font-semibold text-red-700 dark:text-red-300 bg-linear-to-r from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-900/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-red-200 dark:border-red-800/50 whitespace-nowrap">
                Faulty / Inactive
              </span>
            ) : (
              <StatusBadge status={'available'} />
            )}
          </div>
        </div>
      </div>

      {/* Connection Flow Body */}
      <div className="px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* A -> B Visual - Stacked on mobile, side-by-side on desktop */}
        <div className="bg-linear-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3 sm:gap-4">
            {/* END A */}
            <div className="flex-1 min-w-0">
              <div className="mb-2 sm:mb-3 pb-1.5 sm:pb-2 border-b border-gray-200 dark:border-gray-700/50">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End A
                </span>
              </div>

              <div className="space-y-2">
                <div
                  className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate"
                  title={startNodeName}
                >
                  {startNodeName}
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800/50 px-2 sm:px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Fiber:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {startFiberNo}
                  </span>
                </div>

                {/* End A Metrics */}
                <div className="bg-white dark:bg-gray-800/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1 sm:space-y-1.5 text-xs shadow-sm">
                  {/* RKM Highlighted */}
                  <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 -mx-1 px-1.5 py-1 rounded">
                    <span className="text-blue-700 dark:text-blue-300 font-bold">RKM</span>
                    <span className="font-mono font-bold text-blue-800 dark:text-blue-100">
                      {fiber.otdr_distance_sn_km ? `${fiber.otdr_distance_sn_km} km` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">DOM</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs">
                      {startDom || '-'}
                    </span>
                  </div>
                  {fiber.sn_power_dbm && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Power</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {fiber.sn_power_dbm} dBm
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Arrow - Horizontal on mobile, Vertical on desktop */}
            <div className="flex items-center justify-center sm:pt-12">
              <div className="p-2 rounded-full bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 shadow-sm rotate-90 sm:rotate-0">
                <FiChevronsRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            {/* END B */}
            <div className="flex-1 min-w-0 sm:text-right">
              <div className="mb-2 sm:mb-3 pb-1.5 sm:pb-2 border-b border-gray-200 dark:border-gray-700/50">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End B
                </span>
              </div>

              <div className="space-y-2 flex flex-col sm:items-end">
                <div
                  className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate w-full"
                  title={endNodeName}
                >
                  {endNodeName}
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800/50 px-2 sm:px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Fiber:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {endFiberNo}
                  </span>
                </div>

                {/* End B Metrics */}
                <div className="bg-white dark:bg-gray-800/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1 sm:space-y-1.5 text-xs shadow-sm w-full">
                  {/* RKM Highlighted */}
                  <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 -mx-1 px-1.5 py-1 rounded">
                    <span className="text-purple-700 dark:text-purple-300 font-bold">RKM</span>
                    <span className="font-mono font-bold text-purple-800 dark:text-purple-100">
                      {fiber.otdr_distance_en_km ? `${fiber.otdr_distance_en_km} km` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">DOM</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs">
                      {endDom || '-'}
                    </span>
                  </div>
                  {fiber.en_power_dbm && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Power</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {fiber.en_power_dbm} dBm
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shared Metrics & Remarks */}
        <div className="space-y-2 sm:space-y-2.5">
          {/* Enhanced Loss Badge */}
          <div className="flex items-center justify-between text-sm bg-amber-50 dark:bg-amber-900/20 px-2.5 sm:px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50 shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FiZap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-amber-700 dark:text-amber-300 font-bold uppercase text-xs tracking-wide">
                Route Loss
              </span>
            </div>
            <span className="font-mono font-bold text-base sm:text-lg text-amber-800 dark:text-amber-200 whitespace-nowrap">
              {fiber.route_loss_db ? `${fiber.route_loss_db} dB` : '-'}
            </span>
          </div>

          {fiber.remark && (
            <div className="bg-gray-50 dark:bg-gray-900/20 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-gray-100 dark:border-gray-800/50">
              <div className="flex items-start gap-1.5 sm:gap-2">
                <FiInfo className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">
                    Remarks
                  </div>
                  <TruncateTooltip
                    text={fiber.remark}
                    className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      {actions && (
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-linear-to-t from-gray-50 to-transparent dark:from-gray-900/30 border-t border-gray-200 dark:border-gray-700/50 flex justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};
