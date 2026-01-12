// components/map/ClientRingMap/ConnectionLine.tsx
'use client';

import { Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ButtonSpinner } from '@/components/common/ui';
import { Ruler, Edit2, Save, X, MessageSquare } from 'lucide-react';
import { PopupFiberRow } from '../PopupFiberRow';
import { fetchOrsDistance, isColocated, getCurvedPath } from '@/utils/mapUtils';
import { PathConfig, RingMapNode } from './types';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface ConnectionLineProps {
  start: RingMapNode;
  end: RingMapNode;
  startPos: L.LatLng;
  endPos: L.LatLng;
  type: 'solid' | 'dashed';
  theme: string;
  showPopup: boolean;
  setPolylineRef: (key: string, el: L.Polyline | null) => void;
  config?: PathConfig;
  customColor?: string;
  curveOffset?: number;
  hasReverse?: boolean;
  rotation?: number;
}

type LogicalPath = {
  id: string;
  path_name: string;
  path_role: string | null;
  system_connection_id: string | null;
  bandwidth_gbps: number | null;
  remark: string | null;
};

export const ConnectionLine = ({
  start,
  end,
  startPos,
  endPos,
  type,
  theme,
  showPopup,
  setPolylineRef,
  config,
  customColor,
  curveOffset = 0,
  rotation = 0,
}: ConnectionLineProps) => {
  const [isInteracted, setIsInteracted] = useState(false);
  const shouldFetch = showPopup || isInteracted;
  const queryClient = useQueryClient();
  const supabase = createClient();

  // --- Local State for Remarks UI ---
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkText, setRemarkText] = useState('');

  // --- Dynamic Offset Calculation for Visual "Up" ---
  const popupOffset = useMemo(() => {
    const distance = 25; // Distance in pixels from the line
    const rad = (rotation * Math.PI) / 180;
    
    // Calculate offset vector (0, -distance) rotated by 'rotation'
    // This places the popup visually "above" the point on the rotated map
    const x = -distance * Math.sin(rad);
    const y = -distance * Math.cos(rad);
    
    return L.point(x, y);
  }, [rotation]);

  // --- Popup Rotation Logic ---
  const popupRef = useRef<L.Popup>(null);

  const updatePopupStyle = useCallback(() => {
    if (!popupRef.current) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const popup = popupRef.current as any;
    const el = popup._container as HTMLElement;
    
    if (!el) return;

    // Hide tip as it doesn't rotate correctly with content wrapper
    const tip = el.querySelector('.leaflet-popup-tip-container') as HTMLElement;
    if (tip) {
      tip.style.display = 'none';
    }

    // Rotate the wrapper (content) only
    // This keeps the container (and Leaflet's positioning) intact, but spins the visual box
    const wrapper = el.querySelector('.leaflet-popup-content-wrapper') as HTMLElement;
    if (wrapper) {
        if (rotation !== 0) {
            wrapper.style.transform = `rotate(${-rotation}deg)`;
            wrapper.style.transformOrigin = 'center bottom';
            wrapper.style.transition = 'transform 0.3s ease-out';
        } else {
            wrapper.style.transform = '';
            wrapper.style.transformOrigin = '';
            wrapper.style.transition = '';
        }
    }
  }, [rotation]);

  // Apply style when rotation changes or popup opens
  useEffect(() => {
    const timer = setTimeout(updatePopupStyle, 0);
    return () => clearTimeout(timer);
  }, [rotation, updatePopupStyle, isInteracted]);


  // 1. Distance Calculation
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ors-distance', start.id, end.id],
    queryFn: () => fetchOrsDistance(start, end),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [allotedService, setAllotedService] = useState<string | undefined>(undefined);
  const [hasActiveService, setHasActiveService] = useState(false);

  // 2. Fetch Logical Path Info
  const { data: logicalPaths = [], refetch } = useQuery<LogicalPath[]>({
    queryKey: [
      'logical_fiber_paths',
      'segment',
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
        .select('id, path_name, path_role, system_connection_id, bandwidth_gbps, remark')
        .or(filter);

      if (error) throw error;
      return data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (logicalPaths.length > 0) {
      const path = logicalPaths[0];
      setConnectionId(path.system_connection_id || undefined);
      setAllotedService(path.path_name || undefined);

      setHasActiveService(!!path.system_connection_id);

      if (!isEditingRemark) {
        setRemarkText(path.remark || '');
      }
    } else if (config?.connectionId) {
      setConnectionId(config.connectionId);
      setHasActiveService(false);
    } else {
      setHasActiveService(false);
    }
  }, [logicalPaths, config?.connectionId, isEditingRemark]);

  // 3. Mutation to Save/Insert Remark
  const { mutate: saveRemark, isPending: isSaving } = useMutation({
    mutationFn: async (text: string) => {
      const existingPath = logicalPaths[0];

      if (existingPath) {
        const { error } = await supabase
          .from('logical_fiber_paths')
          .update({ remark: text })
          .eq('id', existingPath.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('logical_fiber_paths').insert({
          source_system_id: start.id,
          destination_system_id: end.id,
          source_port: config?.sourcePort || null,
          destination_port: config?.destPort || null,
          remark: text,
          path_name: `Manual Link: ${start.name} - ${end.name}`,
          path_role: 'working',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Remark saved successfully');
      setIsEditingRemark(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['logical_fiber_paths'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to save remark: ${err.message}`);
    },
  });

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveRemark(remarkText);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingRemark(false);
    setRemarkText(logicalPaths[0]?.remark || '');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingRemark(true);
  };

  // Helper to manually close the popup since we hid the default button
  const handleClosePopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (popupRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (popupRef.current as any)._map;
        if (map) map.closePopup();
    }
  };

  const defaultColor =
    type === 'solid'
      ? theme === 'dark'
        ? '#3b82f6'
        : '#2563eb'
      : theme === 'dark'
      ? '#ef4444'
      : '#dc2626';

  const color = customColor || defaultColor;

  const distanceText = isLoading ? (
    <span className="flex items-center gap-2 text-gray-500 text-xs">
      <ButtonSpinner size="xs" /> Calc...
    </span>
  ) : isError ? (
    <span className="text-red-500 text-xs">Failed</span>
  ) : data?.distance_km ? (
    <span className="font-bold">{data.distance_km} km</span>
  ) : (
    'N/A'
  );

  const hasConfig =
    config &&
    (config.source ||
      (config.fiberMetrics && config.fiberMetrics.length > 0) ||
      config.cableName ||
      config.fiberInfo);

  const isCluster = isColocated(startPos, endPos, 0.005);
  let positions;

  if (isCluster) {
    positions = getCurvedPath(startPos, endPos, 0.5 + curveOffset * 2);
  } else if (curveOffset !== 0) {
    positions = getCurvedPath(startPos, endPos, curveOffset);
  } else {
    positions = [startPos, endPos];
  }

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight: type === 'solid' ? 4 : 2.5,
        opacity: type === 'solid' ? 1 : 0.7,
        dashArray: type === 'dashed' ? '20, 20' : undefined,
      }}
      eventHandlers={{
        click: () => setIsInteracted(true),
        popupopen: () => {
            setIsInteracted(true);
            setTimeout(updatePopupStyle, 10);
        },
      }}
      ref={(el) => setPolylineRef(`${type}-${start.id}-${end.id}`, el)}
    >
      <Popup
        ref={popupRef}
        autoClose={false}
        closeOnClick={false}
        className={theme === 'dark' ? 'dark-popup' : ''}
        minWidth={320}
        maxWidth={400}
        offset={popupOffset} // Dynamic offset based on rotation
        closeButton={false} // Hide default close button
      >
        <div className="text-sm w-full relative">
          
          {/* Custom Close Button inside the rotated content */}
          <button 
            onClick={handleClosePopup}
            className="absolute -top-3 -right-3 p-1.5 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-full shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all z-50"
            title="Close"
          >
            <X size={14} />
          </button>

          <div className="font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-700 dark:text-gray-300 pr-6">
            {type === 'solid' ? 'Segment Details' : 'Spur Connection'}
          </div>

          {hasConfig ? (
            <div className="mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <PopupFiberRow
                  connectionId={connectionId || config?.connectionId}
                  allotedService={allotedService}
                />
              </div>
            </div>
          ) : (
            type === 'solid' && (
              <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center">
                Physical link not provisioned
              </div>
            )
          )}

          {!hasActiveService && (
            <div className="mb-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-2 border border-gray-200 dark:border-gray-700 group hover:shadow-sm transition-all">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <MessageSquare size={12} />
                  <span>Remarks</span>
                </div>
                {!isEditingRemark && (
                  <button
                    onClick={handleEditClick}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Edit Remarks"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>

              {isEditingRemark ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full text-xs p-2 rounded border border-blue-300 dark:border-blue-700 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    placeholder="Enter remarks here..."
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelClick}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={handleSaveClick}
                      disabled={isSaving}
                      className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      title="Save"
                    >
                      {isSaving ? <ButtonSpinner size="xs" /> : <Save size={14} />}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-400 italic wrap-break-words pl-1 min-h-[1.2em]">
                  {remarkText || 'No remarks added.'}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700 mt-2">
            <div className="mt-1 flex justify-between items-center px-1">
              <span className="font-medium flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Road Distance
              </span>
              <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                {distanceText}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Polyline>
  );
};