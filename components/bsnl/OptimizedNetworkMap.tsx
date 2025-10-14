// path: components/bsnl/OptimizedNetworkMap.tsx
"use client";

import React, { useMemo, useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, TileLayerProps } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { BsnlNode, BsnlCable, BsnlSystem } from './types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Maximize, Minimize } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

function MapEventHandler({ setBounds, setZoom }: { setBounds: (bounds: LatLngBounds | null) => void; setZoom: (zoom: number) => void; }) {
  const map = useMap();

  useEffect(() => {
    const handler = () => {
      try {
        if (!map || !map.getBounds || !map.getContainer()) return;
        const newBounds = map.getBounds();
        const newZoom = map.getZoom();
        const sw = newBounds.getSouthWest();
        const ne = newBounds.getNorthEast();
        if (!isFinite(sw.lat) || !isFinite(sw.lng) || !isFinite(ne.lat) || !isFinite(ne.lng)) return;
        if (!isFinite(newZoom) || newZoom <= 0) return;
        setBounds(newBounds);
        setZoom(newZoom);
      } catch (error) {
        console.debug('Map not ready yet:', error);
      }
    };

    const invalidateSize = () => setTimeout(() => {
      if (map && map.invalidateSize) map.invalidateSize();
    }, 100);

    map.on('zoomend moveend', handler);
    window.addEventListener('resize', invalidateSize);
    setTimeout(handler, 100);

    return () => {
      map.off('zoomend moveend', handler);
      window.removeEventListener('resize', invalidateSize);
    };
  }, [map, setBounds, setZoom]);

  return null;
}

const MapContent = memo<{
  cables: BsnlCable[];
  visibleLayers: { nodes: boolean; cables: boolean; systems: boolean };
  visibleNodes: BsnlNode[]; // This now receives pre-filtered nodes
  nodeMap: Map<string, BsnlNode>;
  mapUrl: string;
  mapAttribution: string;
  setMapBounds: (bounds: LatLngBounds | null) => void;
  setZoom: (zoom: number) => void;
}>(({ cables, visibleLayers, visibleNodes, nodeMap, mapUrl, mapAttribution, setMapBounds, setZoom }) => (
  <>
    <MapEventHandler setBounds={setMapBounds} setZoom={setZoom} />
    <TileLayer {...({ url: mapUrl, attribution: mapAttribution } as TileLayerProps)} />

    {visibleLayers.cables && cables.map((cable: BsnlCable) => {
        const startNode = nodeMap.get(cable.sn_id!);
        const endNode = nodeMap.get(cable.en_id!);
        if (startNode?.latitude && startNode.longitude && endNode?.latitude && endNode.longitude) {
            return (
                <Polyline
                    key={cable.id}
                    positions={[[startNode.latitude, startNode.longitude], [endNode.latitude, endNode.longitude]]}
                    pathOptions={{ color: cable.status ? '#3b82f6' : '#ef4444', weight: 3, opacity: 0.7 }}
                >
                  <Popup>
                      <div className="min-w-48 max-w-72">
                          <h3 className="font-semibold text-base">{cable.route_name}</h3>
                          <p className="text-sm">Type: {cable.ofc_type_name}</p>
                          <p className="text-sm">Capacity: {cable.capacity}F</p>
                          <p className="text-sm">Status: {cable.status ? 'Active' : 'Inactive'}</p>
                          <p className="text-sm">Owner: {cable.ofc_owner_name}</p>
                      </div>
                  </Popup>
                </Polyline>
            );
        }
        return null;
    })}

    {/* THE FIX: Only map over the pre-filtered visibleNodes for markers */}
    {visibleNodes.map((node: BsnlNode) => (
      (node.latitude && node.longitude) && (
          <Marker key={node.id} position={[node.latitude, node.longitude]}>
              <Popup>
                  <div className="min-w-48 max-w-72">
                      <h3 className="font-semibold text-base">{node.name}</h3>
                      <p className="text-sm">Type: {node.node_type_code}</p>
                      <p className="text-sm">Region: {node.maintenance_area_name}</p>
                      {node.latitude && <p className="text-sm">Lat: {node.latitude}</p>}
                      {node.longitude && <p className="text-sm">Long: {node.longitude}</p>}
                      {node.remark && <p className="text-sm">Remark: {node.remark}</p>}
                  </div>
              </Popup>
          </Marker>
      )
    ))}
  </>
));
MapContent.displayName = 'MapContent';

