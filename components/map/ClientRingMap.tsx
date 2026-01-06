// components/map/ClientRingMap.tsx

"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  Tooltip,
  LayersControl,
} from "react-leaflet";
import L, { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect, useMemo } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { getNodeIcon } from "@/utils/getNodeIcons";
import { MapNode, RingMapNode } from "./types/node";
import { MapLegend } from "./MapLegend";
import { formatIP } from "@/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { ButtonSpinner } from "@/components/common/ui";
import { fetchOrsDistance, fixLeafletIcons } from "@/utils/mapUtils";
import { Activity, Router, Anchor } from "lucide-react";
import { PortDisplayInfo } from "@/app/dashboard/rings/[id]/page";

export interface PathConfig {
  source?: string;
  sourcePort?: string;
  dest?: string;
  destPort?: string;
  fiberInfo?: string;
  cableName?: string;
  capacity?: number;
}

interface ConnectionLineProps {
  start: MapNode;
  end: MapNode;
  type: "solid" | "dashed";
  theme: string;
  showPopup: boolean;
  setPolylineRef: (key: string, el: L.Polyline | null) => void;
  config?: PathConfig;
}

// ... ConnectionLine component ...
const ConnectionLine = ({
  start,
  end,
  type,
  theme,
  showPopup,
  setPolylineRef,
  config,
}: ConnectionLineProps) => {
  const [isInteracted, setIsInteracted] = useState(false);
  const shouldFetch = showPopup || isInteracted;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ors-distance", start.id, end.id],
    queryFn: () => fetchOrsDistance(start, end),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const color =
    type === "solid"
      ? theme === "dark"
        ? "#3b82f6"
        : "#2563eb"
      : theme === "dark"
      ? "#ef4444"
      : "#dc2626";

  const distanceText = isLoading ? (
    <span className='flex items-center gap-2 text-gray-500 text-xs'>
      <ButtonSpinner size='xs' /> Calc...
    </span>
  ) : isError ? (
    <span className='text-red-500 text-xs'>Failed</span>
  ) : data?.distance_km ? (
    <span className='font-bold'>{data.distance_km} km</span>
  ) : (
    "N/A"
  );

  const hasConfig = config && (config.source || config.fiberInfo || config.cableName);

  return (
    <Polyline
      positions={[
        [start.lat as number, start.long as number],
        [end.lat as number, end.long as number],
      ]}
      color={color}
      weight={type === "solid" ? 3 : 2.5}
      opacity={type === "solid" ? 1 : 0.7}
      dashArray={type === "dashed" ? "6" : undefined}
      eventHandlers={{
        click: () => setIsInteracted(true),
        popupopen: () => setIsInteracted(true),
      }}
      ref={(el) => setPolylineRef(`${type}-${start.id}-${end.id}`, el)}>
      <Popup
        autoClose={false}
        closeOnClick={false}
        className={theme === "dark" ? "dark-popup" : ""}>
        <div className='text-sm min-w-[220px]'>
          <div className='font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-700 dark:text-gray-300'>
            {type === "solid" ? "Segment Details" : "Spur Connection"}
          </div>

          {config?.cableName && (
            <div className='flex items-center justify-between gap-2 mb-2'>
              <div
                className='text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 truncate'
                title={config.cableName}>
                <Router className='w-3 h-3 shrink-0' />
                <span className='truncate max-w-[150px]'>{config.cableName}</span>
              </div>
              {config.capacity && (
                <span className='shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                  {config.capacity}F
                </span>
              )}
            </div>
          )}

          {hasConfig ? (
            <div className='mb-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800'>
              {/* Show Physical Fiber Info */}
              {config.fiberInfo ? (
                <div className='mt-2 pt-2 border-t border-blue-200 dark:border-blue-700/50'>
                  <div className='text-[10px] font-bold text-green-600 dark:text-green-400 uppercase mb-1 tracking-wider flex items-center gap-1'>
                    <Activity className='w-3 h-3' /> Active Fibers
                  </div>
                  <div className='text-xs font-mono text-gray-700 dark:text-gray-300 wrap-break-words bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded border border-green-100 dark:border-green-900/30 whitespace-pre-wrap'>
                    {config.fiberInfo}
                  </div>
                </div>
              ) : (
                <div className='mt-2 pt-2 border-t border-blue-200 dark:border-blue-700/50'>
                  <div className='text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider flex items-center gap-1'>
                    <Activity className='w-3 h-3' /> Connection Status
                  </div>
                  <div className='text-xs text-gray-500 italic'>No fibers lit on this segment</div>
                </div>
              )}
            </div>
          ) : (
            type === "solid" && (
              <div className='mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center'>
                Physical link not provisioned
              </div>
            )
          )}

          <div className='flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 pt-1'>
            <div className='mt-1 flex justify-between items-center px-1'>
              <span className='font-medium'>Road Distance</span>
              <span className='font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded'>
                {distanceText}
              </span>
            </div>
          </div>
        </div>
      </Popup>
    </Polyline>
  );
};

