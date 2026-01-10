// components/map/MeshDiagram/MeshDiagram.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useThemeStore } from '@/stores/themeStore';
import { getConnectionColor, getMultiLineCurveOffset } from '@/utils/mapUtils';
import { MeshController } from './controllers/MeshController';
import { MeshConnectionLine } from './MeshConnectionLine';
import { MeshNodeMarker } from './MeshNodeMarker';
import { MeshControls } from './MeshControls';
import { useMeshLayout } from './utils/meshUtils';
import { MeshDiagramProps } from './types';
import { RingMapNode } from '@/components/map/ClientRingMap/types';

// Helper to group parallel lines (Same as ClientRingMap)
const groupLines = (lines: Array<[RingMapNode, RingMapNode]>) => {
  const groups = new Map<string, Array<[RingMapNode, RingMapNode]>>();
  lines.forEach((line) => {
    const [start, end] = line;
    const key = [start.id, end.id].sort().join('-');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(line);
  });
  return groups;
};

export default function MeshDiagram({
  nodes,
  connections,
  onBack,
  segmentConfigs = {},
  nodePorts,
}: MeshDiagramProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#f8fafc';

  const { nodePositions, bounds } = useMeshLayout(nodes);

  // Group connections to handle parallels
  const groupedConnections = useMemo(() => groupLines(connections), [connections]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    if (isFullScreen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  const containerClass = isFullScreen
    ? 'fixed inset-0 z-40 bg-slate-50 dark:bg-slate-900'
    : 'relative w-full h-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm';

  return (
    <div className={containerClass}>
      <MeshControls onBack={onBack} isFullScreen={isFullScreen} setIsFullScreen={setIsFullScreen} />

      <MapContainer
        bounds={bounds}
        crs={L.CRS.Simple}
        style={{ height: '100%', width: '100%', background: bgColor }}
        minZoom={-3}
        maxZoom={3}
        scrollWheelZoom={true}
        attributionControl={false}
        zoomControl={false}
        className="dark:bg-blue-950! shadow-lg"
      >
        <MeshController bounds={bounds} />
        <ZoomControl position="bottomright" />

        {Array.from(groupedConnections.values()).map((groupLines) => {
          return groupLines.map(([nodeA, nodeB], index) => {
            const posA = nodePositions.get(nodeA.id!);
            const posB = nodePositions.get(nodeB.id!);
            if (!posA || !posB) return null;

            // THE FIX: Use hub logic instead of decimal order for Spurs
            // If EITHER node is not a hub, it's a spur (dashed).
            const isSpur = !nodeA.is_hub || !nodeB.is_hub;

            // Get Config
            const sortedKey = [nodeA.id, nodeB.id].sort().join('-');
            const configs = segmentConfigs[sortedKey] || [];
            const config = configs[index] || configs[0];

            let lineColor = undefined;
            if (config?.color) {
              lineColor = config.color;
            } else if (config?.connectionId) {
              lineColor = getConnectionColor(config.connectionId);
            }

            // Calculate Curve Offset
            const curveOffset = getMultiLineCurveOffset(index, groupLines.length);

            return (
              <MeshConnectionLine
                key={`${nodeA.id}-${nodeB.id}-${index}`}
                nodesLength={nodes.length}
                startPos={posA}
                endPos={posB}
                isSpur={isSpur}
                config={config}
                theme={theme}
                startNodeName={nodeA.name || 'A'}
                endNodeName={nodeB.name || 'B'}
                customColor={lineColor}
                start={nodeA}
                end={nodeB}
                curveOffset={curveOffset} // Pass offset
              />
            );
          });
        })}

        {Array.from(nodePositions.entries()).map(([nodeId, pos]) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) return null;
          const portsList = nodePorts?.get(node.id!) || [];

          return (
            <MeshNodeMarker
              key={nodeId}
              node={node}
              position={pos}
              portsList={portsList}
              theme={theme}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