interface OptimizedNetworkMapProps {
  nodes: BsnlNode[];
  cables: BsnlCable[];
  selectedSystem: BsnlSystem | null;
  visibleLayers?: { nodes: boolean; cables: boolean; systems: boolean };
  mapBounds: LatLngBounds | null;
  zoom: number;
  onBoundsChange: (bounds: LatLngBounds | null) => void;
  onZoomChange: (zoom: number) => void;
}

export function OptimizedNetworkMap({
  nodes,
  cables,
  visibleLayers = { nodes: true, cables: true, systems: true },
  mapBounds,
  zoom,
  onBoundsChange,
  onZoomChange
}: OptimizedNetworkMapProps) {
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const { theme } = useThemeStore();

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isFullScreen]);

  const initialBounds = useMemo(() => {
    if (nodes.length === 0) return null;
    const lats = nodes.map(n => n.latitude ?? 0).filter(lat => lat !== 0 && isFinite(lat));
    const lngs = nodes.map(n => n.longitude ?? 0).filter(lng => lng !== 0 && isFinite(lng));
    if (lats.length === 0 || lngs.length === 0) return null;
    return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]] as [[number, number], [number, number]];
  }, [nodes]);

  const nodeMap = useMemo(() => new Map<string, BsnlNode>(nodes.map(node => [node.id!, node])), [nodes]);

  // THE FIX: Create a new memoized array of only the nodes that should be visible as markers.
  const visibleNodes = useMemo(() => {
    if (!mapBounds || !visibleLayers.nodes) return [];
    // Performance optimization: Render fewer markers when zoomed out.
    const maxItems = zoom > 14 ? 1000 : zoom > 12 ? 500 : 100;
    return nodes.slice(0, maxItems).filter(node => {
        const lat = node.latitude;
        const lng = node.longitude;
        if (lat == null || lng == null || !isFinite(lat) || !isFinite(lng)) return false;
        return mapBounds.contains([lat, lng]);
    });
  }, [nodes, mapBounds, zoom, visibleLayers.nodes]);
  
  if (nodes.length > 0 && !initialBounds) {
    return <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700"><p className="text-gray-500 dark:text-gray-300">No valid location data in the provided nodes.</p></div>;
  }
  
  if (nodes.length === 0) {
    return <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700"><p className="text-gray-500 dark:text-gray-300">No location data available to display map.</p></div>;
  }

  // const mapUrl = theme === 'dark'
  //   ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  //   : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const mapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

  // const mapAttribution = theme === 'dark'
  //   ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  //   : '&copy; OpenStreetMap contributors';
    const mapAttribution = '&copy; OpenStreetMap contributors';

  return (
    <>
      <div className={`relative h-full w-full transition-all duration-300 ${isFullScreen ? 'invisible' : 'visible'}`}>
        <MapContainer key="normal" bounds={initialBounds!} className="h-full w-full rounded-lg bg-gray-200 dark:bg-gray-800">
          <MapContent
            cables={cables}
            visibleLayers={visibleLayers}
            visibleNodes={visibleNodes}
            nodeMap={nodeMap}
            mapUrl={mapUrl}
            mapAttribution={mapAttribution}
            setMapBounds={onBoundsChange}
            setZoom={onZoomChange}
          />
        </MapContainer>
        <button
          onClick={() => setIsFullScreen(true)}
          className="absolute top-4 right-4 z-[1000] p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Enter Full Screen"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>
      {isFullScreen && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900">
          <MapContainer key="fullscreen" bounds={initialBounds!} className="h-full w-full bg-gray-200 dark:bg-gray-800">
            <MapContent
              cables={cables}
              visibleLayers={visibleLayers}
              visibleNodes={visibleNodes}
              nodeMap={nodeMap}
              mapUrl={mapUrl}
              mapAttribution={mapAttribution}
              setMapBounds={onBoundsChange}
              setZoom={onZoomChange}
            />
          </MapContainer>
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-4 right-4 z-[10000] p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Exit Full Screen"
          >
            <Minimize className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}