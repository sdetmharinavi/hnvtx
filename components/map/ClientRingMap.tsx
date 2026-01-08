// components/map/ClientRingMap.tsx
'use client';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  LayersControl,
  ZoomControl,
} from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { MapNode, RingMapNode } from './types/node';
import { MapLegend } from './MapLegend';
import { formatIP } from '@/utils/formatters';
import { useQuery } from '@tanstack/react-query';
import { ButtonSpinner } from '@/components/common/ui';
import {
  fetchOrsDistance,
  fixLeafletIcons,
  applyJitterToNodes,
  DisplayNode,
} from '@/utils/mapUtils';
import { Ruler } from 'lucide-react';
import { PopupFiberRow } from './PopupFiberRow';

export interface PortDisplayInfo {
  port: string;
  color: string;
  targetNodeName?: string;
}

export interface FiberMetric {
  label: string;
  role: string;
  direction: string;
  distance?: number | null;
  power?: number | null;
  connectionId?: string | null;
}

export interface PathConfig {
  source?: string;
  sourcePort?: string;
  dest?: string;
  destPort?: string;
  fiberMetrics?: FiberMetric[];
  cableName?: string;
  capacity?: number;
  fiberInfo?: string;
  connectionId?: string;
}

function getReadableTextColor(bgColor: string): string {
  const c = bgColor.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#ffffff';
}

// --- HELPER: Create HTML String for DivIcon ---
const createLabelHtml = (
  name: string,
  ip: string | null,
  ports: PortDisplayInfo[],
  isDark: boolean
) => {
  const bgClass = isDark ? 'bg-slate-800/90 text-slate-50' : 'bg-white/90 text-slate-900';
  const borderClass = isDark ? 'border-slate-600' : 'border-slate-200';
  
  let portsHtml = '';
  if (ports.length > 0) {
    const visiblePorts = ports.slice(0, 6);
    const hiddenCount = ports.length - 6;
    
    const portItems = visiblePorts.map(p => {
       const textColor = getReadableTextColor(p.color);
       return `<div class="px-1 font-bold py-px text-[12px] font-mono rounded border shadow-sm flex items-center gap-1 backdrop-blur-xs whitespace-nowrap" style="background-color: ${p.color}; color: ${textColor}; border-color: rgba(255,255,255,0.3)"><span>${p.port}</span></div>`;
    }).join('');

    const moreItem = hiddenCount > 0 
      ? `<div class="text-[9px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm">+${hiddenCount}</div>` 
      : '';

    portsHtml = `<div class="mt-1 flex flex-row gap-px items-center justify-left max-w-[200px]">${portItems}${moreItem}</div>`;
  }

  // NOTE: We don't render a CSS triangle arrow here because the label is draggable.
  // Instead, we rely on the Polyline (Leader Line) rendered in the map loop to connect the label to the node.
  // The transform puts the box slightly above the anchor point.
  return `
    <div class="flex flex-col items-center cursor-grab active:cursor-grabbing transform -translate-y-1/2">
      <div class="px-2 py-1 text-[13px] font-bold rounded-md border shadow-md backdrop-blur-sm whitespace-nowrap z-10 ${bgClass} ${borderClass}">
        ${name} ${ip ? `<span class="font-mono font-normal opacity-80 text-[11px] ml-1">| ${ip}</span>` : ''}
      </div>
      ${portsHtml}
    </div>
  `;
};

