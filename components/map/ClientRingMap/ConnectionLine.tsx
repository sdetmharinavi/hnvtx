// components/map/ClientRingMap/ConnectionLine.tsx
'use client';

import { Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Navigation } from 'lucide-react';
import { PopupFiberRow } from '../PopupFiberRow';
import {
  fetchOrsDistance,
  isColocated,
  getCurvedPath,
  getDynamicLineWeight,
} from '@/utils/mapUtils';
import { PathConfig, RingMapNode } from './types';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { PopupRemarksRow } from '@/components/map/PopupRemarksRow';
import useIsMobile from '@/hooks/useIsMobile';

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
  isMeasureMode: boolean;
}

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
  isMeasureMode,
}: ConnectionLineProps) => {
  const map = useMap();
  const [manualPos, setManualPos] = useState<L.LatLng | null>(null);

  const isMobile = useIsMobile();
  const shouldFetch = showPopup || !!manualPos;
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkText, setRemarkText] = useState('');

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
    if (positions.length === 3 && positions[1] instanceof L.LatLng) return positions[1];
    return new L.LatLng((startPos.lat + endPos.lat) / 2, (startPos.lng + endPos.lng) / 2);
  }, [positions, startPos, endPos]);

  const activePopupPos = manualPos || (showPopup ? centerPos : null);

  const popupOffset = useMemo(() => {
    const rad = (rotation * Math.PI) / 180;
    return L.point(-20 * Math.sin(rad), -20 * Math.cos(rad));
  }, [rotation]);

  const popupRef = useRef<L.Popup>(null);

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
        if (wrapper) {
          wrapper.style.transformOrigin = 'center bottom';
          if (rotation !== 0) {
            wrapper.style.transform = `rotate(${-rotation}deg)`;
            if (tip) tip.style.opacity = '0';
          } else {
            wrapper.style.transform = '';
            if (tip) tip.style.opacity = '1';
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [rotation, activePopupPos]);

  const { data: orsDistanceData, isLoading: isLoadingOrs } = useQuery({
    queryKey: ['ors-distance', start.id, end.id],
    queryFn: () => fetchOrsDistance(start, end),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const [connectionId, setConnectionId] = useState<string | undefined>(undefined);
  const [allotedService, setAllotedService] = useState<string | undefined>(undefined);

  const { data: configuredPaths = [], refetch: refetchConfig } = useQuery({
    queryKey: ['logical_paths', 'segment', start.id, end.id],
    queryFn: async () => {
      if (!start.id || !end.id) return [];

      const { data, error } = await supabase
        .from('logical_paths')
        .select('id, name, status, source_system_id, destination_system_id')
        .in('source_system_id', [start.id, end.id])
        .in('destination_system_id', [start.id, end.id]);

      if (error) throw error;

      return data.filter(
        (p) =>
          (p.source_system_id === start.id && p.destination_system_id === end.id) ||
          (p.source_system_id === end.id && p.destination_system_id === start.id),
      );
    },
    enabled: shouldFetch && !!start.id && !!end.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: provisionedPaths = [] } = useQuery({
    queryKey: ['logical_fiber_paths', 'segment', start.id, end.id],
    queryFn: async () => {
      if (!start.id || !end.id) return [];

      const { data, error } = await supabase
        .from('logical_fiber_paths')
        .select('id, system_connection_id, remark, source_system_id, destination_system_id')
        .in('source_system_id', [start.id, end.id])
        .in('destination_system_id', [start.id, end.id]);

      if (error) throw error;

      return data.filter(
        (p) =>
          (p.source_system_id === start.id && p.destination_system_id === end.id) ||
          (p.source_system_id === end.id && p.destination_system_id === start.id),
      );
    },
    enabled: shouldFetch && !!start.id && !!end.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const configPath = configuredPaths[0];
    const provPath = provisionedPaths[0];
    setAllotedService(configPath?.name || config?.cableName);
    setConnectionId(provPath?.system_connection_id || config?.connectionId);
    if (!isEditingRemark) setRemarkText(provPath?.remark || '');
  }, [configuredPaths, provisionedPaths, config, isEditingRemark]);

  const { mutate: saveRemark, isPending: isSaving } = useMutation({
    mutationFn: async (text: string) => {
      const existingPath = provisionedPaths[0];
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
          remark: text,
          path_name: `Remark for Link: ${start.name} - ${end.name}`,
          path_role: 'working',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Remark saved successfully');
      setIsEditingRemark(false);
      refetchConfig();
      queryClient.invalidateQueries({ queryKey: ['logical_fiber_paths'] });
    },
  });

  const baseWeight = type === 'solid' ? 4 : 2.5;
  const dynamicWeight = getDynamicLineWeight(config?.bandwidthGbps, baseWeight);

  const defaultColor =
    type === 'solid'
      ? theme === 'dark'
        ? '#3b82f6'
        : '#2563eb'
      : theme === 'dark'
        ? '#ef4444'
        : '#dc2626';
  const color = customColor || defaultColor;

  return (
    <>
      <Polyline
        positions={positions}
        pathOptions={{
          color,
          weight: dynamicWeight,
          opacity: type === 'solid' ? 1 : 0.7,
          dashArray: type === 'dashed' ? '20, 20' : undefined,
          interactive: false,
        }}
      />
      <Polyline
        positions={positions}
        pathOptions={{ color: 'transparent', weight: isMobile ? 30 : 15, opacity: 0 }}
        interactive={!isMeasureMode}
        eventHandlers={{
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            if (rotation === 0) {
              setManualPos(e.latlng);
              return;
            }
            const mapSize = map.getSize();
            const centerPoint = L.point(mapSize.x / 2, mapSize.y / 2);
            const clickPoint = e.containerPoint;
            const rad = (-rotation * Math.PI) / 180;
            const rotX =
              (clickPoint.x - centerPoint.x) * Math.cos(rad) -
              (clickPoint.y - centerPoint.y) * Math.sin(rad);
            const rotY =
              (clickPoint.x - centerPoint.x) * Math.sin(rad) +
              (clickPoint.y - centerPoint.y) * Math.cos(rad);
            setManualPos(
              map.containerPointToLatLng(L.point(centerPoint.x + rotX, centerPoint.y + rotY)),
            );
          },
        }}
        ref={(el) => setPolylineRef(`${type}-${start.id}-${end.id}`, el)}
      />
      {activePopupPos && !isMeasureMode && (
        <Popup
          position={activePopupPos}
          ref={popupRef}
          autoClose={false}
          closeOnClick={false}
          className={theme === 'dark' ? 'dark-popup' : ''}
          minWidth={320}
          maxWidth={400}
          offset={popupOffset}
          closeButton={false}>
          <div className='text-sm w-full relative'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setManualPos(null);
              }}
              className='absolute -top-3 -right-3 p-1.5 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-full shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all z-50 cursor-pointer'
              type='button'>
              <X size={14} />
            </button>
            {config?.connectionId || configuredPaths.length > 0 || provisionedPaths.length > 0 ? (
              <div className='mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'>
                <div className='divide-y divide-gray-100 dark:divide-gray-700'>
                  <PopupFiberRow connectionId={connectionId} allotedService={allotedService} />
                </div>
              </div>
            ) : type === 'solid' ? (
              <div className='mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center'>
                Physical link not provisioned
              </div>
            ) : null}

            {/* Estimated Road Distance display block */}
            {shouldFetch && (
              <div className='mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg flex items-center justify-between shadow-xs'>
                <div className='flex items-center gap-2 text-blue-800 dark:text-blue-300'>
                  <Navigation className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                  <span className='font-medium text-xs uppercase tracking-wider'>Est. Road Distance</span>
                </div>
                <div className='font-mono font-bold text-sm text-blue-700 dark:text-blue-400'>
                  {isLoadingOrs ? (
                    <div className='flex items-center gap-1.5'>
                      <div className='w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
                      <span className='text-xs font-normal text-gray-400'>Calculating...</span>
                    </div>
                  ) : orsDistanceData?.distance_km ? (
                    `${orsDistanceData.distance_km} km`
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
            )}

            <PopupRemarksRow
              remark={remarkText}
              isEditing={isEditingRemark}
              editText={remarkText}
              isSaving={isSaving}
              onEditClick={(e) => {
                e.stopPropagation();
                setIsEditingRemark(true);
              }}
              onSaveClick={(e) => {
                e.stopPropagation();
                saveRemark(remarkText);
              }}
              onCancelClick={(e) => {
                e.stopPropagation();
                setIsEditingRemark(false);
                setRemarkText(provisionedPaths[0]?.remark || '');
              }}
              onTextChange={setRemarkText}
            />
          </div>
        </Popup>
      )}
    </>
  );
};
