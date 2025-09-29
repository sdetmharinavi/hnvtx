// path: components/map/ClientRingMap.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L, { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect, useMemo, memo } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { FiMaximize, FiMinimize } from "react-icons/fi";
import { Row } from "@/hooks/database";
import { getNodeIcon } from "@/utils/getNodeIcons";

// Define a standardized interface for any node to be displayed on the map
export interface MapNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type?: string | null;
  status?: boolean | null;
  ip?: string | null;
  remark?: string | null;
}

// --- COMPONENT PROPS ---
interface ClientRingMapProps {
  nodes: MapNode[];
  pathSegments?: Row<'v_system_ring_paths_detailed'>[];
  highlightedNodeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
}

// A new component to handle map invalidation logic
const MapController = ({ isFullScreen }: { isFullScreen: boolean }) => {
    const map = useMap();
    useEffect(() => {
        // Invalidate map size after a short delay when fullscreen state changes
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100); // 100ms delay to allow container to resize
        return () => clearTimeout(timer);
    }, [isFullScreen, map]);
    return null;
};

export default function ClientRingMap({ nodes, pathSegments = [], highlightedNodeIds = [], onNodeClick }: ClientRingMapProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useThemeStore();

  const bounds = useMemo(() => {
      const validNodes = nodes.filter(n => n.lat != null && n.lng != null);
      if (validNodes.length === 0) return null;
      const lats = validNodes.map(n => n.lat);
      const lngs = validNodes.map(n => n.lng);
      return new LatLngBounds([Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]);
  }, [nodes]);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  if (nodes.length === 0) {
    return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Not enough node data to display the map.</div>;
  }


  const mapUrl = theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const mapAttribution = theme === 'dark' ? '&copy; OpenStreetMap contributors &copy; CARTO' : '&copy; OpenStreetMap contributors';

  const mapContainerClass = isFullScreen ? "fixed inset-0 z-[100] bg-white dark:bg-gray-900" : "relative h-full w-full";

  return (
    <div className={mapContainerClass}>
      <MapContainer
        key={isFullScreen ? 'full' : 'normal'} // Re-initializing map on mode change can help
        center={bounds ? bounds.getCenter() : [22.5726, 88.3639]}
        bounds={bounds || undefined}
        zoom={bounds ? undefined : 13}
        style={{ height: "100%", width: "100%" }}
        className="bg-gray-200 dark:bg-gray-800"
      >
        <MapController isFullScreen={isFullScreen} />
        <TileLayer url={mapUrl} attribution={mapAttribution} />

        {pathSegments.map((segment) => {
          const startNode = nodeMap.get(segment.start_node_id!);
          const endNode = nodeMap.get(segment.end_node_id!);
          if (!startNode || !endNode) return null;
          return (
            <Polyline
              key={segment.id}
              positions={[[startNode.lat, startNode.lng], [endNode.lat, endNode.lng]]}
              color="#FF0000"
              weight={5}
            />
          );
        })}

        {nodes.map((node) => {
          const isHighlighted = highlightedNodeIds.includes(node.id);
          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={getNodeIcon(node.type, isHighlighted)}
              eventHandlers={{ click: () => onNodeClick?.(node.id) }}
            >
              <Popup>
                <div className="text-sm font-sans">
                  <h4 className="font-bold text-base mb-1">{node.name}</h4>
                  <p><strong className="font-semibold">Type:</strong> {node.type || 'N/A'}</p>
                  <p><strong className="font-semibold">Status:</strong> {node.status ? 'Active' : 'Inactive'}</p>
                  {node.ip && <p><strong className="font-semibold">IP:</strong> {node.ip || 'N/A'}</p>}
                  {node.remark && <p><strong className="font-semibold">Remark:</strong> {node.remark}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <button
        onClick={() => setIsFullScreen(!isFullScreen)}
        className="absolute top-4 right-4 z-[1000] p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
      >
        {isFullScreen ? <FiMinimize className="h-5 w-5" /> : <FiMaximize className="h-5 w-5" />}
      </button>
    </div>
  );
}