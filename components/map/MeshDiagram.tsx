// path: components/map/MeshDiagram.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { MapContainer, Marker, Popup, Polyline, useMap, Tooltip, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RingMapNode } from "./types/node";
import { getNodeIcon } from "@/utils/getNodeIcons";
import { Maximize, Minimize, ArrowLeft, Router, Activity } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { PathConfig, PortDisplayInfo } from "./ClientRingMap";
import { formatIP } from "@/utils/formatters";

interface MeshDiagramProps {
  nodes: RingMapNode[];
  connections: Array<[RingMapNode, RingMapNode]>;
  ringName?: string;
  onBack?: () => void;
  segmentConfigs?: Record<string, PathConfig>;
  nodePorts?: Map<string, PortDisplayInfo[]>;
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

// Helper to generate curved path coordinates (Quadratic Bezier approximation)
const getCurvedPath = (start: L.LatLng, end: L.LatLng, offsetMultiplier: number = 0.2) => {
  const lat1 = start.lat;
  const lng1 = start.lng;
  const lat2 = end.lat;
  const lng2 = end.lng;

  // Midpoint
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  // Vector
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  // Normal Vector (Perpendicular)
  // Rotate 90 degrees: (x, y) -> (-y, x)
  const normLat = -dLng;
  const normLng = dLat;

  // Offset point
  const curveLat = midLat + normLat * offsetMultiplier;
  const curveLng = midLng + normLng * offsetMultiplier;

  // Return array of points including the control point to simulate curve
  // Leaflet Polyline draws straight lines between points, so we add the mid-curve point
  // For smoother curves, we could add more intermediate points, but 3 points (Start -> Curve -> End)
  // is usually enough for a visual arc in schematic view.
  return [start, new L.LatLng(curveLat, curveLng), end];
};

// Sub-component for rendering lines with Popups
const MeshConnectionLine = ({
  startPos,
  endPos,
  isSpur,
  config,
  theme,
  startNodeName,
  endNodeName,
  nodesLength,
}: {
  startPos: L.LatLng;
  endPos: L.LatLng;
  isSpur: boolean;
  config?: PathConfig;
  theme: string;
  startNodeName: string;
  endNodeName: string;
  nodesLength: number;
}) => {
  const isDark = theme === "dark";

  const color = isSpur ? (isDark ? "#b4083f" : "#ff0066") : isDark ? "#60a5fa" : "#3b82f6";
  const hasConfig =
    config &&
    (config.source || (config.fiberMetrics && config.fiberMetrics.length > 0) || config.cableName);

  // Apply curve only to backbone (non-spur) segments to create the ring effect
  // Offset multiplier determines the "roundness" of the ring
  const positions = (isSpur || nodesLength !==2 ) ? [startPos, endPos] : getCurvedPath(startPos, endPos, 0.15);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: color,
        weight: isSpur ? 2 : 4,
        dashArray: isSpur ? "5, 5" : undefined,
        opacity: 0.8,
        lineCap: "round",
        lineJoin: "round",
      }}>
      <Popup className={isDark ? "dark-popup" : ""} minWidth={280} maxWidth={350}>
        <div className='text-sm w-full'>
          <div className='font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-700 dark:text-gray-300'>
            {isSpur ? "Spur Connection" : "Backbone Segment"}
          </div>

          <div className='text-xs text-gray-500 mb-2'>
            {startNodeName} ↔ {endNodeName}
          </div>

          {config?.cableName && (
            <div className='flex items-center justify-between gap-2 mb-2'>
              <div
                className='text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 truncate'
                title={config.cableName}>
                <Router className='w-3 h-3 shrink-0' />
                <span className='truncate max-w-[200px]'>{config.cableName}</span>
              </div>
              {config.capacity && (
                <span className='shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                  {config.capacity}F
                </span>
              )}
            </div>
          )}

          {hasConfig ? (
            <div className='mb-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-200 dark:border-gray-700'>
              {config.fiberMetrics && config.fiberMetrics.length > 0 ? (
                <div className='mt-1'>
                  <div className='text-[10px] font-bold text-green-600 dark:text-green-400 uppercase mb-2 tracking-wider flex items-center gap-1'>
                    <Activity className='w-3 h-3' /> Active Fibers
                  </div>

                  {/* METRICS TABLE REPLICATION */}
                  <div className='overflow-x-auto'>
                    <table className='w-full text-xs text-left'>
                      <thead>
                        <tr className='border-b border-gray-200 dark:border-gray-700 text-gray-500'>
                          <th className='pb-1 font-medium pl-1'>Path / Fiber</th>
                          <th className='pb-1 font-medium w-16'>Role</th>
                          <th className='pb-1 font-medium text-right'>Dist</th>
                          <th className='pb-1 font-medium text-right pr-1'>Pwr</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-100 dark:divide-gray-700/50'>
                        {config.fiberMetrics.map((fm, idx) => (
                          <tr
                            key={idx}
                            className='group hover:bg-gray-100 dark:hover:bg-gray-700/30'>
                            <td
                              className='py-1.5 pl-1 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]'
                              title={fm.label}>
                              {fm.label}
                            </td>
                            <td className='py-1.5'>
                              <div className='flex flex-col'>
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 rounded w-fit ${
                                    fm.role === "working"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                  }`}>
                                  {fm.role === "working" ? "W" : "P"}
                                </span>
                                <span className='text-[9px] text-gray-400 font-mono mt-0.5'>
                                  {fm.direction}
                                </span>
                              </div>
                            </td>
                            <td className='py-1.5 text-right font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap'>
                              {fm.distance ? (
                                <span>{fm.distance}km</span>
                              ) : (
                                <span className='text-gray-300'>-</span>
                              )}
                            </td>
                            <td className='py-1.5 text-right pr-1 font-mono'>
                              {fm.power ? (
                                <span
                                  className={
                                    fm.power < -25
                                      ? "text-red-500 font-bold"
                                      : fm.power < -20
                                      ? "text-amber-500"
                                      : "text-green-600"
                                  }>
                                  {fm.power}
                                </span>
                              ) : (
                                <span className='text-gray-300'>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className='mt-1 pt-1'>
                  <div className='text-xs text-gray-500 italic text-center'>
                    No active fibers lit
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isSpur && (
              <div className='mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center'>
                Physical link not provisioned
              </div>
            )
          )}
        </div>
      </Popup>
    </Polyline>
  );
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
  const isDark = theme === "dark";
  const bgColor = isDark ? "#0f172a" : "#f8fafc";

  function getReadableTextColor(bgColor: string): string {
    const c = bgColor.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150 ? "#000000" : "#ffffff";
  }

  const { nodePositions, bounds } = useMemo(() => {
    const positions = new Map<string, L.LatLng>();
    const CENTER_X = 1000;
    const CENTER_Y = 1000;
    const RING_RADIUS = 400;
    const SPUR_LENGTH = 200;

    const sortedNodes = [...nodes].sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));

    const backboneNodes: RingMapNode[] = [];
    const spurNodes: RingMapNode[] = [];

    sortedNodes.forEach((node) => {
      const order = node.order_in_ring || 0;
      if (Math.abs(order - Math.round(order)) < 0.01) {
        backboneNodes.push(node);
      } else {
        spurNodes.push(node);
      }
    });

    if (backboneNodes.length === 0 && spurNodes.length === 0) {
      backboneNodes.push(...nodes);
    }

    const angleStep = (2 * Math.PI) / Math.max(1, backboneNodes.length);
    const startAngle = -Math.PI / 2;

    backboneNodes.forEach((node, index) => {
      const angle = startAngle + index * angleStep;
      const lat = CENTER_Y + RING_RADIUS * Math.sin(angle);
      const lng = CENTER_X + RING_RADIUS * Math.cos(angle);
      positions.set(node.id!, new L.LatLng(lat, lng));
    });

    const spursByParent = new Map<number, RingMapNode[]>();
    spurNodes.forEach((node) => {
      const parentOrder = Math.floor(node.order_in_ring || 0);
      if (!spursByParent.has(parentOrder)) spursByParent.set(parentOrder, []);
      spursByParent.get(parentOrder)!.push(node);
    });

    spursByParent.forEach((children, parentOrder) => {
      const parentNode = backboneNodes.find(
        (n) => Math.round(n.order_in_ring || 0) === parentOrder
      );
      if (!parentNode) return;
      const parentPos = positions.get(parentNode.id!);
      if (!parentPos) return;

      const vecX = parentPos.lng - CENTER_X;
      const vecY = parentPos.lat - CENTER_Y;
      const mag = Math.sqrt(vecX * vecX + vecY * vecY);
      const dirX = mag === 0 ? 1 : vecX / mag;
      const dirY = mag === 0 ? 0 : vecY / mag;
      const fanAngle = Math.PI / 4;
      const totalSpurs = children.length;

      children.forEach((child, idx) => {
        let rotation = 0;
        if (totalSpurs > 1) {
          const step = fanAngle / (totalSpurs - 1);
          rotation = -fanAngle / 2 + idx * step;
        }
        const rotatedX = dirX * Math.cos(rotation) - dirY * Math.sin(rotation);
        const rotatedY = dirX * Math.sin(rotation) + dirY * Math.cos(rotation);
        const childLng = parentPos.lng + rotatedX * SPUR_LENGTH;
        const childLat = parentPos.lat + rotatedY * SPUR_LENGTH;
        positions.set(child.id!, new L.LatLng(childLat, childLng));
      });
    });

    const lats = Array.from(positions.values()).map((p) => p.lat);
    const lngs = Array.from(positions.values()).map((p) => p.lng);
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
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    if (isFullScreen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);

  const containerClass = isFullScreen
    ? "fixed inset-0 z-40 bg-slate-50 dark:bg-slate-900"
    : "relative w-full h-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm";

  return (
    <div className={containerClass}>
      <div className='absolute top-4 right-4 z-50 flex flex-col gap-2'>
        {onBack && (
          <button
            onClick={onBack}
            className='p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center group'
            title='Go Back'
            aria-label='Go back'>
            <ArrowLeft className='h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200' />
          </button>
        )}

        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className='p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center'
          title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}>
          {isFullScreen ? <Minimize className='h-5 w-5' /> : <Maximize className='h-5 w-5' />}
        </button>
      </div>

      <MapContainer
        bounds={bounds}
        crs={L.CRS.Simple}
        style={{ height: "100%", width: "100%", background: bgColor }}
        minZoom={-3}
        maxZoom={3}
        scrollWheelZoom={true}
        attributionControl={false}
        zoomControl={false}
        className='dark:bg-blue-950! shadow-lg'>
        <MeshController bounds={bounds} />
        <ZoomControl position='bottomright' />

        {connections.map(([nodeA, nodeB], index) => {
          const posA = nodePositions.get(nodeA.id!);
          const posB = nodePositions.get(nodeB.id!);
          if (!posA || !posB) return null;

          const orderA = nodeA.order_in_ring || 0;
          const orderB = nodeB.order_in_ring || 0;
          const isSpur = orderA % 1 !== 0 || orderB % 1 !== 0;
          const key1 = `${nodeA.id}-${nodeB.id}`;
          const key2 = `${nodeB.id}-${nodeA.id}`;
          const config = segmentConfigs[key1] || segmentConfigs[key2];

          return (
            <MeshConnectionLine
              key={`${nodeA.id}-${nodeB.id}-${index}`}
              nodesLength = {nodes.length}
              startPos={posA}
              endPos={posB}
              isSpur={isSpur}
              config={config}
              theme={theme}
              startNodeName={nodeA.name || "A"}
              endNodeName={nodeB.name || "B"}
            />
          );
        })}

        {Array.from(nodePositions.entries()).map(([nodeId, pos]) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) return null;
          const portsList = nodePorts?.get(node.id!) || [];

          return (
            <Marker
              key={nodeId}
              position={pos}
              icon={getNodeIcon(node.system_type, node.type, false)}>
              <Tooltip
                direction='bottom'
                offset={[0, 10]}
                opacity={1}
                permanent
                className='bg-transparent border-none shadow-none p-0'>
                <div className='flex flex-col items-center'>
                  <div className='px-1 py-0.5 bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-50 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-600 shadow-sm backdrop-blur-xs whitespace-nowrap'>
                    {node.name}
                  </div>
                  {portsList.length > 0 && (
                    <div className='mt-0.5 flex flex-row gap-px items-center'>
                      {portsList.slice(0, 6).map((p, idx) => (
                        <div
                          key={idx}
                          className='px-1 font-bold py-px text-[14px] font-mono rounded border shadow-sm flex items-center gap-1 backdrop-blur-xs whitespace-nowrap'
                          style={{
                            backgroundColor: p.color ? p.color : "#3b82f6",
                            color: getReadableTextColor(p.color),
                            borderColor: "rgba(255,255,255,0.3)",
                          }}>
                          <span>{p.port}</span>
                        </div>
                      ))}
                      {portsList.length > 6 && (
                        <div className='text-[9px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm'>
                          +{portsList.length - 6} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Tooltip>

              <Popup className='custom-popup'>
                <div className='text-sm min-w-[200px] p-0 rounded-lg overflow-hidden bg-white dark:bg-slate-800'>
                  <div className='bg-linear-to-r from-blue-50 to-blue-100 dark:from-slate-700 dark:to-slate-600 px-3 py-2.5 border-b border-slate-200 dark:border-slate-600'>
                    <h3 className='font-bold text-slate-900 dark:text-slate-50 text-base'>
                      {node.name}
                    </h3>
                  </div>

                  <div className='space-y-2 p-3 text-slate-600 dark:text-slate-300'>
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
                        <span className='font-medium text-slate-700 dark:text-slate-200'>
                          Type:
                        </span>
                        <span className='text-xs'>{node.system_type}</span>
                      </div>
                    )}

                    {portsList.length > 0 && (
                      <div className='mt-2 pt-1 border-t border-gray-200 dark:border-gray-600'>
                        <div className='text-xs font-semibold text-gray-500 uppercase mb-1'>
                          Active Interfaces
                        </div>
                        <div className='flex flex-wrap gap-1'>
                          {portsList.map((p, idx) => (
                            <span
                              key={idx}
                              className='text-[16px] px-1.5 py-0.5 rounded border'
                              style={{
                                backgroundColor: p.color + "15",
                                borderColor: p.color + "40",
                                color: getReadableTextColor(p.color),
                              }}
                              title={p.targetNodeName ? `→ ${p.targetNodeName}` : "Endpoint"}>
                              <span className='font-mono font-bold'>{p.port}</span>
                              {p.targetNodeName && (
                                <span className='ml-1 opacity-70'>→ {p.targetNodeName}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {node.is_hub && (
                      <div className='pt-2 mt-2 border-t border-slate-200 dark:border-slate-600'>
                        <span className='inline-block px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-100 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-md'>
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
