// components/bsnl/OptimizedNetworkMap.tsx
'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
  TileLayerProps,
} from 'react-leaflet';
import { LatLngBounds, LatLngExpression } from 'leaflet';
import { BsnlNode, BsnlSystem } from './types';
import { ExtendedOfcCable } from '@/schemas/custom-schemas';
import 'leaflet/dist/leaflet.css';
import { Maximize, Minimize } from 'lucide-react';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { MapLegend } from '@/components/map/MapLegend';
import { applyJitterToNodes, fixLeafletIcons, DisplayNode } from '@/utils/mapUtils';
import GenericRemarks from '@/components/common/GenericRemarks';
import { useDebounce } from 'use-debounce';

// --- CONTROLLER: Auto Fit ---
const MapAutoFit = ({ nodes, filterKey }: { nodes: BsnlNode[]; filterKey?: string }) => {
  const map = useMap();
  const isFirstRender = useRef(true);
  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    if (nodes.length === 0) return;

    const hasFilterChanged = prevFilterKey.current !== filterKey;

    if (isFirstRender.current || hasFilterChanged) {
      const latLngs: LatLngExpression[] = nodes
        .filter((n) => n.latitude != null && n.longitude != null)
        .map((n) => [n.latitude!, n.longitude!]);

      if (latLngs.length > 0) {
        const bounds = new LatLngBounds(latLngs);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
          duration: 1,
        });
      }

      isFirstRender.current = false;
      prevFilterKey.current = filterKey;
    }
  }, [nodes, map, filterKey]);

  return null;
};

// --- CONTROLLER: Event Handler ---
function MapEventHandler({
  setBounds,
  setZoom,
}: {
  setBounds: (bounds: LatLngBounds | null) => void;
  setZoom: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handler = () => {
      try {
        if (!map || !map.getBounds || !map.getContainer()) return;
        const newBounds = map.getBounds();
        const newZoom = map.getZoom();

        const sw = newBounds.getSouthWest();
        const ne = newBounds.getNorthEast();
        if (!isFinite(sw.lat) || !isFinite(sw.lng) || !isFinite(ne.lat) || !isFinite(ne.lng))
          return;
        if (!isFinite(newZoom) || newZoom <= 0) return;

        setBounds(newBounds);
        setZoom(newZoom);
      } catch (error) {
        console.debug('Map not ready yet:', error);
      }
    };

    handler();

    const invalidateSize = () =>
      setTimeout(() => {
        if (map && map.invalidateSize) map.invalidateSize();
      }, 100);

    map.on('zoomend moveend', handler);
    window.addEventListener('resize', invalidateSize);

    return () => {
      map.off('zoomend moveend', handler);
      window.removeEventListener('resize', invalidateSize);
    };
  }, [map, setBounds, setZoom]);

  return null;
}

