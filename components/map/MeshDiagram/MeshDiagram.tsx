// components/map/MeshDiagram/MeshDiagram.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useThemeStore } from '@/stores/themeStore';
import { getConnectionColor } from '@/utils/mapUtils';
import { MeshController } from './controllers/MeshController';
import { MeshConnectionLine } from './MeshConnectionLine';
import { MeshNodeMarker } from './MeshNodeMarker';
import { MeshControls } from './MeshControls';
import { useMeshLayout } from './utils/meshUtils';
import { MeshDiagramProps } from './types';

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

        {connections.map(([nodeA, nodeB], index) => {
          const posA = nodePositions.get(nodeA.id!);
          const posB = nodePositions.get(nodeB.id!);
          if (!posA || !posB) return null;

          const orderA = nodeA.order_in_ring || 0;
          const orderB = nodeB.order_in_ring || 0;
          const isSpur = orderA % 1 !== 0 || orderB % 1 !== 0;
          const key1 = `${nodeA.id}-${nodeB.id}`;
          const config = segmentConfigs[key1];

          let lineColor = undefined;
          if (config?.connectionId) {
            lineColor = getConnectionColor(config.connectionId);
          }

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
            />
          );
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
