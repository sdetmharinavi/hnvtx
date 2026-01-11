// components/map/MeshDiagram/MeshNodeMarker.tsx
'use client';

import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { formatIP } from '@/utils/formatters';
import { PortDisplayInfo, RingMapNode } from '@/components/map/ClientRingMap/types';
import { createLabelHtml } from '@/components/map/ClientRingMap/utils/labelUtils';
import { useMemo, useRef } from 'react';

interface MeshNodeMarkerProps {
  node: RingMapNode;
  position: L.LatLng;
  portsList: PortDisplayInfo[];
  theme: string;
  labelPosition?: L.LatLngExpression;
  onLabelDragEnd?: (e: L.LeafletEvent, nodeId: string) => void;
}

// Center of the mesh layout (matches utils/meshUtils.ts)
const MESH_CENTER_X = 1000;
const MESH_CENTER_Y = 1000;
const LABEL_OFFSET_DISTANCE = 80;

export const MeshNodeMarker = ({
  node,
  position,
  portsList,
  theme,
  labelPosition,
  onLabelDragEnd,
}: MeshNodeMarkerProps) => {
  const isDark = theme === 'dark';
  const labelMarkerRef = useRef<L.Marker>(null);

  // 1. Calculate Smart Initial Label Position (Radial Push)
  // This pushes the label OUTWARD from the center, so it doesn't overlap the lines converging on the node.
  const finalLabelPos = useMemo(() => {
    if (labelPosition) return labelPosition;

    // Calculate vector from Mesh Center to Node
    const dx = position.lng - MESH_CENTER_X;
    const dy = position.lat - MESH_CENTER_Y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    // If node is exactly at center (rare), push down
    if (magnitude < 1) {
      return new L.LatLng(position.lat + LABEL_OFFSET_DISTANCE, position.lng);
    }

    // Normalize and scale vector to push OUTWARD
    const offsetX = (dx / magnitude) * LABEL_OFFSET_DISTANCE;
    const offsetY = (dy / magnitude) * LABEL_OFFSET_DISTANCE;

    return new L.LatLng(position.lat + offsetY, position.lng + offsetX);
  }, [position, labelPosition]);

  // 2. Create Custom DivIcon for the Label
  // Using a small iconSize ensures the drag handle is centered but the HTML content can overflow visibly
  const labelIcon = useMemo(() => {
    return L.divIcon({
      html: createLabelHtml(
        node.name || 'Unknown',
        formatIP(node.ip),
        portsList,
        isDark,
        0 // No rotation
      ),
      className: 'bg-transparent border-none',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, [node.name, node.ip, portsList, isDark]);

  return (
    <>
      {/* Dashed Connector Line: Node Icon -> Label */}
      <Polyline
        positions={[position, finalLabelPos]}
        pathOptions={{
          color: isDark ? '#94a3b8' : '#64748b',
          weight: 1,
          dashArray: '4, 4',
          opacity: 0.4,
          interactive: false, // Line should not block clicks
        }}
      />

      {/* Node Icon Marker (Static, Lower Z-Index) */}
      <Marker
        position={position}
        icon={getNodeIcon(node.system_type, node.type, false)}
        zIndexOffset={500}
      >
        <Popup className="custom-popup">
          <div className="text-sm min-w-[200px] p-0 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
            <div className="bg-linear-to-r from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 px-3 py-2.5 border-b border-slate-200 dark:border-slate-600">
              <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base">{node.name}</h3>
            </div>
            <div className="space-y-2 p-3 text-slate-600 dark:text-slate-300">
              {node.ip && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">IP:</span>
                  <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-100 break-all">
                    {formatIP(node.ip)}
                  </span>
                </div>
              )}
              {node.system_type && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Type:</span>
                  <span className="text-xs">{node.system_type}</span>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Label Marker (Draggable, Higher Z-Index) */}
      <Marker
        ref={labelMarkerRef}
        position={finalLabelPos}
        icon={labelIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            // Defer update to prevent potential render thrashing
            requestAnimationFrame(() => {
              onLabelDragEnd?.(e, node.id!);
            });
          },
        }}
        zIndexOffset={1000} // Ensure labels are always on top
        opacity={1}
      />
    </>
  );
};
