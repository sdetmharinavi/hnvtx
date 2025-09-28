"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useRef, useEffect, useMemo } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { V_ring_nodesRowSchema } from "@/schemas/zod-schemas";
import { FiMaximize, FiMinimize } from "react-icons/fi";
import { Maximize, Minimize } from "lucide-react";

const MaanIcon = L.icon({ iconUrl: "/images/switch_image.png", iconSize: [40, 40], iconAnchor: [20, 20] });
const BTSIcon = L.icon({ iconUrl: "/images/bts_image.png", iconSize: [40, 40], iconAnchor: [20, 20] });
const DefaultIcon = L.icon({ iconUrl: "/images/marker-icon.png", shadowUrl: "/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

const getNodeIcon = (nodeType: string | null) => {
  switch (nodeType) {
    case 'MAAN':
    case 'CPAN':
    case 'EXCHANGE':
      return MaanIcon;
    case 'BTS':
      return BTSIcon;
    default:
      return DefaultIcon;
  }
};

export default function ClientRingMap({ nodes, ringName }: { nodes: V_ring_nodesRowSchema[]; ringName: string }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapRef = useRef<L.Map>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      const timer = setTimeout(() => map.invalidateSize(), 100);
      return () => clearTimeout(timer);
    }
  }, [isFullScreen]);

  const mainNodes = useMemo(() => 
    nodes
      .filter(node => node.ring_status)
      .sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0)),
    [nodes]
  );

  const spurConnections = useMemo(() => {
    const connections: Array<[V_ring_nodesRowSchema, V_ring_nodesRowSchema]> = [];
    nodes
      .filter(node => !node.ring_status)
      .forEach(spurNode => {
        const mainNode = mainNodes.find(m => m.order_in_ring === spurNode.order_in_ring);
        if (mainNode) {
          connections.push([mainNode, spurNode]);
        }
      });
    return connections;
  }, [nodes, mainNodes]);

  if (nodes.length === 0 || mainNodes.length === 0) {
    return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Not enough node data to display map for this ring.</div>;
  }

  const mapCenter: L.LatLngExpression = [mainNodes[0].lat!, mainNodes[0].long!];

  const mapUrl = isDarkMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  
  const mapAttribution = isDarkMode
    ? '&copy; OpenStreetMap contributors &copy; CARTO'
    : '&copy; OpenStreetMap contributors';

  const mapContainerClass = isFullScreen
    ? "fixed inset-0 z-[100] bg-white dark:bg-gray-900"
    : "relative h-[70vh] w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700";

  return (
    <div className={mapContainerClass}>
      <MapContainer center={mapCenter} zoom={13} ref={mapRef} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={mapUrl} attribution={mapAttribution} />

        {mainNodes.map((node, index) => {
          const nextNode = mainNodes[(index + 1) % mainNodes.length];
          if (!node.lat || !node.long || !nextNode.lat || !nextNode.long) return null;
          return (
            <Polyline
              key={`ring-${node.id}-${nextNode.id}`}
              positions={[[node.lat, node.long], [nextNode.lat, nextNode.long]]}
              color={isDarkMode ? "#3b82f6" : "#2563eb"}
              weight={4}
            />
          );
        })}

        {spurConnections.map(([main, spur]) => {
          if (!main.lat || !main.long || !spur.lat || !spur.long) return null;
          return (
            <Polyline
              key={`spur-${main.id}-${spur.id}`}
              positions={[[main.lat, main.long], [spur.lat, spur.long]]}
              color={isDarkMode ? "#ef4444" : "#dc2626"}
              weight={2.5}
              dashArray="5, 10"
            />
          );
        })}

        {nodes.map((node) => {
          if (!node.lat || !node.long) return null;
          return (
            <Marker key={node.id} position={[node.lat, node.long]} icon={getNodeIcon(node.type)}>
              <Popup>
                <div className="text-sm font-sans">
                  <h4 className="font-bold text-base mb-1">{node.name}</h4>
                  <p><strong className="font-semibold">Type:</strong> {node.type || 'N/A'}</p>
                  <p><strong className="font-semibold">Status:</strong> {node.ring_status ? 'Active Ring' : 'Spur'}</p>
                  <p><strong className="font-semibold">IP:</strong> {node.ip || 'N/A'}</p>
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
        {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>
    </div>
  );
}