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
  polylineRefs?: React.MutableRefObject<{ [key: string]: L.Polyline }>;
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

  // Label counter-rotation
  const labelIcon = L.divIcon({
    html: createLabelHtml(
      node.system_node_name || node.name || 'Unknown',
      displayIp,
      portsList,
      theme === 'dark',
      rotation
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
    if (popupRef.current) {
      const el = popupRef.current.getElement();
      if (el) {
        // Find wrapper to rotate
        const wrapper = el.querySelector('.leaflet-popup-content-wrapper') as HTMLElement;
        const tip = el.querySelector('.leaflet-popup-tip-container') as HTMLElement;

        if (wrapper) {
          wrapper.style.transform = `rotate(${-rotation}deg)`;
          wrapper.style.transition = 'transform 0.5s';
        }

        // Hide the tip when rotated as the geometry looks broken
        if (tip) {
          tip.style.opacity = rotation !== 0 ? '0' : '1';
        }
      }
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
          <div className="text-sm">
            <div className="text-xs text-gray-900 mb-1 font-bold">{node.system_node_name}</div>
            <div className="text-sm">{node.name}</div>
            {node.lat && node.long && (
              <div className="text-sm">
                ({node.lat}, {node.long})
              </div>
            )}
            {node.remark && <p className="italic text-xs mt-1">{node.remark}</p>}
            {node.ip && <p className="font-mono text-xs mt-1">IP: {displayIp}</p>}
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
