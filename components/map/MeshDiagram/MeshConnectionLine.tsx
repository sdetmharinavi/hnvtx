// components/map/MeshDiagram/MeshConnectionLine.tsx
'use client';

import { Polyline, Popup } from 'react-leaflet';
import { getCurvedPath } from '@/utils/mapUtils';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { MeshConnectionLineProps } from './types';
import { PopupFiberRow } from '@/components/map/PopupFiberRow';

type LogicalPath = {
  id: string;
  path_name: string;
  path_role: string | null;
  system_connection_id: string | null;
  bandwidth_gbps: number | null;
};

export const MeshConnectionLine = ({
  startPos,
  endPos,
  isSpur,
  config,
  theme,
  nodesLength,
  customColor,
  start,
  end,
}: MeshConnectionLineProps) => {
  const isDark = theme === 'dark';
  const supabase = createClient();
  const [isInteracted, setIsInteracted] = useState(false);
  const shouldFetch = isInteracted;

  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [allotedService, setAllotedService] = useState<string | undefined>(undefined);

  // --- LOGICAL PATH QUERY (Identical logic to ClientRingMap) ---
  const { data: logicalPaths = [] } = useQuery<LogicalPath[]>({
    queryKey: [
      'logical-paths-segment-mesh',
      start.id,
      end.id,
      config?.sourcePort,
      config?.destPort,
    ],
    queryFn: async () => {
      if (!start.id || !end.id) return [];

      const srcPort = config?.sourcePort;
      const dstPort = config?.destPort;
      let filter = '';

      if (srcPort && dstPort) {
        const dir1 = `and(source_system_id.eq.${start.id},destination_system_id.eq.${end.id},source_port.eq.${srcPort},destination_port.eq.${dstPort})`;
        const dir2 = `and(source_system_id.eq.${end.id},destination_system_id.eq.${start.id},source_port.eq.${dstPort},destination_port.eq.${srcPort})`;
        filter = `${dir1},${dir2}`;
      } else {
        filter = `and(source_system_id.eq.${start.id},destination_system_id.eq.${end.id}),and(source_system_id.eq.${end.id},destination_system_id.eq.${start.id})`;
      }

      const { data, error } = await supabase
        .from('logical_fiber_paths')
        .select('id, path_name, path_role, system_connection_id, bandwidth_gbps')
        .or(filter);

      if (error) throw error;
      return data;
    },
    enabled: shouldFetch && !!start.id && !!end.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (!logicalPaths.length) return;
    setConnectionId(logicalPaths[0].system_connection_id || undefined);
    setAllotedService(logicalPaths[0].path_name || undefined);
  }, [logicalPaths]);

  let color = isSpur ? (isDark ? '#b4083f' : '#ff0066') : isDark ? '#60a5fa' : '#3b82f6';
  if (customColor) {
    color = customColor;
  }

  const hasConfig =
    config &&
    (config.source || (config.fiberMetrics && config.fiberMetrics.length > 0) || config.cableName);

  const positions =
    isSpur || nodesLength !== 2 ? [startPos, endPos] : getCurvedPath(startPos, endPos, 0.15);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: color,
        weight: isSpur ? 2 : 4,
        dashArray: isSpur ? '5, 5' : undefined,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }}
      eventHandlers={{
        click: () => setIsInteracted(true),
        popupopen: () => setIsInteracted(true),
      }}
    >
      <Popup className={isDark ? 'dark-popup' : ''} minWidth={280} maxWidth={350}>
        <div className="text-sm w-full">
          {hasConfig ? (
            <div className="mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <PopupFiberRow connectionId={connectionId} allotedService={allotedService} />
              </div>
            </div>
          ) : (
            !isSpur && (
              <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center">
                Physical link not provisioned
              </div>
            )
          )}
        </div>
      </Popup>
    </Polyline>
  );
};
