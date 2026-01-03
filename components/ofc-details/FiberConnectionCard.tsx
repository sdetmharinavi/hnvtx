import React from 'react';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import {
  FiChevronsRight,
  FiZap,
  FiArrowRight,
  FiActivity,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';
import { formatDate } from '@/utils/formatters';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface FiberConnectionCardProps {
  fiber: V_ofc_connections_completeRowSchema;
  actions?: React.ReactNode;
}

export const FiberConnectionCard: React.FC<FiberConnectionCardProps> = ({ fiber, actions }) => {
  // Logic for Status Determination
  const isFaulty = !fiber.status;
  // Check both direct system assignment AND logical path assignment
  const isAllocated = !isFaulty && (!!fiber.system_id || !!fiber.logical_path_id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isSpare = !isFaulty && !isAllocated;

  const startNodeName = fiber.updated_sn_name || fiber.sn_name || 'Start Node';
  const endNodeName = fiber.updated_en_name || fiber.en_name || 'End Node';

  const startFiberNo = fiber.updated_fiber_no_sn || fiber.fiber_no_sn;
  const endFiberNo = fiber.updated_fiber_no_en || fiber.fiber_no_en;

  const startDom = fiber.sn_dom ? formatDate(fiber.sn_dom, { format: 'dd-mm-yyyy' }) : null;
  const endDom = fiber.en_dom ? formatDate(fiber.en_dom, { format: 'dd-mm-yyyy' }) : null;

  // Visual Configuration based on status
  let statusColor = 'from-green-500 to-emerald-600'; // Spare default
  let borderColor = 'border-gray-200 dark:border-gray-700';
  let badge = (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800">
      <FiCheckCircle className="w-3.5 h-3.5" /> SPARE
    </span>
  );

  if (isFaulty) {
    statusColor = 'from-red-500 to-rose-600';
    borderColor = 'border-red-200 dark:border-red-900/50';
    badge = (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-800">
        <FiAlertTriangle className="w-3.5 h-3.5" /> FAULTY
      </span>
    );
  } else if (isAllocated) {
    statusColor = 'from-blue-500 to-indigo-600';
    // borderColor = 'border-blue-200 dark:border-blue-900/50';
    badge = (
      <div className="grid grid-flow-row text-right">
        <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider mb-0.5 flex items-center justify-end gap-1">
          <FiActivity className="w-3 h-3" /> Utilized
        </span>
        <TruncateTooltip
          className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white max-w-[120px] sm:max-w-[140px]"
          text={fiber.system_name || fiber.ofc_route_name || 'Allocated'}
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border ${borderColor} shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col group relative overflow-hidden`}
    >
      {/* Status Bar Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b ${statusColor}`} />

      {/* Header */}
      <div className="px-3 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-linear-to-b from-gray-50/50 to-transparent dark:from-gray-900/20 pl-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Fiber Number Display */}
            <div className="font-mono font-bold text-sm sm:text-base bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-2.5 py-1 rounded-md text-gray-700 dark:text-gray-200 shadow-sm flex items-center gap-2">
              <span className="whitespace-nowrap">F-{startFiberNo}</span>
              {startFiberNo !== endFiberNo && (
                <>
                  <FiArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="whitespace-nowrap">F-{endFiberNo}</span>
                </>
              )}
            </div>
          </div>
          {/* Status Badge */}
          <div className="ml-auto sm:ml-0">{badge}</div>
        </div>
      </div>

      {/* Connection Flow Body */}
      <div className="px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4 pl-5">
        {/* A -> B Visual */}
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
                <div className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800/50 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Fiber:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {startFiberNo}
                  </span>
                </div>
                {/* End A Metrics */}
                <div className="bg-white dark:bg-gray-800/50 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1 text-xs shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">RKM</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {fiber.otdr_distance_sn_km ?? '-'}
                    </span>
                  </div>
                  {startDom && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">DOM</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300 text-[10px]">
                        {startDom}
                      </span>
                    </div>
                  )}
                  {fiber.sn_power_dbm && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Pwr</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {fiber.sn_power_dbm}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="flex items-center justify-center sm:pt-12">
              <div
                className={`p-1.5 rounded-full border shadow-sm rotate-90 sm:rotate-0 ${
                  isFaulty
                    ? 'bg-red-50 border-red-200 text-red-400'
                    : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-400'
                }`}
              >
                <FiChevronsRight className="w-4 h-4" />
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
                <div className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800/50 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Fiber:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {endFiberNo}
                  </span>
                </div>
                {/* End B Metrics */}
                <div className="bg-white dark:bg-gray-800/50 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1 text-xs shadow-sm w-full">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">RKM</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {fiber.otdr_distance_en_km ?? '-'}
                    </span>
                  </div>
                  {endDom && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">DOM</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300 text-[10px]">
                        {endDom}
                      </span>
                    </div>
                  )}
                  {fiber.en_power_dbm && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">Pwr</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {fiber.en_power_dbm}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shared Metrics & Remarks */}
        <div className="space-y-2">
          {/* Enhanced Loss Badge */}
          <div
            className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg border shadow-sm ${
              isFaulty
                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiZap
                className={`w-4 h-4 shrink-0 ${
                  isFaulty ? 'text-red-600' : 'text-amber-600 dark:text-amber-400'
                }`}
              />
              <span
                className={`font-bold uppercase text-xs tracking-wide ${
                  isFaulty ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                Route Loss
              </span>
            </div>
            <span
              className={`font-mono font-bold ${
                isFaulty ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'
              }`}
            >
              {fiber.route_loss_db ? `${fiber.route_loss_db} dB` : '-'}
            </span>
          </div>

          {fiber.remark && (
            <div className="bg-gray-50 dark:bg-gray-900/20 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800/50 text-xs text-gray-600 dark:text-gray-400 italic">
              <TruncateTooltip text={fiber.remark} />
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      {actions && (
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-linear-to-t from-gray-50 to-transparent dark:from-gray-900/30 border-t border-gray-200 dark:border-gray-700/50 flex justify-end gap-2 pl-6">
          {actions}
        </div>
      )}
    </div>
  );
};
