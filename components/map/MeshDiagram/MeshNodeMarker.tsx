// components/map/MeshDiagram/MeshNodeMarker.tsx
'use client';

import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { formatIP } from '@/utils/formatters';
import { PortDisplayInfo, RingMapNode } from '@/components/map/ClientRingMap/types';
import { createLabelHtml } from '@/components/map/ClientRingMap/utils/labelUtils';
import { useMemo, useRef } from 'react';
import { V_port_power_readingsRowSchema } from '@/schemas/zod-schemas';

interface MeshNodeMarkerProps {
  node: RingMapNode;
  position: L.LatLng;
  portsList: PortDisplayInfo[];
  theme: string;
  labelPosition?: L.LatLngExpression;
  onLabelDragEnd?: (e: L.LeafletEvent, nodeId: string) => void;
  showPowerLevels?: boolean;
  powerData?: Record<string, V_port_power_readingsRowSchema>;
}

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
  showPowerLevels = false,
  powerData = {}
}: MeshNodeMarkerProps) => {
  const isDark = theme === 'dark';
  const labelMarkerRef = useRef<L.Marker>(null);

  const finalLabelPos = useMemo(() => {
    if (labelPosition) return labelPosition;

    const dx = position.lng - MESH_CENTER_X;
    const dy = position.lat - MESH_CENTER_Y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    if (magnitude < 1) {
      return new L.LatLng(position.lat + LABEL_OFFSET_DISTANCE, position.lng);
    }

    const offsetX = (dx / magnitude) * LABEL_OFFSET_DISTANCE;
    const offsetY = (dy / magnitude) * LABEL_OFFSET_DISTANCE;

    return new L.LatLng(position.lat + offsetY, position.lng + offsetX);
  }, [position, labelPosition]);

  const labelIcon = useMemo(() => {
    return L.divIcon({
      html: createLabelHtml(
        node.system_node_name || node.name || 'Unknown',
        formatIP(node.ip),
        portsList,
        isDark,
        0, 
        showPowerLevels,
        node.id!,
        powerData
      ),
      className: 'bg-transparent border-none',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, [node.system_node_name, node.name, node.ip, portsList, isDark, showPowerLevels, node.id, powerData]);

  return (
    <>
      <Polyline
        positions={[position, finalLabelPos]}
        pathOptions={{
          color: isDark ? '#94a3b8' : '#64748b',
          weight: 1,
          dashArray: '4, 4',
          opacity: 0.4,
          interactive: false, 
        }}
      />

      <Marker
        position={position}
        icon={getNodeIcon(node.system_type, node.type, false)}
        zIndexOffset={500}>
        <Popup className='custom-popup'>
          <div className='text-sm min-w-[200px] p-0 rounded-lg overflow-hidden bg-white dark:bg-slate-800'>
            <div className='bg-linear-to-r from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 px-3 py-2.5 border-b border-slate-200 dark:border-slate-600'>
              <h3 className='font-bold text-slate-900 dark:text-slate-50 text-base'>
                {node.system_node_name || node.name}
              </h3>
            </div>
            <div className='space-y-2 p-3 text-slate-600 dark:text-slate-300'>
              <div className='flex items-center justify-between'>
                <span className='font-medium text-slate-700 dark:text-slate-200'>Location:</span>
                <span className='text-xs truncate max-w-[120px]' title={node.name || ''}>
                  {node.name}
                </span>
              </div>
              {node.ip && (
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-slate-700 dark:text-slate-200'>IP:</span>
                  <span className='font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-100 break-all'>
                    {formatIP(node.ip)}
                  </span>
                </div>
              )}
              {node.system_type && (
                <div className='flex items-center justify-between'>
                  <span className='font-medium text-slate-700 dark:text-slate-200'>Type:</span>
                  <span className='text-xs'>{node.system_type}</span>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>

      <Marker
        ref={labelMarkerRef}
        position={finalLabelPos}
        icon={labelIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            requestAnimationFrame(() => {
              onLabelDragEnd?.(e, node.id!);
            });
          },
        }}
        zIndexOffset={1000}
        opacity={1}
      />
    </>
  );
};