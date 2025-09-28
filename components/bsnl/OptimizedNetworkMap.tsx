// path: components/bsnl/OptimizedNetworkMap.tsx
"use client";

import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, TileLayerProps } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { BsnlNode, BsnlCable, BsnlSystem } from './types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Maximize, Minimize } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

// Component to handle map events like pan and zoom
function MapEventHandler({ setBounds, setZoom }: { setBounds: (bounds: LatLngBounds) => void; setZoom: (zoom: number) => void; }) {
  const map = useMap();

  useEffect(() => {
    const handler = () => {
      setBounds(map.getBounds());
      setZoom(map.getZoom());
    };
    // This forces the map to re-evaluate its size, crucial for the full-screen toggle
    const invalidateSize = () => setTimeout(() => map.invalidateSize(), 100);
    
    map.on('zoomend moveend', handler);
    window.addEventListener('resize', invalidateSize);
    handler(); // Initial call
    
    return () => { 
      map.off('zoomend moveend', handler); 
      window.removeEventListener('resize', invalidateSize);
    };
  }, [map, setBounds, setZoom]);

  return null;
}

export function OptimizedNetworkMap({ nodes, cables, visibleLayers = { nodes: true, cables: true, systems: true } }: { nodes: BsnlNode[]; cables: BsnlCable[]; selectedSystem: BsnlSystem | null; visibleLayers?: { nodes: boolean; cables: boolean; systems: boolean }; }) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useThemeStore();

  // This one-time effect corrects the default icon path issue with Next.js and Leaflet.
  useEffect(() => {
    // The `_getIconUrl` is a private property not included in the type definitions,
    // so we cast to a record to safely delete it without using `any`.
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // Handle body overflow when fullscreen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isFullScreen]);

  const bounds = useMemo(() => {
    if (nodes.length === 0) return null;
    const lats = nodes.map(n => n.latitude ?? 0).filter(Boolean);
    const lngs = nodes.map(n => n.longitude ?? 0).filter(Boolean);
    if (lats.length === 0 || lngs.length === 0) return null;
    return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]] as [[number, number], [number, number]];
  }, [nodes]);

  const [zoom, setZoom] = useState(13);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const nodeMap = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);

  const visibleNodes = useMemo(() => {
    if (!mapBounds || !visibleLayers.nodes) return [];
    const maxItems = zoom > 14 ? 1000 : zoom > 12 ? 500 : 100;
    return nodes.slice(0, maxItems).filter(node => {
        const lat = node.latitude;
        const lng = node.longitude;
        if (lat == null || lng == null) return false;
        return lat >= mapBounds.getSouth() && lat <= mapBounds.getNorth() && lng >= mapBounds.getWest() && lng <= mapBounds.getEast();
    });
  }, [nodes, mapBounds, zoom, visibleLayers.nodes]);
  
  if (!bounds) return <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700"><p className="text-gray-500 dark:text-gray-300">No location data available to display map.</p></div>;

  const mapUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  
  const mapAttribution = theme === 'dark'
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; OpenStreetMap contributors';

  return (
    <>
      {/* Regular map container */}
      <div className={`relative h-full w-full transition-all duration-300 ${isFullScreen ? 'invisible' : 'visible'}`}>
        <MapContainer key="normal" bounds={bounds} className="h-full w-full rounded-lg bg-gray-200 dark:bg-gray-800">
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
                            <div className="w-48">
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

          {visibleNodes.map((node: BsnlNode) => (
            (node.latitude && node.longitude) && (
                <Marker key={node.id} position={[node.latitude, node.longitude]}>
                    <Popup>
                        <div className="w-48">
                            <h3 className="font-semibold text-base">{node.name}</h3>
                            <p className="text-sm">Type: {node.node_type_name}</p>
                            <p className="text-sm">Status: {node.status ? 'Active' : 'Inactive'}</p>
                            <p className="text-sm">Region: {node.maintenance_area_name}</p>
                        </div>
                    </Popup>
                </Marker>
            )
          ))}
        </MapContainer>
        
        <button
          onClick={() => setIsFullScreen(true)}
          className="absolute top-4 right-4 z-[1000] p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Enter Full Screen"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>

      {/* Fullscreen overlay */}
      {isFullScreen && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900">
          <MapContainer key="fullscreen" bounds={bounds} className="h-full w-full bg-gray-200 dark:bg-gray-800">
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
                              <div className="w-48">
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

            {visibleNodes.map((node: BsnlNode) => (
              (node.latitude && node.longitude) && (
                  <Marker key={node.id} position={[node.latitude, node.longitude]}>
                      <Popup>
                          <div className="w-48">
                              <h3 className="font-semibold text-base">{node.name}</h3>
                              <p className="text-sm">Type: {node.node_type_name}</p>
                              <p className="text-sm">Status: {node.status ? 'Active' : 'Inactive'}</p>
                              <p className="text-sm">Region: {node.maintenance_area_name}</p>
                          </div>
                      </Popup>
                  </Marker>
              )
            ))}
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