interface ClientRingMapProps {
  nodes: MapNode[];
  solidLines?: Array<[MapNode, MapNode]>;
  dashedLines?: Array<[RingMapNode, RingMapNode]>;
  highlightedNodeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
  onBack?: () => void;
  flyToCoordinates?: [number, number] | null;
  showControls?: boolean;
  segmentConfigs?: Record<string, PathConfig>;
  // UPDATED PROP
  nodePorts?: Map<string, PortDisplayInfo[]>;
}

// ... MapController, FullscreenControl, MapFlyToController ...
const MapController = ({ isFullScreen }: { isFullScreen: boolean }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [isFullScreen, map]);
  return null;
};

const FullscreenControl = ({
  isFullScreen,
  setIsFullScreen,
}: {
  isFullScreen: boolean;
  setIsFullScreen: (fs: boolean) => void;
}) => {
  const map = useMap();
  useEffect(() => {
    const Fullscreen = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control leaflet-control-custom"
        );
        container.style.backgroundColor = "white";
        container.style.color = "black";
        container.style.width = "34px";
        container.style.height = "34px";
        container.style.borderRadius = "4px";
        container.style.cursor = "pointer";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        container.title = isFullScreen ? "Exit Full Screen" : "Enter Full Screen";
        const iconHTML = isFullScreen
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
        container.innerHTML = iconHTML;
        L.DomEvent.on(container, "click", (e) => {
          L.DomEvent.stopPropagation(e);
          setIsFullScreen(!isFullScreen);
        });
        return container;
      },
    });
    const control = new Fullscreen({ position: "topleft" });
    map.whenReady(() => {
      control.addTo(map);
    });
    return () => {
      control.remove();
    };
  }, [map, isFullScreen, setIsFullScreen]);
  return null;
};

const MapFlyToController = ({ coords }: { coords: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords as [number, number], 16);
    }
  }, [coords, map]);
  return null;
};

