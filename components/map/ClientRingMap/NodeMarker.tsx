// components/map/ClientRingMap/NodeMarker.tsx
'use client';

import { Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { createLabelHtml } from './utils/labelUtils';
import { DisplayNode } from '@/utils/mapUtils';
import { PortDisplayInfo, RingMapNode } from './types';
import { RefObject, useEffect, useRef } from 'react';
import GenericRemarks from '@/components/common/GenericRemarks';
import { V_port_power_readingsRowSchema } from '@/schemas/zod-schemas';

interface NodeMarkerProps {
  node: DisplayNode<RingMapNode>;
  nodePos: [number, number];
  labelPos: [number, number];
  mapCenter: { lat: number; lng: number };
  theme: string;
  isHighlighted: boolean;
  portsList: PortDisplayInfo[];
  displayIp: string | null;
  markerRefs: RefObject<{ [key: string]: L.Marker }>;
  polylineRefs?: RefObject<{ [key: string]: L.Polyline }>;
  onNodeClick?: (nodeId: string) => void;
  onLabelDragEnd: (e: L.LeafletEvent, nodeId: string) => void;
  rotation: number;
  isMeasureMode: boolean;
  showPowerLevels?: boolean;
  powerData?: Record<string, V_port_power_readingsRowSchema>;
}

export const NodeMarker = ({
  node,
  nodePos,
  labelPos,
  mapCenter,
  theme,
  isHighlighted,
  portsList,
  displayIp,
  markerRefs,
  onNodeClick,
  onLabelDragEnd,
  rotation,
  isMeasureMode,
  showPowerLevels = false,
  powerData = {},
}: NodeMarkerProps) => {
  const dLat = node.displayLat - mapCenter.lat;
  const dLng = node.displayLng - mapCenter.lng;
  const mag = Math.sqrt(dLat * dLat + dLng * dLng);

  const OFFSET_DISTANCE = 0.003;
  let offsetLat = 0;
  let offsetLng = 0;

  if (mag > 0.0001) {
    offsetLat = (dLat / mag) * OFFSET_DISTANCE;
    offsetLng = (dLng / mag) * OFFSET_DISTANCE;
  } else {
    offsetLat = OFFSET_DISTANCE;
  }

  const defaultLabelPos: [number, number] = [
    node.displayLat + offsetLat,
    node.displayLng + offsetLng,
  ];
  const finalLabelPos = labelPos || defaultLabelPos;

  const labelIcon = L.divIcon({
    html: createLabelHtml(
      node.system_node_name || node.name || 'Unknown',
      displayIp,
      portsList,
      theme === 'dark',
      rotation,
      showPowerLevels,
      node.id!,
      powerData
    ),
    className: 'bg-transparent border-none',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

  const markerIcon = getNodeIcon(node.system_type, node.type, !!isHighlighted, rotation);

  const popupRef = useRef<L.Popup>(null);

  useEffect(() => {
    if (popupRef.current) {
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
  }, [rotation]);

  return (
    <div key={node.id!}>
      <Polyline
        positions={[nodePos, finalLabelPos]}
        pathOptions={{
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          weight: 1.5,
          dashArray: '4, 4',
          opacity: 0.6,
        }}
        interactive={false}
      />
      <Marker
        position={nodePos}
        icon={markerIcon}
        eventHandlers={{ click: () => onNodeClick?.(node.id!) }}
        ref={(el) => {
          if (el && node.id) markerRefs.current[node.id] = el;
        }}
        zIndexOffset={100}
        interactive={!isMeasureMode}
      >
        <Popup
          ref={popupRef}
          autoClose={false}
          closeOnClick={false}
          className={theme === 'dark' ? 'dark-popup' : ''}
          offset={[0, -25]}
        >
          <div className='text-sm min-w-[200px]'>
            <div className='bg-gray-100 dark:bg-gray-700 -mx-4 -mt-3 px-4 py-2 mb-2 border-b border-gray-200 dark:border-gray-600 rounded-t-lg'>
              <div className='text-xs font-bold text-gray-900 dark:text-gray-100'>
                {node.system_node_name}
              </div>
            </div>

            <div className='space-y-1'>
              <div className='font-medium text-gray-800 dark:text-gray-200'>{node.name}</div>
              {node.lat && node.long && (
                <div className='text-xs text-gray-500 font-mono'>
                  {node.lat.toFixed(5)}, {node.long.toFixed(5)}
                </div>
              )}
              <GenericRemarks
                className='whitespace-normal wrap-break-words'
                remark={node.remark || ''}
              />
              {node.ip && (
                <p className='font-mono text-xs mt-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded inline-block'>
                  IP: {displayIp}
                </p>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
      <Marker
        position={finalLabelPos}
        icon={labelIcon}
        draggable={!isMeasureMode}
        eventHandlers={{ dragend: (e) => onLabelDragEnd(e, node.id!) }}
        zIndexOffset={1000}
        opacity={1}
        interactive={!isMeasureMode}
      />
    </div>
  );
};