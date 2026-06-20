// components/map/PopupFiberRow.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePagedData, useRpcRecord } from '@/hooks/database';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { PathDisplay } from '@/components/system-details/PathDisplay';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Activity,
  ArrowRight,
} from 'lucide-react';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface PopupFiberRowProps {
  connectionId?: string;
  allotedService?: string;
}

export const PopupFiberRow: React.FC<PopupFiberRowProps> = ({ connectionId, allotedService }) => {
  const [isLogicalExpanded, setIsLogicalExpanded] = useState(false);
  const [isPhysicalExpanded, setIsPhysicalExpanded] = useState(false);

  const supabase = createClient();

  const { data: connection, isLoading: isConnectionLoading } = useRpcRecord(
    supabase,
    'v_system_connections_complete',
    connectionId ?? null,
    { enabled: (isLogicalExpanded || isPhysicalExpanded) && !!connectionId },
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

  const fiberFilters = useMemo(() => {
    if (allocatedFiberIds.length > 0) {
      return { id: allocatedFiberIds };
    }
    return { id: '00000000-0000-0000-0000-000000000000' };
  }, [allocatedFiberIds]);

  const { data: ofcData, isLoading: isFibersLoading } =
    usePagedData<V_ofc_connections_completeRowSchema>(
      supabase,
      'v_ofc_connections_complete',
      {
        filters: fiberFilters,
        limit: 100,
        orderBy: 'path_segment_order',
        orderDir: 'asc',
      },
      { enabled: isPhysicalExpanded && allocatedFiberIds.length > 0 },
    );

  const hasConnectionId = !!connectionId;
  const displayLabel =
    allotedService?.replace(/\s*\(Working\)\s*/g, '').trim() || 'No Service Alloted';

  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900'>
      <div className='relative bg-indigo-50 bg-linear-to-r from-indigo-50 to-blue-50 dark:bg-indigo-950 dark:from-indigo-950/30 dark:to-blue-950/30 border-b border-indigo-200 dark:border-indigo-800'>
        <div className='flex items-center gap-3 py-3 px-4'>
          <div className='p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-700'>
            <Activity size={16} className='text-indigo-600 dark:text-indigo-400' />
          </div>
          <div className='flex-1 min-w-0'>
            <div className='text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5'>
              Service Connection
            </div>
            <TruncateTooltip
              className='text-sm font-bold text-gray-900 dark:text-gray-100 truncate leading-tight'
              text={displayLabel}
            />
          </div>
        </div>
      </div>

      {hasConnectionId && (
        <div className='border-b border-gray-200 dark:border-gray-700'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLogicalExpanded(!isLogicalExpanded);
            }}
            className='w-full group'
            aria-expanded={isLogicalExpanded}
          >
            <div className='flex items-center gap-3 py-2.5 px-4 hover:bg-blue-50 hover:bg-linear-to-r hover:from-blue-50/50 hover:to-cyan-50/50 dark:hover:bg-blue-900/10 dark:hover:from-blue-950/20 dark:hover:to-cyan-950/20 transition-all duration-200'>
              <div className='p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-md group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors'>
                {isLogicalExpanded ? (
                  <ChevronDown size={14} className='text-blue-700 dark:text-blue-300' />
                ) : (
                  <ChevronRight size={14} className='text-blue-700 dark:text-blue-300' />
                )}
              </div>

              <div className='flex items-center gap-2 flex-1'>
                <div className='w-1 h-4 bg-blue-500 bg-linear-to-b from-blue-500 to-cyan-500 rounded-full shadow-sm' />
                <span className='text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide'>
                  Logical Route
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <span className='text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full'>
                  {isLogicalExpanded ? 'Hide' : 'Show'}
                </span>
                <ArrowRight
                  size={12}
                  className={`text-blue-500 dark:text-blue-400 transition-transform duration-200 ${
                    isLogicalExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5'
                  }`}
                />
              </div>
            </div>
          </button>

          {isLogicalExpanded && (
            <div className='px-4 pb-3 bg-blue-50 bg-linear-to-b from-blue-50/30 to-transparent dark:bg-blue-900/10 dark:from-blue-950/10 dark:to-transparent'>
              {isConnectionLoading ? (
                <div className='flex flex-col items-center justify-center py-8 gap-3'>
                  <div className='relative'>
                    <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
                    <div className='absolute inset-0 w-6 h-6 animate-ping text-blue-300 opacity-20'>
                      <Loader2 className='w-6 h-6' />
                    </div>
                  </div>
                  <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    Loading logical route...
                  </span>
                </div>
              ) : (
                <div className='bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-100 dark:border-blue-900/50 shadow-sm overflow-hidden'>
                  <div className='p-1'>
                    <PathDisplay systemConnectionId={connectionId || null} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {hasConnectionId && (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPhysicalExpanded(!isPhysicalExpanded);
            }}
            className='w-full group'
            aria-expanded={isPhysicalExpanded}
          >
            <div className='flex items-center gap-3 py-2.5 px-4 hover:bg-emerald-50 hover:bg-linear-to-r hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:bg-emerald-900/10 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/20 transition-all duration-200'>
              <div className='p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-md group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/60 transition-colors'>
                {isPhysicalExpanded ? (
                  <ChevronDown size={14} className='text-emerald-700 dark:text-emerald-300' />
                ) : (
                  <ChevronRight size={14} className='text-emerald-700 dark:text-emerald-300' />
                )}
              </div>

              <div className='flex items-center gap-2 flex-1'>
                <div className='w-1 h-4 bg-emerald-500 bg-linear-to-b from-emerald-500 to-teal-500 rounded-full shadow-sm' />
                <span className='text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide'>
                  Physical Segments
                </span>
              </div>

              <div className='flex items-center gap-2'>
                {ofcData?.data && ofcData.data.length > 0 && (
                  <span className='text-[10px] font-bold bg-emerald-500 bg-linear-to-r from-emerald-500 to-teal-500 text-white px-2.5 py-1 rounded-full shadow-sm'>
                    {ofcData.data.length}
                  </span>
                )}
                <span className='text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full'>
                  {isPhysicalExpanded ? 'Hide' : 'Show'}
                </span>
                <ArrowRight
                  size={12}
                  className={`text-emerald-500 dark:text-emerald-400 transition-transform duration-200 ${
                    isPhysicalExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5'
                  }`}
                />
              </div>
            </div>
          </button>

          {isPhysicalExpanded && (
            <div className='px-4 pb-3 bg-emerald-50 bg-linear-to-b from-emerald-50/30 to-transparent dark:bg-emerald-900/10 dark:from-emerald-950/10 dark:to-transparent'>
              {isConnectionLoading || isFibersLoading ? (
                <div className='flex flex-col items-center justify-center py-8 gap-3'>
                  <div className='relative'>
                    <Loader2 className='w-6 h-6 animate-spin text-emerald-500' />
                    <div className='absolute inset-0 w-6 h-6 animate-ping text-emerald-300 opacity-20'>
                      <Loader2 className='w-6 h-6' />
                    </div>
                  </div>
                  <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                    Loading physical segments...
                  </span>
                </div>
              ) : (
                <div className='bg-white dark:bg-gray-800 rounded-lg border-2 border-emerald-100 dark:border-emerald-900/50 shadow-sm overflow-hidden'>
                  <div className='p-3'>
                    {ofcData?.data && ofcData.data.length > 0 ? (
                      <div className='max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1'>
                        {ofcData.data.map((seg, idx) => {
                          const startFib = seg.updated_fiber_no_sn ?? seg.fiber_no_sn;
                          const endFib = seg.updated_fiber_no_en ?? seg.fiber_no_en;

                          return (
                            <div
                              key={seg.id || idx}
                              className='group/card p-2.5 bg-gray-50 bg-linear-to-br from-gray-50 to-gray-100/50 dark:bg-gray-800 dark:from-gray-800/50 dark:to-gray-800/30 rounded-lg hover:bg-emerald-50 hover:from-emerald-50 hover:to-teal-50 dark:hover:bg-emerald-900/20 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/20 transition-all duration-200 border-2 border-gray-200/50 dark:border-gray-700/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'
                            >
                              <div className='flex items-start justify-between gap-2 mb-2'>
                                <div className='flex items-start gap-2 flex-1 min-w-0'>
                                  <TruncateTooltip
                                    className='text-xs font-bold text-gray-900 dark:text-gray-100 truncate leading-tight'
                                    text={`${seg.ofc_route_name} ${seg.ofc_type_name}`}
                                  />
                                </div>
                                <div className='flex items-center gap-1.5 shrink-0'>
                                  <span className='font-mono font-bold bg-blue-500 bg-linear-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-md text-[10px] shadow-sm whitespace-nowrap'>
                                    F{startFib}→F{endFib}
                                  </span>
                                  <span className='font-mono font-bold bg-emerald-500 bg-linear-to-r from-emerald-500 to-teal-500 text-white px-2 py-1 rounded-md text-[10px] shadow-sm capitalize'>
                                    {seg.path_direction}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className='py-8 text-center'>
                        <p className='text-xs font-semibold text-gray-600 dark:text-gray-400'>
                          No Physical Segments Found
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};