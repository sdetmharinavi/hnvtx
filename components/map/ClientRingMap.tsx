// path: components/map/ClientRingMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { MapNode, RingMapNode } from './types/node';
import { MapLegend } from './MapLegend'; // THE FIX: Import Legend
import { formatIP } from '@/utils/formatters';

interface ClientRingMapProps {
  nodes: MapNode[];
  solidLines?: Array<[MapNode, MapNode]>;
  dashedLines?: Array<[RingMapNode, RingMapNode]>;
  distances?: Record<string, string>;
  highlightedNodeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
  onBack?: () => void;
  flyToCoordinates?: [number, number] | null;
  showControls?: boolean;
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
    const Fullscreen = L.Control.extend({
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
    // Wait for the map to be ready before adding the control.
    const control = new Fullscreen({ position: 'topleft' });
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
  distances = {},
  onBack,
  highlightedNodeIds = [],
  onNodeClick,
  flyToCoordinates = null,
  showControls = false,
}: ClientRingMapProps) {
  const { theme } = useThemeStore();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAllNodePopups, setShowAllNodePopups] = useState(false);
  const [showAllLinePopups, setShowAllLinePopups] = useState(false);

  const mapRef = useRef<L.Map>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  const polylineRefs = useRef<{ [key: string]: L.Polyline }>({});

  // ... (popupOffsets and nodeLabelDirections useMemos remain unchanged) ...
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
          const radius = 40; // pixels from marker center
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;
          offsets[nodeId] = [offsetX, offsetY];
        });
      }
    });
    return offsets;
  }, [nodes]);

  const nodeLabelDirections = useMemo(() => {
    const directions = new Map<string, 'left' | 'right'>();
    if (nodes.length < 2) return directions;

    const validNodes = nodes.filter((n) => n.long != null && isFinite(n.long as number));
    if (validNodes.length === 0) return directions;

    const lngs = validNodes.map((n) => n.long as number);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    validNodes.forEach((node) => {
      if (node.id) {
        const direction = (node.long as number) < centerLng ? 'left' : 'right';
        directions.set(node.id, direction);
      }
    });

    return directions;
  }, [nodes]);

  // ... (useEffect for icons and popups remain unchanged) ...
  useEffect(() => {
    const iconPrototype = L.Icon.Default.prototype as L.Icon.Default & {
      _getIconUrl?: () => string;
    };
    delete iconPrototype._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
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
        n.lat !== null && n.long !== null && typeof n.lat === 'number' && typeof n.long === 'number'
    );
    if (validNodes.length === 0) return null;
    const lats = validNodes.map((n) => n.lat as number);
    const lngs = validNodes.map((n) => n.long as number);
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [nodes]);

  if (nodes.length === 0) return <div className="py-10 text-center">No nodes to display</div>;

  const mapUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const mapAttribution = '&copy; OpenStreetMap contributors &copy; CARTO';
  const mapContainerClass = isFullScreen
    ? 'fixed inset-0 z-[100]'
    : 'relative h-full w-full rounded-lg overflow-hidden';

  return (
    <div className={mapContainerClass}>
      {/* THE FIX: Add Legend */}
      <MapLegend />

      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-white dark:bg-gray-800 min-w-[160px] rounded-lg p-2 shadow-lg text-gray-800 dark:text-white">
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
        <TileLayer url={mapUrl} attribution={mapAttribution} />

        {/* Lines rendering logic remains the same... */}
        {solidLines
          .filter(
            ([start, end]) =>
              start.lat !== null && start.long !== null && end.lat !== null && end.long !== null
          )
          .map(([start, end], i) => (
            <Polyline
              key={`solid-${start.id}-${end.id}-${i}`}
              positions={[
                [start.lat as number, start.long as number],
                [end.lat as number, end.long as number],
              ]}
              color={theme === 'dark' ? '#3b82f6' : '#2563eb'}
              weight={3}
              opacity={1}
              ref={(el) => {
                if (el) polylineRefs.current[`solid-${start.id}-${end.id}-${i}`] = el;
              }}
            >
              <Popup
                autoClose={false}
                closeOnClick={false}
                className={theme === 'dark' ? 'dark-popup' : ''}
              >
                <div className="text-sm">
                  <p>
                    {start.name} → {end.name}
                  </p>
                  <p>Road Distance: {distances[`${start.id}-${end.id}`] ?? '...'}</p>
                </div>
              </Popup>
            </Polyline>
          ))}

        {dashedLines
          .filter(
            ([source, target]) =>
              source.lat !== null &&
              source.long !== null &&
              target.lat !== null &&
              target.long !== null
          )
          .map(([source, target], i) => (
            <Polyline
              key={`dashed-${source.id}-${target.id}`}
              positions={[
                [source.lat as number, source.long as number],
                [target.lat as number, target.long as number],
              ]}
              color={theme === 'dark' ? '#ef4444' : '#dc2626'}
              weight={2.5}
              opacity={0.7}
              dashArray="6"
              ref={(el) => {
                if (el) polylineRefs.current[`dashed-${source.id}-${target.id}-${i}`] = el;
              }}
            >
              <Popup
                autoClose={false}
                closeOnClick={false}
                className={theme === 'dark' ? 'dark-popup' : ''}
              >
                <div className="text-sm">
                  <p>
                    {source.name} ↔ {target.name}
                  </p>
                  <p>Road Distance: {distances[`${source.id}-${target.id}`] ?? '...'}</p>
                </div>
              </Popup>
            </Polyline>
          ))}

        {nodes
          .filter((node) => node.lat !== null && node.long !== null)
          .map((node, i) => {
            const isHighlighted = highlightedNodeIds.includes(node.id!);
            const displayIp = node.ip ? formatIP(node.ip) : 'N/A';
            const direction = nodeLabelDirections.get(node.id!) || 'auto';
            const offset =
              direction === 'left' ? ([-20, 0] as [number, number]) : ([20, 0] as [number, number]);

            return (
              <Marker
                key={node.id! + i}
                position={[node.lat as number, node.long as number]}
                icon={getNodeIcon(node.system_type, node.type, isHighlighted)}
                eventHandlers={{ click: () => onNodeClick?.(node.id!) }}
                ref={(el) => {
                  if (el) markerRefs.current[node.id!] = el;
                }}
              >
                <Popup
                  autoClose={false}
                  closeOnClick={false}
                  className={theme === 'dark' ? 'dark-popup' : ''}
                  offset={popupOffsets[node.id!] || [0, 0]}
                >
                  <div className="text-sm">
                    <h4 className="font-bold">{node.name}</h4>
                    {node.system_type_code && <p>Type: {node.system_type_code}</p>}
                    {node.type && <p>Node: {node.type}</p>}
                    {node.ip && <p>IP: {displayIp}</p>}
                  </div>
                </Popup>
                <Tooltip
                  permanent
                  direction={direction}
                  offset={offset}
                  className="permanent-label"
                >
                  {node.system_node_name}
                </Tooltip>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
