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
  onLabelDragEnd: (e: L.LeafletEvent, nodeId: string) => void;
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
  const markerRef = useRef<L.Marker>(null);

  // 1. Calculate Smart Initial Label Position (Radial Push)
  const finalLabelPos = useMemo(() => {
    if (labelPosition) return labelPosition;

    // Calculate vector from Mesh Center to Node
    const dx = position.lng - MESH_CENTER_X;
    const dy = position.lat - MESH_CENTER_Y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    // If node is exactly at center, push down (rare edge case)
    if (magnitude < 1) {
      return new L.LatLng(position.lat + LABEL_OFFSET_DISTANCE, position.lng);
    }

    // Normalize and scale vector to push OUTWARD
    const offsetX = (dx / magnitude) * LABEL_OFFSET_DISTANCE;
    const offsetY = (dy / magnitude) * LABEL_OFFSET_DISTANCE;

    return new L.LatLng(position.lat + offsetY, position.lng + offsetX);
  }, [position, labelPosition]);

  // 2. Create Custom DivIcon for the Label
  // FIX: Provide a small non-zero size to ensure hit-testing works for drag
  // The CSS in createLabelHtml centers the content regardless of this size via absolute positioning
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
      iconSize: [20, 20], // Small hit box center
      iconAnchor: [10, 10], // Centered
    });
  }, [node.name, node.ip, portsList, isDark]);

  return (
    <>
      {/* Dashed Line connecting Node to Label */}
      <Polyline
        positions={[position, finalLabelPos]}
        pathOptions={{
          color: isDark ? '#94a3b8' : '#64748b',
          weight: 1,
          dashArray: '4, 4',
          opacity: 0.5,
          interactive: false, // Ensure line doesn't block clicks
        }}
      />

      {/* Node Icon Marker (Static position) */}
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
              {node.is_hub && (
                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="inline-block px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-md">
                    🔗 HUB NODE
                  </span>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Label Marker (Draggable) */}
      <Marker
        ref={markerRef}
        position={finalLabelPos}
        icon={labelIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            // Use requestAnimationFrame to defer the state update slightly
            // This can help prevent layout trashing if multiple events fire
            requestAnimationFrame(() => {
              onLabelDragEnd(e, node.id!);
            });
          },
        }}
        zIndexOffset={1000}
        opacity={1}
      />
    </>
  );
};