export default function ClientRingMap({
  nodes,
  solidLines = [],
  dashedLines = [],
  onBack,
  highlightedNodeIds = [],
  onNodeClick,
  flyToCoordinates = null,
  showControls = false,
  segmentConfigs = {},
  nodePorts,
}: ClientRingMapProps) {
  const { theme } = useThemeStore();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAllNodePopups, setShowAllNodePopups] = useState(false);
  const [showAllLinePopups, setShowAllLinePopups] = useState(false);

  function getReadableTextColor(bgColor: string): string {
    const c = bgColor.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;

    // Perceived luminance formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 150 ? "#000000" : "#ffffff";
  }

  const mapRef = useRef<L.Map>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  const polylineRefs = useRef<{ [key: string]: L.Polyline }>({});

  const setPolylineRef = (key: string, el: L.Polyline | null) => {
    if (el) {
      polylineRefs.current[key] = el;
      if (showAllLinePopups) el.openPopup();
    } else {
      delete polylineRefs.current[key];
    }
  };

  const popupOffsets = useMemo(() => {
    const groups: Record<string, string[]> = {};
    nodes.forEach((node) => {
      const key = `${node.lat},${node.long}`;
      if (!groups[key]) groups[key] = [];
      if (node.id) groups[key].push(node.id);
    });

    const offsets: Record<string, [number, number]> = {};
    Object.values(groups).forEach((nodeIds) => {
      const total = nodeIds.length;
      if (total > 1) {
        nodeIds.forEach((nodeId, index) => {
          const angle = (index / total) * (Math.PI * 2) - Math.PI / 2;
          const radius = 40;
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;
          offsets[nodeId] = [offsetX, offsetY];
        });
      }
    });
    return offsets;
  }, [nodes]);

  const nodeLabelDirections = useMemo(() => {
    const directions = new Map<string, "left" | "right">();
    if (nodes.length < 2) return directions;
    const validNodes = nodes.filter((n) => n.long != null && isFinite(n.long as number));
    if (validNodes.length === 0) return directions;
    const lngs = validNodes.map((n) => n.long as number);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    validNodes.forEach((node) => {
      if (node.id) {
        const direction = (node.long as number) < centerLng ? "left" : "right";
        directions.set(node.id, direction);
      }
    });
    return directions;
  }, [nodes]);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  useEffect(() => {
    Object.values(markerRefs.current).forEach((marker) =>
      showAllNodePopups ? marker.openPopup() : marker.closePopup()
    );
  }, [showAllNodePopups]);

  useEffect(() => {
    Object.values(polylineRefs.current).forEach((polyline) =>
      showAllLinePopups ? polyline.openPopup() : polyline.closePopup()
    );
  }, [showAllLinePopups]);

  const bounds = useMemo(() => {
    if (nodes.length === 0) return null;
    const validNodes = nodes.filter(
      (n) =>
        n.lat !== null && n.long !== null && typeof n.lat === "number" && typeof n.long === "number"
    );
    if (validNodes.length === 0) return null;
    const lats = validNodes.map((n) => n.lat as number);
    const lngs = validNodes.map((n) => n.long as number);
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [nodes]);

  if (nodes.length === 0) return <div className='py-10 text-center'>No nodes to display</div>;

  const mapContainerClass = isFullScreen
    ? "fixed inset-0 z-[100]"
    : "relative h-full w-full rounded-lg overflow-hidden";

  return (
    <div className={mapContainerClass}>
      <MapLegend />
      {showControls && (
        <div className='absolute top-4 right-4 z-1000 flex flex-col gap-2 bg-white dark:bg-gray-800 min-w-[160px] rounded-lg p-2 shadow-lg text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'>
          {onBack && (
            <button
              onClick={onBack}
              className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors'>
              ← Back
            </button>
          )}
          <button
            onClick={() => setShowAllNodePopups(!showAllNodePopups)}
            className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors'>
            <span className={showAllNodePopups ? "text-green-500" : "text-red-500"}>●</span>{" "}
            {showAllNodePopups ? "Hide" : "Show"} Node Info
          </button>
          <button
            onClick={() => setShowAllLinePopups(!showAllLinePopups)}
            className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors'>
            <span className={showAllLinePopups ? "text-green-500" : "text-red-500"}>●</span>{" "}
            {showAllLinePopups ? "Hide" : "Show"} Line Info
          </button>
        </div>
      )}

      <MapContainer
        center={bounds?.getCenter() || [22.57, 88.36]}
        bounds={bounds || undefined}
        zoom={13}
        ref={mapRef}
        style={{ height: "100%", width: "100%" }}
        className='z-0'>
        <MapController isFullScreen={isFullScreen} />
        <FullscreenControl isFullScreen={isFullScreen} setIsFullScreen={setIsFullScreen} />
        <MapFlyToController coords={flyToCoordinates} />

        <LayersControl position='bottomright'>
          <LayersControl.BaseLayer checked name='Street View'>
            <TileLayer
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name='Satellite View'>
            <TileLayer
              url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {solidLines
          .filter(
            ([start, end]) =>
              start.lat !== null && start.long !== null && end.lat !== null && end.long !== null
          )
          .map(([start, end], i) => {
            const key1 = `${start.id}-${end.id}`;
            const key2 = `${end.id}-${start.id}`;
            const config = segmentConfigs[key1] || segmentConfigs[key2];

            return (
              <ConnectionLine
                key={`solid-${start.id}-${end.id}-${i}`}
                start={start}
                end={end}
                type='solid'
                theme={theme}
                showPopup={showAllLinePopups}
                setPolylineRef={setPolylineRef}
                config={config}
              />
            );
          })}

        {dashedLines
          .filter(
            ([source, target]) =>
              source.lat !== null &&
              source.long !== null &&
              target.lat !== null &&
              target.long !== null
          )
          .map(([source, target], i) => (
            <ConnectionLine
              key={`dashed-${source.id}-${target.id}-${i}`}
              start={source}
              end={target}
              type='dashed'
              theme={theme}
              showPopup={showAllLinePopups}
              setPolylineRef={setPolylineRef}
            />
          ))}

        {nodes
          .filter((node) => node.lat !== null && node.long !== null)
          .map((node, i) => {
            const isHighlighted = highlightedNodeIds.includes(node.id!);
            const displayIp = formatIP(node.ip);
            const direction = nodeLabelDirections.get(node.id!) || "auto";
            const offset =
              direction === "left" ? ([-20, 0] as [number, number]) : ([20, 0] as [number, number]);

            // Get port info array for this node
            const portsList = nodePorts?.get(node.node_id || node.id!) || [];

            return (
              <Marker
                key={node.id! + i}
                position={[node.lat as number, node.long as number]}
                icon={getNodeIcon(node.system_type, node.type, isHighlighted)}
                eventHandlers={{ click: () => onNodeClick?.(node.id!) }}
                ref={(el) => {
                  if (el) markerRefs.current[node.id!] = el;
                }}>
                <Popup
                  autoClose={false}
                  closeOnClick={false}
                  className={theme === "dark" ? "dark-popup" : ""}
                  offset={popupOffsets[node.id!] || [0, 0]}>
                  <div className='text-sm'>
                    <h4 className='font-bold'>{node.name}</h4>
                    {node.remark && <p className='italic text-xs mt-1'>{node.remark}</p>}
                    {node.ip && <p className='font-mono text-xs mt-1'>IP: {displayIp}</p>}

                    {/* Render Ports if available */}
                    {portsList.length > 0 && (
                      <div className='mt-2 pt-1 border-t border-gray-200 dark:border-gray-600'>
                        <div className='text-xs font-semibold text-gray-500 uppercase mb-1'>
                          Active Interfaces
                        </div>
                        <div className='flex flex-wrap gap-1'>
                          {portsList.map((p, idx) => (
                            <span
                              key={idx}
                              className='text-[10px] px-1.5 py-0.5 rounded border'
                              style={{
                                backgroundColor: p.color + "15", // 10% opacity
                                borderColor: p.color + "40", // 25% opacity
                                color: p.color,
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
                  </div>
                </Popup>

                {/* ENHANCED TOOLTIP */}
                <Tooltip
                  permanent
                  direction={direction}
                  offset={offset}
                  className='bg-transparent border-none shadow-none p-0'
                  opacity={1}>
                  <div className='flex flex-col items-center'>
                    <div className='px-1.5 py-0.5 bg-white/95 dark:bg-slate-800/95 text-slate-900 dark:text-slate-50 text-[14px] font-bold rounded border border-slate-200 dark:border-slate-600 shadow-sm backdrop-blur-xs whitespace-nowrap z-10'>
                      {node.system_node_name} - {formatIP(node.ip)}
                    </div>

                    {/* Render Ports if available - With Colors */}
                    {portsList.length > 0 && (
                      <div className='mt-0.5 flex flex-row gap-px items-center'>
                        {portsList.slice(0, 3).map((p, idx) => (
                          <div
                            key={idx}
                            className='px-1 font-bold py-px text-[16px] font-mono rounded border shadow-sm flex items-center gap-1 backdrop-blur-xs whitespace-nowrap'
                            style={{
                              backgroundColor: p.color ? p.color : "#3b82f6", // Fallback blue
                              color: getReadableTextColor(p.color),
                              borderColor: "rgba(255,255,255,0.3)",
                            }}>
                            <Anchor size={8} />
                            <span>{p.port}</span>
                            {/* {p.targetNodeName && (
                                  <>
                                    <ArrowRight size={8} className="mx-0.5" />
                                    <span className="opacity-90">{p.targetNodeName}</span>
                                  </>
                                )} */}
                          </div>
                        ))}
                        {portsList.length > 3 && (
                          <div className='text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm'>
                            +{portsList.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
