'use client';

import { Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { createLabelHtml } from './utils/labelUtils';
import { DisplayNode } from '@/utils/mapUtils';
import { PortDisplayInfo, RingMapNode } from './types';

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
      theme === 'dark'
    ),
    className: 'bg-transparent border-none',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

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
        icon={getNodeIcon(node.system_type, node.type, !!isHighlighted)}
        eventHandlers={{ click: () => onNodeClick?.(node.id!) }}
        ref={(el) => {
          if (el && node.id) markerRefs.current[node.id] = el;
        }}
        zIndexOffset={100}
      >
        <Popup
          autoClose={false}
          closeOnClick={false}
          className={theme === 'dark' ? 'dark-popup' : ''}
          offset={[0, -20]}
        >
          <div className="text-sm">
            <h4 className="font-bold">{node.name}</h4>
            <div className="text-xs text-gray-500 mb-1">{node.system_node_name}</div>
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
