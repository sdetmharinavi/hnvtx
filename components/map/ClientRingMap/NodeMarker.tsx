// components/map/ClientRingMap/NodeMarker.tsx
'use client';

import { Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { createLabelHtml } from './utils/labelUtils';
import { DisplayNode } from '@/utils/mapUtils';
import { PortDisplayInfo, RingMapNode } from './types';
import { useEffect, useRef } from 'react';

interface NodeMarkerProps {
  node: DisplayNode<RingMapNode>;
  nodePos: [number, number];
  labelPos: [number, number];
  mapCenter: { lat: number; lng: number };
  theme: string;
  isHighlighted: boolean;
  portsList: PortDisplayInfo[];
  displayIp: string | null;
  markerRefs: React.MutableRefObject<{ [key: string]: L.Marker }>;
  polylineRefs?: React.MutableRefObject<{ [key: string]: L.Polyline }>; // Type fix
  onNodeClick?: (nodeId: string) => void;
  onLabelDragEnd: (e: L.LeafletEvent, nodeId: string) => void;
  rotation: number;
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

  // Label counter-rotation (Passed into HTML generation)
  const labelIcon = L.divIcon({
    html: createLabelHtml(
      node.system_node_name || node.name || 'Unknown',
      displayIp,
      portsList,
      theme === 'dark',
      rotation // Pass rotation to rotate text inside the label div
    ),
    className: 'bg-transparent border-none',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

  // Icon counter-rotation (passed to util which wraps in rotated div)
  const markerIcon = getNodeIcon(node.system_type, node.type, !!isHighlighted, rotation);

  // Popup counter-rotation ref
  const popupRef = useRef<L.Popup>(null);

  useEffect(() => {
    // This effect ensures popups stay upright when the map is rotated
    if (popupRef.current) {
      // Small timeout to ensure the popup DOM is mounted by Leaflet
      const timer = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const popup = popupRef.current as any;
        if (!popup || !popup._container) return;

        const wrapper = popup._container.querySelector(
          '.leaflet-popup-content-wrapper'
        ) as HTMLElement;
        const tip = popup._container.querySelector('.leaflet-popup-tip-container') as HTMLElement;
        const shadow = popup._container.querySelector('.leaflet-popup-shadow') as HTMLElement;

        if (wrapper) {
          wrapper.style.transition = 'transform 0.3s ease-out';
          wrapper.style.transformOrigin = 'center bottom';

          if (rotation !== 0) {
            wrapper.style.transform = `rotate(${-rotation}deg)`;
            // Hide tip/shadow during rotation as they look broken
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
      >
        <Popup
          ref={popupRef}
          autoClose={false}
          closeOnClick={false}
          className={theme === 'dark' ? 'dark-popup' : ''}
          offset={[0, -25]}
        >
          <div className="text-sm min-w-[200px]">
            <div className="bg-gray-100 dark:bg-gray-700 -mx-4 -mt-3 px-4 py-2 mb-2 border-b border-gray-200 dark:border-gray-600 rounded-t-lg">
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {node.system_node_name}
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-medium text-gray-800 dark:text-gray-200">{node.name}</div>
              {node.lat && node.long && (
                <div className="text-xs text-gray-500 font-mono">
                  {node.lat.toFixed(5)}, {node.long.toFixed(5)}
                </div>
              )}
              {node.remark && (
                <p className="italic text-xs text-gray-600 dark:text-gray-400 mt-2 border-t pt-2 dark:border-gray-700">
                  {node.remark}
                </p>
              )}
              {node.ip && (
                <p className="font-mono text-xs mt-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded inline-block">
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
        draggable={true}
        eventHandlers={{ dragend: (e) => onLabelDragEnd(e, node.id!) }}
        zIndexOffset={1000}
        opacity={1}
      />
    </div>
  );
};