// --- SUB-COMPONENT: Connection Line ---
interface ConnectionLineProps {
  start: MapNode;
  end: MapNode;
  type: 'solid' | 'dashed';
  theme: string;
  showPopup: boolean;
  setPolylineRef: (key: string, el: L.Polyline | null) => void;
  config?: PathConfig;
}

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
    queryKey: ['ors-distance', start.id, end.id],
    queryFn: () => fetchOrsDistance(start, end),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const color =
    type === 'solid'
      ? theme === 'dark'
        ? '#3b82f6'
        : '#2563eb'
      : theme === 'dark'
      ? '#ef4444'
      : '#dc2626';

  const distanceText = isLoading ? (
    <span className="flex items-center gap-2 text-gray-500 text-xs">
      <ButtonSpinner size="xs" /> Calc...
    </span>
  ) : isError ? (
    <span className="text-red-500 text-xs">Failed</span>
  ) : data?.distance_km ? (
    <span className="font-bold">{data.distance_km} km</span>
  ) : (
    'N/A'
  );

  const hasConfig =
    config &&
    (config.source ||
      (config.fiberMetrics && config.fiberMetrics.length > 0) ||
      config.cableName ||
      config.fiberInfo);

  return (
    <Polyline
      positions={[
        [start.lat as number, start.long as number],
        [end.lat as number, end.long as number],
      ]}
      color={color}
      weight={type === 'solid' ? 4 : 2.5}
      opacity={type === 'solid' ? 1 : 0.7}
      dashArray={type === 'dashed' ? '6' : undefined}
      eventHandlers={{
        click: () => setIsInteracted(true),
        popupopen: () => setIsInteracted(true),
      }}
      ref={(el) => setPolylineRef(`${type}-${start.id}-${end.id}`, el)}
    >
      <Popup
        autoClose={false}
        closeOnClick={false}
        className={theme === 'dark' ? 'dark-popup' : ''}
        minWidth={320}
        maxWidth={400}
      >
        <div className="text-sm w-full">
          <div className="font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-1 text-gray-700 dark:text-gray-300">
            {type === 'solid' ? 'Segment Details' : 'Spur Connection'}
          </div>

          {hasConfig ? (
            <div className="mb-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <PopupFiberRow config={config} />
              </div>
            </div>
          ) : (
            type === 'solid' && (
              <div className="mb-2 text-xs text-gray-400 dark:text-gray-500 italic border border-dashed border-gray-300 dark:border-gray-600 p-2 rounded text-center">
                Physical link not provisioned
              </div>
            )
          )}

          <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700 mt-2">
            <div className="mt-1 flex justify-between items-center px-1">
              <span className="font-medium flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Road Distance
              </span>
              <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
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
  nodePorts?: Map<string, PortDisplayInfo[]>;
}

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Fullscreen = (L.Control as any).extend({
      onAdd: function () {
        const container = L.DomUtil.create(
          'div',
          'leaflet-bar leaflet-control leaflet-control-custom'
        );
        container.style.backgroundColor = 'white';
        container.style.color = 'black';
        container.style.width = '34px';
        container.style.height = '34px';
        container.style.borderRadius = '4px';
        container.style.cursor = 'pointer';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.title = isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen';
        const iconHTML = isFullScreen
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
        container.innerHTML = iconHTML;
        L.DomEvent.on(container, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          setIsFullScreen(!isFullScreen);
        });
        return container;
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const control = new (Fullscreen as any)({ position: 'topleft' });
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
  
  // New state to track draggable label positions
  const [labelPositions, setLabelPositions] = useState<Record<string, [number, number]>>({});

  const mapRef = useRef<L.Map>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  const polylineRefs = useRef<{ [key: string]: L.Polyline }>({});

  const displayNodes = useMemo(() => applyJitterToNodes(nodes as RingMapNode[]), [nodes]);

  const setPolylineRef = (key: string, el: L.Polyline | null) => {
    if (el) {
      polylineRefs.current[key] = el;
      if (showAllLinePopups) el.openPopup();
    } else {
      delete polylineRefs.current[key];
    }
  };

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

  const enhancedSegmentConfigs = useMemo(() => {
    return segmentConfigs;
  }, [segmentConfigs]);

  const bounds = useMemo(() => {
    if (displayNodes.length === 0) return null;
    const lats = displayNodes.map((n) => n.displayLat);
    const lngs = displayNodes.map((n) => n.displayLng);
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [displayNodes]);

  const handleLabelDragEnd = useCallback((e: L.LeafletEvent, nodeId: string) => {
      const marker = e.target;
      const position = marker.getLatLng();
      setLabelPositions(prev => ({
          ...prev,
          [nodeId]: [position.lat, position.lng]
      }));
  }, []);

  if (displayNodes.length === 0)
    return <div className="py-10 text-center">No nodes to display</div>;

  const mapContainerClass = isFullScreen
    ? 'fixed inset-0 z-[100]'
    : 'relative h-full w-full rounded-lg overflow-hidden';

  return (
    <div className={mapContainerClass}>
      <MapLegend />
      {showControls && (
        <div className="absolute top-4 right-4 z-1000 flex flex-col gap-2 bg-white dark:bg-gray-800 min-w-[160px] rounded-lg p-2 shadow-lg text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors"
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => setShowAllNodePopups(!showAllNodePopups)}
            className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors"
          >
            <span className={showAllNodePopups ? 'text-green-500' : 'text-red-500'}>●</span>{' '}
            {showAllNodePopups ? 'Hide' : 'Show'} Node Info
          </button>
          <button
            onClick={() => setShowAllLinePopups(!showAllLinePopups)}
            className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors"
          >
            <span className={showAllLinePopups ? 'text-green-500' : 'text-red-500'}>●</span>{' '}
            {showAllLinePopups ? 'Hide' : 'Show'} Line Info
          </button>
        </div>
      )}

      <MapContainer
        center={bounds?.getCenter() || [22.57, 88.36]}
        bounds={bounds || undefined}
        zoom={13}
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapController isFullScreen={isFullScreen} />
        <FullscreenControl isFullScreen={isFullScreen} setIsFullScreen={setIsFullScreen} />
        <MapFlyToController coords={flyToCoordinates} />

        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="Street View">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Lines Rendering */}
        {solidLines
          .filter(
            ([start, end]) =>
              start.lat !== null && start.long !== null && end.lat !== null && end.long !== null
          )
          .map(([start, end], i) => {
            const key1 = `${start.id}-${end.id}`;
            const key2 = `${end.id}-${start.id}`;
            const config = enhancedSegmentConfigs
              ? enhancedSegmentConfigs[key1] || enhancedSegmentConfigs[key2]
              : undefined;

            return (
              <ConnectionLine
                key={`solid-${start.id}-${end.id}-${i}`}
                start={start}
                end={end}
                type="solid"
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
              type="dashed"
              theme={theme}
              showPopup={showAllLinePopups}
              setPolylineRef={setPolylineRef}
            />
          ))}

        {/* Node & Label Rendering */}
        {displayNodes.map((node: DisplayNode<RingMapNode>, i) => {
          const isHighlighted = highlightedNodeIds?.includes(node.id!);
          const displayIp = formatIP(node.ip);
          const portsList = nodePorts?.get(node.id!) || [];
          
          // Original Node Position
          const nodePos: [number, number] = [node.displayLat, node.displayLng];
          
          // Label Position (User drag state OR default slightly offset from node)
          const defaultLabelPos: [number, number] = [node.displayLat, node.displayLng];
          const labelPos: [number, number] = labelPositions[node.id!] || defaultLabelPos;

          // LEADER LINE: Calculate distance to see if we should draw a line
          // Small epsilon to avoid drawing lines when label is "on top" of node (default state)
          // But technically in default state, the HTML has a transform -translate-y-full, so it visually sits above.
          // If the user drags it, labelPos changes.
          // Let's ALWAYS draw the line but make it subtle. 
          // Actually, visually better: Draw line from Node Center to Label Anchor.
          
          const labelIcon = L.divIcon({
            html: createLabelHtml(
              node.system_node_name || node.name || 'Unknown', 
              displayIp, 
              portsList, 
              theme === 'dark'
            ),
            className: 'bg-transparent border-none', 
            iconSize: [0, 0], 
            iconAnchor: [0, 0] // Centered anchor simplifies line drawing logic
          });

          return (
            <div key={node.id! + i}>
              {/* Leader Line (Connects Node to Label) */}
              <Polyline
                positions={[nodePos, labelPos]}
                pathOptions={{
                   color: theme === 'dark' ? '#94a3b8' : '#64748b', // Slate 400/500
                   weight: 1,
                   dashArray: '3, 3',
                   opacity: 0.6
                }}
                interactive={false} // Don't block clicks
              />

              {/* 1. Node Marker (Static Anchor) */}
              <Marker
                position={nodePos}
                icon={getNodeIcon(node.system_type, node.type, !!isHighlighted)}
                eventHandlers={{ click: () => onNodeClick?.(node.id!) }}
                ref={(el) => {
                  if (el) markerRefs.current[node.id!] = el;
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

                    {portsList.length > 0 && (
                      <div className="mt-2 pt-1 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          Active Interfaces
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {portsList.map((p, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded border"
                              style={{
                                backgroundColor: p.color + '15',
                                borderColor: p.color + '40',
                                color: p.color,
                              }}
                              title={p.targetNodeName ? `→ ${p.targetNodeName}` : 'Endpoint'}
                            >
                              <span className="font-mono font-bold">{p.port}</span>
                              {p.targetNodeName && (
                                <span className="ml-1 opacity-70">→ {p.targetNodeName}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* 2. Draggable Label Marker (Replaces Tooltip) */}
              <Marker
                position={labelPos}
                icon={labelIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => handleLabelDragEnd(e, node.id!)
                }}
                zIndexOffset={1000} // Always on top
                opacity={1} // Visible
              />
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}