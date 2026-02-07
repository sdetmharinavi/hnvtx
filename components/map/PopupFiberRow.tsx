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
  ExternalLink,
  Loader2,
  Activity,
  Cable,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import TruncateTooltip from '@/components/common/TruncateTooltip';

interface PopupFiberRowProps {
  connectionId?: string;
  allotedService?: string;
}

export const PopupFiberRow: React.FC<PopupFiberRowProps> = ({ connectionId, allotedService }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Internal collapse states for sections
  const [isLogicalExpanded, setIsLogicalExpanded] = useState(true);
  const [isPhysicalExpanded, setIsPhysicalExpanded] = useState(false); // Default collapsed to save space

  const supabase = createClient();

  const { data: connection, isLoading: isConnectionLoading } = useRpcRecord(
    supabase,
    'v_system_connections_complete',
    connectionId ?? null,
    { enabled: isExpanded && !!connectionId },
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
      { enabled: isExpanded && allocatedFiberIds.length > 0 },
    );

  const isLoading = isConnectionLoading || isFibersLoading;
  const hasConnectionId = !!connectionId;
  const displayLabel =
    allotedService?.replace(/\s*\(Working\)\s*/g, '').trim() || 'No Service Alloted';

  return (
    <div className='border-b border-gray-200/50 dark:border-gray-700/30 last:border-0'>
      {/* Compact Header */}
      <div
        className={`flex items-center gap-2 py-1.5 px-2.5 transition-colors ${
          hasConnectionId
            ? 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer'
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
        {hasConnectionId && (
          <div className='shrink-0 text-gray-400 dark:text-gray-500'>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
        <Activity size={13} className='shrink-0 text-blue-500 dark:text-blue-400' />
        <TruncateTooltip
          className='text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1'
          text={displayLabel}
        />
        {hasConnectionId && (
          <span className='shrink-0 text-[10px] text-gray-400 dark:text-gray-500 font-medium'>
            {isExpanded ? 'Less' : 'More'}
          </span>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && hasConnectionId && (
        <div className='px-2.5 pb-2 space-y-2 bg-gray-50/30 dark:bg-gray-800/20'>
          {isLoading ? (
            <div className='flex items-center justify-center py-6 gap-2'>
              <Loader2 className='w-4 h-4 animate-spin text-blue-500' />
              <span className='text-[11px] text-gray-500 dark:text-gray-400'>Loading...</span>
            </div>
          ) : (
            <>
              {/* Logical Route - Collapsible Card */}
              <div className='bg-white dark:bg-gray-900/40 rounded border border-gray-200/60 dark:border-gray-700/50 overflow-hidden'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLogicalExpanded(!isLogicalExpanded);
                  }}
                  className='w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left'
                >
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1 h-3 bg-blue-500 rounded-full' />
                    <span className='text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                      Logical Route
                    </span>
                  </div>
                  {isLogicalExpanded ? (
                    <ChevronDown size={12} className='text-gray-400' />
                  ) : (
                    <ChevronRight size={12} className='text-gray-400' />
                  )}
                </button>

                {isLogicalExpanded && (
                  <div className='px-2 pb-2 pt-0'>
                    <PathDisplay systemConnectionId={connectionId || null} />
                  </div>
                )}
              </div>

              {/* Physical Segments - Collapsible Card */}
              <div className='bg-white dark:bg-gray-900/40 rounded border border-gray-200/60 dark:border-gray-700/50 overflow-hidden'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhysicalExpanded(!isPhysicalExpanded);
                  }}
                  className='w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left'
                >
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1 h-3 bg-emerald-500 rounded-full' />
                    <span className='text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
                      Physical Segments
                    </span>
                    {ofcData?.data && ofcData.data.length > 0 && (
                      <span className='text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full font-medium'>
                        {ofcData.data.length}
                      </span>
                    )}
                  </div>
                  {isPhysicalExpanded ? (
                    <ChevronDown size={12} className='text-gray-400' />
                  ) : (
                    <ChevronRight size={12} className='text-gray-400' />
                  )}
                </button>

                {isPhysicalExpanded && (
                  <div className='px-2 pb-2 pt-0'>
                    <div className='flex items-center justify-end mb-1.5'>
                      {connection?.system_id && (
                        <Link
                          href={`/dashboard/systems/${connection.system_id}`}
                          target='_blank'
                          className='flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium'
                          onClick={(e) => e.stopPropagation()}
                        >
                          View System <ExternalLink size={9} />
                        </Link>
                      )}
                    </div>

                    {ofcData?.data && ofcData.data.length > 0 ? (
                      <div className='max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar'>
                        {ofcData.data.map((seg, idx) => {
                          const startFib = seg.updated_fiber_no_sn ?? seg.fiber_no_sn;
                          const endFib = seg.updated_fiber_no_en ?? seg.fiber_no_en;

                          return (
                            <div
                              key={seg.id || idx}
                              className='p-1.5 bg-gray-50/50 dark:bg-gray-800/30 rounded hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                            >
                              <div className='flex items-start justify-between gap-1.5 mb-1'>
                                <TruncateTooltip
                                  className='text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 leading-tight'
                                  text={`${seg.ofc_route_name} ${seg.ofc_type_name}`}
                                />
                                <div className='flex items-center gap-1 shrink-0'>
                                  <span className='font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap'>
                                    F{startFib}→F{endFib}
                                  </span>
                                  <span className='font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-medium capitalize'>
                                    {seg.path_direction}
                                  </span>
                                </div>
                              </div>

                              <div className='flex items-center gap-2 text-[10px]'>
                                <div className='flex items-center gap-1 text-gray-600 dark:text-gray-400'>
                                  <Cable size={10} className='shrink-0' />
                                  <span className='font-mono font-medium text-gray-800 dark:text-gray-200'>
                                    {seg.otdr_distance_sn_km}km
                                  </span>
                                </div>

                                {(seg.sn_power_dbm || seg.en_power_dbm) && (
                                  <>
                                    <span className='text-gray-300 dark:text-gray-600'>•</span>
                                    <div className='flex items-center gap-1 text-gray-600 dark:text-gray-400'>
                                      <Zap size={10} className='shrink-0' />
                                      <span className='font-medium'>
                                        {seg.sn_power_dbm
                                          ? seg.updated_sn_name
                                          : seg.updated_en_name}
                                        :
                                      </span>
                                      <span className='font-mono font-semibold text-gray-800 dark:text-gray-200'>
                                        {seg.sn_power_dbm || seg.en_power_dbm}dBm
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className='py-4 text-center'>
                        <Cable
                          size={20}
                          className='mx-auto mb-1 text-gray-300 dark:text-gray-600'
                        />
                        <p className='text-[10px] text-gray-500 dark:text-gray-400'>
                          No segments found
                        </p>
                      </div>
                    )}
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
