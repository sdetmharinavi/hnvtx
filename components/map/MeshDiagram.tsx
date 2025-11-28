// path: components/map/MeshDiagram.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RingMapNode } from './types/node';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { Maximize, Minimize, ArrowLeft } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

interface MeshDiagramProps {
  nodes: RingMapNode[];
  connections: Array<[RingMapNode, RingMapNode]>;
  ringName?: string;
  onBack?: () => void;
}

const MeshController = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
};

export default function MeshDiagram({ nodes, connections, onBack }: MeshDiagramProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useThemeStore();

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#99ccff';
  const hubLineColor = isDark ? '#60a5fa' : '#3b82f6';
  const spurLineColor = isDark ? '#b4083f' : '#ff0066';

  const { nodePositions, bounds } = useMemo(() => {
    const hubs = nodes.filter((n) => n.is_hub);
    const spokes = nodes.filter((n) => !n.is_hub);
    const spokesByHub = new Map<string, RingMapNode[]>();
    const positions = new Map<string, L.LatLng>();

    connections.forEach(([nodeA, nodeB]) => {
      if (nodeA.is_hub && !nodeB.is_hub) {
        if (!spokesByHub.has(nodeA.id!)) spokesByHub.set(nodeA.id!, []);
        spokesByHub.get(nodeA.id!)!.push(nodeB);
      } else if (nodeB.is_hub && !nodeA.is_hub) {
        if (!spokesByHub.has(nodeB.id!)) spokesByHub.set(nodeB.id!, []);
        spokesByHub.get(nodeB.id!)!.push(nodeA);
      }
    });

    const centerX = 500;
    const centerY = 500;
    const hubRadius = 200;
    const spokeLayerRadius = 350;

    if (hubs.length === 1) {
      positions.set(hubs[0].id!, new L.LatLng(centerY, centerX));
    } else {
      hubs.forEach((hub, index) => {
        const angle = (index / hubs.length) * 2 * Math.PI - Math.PI / 2;
        const lng = centerX + hubRadius * Math.cos(angle);
        const lat = centerY - hubRadius * Math.sin(angle);
        positions.set(hub.id!, new L.LatLng(lat, lng));
      });
    }

    hubs.forEach((hub) => {
      const hubPos = positions.get(hub.id!);
      const childSpokes = spokesByHub.get(hub.id!) || [];
      if (!hubPos || childSpokes.length === 0) return;

      const angleToCenter = Math.atan2(centerY - hubPos.lat, centerX - hubPos.lng);
      const angleOutward = angleToCenter + Math.PI;
      const spread = hubs.length === 1 ? 2 * Math.PI : Math.PI / 1.5;
      const startAngle = hubs.length === 1 ? 0 : angleOutward - spread / 2;

      childSpokes.forEach((spoke, index) => {
        const angle = startAngle + ((index + 1) / (childSpokes.length + 1)) * spread;
        const lng = hubPos.lng + (spokeLayerRadius - hubRadius) * Math.cos(angle);
        const lat = hubPos.lat + (spokeLayerRadius - hubRadius) * Math.sin(angle);
        positions.set(spoke.id!, new L.LatLng(lat, lng));
      });
    });

    const unpositionedSpokes = spokes.filter((s) => !positions.has(s.id!));
    if (unpositionedSpokes.length > 0) {
      const outerRadius = 400;
      unpositionedSpokes.forEach((spoke, index) => {
        const angle = (index / unpositionedSpokes.length) * 2 * Math.PI;
        const lng = centerX + outerRadius * Math.cos(angle);
        const lat = centerY + outerRadius * Math.sin(angle);
        positions.set(spoke.id!, new L.LatLng(lat, lng));
      });
    }

    const lats = Array.from(positions.values()).map((p) => p.lat);
    const lngs = Array.from(positions.values()).map((p) => p.lng);

    const minLat = Math.min(...lats, centerY) - 50;
    const maxLat = Math.max(...lats, centerY) + 50;
    const minLng = Math.min(...lngs, centerX) - 50;
    const maxLng = Math.max(...lngs, centerX) + 50;

    const bounds: L.LatLngBoundsExpression = [
      [minLat, minLng],
      [maxLat, maxLng],
    ];

    return { nodePositions: positions, bounds };
  }, [nodes, connections]);

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
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center group"
            title="Go Back"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
          </button>
        )}

        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center"
          title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
        >
          {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>
      </div>

      <MapContainer
        bounds={bounds}
        crs={L.CRS.Simple}
        style={{ height: '100%', width: '100%', background: bgColor }}
        minZoom={-2}
        maxZoom={4}
        scrollWheelZoom={true}
        attributionControl={false}
        zoomControl={false}
        className="dark:!bg-blue-900 shadow-lg"
      >
        <MeshController bounds={bounds} />

        {/* Render Connections */}
        {connections.map(([nodeA, nodeB], index) => {
          const posA = nodePositions.get(nodeA.id!);
          const posB = nodePositions.get(nodeB.id!);
          if (!posA || !posB) return null;

          const isHubLink = nodeA.is_hub && nodeB.is_hub;

          return (
            <Polyline
              key={`${nodeA.id}-${nodeB.id}-${index}`}
              positions={[posA, posB]}
              pathOptions={{
                color: isHubLink ? hubLineColor : spurLineColor,
                weight: isHubLink ? 3 : 1.5,
                dashArray: isHubLink ? undefined : '5, 6',
                opacity: isHubLink ? 0.9 : 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          );
        })}

        {/* Render Nodes */}
        {Array.from(nodePositions.entries()).map(([nodeId, pos]) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) return null;

          return (
            <Marker
              key={nodeId}
              position={pos}
              icon={getNodeIcon(node.system_type, node.type, false)}
            >
              {/* Permanent Label Tooltip */}
              <Tooltip
                direction="bottom"
                offset={[0, 10]}
                opacity={1}
                permanent
                className="bg-transparent border-none shadow-none p-0"
              >
                <div className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-600 shadow-md dark:shadow-lg backdrop-blur-md">
                  {node.name}
                </div>
              </Tooltip>

              {/* Popup Details */}
              <Popup className="custom-popup">
                <div className="text-sm min-w-[200px] p-0 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 px-3 py-2.5 border-b border-slate-200 dark:border-slate-600">
                    <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base">
                      {node.name}
                    </h3>
                  </div>

                  <div className="space-y-2 p-3 text-slate-600 dark:text-slate-300">
                    {node.ip && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            IP:
                          </span>
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-100 break-all">
                            {node.ip?.split('/')[0]}
                          </span>
                        </div>
                      </>
                    )}

                    {node.remark && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-300">
                            {<p>Remark: {node.remark}</p>}
                          </span>
                        </div>
                      </>
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
          );
        })}
      </MapContainer>
    </div>
  );
}