// --- SUB-COMPONENT: Map Content ---
const MapContent = ({
  cables,
  visibleLayers,
  displayNodes,
  mapBounds,
  zoom,
  nodeMap,
  nodeSystemMap,
  mapUrl,
  mapAttribution,
  setMapBounds,
  setZoom,
  filteredNodes,
  filterKey,
}: {
  cables: ExtendedOfcCable[];
  visibleLayers: { nodes: boolean; cables: boolean; systems: boolean };
  displayNodes: DisplayNode<BsnlNode>[];
  mapBounds: LatLngBounds | null;
  zoom: number;
  nodeMap: Map<string, BsnlNode>;
  nodeSystemMap: Map<string, string>;
  mapUrl: string;
  mapAttribution: string;
  setMapBounds: (bounds: LatLngBounds | null) => void;
  setZoom: (zoom: number) => void;
  filteredNodes: BsnlNode[];
  filterKey?: string;
}) => {
  // Determine Rendering Mode (LOD)
  // Simple: Canvas CircleMarkers (Fast, supports thousands)
  // Detailed: DOM Markers (Slow, detailed icons)
  const renderMode = zoom >= 13 ? 'detailed' : 'simple';

  const visibleDisplayNodes = useMemo(() => {
    if (!mapBounds || !visibleLayers.nodes) return displayNodes;

    // Adjust limits based on render mode
    // Detailed mode creates DOM elements, so limit strictly to prevent UI freeze
    // Simple mode uses Canvas, so we can render many more
    const maxItems = renderMode === 'detailed' ? 250 : 5000;

    const paddedBounds = mapBounds.pad(0.2);

    return displayNodes
      .filter((node) => paddedBounds.contains([node.displayLat, node.displayLng]))
      .slice(0, maxItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayNodes, mapBounds, zoom, visibleLayers.nodes, renderMode]);

  const visibleCables = useMemo(() => {
    if (!visibleLayers.cables) return [];
    if (!mapBounds) return cables.slice(0, 100);

    const paddedBounds = mapBounds.pad(0.1);

    return cables.filter((cable) => {
      const s = nodeMap.get(cable.sn_id!);
      const e = nodeMap.get(cable.en_id!);
      if (!s?.latitude || !s?.longitude || !e?.latitude || !e?.longitude) return false;

      return (
        paddedBounds.contains([s.latitude, s.longitude]) ||
        paddedBounds.contains([e.latitude, e.longitude])
      );
    });
  }, [cables, visibleLayers.cables, mapBounds, nodeMap]);

  return (
    <>
      <MapEventHandler setBounds={setMapBounds} setZoom={setZoom} />
      <MapAutoFit nodes={filteredNodes} filterKey={filterKey} />

      <TileLayer {...({ url: mapUrl, attribution: mapAttribution } as TileLayerProps)} />

      {/* Render Cables */}
      {visibleCables.map((cable: ExtendedOfcCable) => {
        const startNode = nodeMap.get(cable.sn_id!);
        const endNode = nodeMap.get(cable.en_id!);

        if (startNode?.latitude && startNode.longitude && endNode?.latitude && endNode.longitude) {
          return (
            <Polyline
              key={cable.id}
              positions={[
                [startNode.latitude, startNode.longitude],
                [endNode.latitude, endNode.longitude],
              ]}
              pathOptions={{
                color: cable.status ? '#3b82f6' : '#ef4444',
                weight: renderMode === 'simple' ? 1.5 : 3, // Thinner lines at low zoom
                opacity: 0.7,
              }}
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

      {/* Render Nodes (LOD Switching) */}
      {visibleDisplayNodes.map((node: DisplayNode<BsnlNode>) => {
        // Shared Popup Content
        const PopupContent = (
          <div className="min-w-48 max-w-72">
            <h3 className="font-semibold text-base">{node.name}</h3>
            <p className="text-sm">Type: {node.node_type_code}</p>
            <p className="text-sm">Region: {node.maintenance_area_name}</p>
            {nodeSystemMap.get(node.id!) && (
              <p className="text-sm text-blue-600 mt-1">Systems: {nodeSystemMap.get(node.id!)}</p>
            )}
            {node.latitude && (
              <p className="text-sm mt-1 text-gray-500">
                {node.latitude.toFixed(5)}, {node.longitude?.toFixed(5)}
              </p>
            )}
            <GenericRemarks remark={node.remark || ''} />
          </div>
        );

        // --- MODE 1: SIMPLE (Canvas Circles) ---
        if (renderMode === 'simple') {
          return (
            <CircleMarker
              key={node.id}
              center={[node.displayLat, node.displayLng]}
              radius={5}
              pathOptions={{
                color: '#ffffff',
                weight: 1,
                fillColor: node.status ? '#16a34a' : '#dc2626', // Green/Red
                fillOpacity: 0.9,
              }}
            >
              <Popup>{PopupContent}</Popup>
            </CircleMarker>
          );
        }

        // --- MODE 2: DETAILED (DOM Markers) ---
        const systemTypesAtNode = nodeSystemMap.get(node.id!) || '';
        const icon = getNodeIcon(systemTypesAtNode, node.node_type_name, false);

        return (
          <Marker
            key={node.id}
            position={[node.displayLat, node.displayLng]}
            icon={icon}
            riseOnHover={true}
            zIndexOffset={10}
          >
            <Popup>{PopupContent}</Popup>
          </Marker>
        );
      })}
    </>
  );
};

MapContent.displayName = 'MapContent';

interface OptimizedNetworkMapProps {
  nodes: BsnlNode[];
  cables: ExtendedOfcCable[];
  systems: BsnlSystem[];
  selectedSystem: BsnlSystem | null;
  visibleLayers?: { nodes: boolean; cables: boolean; systems: boolean };
  mapBounds: LatLngBounds | null;
  zoom: number;
  onBoundsChange: (bounds: LatLngBounds | null) => void;
  onZoomChange: (zoom: number) => void;
  filterKey?: string;
}

export function OptimizedNetworkMap({
  nodes,
  cables,
  systems,
  visibleLayers = { nodes: true, cables: true, systems: true },
  mapBounds,
  zoom,
  onBoundsChange,
  onZoomChange,
  filterKey,
}: OptimizedNetworkMapProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [debouncedBounds] = useDebounce(mapBounds, 100);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isFullScreen]);

  const initialBounds = useMemo(() => {
    if (nodes.length === 0) return null;
    const lats = nodes.map((n) => n.latitude ?? 0).filter((lat) => lat !== 0 && isFinite(lat));
    const lngs = nodes.map((n) => n.longitude ?? 0).filter((lng) => lng !== 0 && isFinite(lng));
    if (lats.length === 0 || lngs.length === 0) return null;
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ] as [[number, number], [number, number]];
  }, [nodes]);

  const nodeMap = useMemo(
    () => new Map<string, BsnlNode>(nodes.map((node) => [node.id!, node])),
    [nodes],
  );

  const nodeSystemMap = useMemo(() => {
    const map = new Map<string, string>();
    systems.forEach((sys) => {
      if (sys.node_id && sys.system_type_code) {
        const current = map.get(sys.node_id) || '';
        if (!current.includes(sys.system_type_code)) {
          map.set(
            sys.node_id,
            current ? `${current}, ${sys.system_type_code}` : sys.system_type_code,
          );
        }
      }
    });
    return map;
  }, [systems]);

  // Jitter calculation on full dataset
  const displayNodes = useMemo(() => {
    return applyJitterToNodes<BsnlNode>(nodes);
  }, [nodes]);

  if (nodes.length > 0 && !initialBounds) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
        <p className="text-gray-500 dark:text-gray-300">No valid location data.</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
        <p className="text-gray-500 dark:text-gray-300">No location data available.</p>
      </div>
    );
  }

  const mapUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const mapAttribution = '&copy; OpenStreetMap contributors';

  return (
    <>
      <div
        className={`relative h-full w-full transition-all duration-300 ${
          isFullScreen ? 'invisible' : 'visible'
        }`}
      >
        <MapLegend />

        <MapContainer
          key="normal"
          bounds={initialBounds!}
          className="h-full w-full rounded-lg bg-gray-200 dark:bg-gray-800"
          // ENABLE CANVAS RENDERER FOR PERFORMANCE
          preferCanvas={true}
        >
          <MapContent
            cables={cables}
            visibleLayers={visibleLayers}
            displayNodes={displayNodes}
            mapBounds={debouncedBounds}
            zoom={zoom}
            nodeMap={nodeMap}
            nodeSystemMap={nodeSystemMap}
            mapUrl={mapUrl}
            mapAttribution={mapAttribution}
            setMapBounds={onBoundsChange}
            setZoom={onZoomChange}
            filteredNodes={nodes}
            filterKey={filterKey}
          />
        </MapContainer>
        <button
          onClick={() => setIsFullScreen(true)}
          className="absolute top-4 right-4 z-1000 p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Enter Full Screen"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>
      {isFullScreen && (
        <div className="fixed inset-0 z-9999 bg-white dark:bg-gray-900">
          <MapLegend />
          <MapContainer
            key="fullscreen"
            bounds={initialBounds!}
            className="h-full w-full bg-gray-200 dark:bg-gray-800"
            // ENABLE CANVAS RENDERER FOR PERFORMANCE
            preferCanvas={true}
          >
            <MapContent
              cables={cables}
              visibleLayers={visibleLayers}
              displayNodes={displayNodes}
              mapBounds={debouncedBounds}
              zoom={zoom}
              nodeMap={nodeMap}
              nodeSystemMap={nodeSystemMap}
              mapUrl={mapUrl}
              mapAttribution={mapAttribution}
              setMapBounds={onBoundsChange}
              setZoom={onZoomChange}
              filteredNodes={nodes}
              filterKey={filterKey}
            />
          </MapContainer>
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-4 right-4 z-10000 p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Exit Full Screen"
          >
            <Minimize className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}
