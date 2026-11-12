// components/map/ClientRingMap/ConnectionLine.tsx
'use client';

import { Polyline, GeoJSON, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Navigation, Upload, Trash2, Map } from 'lucide-react';
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
import { useKmlData } from '@/hooks/data/useKmlData';
import { Button } from '@/components/common/ui/Button';

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
  // ADDED: Edit permissions and KML Handlers
  canEdit?: boolean;
  onUploadKml?: (segmentKey: string, file: File) => void;
  onDeleteKml?: (segmentKey: string, url: string) => void;
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
  canEdit = false,
  onUploadKml,
  onDeleteKml,
}: ConnectionLineProps) => {
  const map = useMap();
  const [manualPos, setManualPos] = useState<L.LatLng | null>(null);

  const isMobile = useIsMobile();
  const shouldFetch = showPopup || !!manualPos;
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [remarkText, setRemarkText] = useState('');

  // Fetch KML Data if url is provided
  const { geoJsonData, isLoading: isLoadingKml } = useKmlData(config?.kmlUrl);
  const segmentKey = [start.id, end.id].sort().join('-');

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
        .select('id, name, source_system_id, destination_system_id')
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
    onError: (err: Error) => toast.error(`Failed to save remark: ${err.message}`),
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

  const handleLineClick = (e: L.LeafletMouseEvent) => {
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
  };

  const showKml = config?.kmlUrl && geoJsonData && !isLoadingKml;

  return (
    <>
      {showKml ? (
        <GeoJSON
          key={`kml-${segmentKey}-${config.kmlUrl}`} // force re-render on url change
          data={geoJsonData}
          style={{
            color,
            weight: dynamicWeight + 1,
            opacity: 0.9,
          }}
          interactive={!isMeasureMode}
          eventHandlers={{
            click: handleLineClick
          }}
        />
      ) : (
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
            eventHandlers={{ click: handleLineClick }}
            ref={(el) => setPolylineRef(`${type}-${start.id}-${end.id}`, el)}
          />
        </>
      )}

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

            {/* NEW: Actual Path (KML) Section */}
            {type === 'solid' && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Map className="w-3.5 h-3.5" /> Actual Path (KML)
                  </span>
                </div>
                {config?.kmlUrl ? (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1.5 rounded border border-emerald-200 dark:border-emerald-800">
                    <span className="truncate max-w-[180px] text-xs font-medium text-emerald-700 dark:text-emerald-300" title={config.kmlName}>
                      {config.kmlName || 'Mapped Route'}
                    </span>
                    {canEdit && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDeleteKml?.(segmentKey, config.kmlUrl!); 
                        }} 
                        className="text-gray-400 hover:bg-red-100 hover:text-red-500 p-1.5 rounded transition-colors"
                        title="Remove Map Path"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ) : canEdit ? (
                  <div className="flex items-center">
                    <input 
                      type="file" 
                      id={`kml-upload-${segmentKey}`} 
                      className="hidden" 
                      accept=".kml,.kmz" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUploadKml?.(segmentKey, file);
                      }} 
                    />
                    <Button 
                      size="xs" 
                      variant="outline" 
                      className="w-full text-xs py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" 
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById(`kml-upload-${segmentKey}`)?.click();
                      }}
                    >
                      <Upload size={12} className="mr-1.5" /> Upload KML Route
                    </Button>
                  </div>
                ) : (
                  <div className="text-gray-400 italic text-xs">No physical path mapped.</div>
                )}
              </div>
            )}
          </div>
        </Popup>
      )}
    </>
  );
};