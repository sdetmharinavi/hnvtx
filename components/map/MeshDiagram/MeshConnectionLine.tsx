// components/map/MeshDiagram/MeshConnectionLine.tsx
"use client";

import { Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import { Router, Activity, Network } from "lucide-react";
import { getCurvedPath } from "@/utils/mapUtils";
import { PathConfig } from "@/components/map/ClientRingMap/types";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ButtonSpinner } from "@/components/common/ui";
import { MeshConnectionLineProps } from "./types"; // Ensure you import the interface
import { PopupFiberRow } from "@/components/map/PopupFiberRow";

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
  startNodeName,
  endNodeName,
  nodesLength,
  customColor,
  start, // New prop
  end, // New prop
}: MeshConnectionLineProps) => {
  const isDark = theme === "dark";
  const supabase = createClient();
  const [isInteracted, setIsInteracted] = useState(false);
  const shouldFetch = isInteracted;

  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);

  // --- LOGICAL PATH QUERY (Identical logic to ClientRingMap) ---
  const { data: logicalPaths = [], isLoading: isLoadingPaths } = useQuery<LogicalPath[]>({
    queryKey: [
      "logical-paths-segment-mesh",
      start.id,
      end.id,
      config?.sourcePort,
      config?.destPort,
    ],
    queryFn: async () => {
      if (!start.id || !end.id) return [];

      const srcPort = config?.sourcePort;
      const dstPort = config?.destPort;
      let filter = "";

      if (srcPort && dstPort) {
        const dir1 = `and(source_system_id.eq.${start.id},destination_system_id.eq.${end.id},source_port.eq.${srcPort},destination_port.eq.${dstPort})`;
        const dir2 = `and(source_system_id.eq.${end.id},destination_system_id.eq.${start.id},source_port.eq.${dstPort},destination_port.eq.${srcPort})`;
        filter = `${dir1},${dir2}`;
      } else {
        filter = `and(source_system_id.eq.${start.id},destination_system_id.eq.${end.id}),and(source_system_id.eq.${end.id},destination_system_id.eq.${start.id})`;
      }

      const { data, error } = await supabase
        .from("logical_fiber_paths")
        .select("id, path_name, path_role, system_connection_id, bandwidth_gbps")
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
  }, [logicalPaths]);

  let color = isSpur ? (isDark ? "#b4083f" : "#ff0066") : isDark ? "#60a5fa" : "#3b82f6";
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
        dashArray: isSpur ? "5, 5" : undefined,
        opacity: 0.8,
        lineCap: "round",
        lineJoin: "round",
      }}
      eventHandlers={{
        click: () => setIsInteracted(true),
        popupopen: () => setIsInteracted(true),
      }}>
      <Popup className={isDark ? "dark-popup" : ""} minWidth={280} maxWidth={350}>
        <div className='text-sm w-full'>
          <div className='font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-700 dark:text-gray-300'>
            {isSpur ? "Spur Connection" : "Backbone Segment"}
          </div>

          <div className='text-xs text-gray-500 mb-2'>
            {startNodeName} ↔ {endNodeName}
          </div>

          {config?.cableName && (
            <div className='flex items-center justify-between gap-2 mb-2'>
              <div
                className='text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 truncate'
                title={config.cableName}>
                <Router className='w-3 h-3 shrink-0' />
                <span className='truncate max-w-[200px]'>{config.cableName}</span>
              </div>
              {config.capacity && (
                <span className='shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                  {config.capacity}F
                </span>
              )}
            </div>
          )}

          {hasConfig ? (
            <div className='mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'>
              <div className='divide-y divide-gray-100 dark:divide-gray-700'>
                <PopupFiberRow config={config} connectionId={connectionId} />
              </div>
            </div>
          ) : (
            !isSpur && (
              <div className='mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center'>
                Physical link not provisioned
              </div>
            )
          )}

          {/* NEW SECTION: LOGICAL PATHS (Visible on Interaction) */}
          {shouldFetch && (
            <div className='mt-3 border-t border-gray-100 dark:border-gray-700 pt-2'>
              <div className='flex items-center gap-1.5 mb-2 text-xs font-semibold text-gray-600 dark:text-gray-300'>
                <Network className='w-3.5 h-3.5' />
                <span>Logical Paths on this Segment</span>
              </div>

              {isLoadingPaths ? (
                <div className='flex justify-center py-2'>
                  <ButtonSpinner size='xs' />
                </div>
              ) : logicalPaths && logicalPaths.length > 0 ? (
                <div className='space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar'>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {logicalPaths.map((path: any) => (
                    <div
                      key={path.id}
                      className='flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded border border-gray-200 dark:border-gray-700'>
                      <span
                        className='font-medium text-blue-700 dark:text-blue-300 truncate max-w-[160px]'
                        title={path.path_name || ""}>
                        {path.path_name || "Unnamed Path"}
                      </span>
                      <div className='flex items-center gap-2'>
                        {path.bandwidth_gbps && (
                          <span className='text-[10px] bg-gray-200 dark:bg-gray-700 px-1 rounded'>
                            {path.bandwidth_gbps}G
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-1.5 rounded font-bold uppercase ${
                            path.path_role === "working"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}>
                          {path.path_role === "working" ? "W" : "P"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-xs text-gray-400 italic text-center py-1'>
                  No logical paths explicitly defined between these specific ports.
                </div>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Polyline>
  );
};
