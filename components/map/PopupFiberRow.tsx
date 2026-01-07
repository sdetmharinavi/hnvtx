// components/map/PopupFiberRow.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePagedData, useRpcRecord } from '@/hooks/database';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { PathDisplay } from '@/components/system-details/PathDisplay';
import { ChevronDown, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { FiberMetric } from './ClientRingMap';
import Link from 'next/link';

interface PopupFiberRowProps {
  fm: FiberMetric;
}

export const PopupFiberRow: React.FC<PopupFiberRowProps> = ({ fm }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  // 1. Fetch the Connection Record to get Fiber IDs
  const { data: connection, isLoading: isConnectionLoading } = useRpcRecord(
    supabase,
    "v_system_connections_complete",
    fm.connectionId ?? null,
    { enabled: isExpanded && !!fm.connectionId }
  );

  // 2. Extract Fiber IDs
  const allocatedFiberIds = useMemo(() => {
    if (!connection) return [];
    return [
      ...(connection.working_fiber_in_ids || []),
      ...(connection.working_fiber_out_ids || []),
      ...(connection.protection_fiber_in_ids || []),
      ...(connection.protection_fiber_out_ids || []),
    ].filter(Boolean);
  }, [connection]);

  // 3. Build Safe Filter for Physical Segments
  const fiberIdFilter = useMemo(() => {
    if (allocatedFiberIds.length === 0) return undefined;
    return `id::text IN ('${allocatedFiberIds.join("','")}')`;
  }, [allocatedFiberIds]);

  // 4. Fetch Physical Segments
  const { data: ofcData, isLoading: isFibersLoading } = usePagedData<V_ofc_connections_completeRowSchema>(
    supabase,
    "v_ofc_connections_complete",
    {
      filters: { or: fiberIdFilter },
      limit: 100,
      orderBy: 'path_segment_order',
      orderDir: 'asc'
    },
    { enabled: isExpanded && allocatedFiberIds.length > 0 }
  );

  const isLoading = isConnectionLoading || isFibersLoading;

  return (
    <div className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      {/* Row Header */}
      <div 
        className="flex items-center justify-between py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors rounded-md"
        onClick={(e) => {
          e.stopPropagation(); // Prevent map click through
          if (fm.connectionId) setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {fm.connectionId && (
            <button
              className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
              title="View Logical Route"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate" title={fm.label}>
              {fm.label}
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className={`uppercase font-bold tracking-wider ${
                fm.role === "working" 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-purple-600 dark:text-purple-400"
              }`}>
                {fm.role === "working" ? "Working" : "Protect"}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 font-mono">{fm.direction}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 ml-3 shrink-0">
           {fm.distance ? (
             <span className="text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
               {fm.distance} km
             </span>
           ) : <span className="text-gray-300 text-xs">-</span>}
           
           {fm.power ? (
            <span className={`text-xs font-mono font-bold ${
               fm.power < -25 ? "text-red-500" : fm.power < -20 ? "text-amber-500" : "text-green-600"
            }`}>
              {fm.power} dBm
            </span>
           ) : <span className="text-gray-300 text-xs">-</span>}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && fm.connectionId && (
        <div className="pl-4 pr-2 pb-3 pt-1 space-y-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-md">
          {isLoading ? (
             <div className="flex items-center justify-center py-4 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading path details...
             </div>
          ) : (
            <>
              {/* Logical Path */}
              <div className="space-y-1">
                <h6 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Logical Route</h6>
                <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-2">
                  <PathDisplay systemConnectionId={fm.connectionId} />
                </div>
              </div>

              {/* Physical Segments (Simplified List) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <h6 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Physical Segments</h6>
                    {connection?.system_id && (
                        <Link 
                            href={`/dashboard/systems/${connection.system_id}`} 
                            target="_blank"
                            className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                        >
                            View System <ExternalLink size={10} />
                        </Link>
                    )}
                </div>
                
                {ofcData?.data && ofcData.data.length > 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 max-h-40 overflow-y-auto custom-scrollbar">
                    {ofcData.data.map((seg, idx) => (
                      <div key={seg.id || idx} className="p-2 text-xs">
                        <div className="flex justify-between font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                           <span className="truncate max-w-[160px]" title={seg.ofc_route_name || ''}>
                             {seg.ofc_route_name}
                           </span>
                           <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-[10px]">
                             F{seg.fiber_no_sn} → F{seg.fiber_no_en}
                           </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                           <span>{seg.otdr_distance_sn_km}km</span>
                           <span>Loss: {seg.route_loss_db || '-'}dB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic text-center py-2 border border-dashed border-gray-200 dark:border-gray-700 rounded">
                     No physical fibers found.
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