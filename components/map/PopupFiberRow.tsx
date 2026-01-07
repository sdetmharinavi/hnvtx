// components/map/PopupFiberRow.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePagedData, useRpcRecord } from '@/hooks/database';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { PathDisplay } from '@/components/system-details/PathDisplay';
import { ChevronDown, ChevronRight, ExternalLink, Loader2, Activity, Cable } from 'lucide-react';
import { PathConfig } from './ClientRingMap';
import Link from 'next/link';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface PopupFiberRowProps {
  config?: PathConfig;
}

export const PopupFiberRow: React.FC<PopupFiberRowProps> = ({ config }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  const allUniqueConnectionIds = useMemo(() => {
    if (!config?.fiberMetrics) return [];
    return Array.from(new Set(config.fiberMetrics.map((fm) => fm.connectionId).filter(Boolean)));
  }, [config]);

  const { data: connection, isLoading: isConnectionLoading } = useRpcRecord(
    supabase,
    'v_system_connections_complete',
    allUniqueConnectionIds[0] ?? null,
    { enabled: isExpanded && !!allUniqueConnectionIds[0] }
  );

  const allocatedFiberIds = useMemo(() => {
    if (!connection) return [];
    return [
      ...(connection.working_fiber_in_ids || []),
      ...(connection.working_fiber_out_ids || []),
      ...(connection.protection_fiber_in_ids || []),
      ...(connection.protection_fiber_out_ids || []),
    ].filter(Boolean);
  }, [connection]);

  const fiberIdFilter = useMemo(() => {
    if (allocatedFiberIds.length === 0) return undefined;
    return `id::text IN ('${allocatedFiberIds.join("','")}')`;
  }, [allocatedFiberIds]);

  const { data: ofcData, isLoading: isFibersLoading } =
    usePagedData<V_ofc_connections_completeRowSchema>(
      supabase,
      'v_ofc_connections_complete',
      {
        filters: { or: fiberIdFilter },
        limit: 100,
        orderBy: 'path_segment_order',
        orderDir: 'asc',
      },
      { enabled: isExpanded && allocatedFiberIds.length > 0 }
    );

  const isLoading = isConnectionLoading || isFibersLoading;
  const hasConnectionId = !!allUniqueConnectionIds[0];

  return (
    <div className="border-b border-gray-200/60 dark:border-gray-700/40 last:border-0">
      {/* Row Header */}
      <div
        className={`flex items-center justify-between py-2.5 px-3 transition-all duration-200 ${
          hasConnectionId
            ? 'hover:bg-linear-to-r hover:from-blue-50/50 hover:to-transparent dark:hover:from-blue-900/10 cursor-pointer'
            : 'opacity-60'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          if (hasConnectionId) setIsExpanded(!isExpanded);
        }}
        role={hasConnectionId ? 'button' : undefined}
        aria-expanded={isExpanded}
        tabIndex={hasConnectionId ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasConnectionId && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {hasConnectionId ? (
            <>
              <div className="shrink-0 p-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-transform duration-200 hover:scale-110">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Activity size={14} className="shrink-0 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  Service Alloted:
                </span>
                <TruncateTooltip
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                  text={config?.fiberMetrics?.[0].label || 'Service Alloted'}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Activity size={14} className="shrink-0 text-gray-400" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {config?.fiberMetrics?.[0].label || 'No Service Alloted'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && hasConnectionId && (
        <div className="px-3 pb-3 pt-2 space-y-3 bg-linear-to-b from-gray-50/80 to-transparent dark:from-gray-800/40 border-t border-gray-200/40 dark:border-gray-700/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Loading path details...
              </span>
            </div>
          ) : (
            <>
              {/* Logical Path Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                  <h6 className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider px-2">
                    Logical Route
                  </h6>
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                </div>
                <div className="bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200/80 dark:border-gray-700/60 shadow-sm p-3 hover:shadow-md transition-shadow">
                  <PathDisplay systemConnectionId={allUniqueConnectionIds[0] || null} />
                </div>
              </div>

              {/* Physical Segments Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                  <div className="flex items-center justify-between gap-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <Cable size={12} className="text-gray-500 dark:text-gray-400" />
                      <h6 className="text-[10px] uppercase font-semibold text-gray-500 dark:text-gray-400 tracking-wider whitespace-nowrap">
                        Physical Segments
                      </h6>
                    </div>
                    {connection?.system_id && (
                      <Link
                        href={`/dashboard/systems/${connection.system_id}`}
                        target="_blank"
                        className="flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View System <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                </div>

                {ofcData?.data && ofcData.data.length > 0 ? (
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50 custom-scrollbar">
                      {ofcData.data.map((seg, idx) => (
                        <div
                          key={seg.id || idx}
                          className="p-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <TruncateTooltip
                              className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1"
                              text={`${seg.ofc_route_name} ${seg.ofc_type_name}`}
                            />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-medium">
                                F{seg.updated_fiber_no_sn} → F{seg.updated_fiber_no_en}
                              </span>
                              <span className="inline-flex items-center font-mono bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-medium">
                                {seg.fiber_role}
                              </span>
                              <span className="inline-flex items-center font-mono bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-medium capitalize">
                                {seg.path_direction}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                            <span className="font-medium">
                              Distance:{' '}
                              <span className="font-mono text-gray-800 dark:text-gray-200">
                                {seg.otdr_distance_sn_km}km
                              </span>
                            </span>
                            {seg.sn_power_dbm ? (
                              <span className="font-medium">
                                Rx Power at {seg.updated_sn_name}:
                                <span className="font-mono text-gray-800 dark:text-gray-200 ml-1">
                                  {seg.sn_power_dbm}dBm
                                </span>
                              </span>
                            ) : seg.en_power_dbm ? (
                              <span className="font-medium">
                                Rx Power at {seg.updated_en_name}:
                                <span className="font-mono text-gray-800 dark:text-gray-200 ml-1">
                                  {seg.en_power_dbm}dBm
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                No power data
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                    <Cable size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      No physical fiber segments found
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
