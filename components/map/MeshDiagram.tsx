// path: components/map/MeshDiagram.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, Polyline, useMap, Tooltip, ZoomControl } from 'react-leaflet';
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
      map.fitBounds(bounds, { padding: [100, 100], animate: true });
    }
  }, [map, bounds]);

  return null;
};

export default function MeshDiagram({ nodes, connections, onBack }: MeshDiagramProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useThemeStore();

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const hubLineColor = isDark ? '#60a5fa' : '#3b82f6';
  const spurLineColor = isDark ? '#b4083f' : '#ff0066';

  const { nodePositions, bounds } = useMemo(() => {
    const positions = new Map<string, L.LatLng>();
    
    // Configuration
    const CENTER_X = 1000;
    const CENTER_Y = 1000;
    const RING_RADIUS = 400;
    const SPUR_LENGTH = 200;

    // 1. Sort nodes by order
    const sortedNodes = [...nodes].sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));

    // 2. Separate Backbone (Integer Orders) from Spurs (Decimal Orders)
    const backboneNodes: RingMapNode[] = [];
    const spurNodes: RingMapNode[] = [];

    sortedNodes.forEach(node => {
        const order = node.order_in_ring || 0;
        // Check if it's effectively an integer (e.g., 1.0, 2.0)
        if (Math.abs(order - Math.round(order)) < 0.01) {
            backboneNodes.push(node);
        } else {
            spurNodes.push(node);
        }
    });

    // If no backbone detected (all nulls), treat everyone as backbone
    if (backboneNodes.length === 0 && spurNodes.length === 0) {
        backboneNodes.push(...nodes);
    }

    // 3. Position Backbone Nodes in a Circle
    const angleStep = (2 * Math.PI) / Math.max(1, backboneNodes.length);
    // Start from -90deg (Top)
    const startAngle = -Math.PI / 2;

    backboneNodes.forEach((node, index) => {
        const angle = startAngle + (index * angleStep);
        const lat = CENTER_Y + RING_RADIUS * Math.sin(angle); // Y corresponds to Lat
        const lng = CENTER_X + RING_RADIUS * Math.cos(angle); // X corresponds to Lng
        positions.set(node.id!, new L.LatLng(lat, lng));
    });

    // 4. Position Spur Nodes (Radiating from parent)
    // Group spurs by their parent integer order
    const spursByParent = new Map<number, RingMapNode[]>();
    spurNodes.forEach(node => {
        const parentOrder = Math.floor(node.order_in_ring || 0);
        if (!spursByParent.has(parentOrder)) spursByParent.set(parentOrder, []);
        spursByParent.get(parentOrder)!.push(node);
    });

    spursByParent.forEach((children, parentOrder) => {
        // Find parent position
        const parentNode = backboneNodes.find(n => Math.round(n.order_in_ring || 0) === parentOrder);
        if (!parentNode) {
            return;
        }

        const parentPos = positions.get(parentNode.id!);
        if (!parentPos) return;

        // Calculate vector from center to parent
        const vecX = parentPos.lng - CENTER_X;
        const vecY = parentPos.lat - CENTER_Y;
        const mag = Math.sqrt(vecX * vecX + vecY * vecY);
        
        // Normalized direction vector
        const dirX = mag === 0 ? 1 : vecX / mag;
        const dirY = mag === 0 ? 0 : vecY / mag;

        // Fan out logic if multiple spurs on one node
        const fanAngle = Math.PI / 4; // 45 degrees spread
        const totalSpurs = children.length;
        
        children.forEach((child, idx) => {
            // If multiple spurs, rotate the vector slightly
            let rotation = 0;
            if (totalSpurs > 1) {
                // Center the fan around the main direction
                const step = fanAngle / (totalSpurs - 1);
                rotation = -fanAngle/2 + idx * step;
            }

            // Rotate direction vector
            const rotatedX = dirX * Math.cos(rotation) - dirY * Math.sin(rotation);
            const rotatedY = dirX * Math.sin(rotation) + dirY * Math.cos(rotation);

            const childLng = parentPos.lng + rotatedX * SPUR_LENGTH;
            const childLat = parentPos.lat + rotatedY * SPUR_LENGTH;

            positions.set(child.id!, new L.LatLng(childLat, childLng));
        });
    });
    
    // 5. Calculate Bounds
    const lats = Array.from(positions.values()).map((p) => p.lat);
    const lngs = Array.from(positions.values()).map((p) => p.lng);

    // Add padding to bounds
    const minLat = Math.min(...lats) - 100;
    const maxLat = Math.max(...lats) + 100;
    const minLng = Math.min(...lngs) - 100;
    const maxLng = Math.max(...lngs) + 100;

    const bounds: L.LatLngBoundsExpression = [
      [minLat, minLng],
      [maxLat, maxLng],
    ];

    return { nodePositions: positions, bounds };
  }, [nodes]);

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
        minZoom={-3}
        maxZoom={3}
        scrollWheelZoom={true}
        attributionControl={false}
        zoomControl={false} // We add it manually below
        className="dark:bg-blue-950! shadow-lg"
      >
        <MeshController bounds={bounds} />
        
        {/* ADDED: Standard Zoom Controls in top-left */}
        <ZoomControl position="bottomright" />

        {/* Render Connections */}
        {connections.map(([nodeA, nodeB], index) => {
          const posA = nodePositions.get(nodeA.id!);
          const posB = nodePositions.get(nodeB.id!);
          if (!posA || !posB) return null;

          const orderA = nodeA.order_in_ring || 0;
          const orderB = nodeB.order_in_ring || 0;
          const isSpur = (orderA % 1 !== 0) || (orderB % 1 !== 0);

          return (
            <Polyline
              key={`${nodeA.id}-${nodeB.id}-${index}`}
              positions={[posA, posB]}
              pathOptions={{
                color: isSpur ? spurLineColor : hubLineColor,
                weight: isSpur ? 2 : 4,
                dashArray: isSpur ? '5, 5' : undefined,
                opacity: 0.8,
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
              <Tooltip
                direction="bottom"
                offset={[0, 10]}
                opacity={1}
                permanent
                className="bg-transparent border-none shadow-none p-0"
              >
                <div className="flex flex-col items-center">
                    <div className="px-1 py-0.5 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-600 shadow-sm backdrop-blur-xs whitespace-nowrap">
                    {node.name}
                    </div>
                </div>
              </Tooltip>

              <Popup className="custom-popup">
                <div className="text-sm min-w-[200px] p-0 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                  <div className="bg-linear-to-r from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 px-3 py-2.5 border-b border-slate-200 dark:border-slate-600">
                    <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base">
                      {node.name}
                    </h3>
                  </div>

                  <div className="space-y-2 p-3 text-slate-600 dark:text-slate-300">
                    {node.ip && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          IP:
                        </span>
                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-800 dark:text-slate-100 break-all">
                          {node.ip?.split('/')[0]}
                        </span>
                      </div>
                    )}
                    
                    {node.system_type && (
                         <div className="flex items-center justify-between">
                         <span className="font-medium text-slate-700 dark:text-slate-200">
                           Type:
                         </span>
                         <span className="text-xs">
                           {node.system_type}
                         </span>
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
          );
        })}
      </MapContainer>
    </div>
  );
}