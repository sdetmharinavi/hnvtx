// components/map/ClientRingMap/ConnectionLine.tsx
'use client';

import { Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ButtonSpinner } from '@/components/common/ui';
import { Ruler, X } from 'lucide-react';
import { PopupFiberRow } from '../PopupFiberRow';
import { fetchOrsDistance, isColocated, getCurvedPath } from '@/utils/mapUtils';
import { PathConfig, RingMapNode } from './types';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { PopupRemarksRow } from '@/components/map/PopupRemarksRow';
import useIsMobile from '@/hooks/useIsMobile'; // ADDED

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
  const map = useMap();
  const [manualPos, setManualPos] = useState<L.LatLng | null>(null);

  // ADDED: Mobile check for dynamic hit box sizing
  const isMobile = useIsMobile();

  const shouldFetch = showPopup || !!manualPos;
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkText, setRemarkText] = useState('');

  // --- Calculate Line Geometry ---
  const isCluster = isColocated(startPos, endPos, 0.005);
  const positions = useMemo(() => {
    if (isCluster) {
      return getCurvedPath(startPos, endPos, 0.5 + curveOffset * 2);
    } else if (curveOffset !== 0) {
      return getCurvedPath(startPos, endPos, curveOffset);
    } else {
      return [startPos, endPos];
    }
  }, [startPos, endPos, isCluster, curveOffset]);

  const centerPos = useMemo(() => {
    if (positions.length === 3 && positions[1] instanceof L.LatLng) {
      return positions[1];
    }
    const lat = (startPos.lat + endPos.lat) / 2;
    const lng = (startPos.lng + endPos.lng) / 2;
    return new L.LatLng(lat, lng);
  }, [positions, startPos, endPos]);

  const activePopupPos = manualPos || (showPopup ? centerPos : null);

  // --- Dynamic Offset Calculation for Visual "Up" ---
  const popupOffset = useMemo(() => {
    const distance = 20; // Pixel distance from line
    const rad = (rotation * Math.PI) / 180;

    const x = -distance * Math.sin(rad);
    const y = -distance * Math.cos(rad);

    return L.point(x, y);
  }, [rotation]);

  const popupRef = useRef<L.Popup>(null);

  // Apply counter-rotation to popup content
  useEffect(() => {
    if (activePopupPos && popupRef.current) {
      const timer = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const popup = popupRef.current as any;
        if (!popup || !popup._container) return;

        const wrapper = popup._container.querySelector(
          '.leaflet-popup-content-wrapper',
        ) as HTMLElement;
        const tip = popup._container.querySelector('.leaflet-popup-tip-container') as HTMLElement;
        const shadow = popup._container.querySelector('.leaflet-popup-shadow') as HTMLElement;

        if (wrapper) {
          wrapper.style.transition = 'transform 0.3s ease-out';
          wrapper.style.transformOrigin = 'center bottom';

          if (rotation !== 0) {
            wrapper.style.transform = `rotate(${-rotation}deg)`;
            if (tip) tip.style.opacity = '0';
            if (shadow) shadow.style.opacity = '0';
          } else {
            wrapper.style.transform = '';
            if (tip) tip.style.opacity = '1';
            if (shadow) shadow.style.opacity = '1';
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [rotation, activePopupPos]);

  // Data Fetching & Mutations
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ors-distance', start.id, end.id],
    queryFn: () => fetchOrsDistance(start, end),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [allotedService, setAllotedService] = useState<string | undefined>(undefined);

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
      if (!isEditingRemark) {
        setRemarkText(path.remark || '');
      }
    } else if (config?.connectionId) {
      setConnectionId(config.connectionId);
    }
  }, [logicalPaths, config?.connectionId, isEditingRemark]);

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
  const handleClosePopup = () => {
    setManualPos(null);
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
    <span className='flex items-center gap-2 text-gray-500 text-xs'>
      <ButtonSpinner size='xs' /> Calc...
    </span>
  ) : isError ? (
    <span className='text-red-500 text-xs'>Failed</span>
  ) : data?.distance_km ? (
    <span className='font-bold'>{data.distance_km} km</span>
  ) : (
    'N/A'
  );

  const hasConfig =
    config &&
    (config.source ||
      (config.fiberMetrics && config.fiberMetrics.length > 0) ||
      config.cableName ||
      config.fiberInfo);

  // --- Rotated Click Handler ---
  const handlePolylineClick = (e: L.LeafletMouseEvent) => {
    L.DomEvent.stopPropagation(e);
    if (rotation === 0) {
      setManualPos(e.latlng);
      return;
    }
    const mapSize = map.getSize();
    const centerPoint = L.point(mapSize.x / 2, mapSize.y / 2);
    const clickPoint = e.containerPoint;
    const deltaX = clickPoint.x - centerPoint.x;
    const deltaY = clickPoint.y - centerPoint.y;
    const angleRad = (-rotation * Math.PI) / 180;
    const rotatedX = deltaX * Math.cos(angleRad) - deltaY * Math.sin(angleRad);
    const rotatedY = deltaX * Math.sin(angleRad) + deltaY * Math.cos(angleRad);
    const correctedPoint = L.point(centerPoint.x + rotatedX, centerPoint.y + rotatedY);
    const correctedLatLng = map.containerPointToLatLng(correctedPoint);
    setManualPos(correctedLatLng);
  };

  // ADDED: Hit box weight based on device
  const hitWeight = isMobile ? 40 : 15;

  return (
    <>
      {/* 1. VISUAL LINE (Thinner, non-interactive to let clicks pass to hitbox if needed, or handled by group) */}
      {/* Note: interactive={false} allows clicks to pass through to the HitBox if it is underneath.
          However, Leaflet layers are usually SVG/Canvas z-indexed.
          To ensure the HitBox captures the click, we render the HitBox *with* handlers
          and the Visual line purely for display.
      */}
      <Polyline
        positions={positions}
        pathOptions={{
          color,
          weight: type === 'solid' ? 4 : 2.5,
          opacity: type === 'solid' ? 1 : 0.7,
          dashArray: type === 'dashed' ? '20, 20' : undefined,
          interactive: false, // Visual line ignores clicks
        }}
      />

      {/* 2. HIT BOX LINE (Thick, Transparent, Handles Clicks) */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: 'transparent',
          weight: hitWeight, // 30px on mobile, 15px on desktop
          opacity: 0,
        }}
        eventHandlers={{ click: handlePolylineClick }}
        ref={(el) => setPolylineRef(`${type}-${start.id}-${end.id}`, el)}
      />

      {activePopupPos && (
        <Popup
          position={activePopupPos}
          ref={popupRef}
          autoClose={false}
          closeOnClick={false}
          className={theme === 'dark' ? 'dark-popup' : ''}
          minWidth={320}
          maxWidth={400}
          offset={popupOffset}
          closeButton={false}
        >
          <div className='text-sm w-full relative'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClosePopup();
              }}
              className='absolute -top-3 -right-3 p-1.5 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-full shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all z-50 cursor-pointer'
              title='Close'
              type='button'
            >
              <X size={14} />
            </button>
            <div className='font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-700 dark:text-gray-300 pr-6'>
              {config?.source}/{config?.sourcePort} - {config?.dest}/{config?.destPort}
            </div>

            {hasConfig ? (
              <div className='mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'>
                <div className='divide-y divide-gray-100 dark:divide-gray-700'>
                  <PopupFiberRow
                    connectionId={connectionId || config?.connectionId}
                    allotedService={allotedService}
                  />
                </div>
              </div>
            ) : (
              type === 'solid' && (
                <div className='mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center'>
                  Physical link not provisioned
                </div>
              )
            )}

            <PopupRemarksRow
              remark={remarkText}
              isEditing={isEditingRemark}
              editText={remarkText}
              isSaving={isSaving}
              onEditClick={handleEditClick}
              onSaveClick={handleSaveClick}
              onCancelClick={handleCancelClick}
              onTextChange={setRemarkText}
            />

            <div className='flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700 mt-2'>
              <div className='mt-1 flex justify-between items-center px-1'>
                <span className='font-medium flex items-center gap-1'>
                  <Ruler className='w-3 h-3' /> Road Distance
                </span>
                <span className='font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded'>
                  {distanceText}
                </span>
              </div>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
};
