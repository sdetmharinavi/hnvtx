// path: components/map/ClientRingMap.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L, { Control, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect, useMemo } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { MaanNode, NodeType } from "@/components/map/node";
import { getNodeIcon } from "@/utils/getNodeIcons";

// --- NEW: Custom Fullscreen Control Component (Corrected) ---
const FullscreenControl = ({ isFullScreen, setIsFullScreen }: { isFullScreen: boolean, setIsFullScreen: (fs: boolean) => void }) => {
  const map = useMap();

  useEffect(() => {
    const Fullscreen = Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.backgroundColor = 'white';
        container.style.width = '34px'; // Slightly wider for better icon fit
        container.style.height = '34px';
        container.style.borderRadius = '4px';
        container.style.cursor = 'pointer';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.title = isFullScreen ? "Exit Full Screen" : "Enter Full Screen";
        
        // Use innerHTML with SVG strings for icons
        const maximizeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
        const minimizeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`;
        
        container.innerHTML = isFullScreen ? minimizeIcon : maximizeIcon;

        // Add event listener
        L.DomEvent.on(container, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          setIsFullScreen(!isFullScreen);
        });

        return container;
      },
    });

    const fullscreenControl = new Fullscreen({ position: 'topleft' });
    fullscreenControl.addTo(map);

    return () => {
      fullscreenControl.remove();
    };
  }, [map, isFullScreen, setIsFullScreen]);

  return null;
};


interface ClientRingMapProps {
  nodes: MaanNode[];
  mainSegments: Array<[MaanNode, MaanNode]>;
  spurConnections: Array<[MaanNode, MaanNode]>;
  distances: Record<string, string>;
  onBack?: () => void;
  highlightedNodeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
}

const MapController = ({ isFullScreen }: { isFullScreen: boolean }) => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }, [isFullScreen, map]);
    return null;
};

export default function ClientRingMap({ 
  nodes, 
  mainSegments, 
  spurConnections, 
  distances, 
  onBack,
  highlightedNodeIds = [],
  onNodeClick,
}: ClientRingMapProps) {
  const { theme } = useThemeStore();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAllNodePopups, setShowAllNodePopups] = useState(false);
  const [showAllLinePopups, setShowAllLinePopups] = useState(false);
  
  const mapRef = useRef<L.Map>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  const polylineRefs = useRef<{ [key: string]: L.Polyline }>({});

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  useEffect(() => {
    Object.values(markerRefs.current).forEach(marker => showAllNodePopups ? marker.openPopup() : marker.closePopup());
  }, [showAllNodePopups]);

  useEffect(() => {
    Object.values(polylineRefs.current).forEach(polyline => showAllLinePopups ? polyline.openPopup() : polyline.closePopup());
  }, [showAllLinePopups]);

  if (nodes.length === 0) return <div className='py-10 text-center'>No nodes to display</div>;

  const bounds = useMemo(() => {
    if (nodes.length === 0) return null;
    const lats = nodes.map((n) => n.lat);
    const lngs = nodes.map((n) => n.long);
    return new LatLngBounds([Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]);
  }, [nodes]);

  const mapUrl = theme === "dark" ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const mapAttribution = "&copy; OpenStreetMap contributors &copy; CARTO";
  const mapContainerClass = isFullScreen ? "fixed inset-0 z-[100]" : "relative h-full w-full rounded-lg overflow-hidden";

  return (
    <div className={mapContainerClass}>
      <div className='absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-white dark:bg-gray-800 min-w-[160px] rounded-lg p-2 shadow-lg text-gray-800 dark:text-white'>
        {onBack && (
          <button onClick={onBack} className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors'>
            ← Back to List
          </button>
        )}
        <button onClick={() => setShowAllNodePopups(!showAllNodePopups)} className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors'>
          <span className={showAllNodePopups ? "text-green-500" : "text-red-500"}>●</span> {showAllNodePopups ? "Hide" : "Show"} Node Info
        </button>
        <button onClick={() => setShowAllLinePopups(!showAllLinePopups)} className='px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1 rounded transition-colors'>
          <span className={showAllLinePopups ? "text-green-500" : "text-red-500"}>●</span> {showAllLinePopups ? "Hide" : "Show"} Line Info
        </button>
      </div>

      <MapContainer center={[nodes[0].lat, nodes[0].long]} bounds={bounds || undefined} zoom={13} ref={mapRef} style={{ height: "100%", width: "100%" }} className='z-0'>
        <MapController isFullScreen={isFullScreen} />
        <FullscreenControl isFullScreen={isFullScreen} setIsFullScreen={setIsFullScreen} />
        <TileLayer url={mapUrl} attribution={mapAttribution} />
        
        {mainSegments.map(([start, end]) => (
          <Polyline
            key={`main-${start.id}-${end.id}`}
            positions={[[start.lat, start.long], [end.lat, end.long]]}
            color={theme === "dark" ? "#3b82f6" : "#2563eb"}
            weight={4}
            opacity={0.8}
            ref={(el) => { if (el) polylineRefs.current[`main-${start.id}-${end.id}`] = el; }}
          >
            <Popup autoClose={false} closeOnClick={false} className={theme === "dark" ? "dark-popup" : ""}>
              <div className='text-sm'>
                <p>{start.name} → {end.name}</p>
                <p>Road Distance: {distances[`${start.id}-${end.id}`] ?? "..."}</p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {spurConnections.map(([source, target]) => (
          <Polyline
            key={`spur-${source.id}-${target.id}`}
            positions={[[source.lat, source.long], [target.lat, target.long]]}
            color={theme === "dark" ? "#ef4444" : "#dc2626"}
            weight={2.5}
            opacity={0.7}
            dashArray='6'
            ref={(el) => { if (el) polylineRefs.current[`spur-${source.id}-${target.id}`] = el; }}
          >
            <Popup autoClose={false} closeOnClick={false} className={theme === "dark" ? "dark-popup" : ""}>
              <div className='text-sm'>
                <p>{source.name} ↔ {target.name}</p>
                <p>Road Distance: {distances[`${source.id}-${target.id}`] ?? "..."}</p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {nodes.map((node) => {
          const isHighlighted = highlightedNodeIds.includes(node.id);
          const displayIp = node.ip ? node.ip.split('/')[0] : 'N/A';

          return (
            <Marker
              key={node.id}
              position={[node.lat, node.long]}
              icon={getNodeIcon(node.type, isHighlighted)}
              eventHandlers={{ click: () => onNodeClick?.(node.id) }}
              ref={(el) => { if (el) markerRefs.current[node.id] = el; }}
            >
              <Popup autoClose={false} closeOnClick={false} className={theme === "dark" ? "dark-popup" : ""}>
                <div className='text-sm'>
                  <h4 className='font-bold'>{node.name}</h4>
                  <p>Type: {node.type}</p>
                  <p>IP: {displayIp}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}