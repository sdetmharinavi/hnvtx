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
import { Maximize, Minimize, Ruler } from 'lucide-react';
import { getNodeIcon } from '@/utils/getNodeIcons';
import { MapLegend } from '@/components/map/MapLegend';
import { applyJitterToNodes, fixLeafletIcons, DisplayNode } from '@/utils/mapUtils';
import GenericRemarks from '@/components/common/GenericRemarks';
import { useDebounce } from 'use-debounce';
import { MeasureController } from '@/components/kml/MeasureController';

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
  isMeasureMode,
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
  isMeasureMode: boolean;
}) => {
  const renderMode = zoom >= 13 ? 'detailed' : 'simple';

  const visibleDisplayNodes = useMemo(() => {
    if (!mapBounds || !visibleLayers.nodes) return displayNodes;

    const maxItems = renderMode === 'detailed' ? 250 : 5000;
    const paddedBounds = mapBounds.pad(0.2);

    return displayNodes
      .filter((node) => paddedBounds.contains([node.displayLat, node.displayLng]))
      .slice(0, maxItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayNodes, mapBounds, zoom, visibleLayers.nodes, renderMode]);

  const visibleCables = useMemo(() => {
    if (!visibleLayers.cables) return [];
    // THE FIX: Provide all cables before map bounds establish, don't slice early.
    if (!mapBounds) return cables;

    // THE FIX: Increased padding to 0.5 to prevent snapping out too soon
    // when dragging along a long diagonal line.
    const paddedBounds = mapBounds.pad(0.5);

    return cables.filter((cable) => {
      const s = nodeMap.get(cable.sn_id!);
      const e = nodeMap.get(cable.en_id!);

      // If either coordinate is completely missing, we can't draw the line anyway.
      if (!s?.latitude || !s?.longitude || !e?.latitude || !e?.longitude) return false;

      // THE FIX: Create a bounding box representing the line segment.
      // Leaflet's intersects() will correctly return true if the cable passes
      // directly through the viewport even if both endpoints are currently off-screen.
      const cableBounds = new LatLngBounds([s.latitude, s.longitude], [e.latitude, e.longitude]);

      return paddedBounds.intersects(cableBounds);
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
          const defaultColor = cable.status ? '#3b82f6' : '#ef4444';
          const defaultWeight = renderMode === 'simple' ? 2 : 3.5;

          return (
            <Polyline
              key={cable.id}
              positions={[
                [startNode.latitude, startNode.longitude],
                [endNode.latitude, endNode.longitude],
              ]}
              pathOptions={{
                color: defaultColor,
                weight: defaultWeight,
                opacity: 0.8,
              }}
              interactive={!isMeasureMode}
              eventHandlers={{
                popupopen: (e) => {
                  const layer = e.target;
                  if (layer.setStyle) {
                    layer.setStyle({
                      color: '#eab308',
                      weight: defaultWeight + 3,
                      opacity: 1,
                    });
                    layer.bringToFront();
                  }
                },
                popupclose: (e) => {
                  const layer = e.target;
                  if (layer.setStyle) {
                    layer.setStyle({
                      color: defaultColor,
                      weight: defaultWeight,
                      opacity: 0.8,
                    });
                  }
                },
              }}
            >
              <Popup>
                <div className='min-w-48 max-w-72'>
                  <h3 className='font-semibold text-base text-gray-900'>{cable.route_name}</h3>
                  <p className='text-sm text-gray-700 mt-1'>
                    <strong>Type:</strong> {cable.ofc_type_name}
                  </p>
                  <p className='text-sm text-gray-700'>
                    <strong>Capacity:</strong> {cable.capacity}F
                  </p>
                  <p className='text-sm text-gray-700'>
                    <strong>Status:</strong>{' '}
                    <span
                      className={
                        cable.status ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                      }
                    >
                      {cable.status ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p className='text-sm text-gray-700'>
                    <strong>Owner:</strong> {cable.ofc_owner_name}
                  </p>
                </div>
              </Popup>
            </Polyline>
          );
        }
        return null;
      })}

      {/* Render Nodes (LOD Switching) */}
      {visibleDisplayNodes.map((node: DisplayNode<BsnlNode>) => {
        const PopupContent = (
          <div className='min-w-48 max-w-72'>
            <h3 className='font-semibold text-base'>{node.name}</h3>
            <p className='text-sm'>Type: {node.node_type_code}</p>
            <p className='text-sm'>Region: {node.maintenance_area_name}</p>
            {nodeSystemMap.get(node.id!) && (
              <p className='text-sm text-blue-600 mt-1'>Systems: {nodeSystemMap.get(node.id!)}</p>
            )}
            {node.latitude && (
              <p className='text-sm mt-1 text-gray-500'>
                {node.latitude.toFixed(5)}, {node.longitude?.toFixed(5)}
              </p>
            )}
            <GenericRemarks
              className='whitespace-normal wrap-break-words'
              remark={node.remark || ''}
            />
          </div>
        );

        if (renderMode === 'simple') {
          return (
            <CircleMarker
              key={node.id}
              center={[node.displayLat, node.displayLng]}
              radius={5}
              pathOptions={{
                color: '#ffffff',
                weight: 1,
                fillColor: node.status ? '#16a34a' : '#dc2626',
                fillOpacity: 0.9,
              }}
              interactive={!isMeasureMode}
            >
              <Popup>{PopupContent}</Popup>
            </CircleMarker>
          );
        }

        const systemTypesAtNode = nodeSystemMap.get(node.id!) || '';
        const icon = getNodeIcon(systemTypesAtNode, node.node_type_name, false);

        return (
          <Marker
            key={node.id}
            position={[node.displayLat, node.displayLng]}
            icon={icon}
            riseOnHover={true}
            zIndexOffset={10}
            interactive={!isMeasureMode}
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
  const [isMeasureMode, setIsMeasureMode] = useState(false);
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMeasureMode) setIsMeasureMode(false);
        else if (isFullScreen) setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMeasureMode, isFullScreen]);

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

  const displayNodes = useMemo(() => {
    return applyJitterToNodes<BsnlNode>(nodes);
  }, [nodes]);

  if (nodes.length > 0 && !initialBounds) {
    return (
      <div className='flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700'>
        <p className='text-gray-500 dark:text-gray-300'>No valid location data.</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className='flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700'>
        <p className='text-gray-500 dark:text-gray-300'>No location data available.</p>
      </div>
    );
  }

  const mapUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const mapAttribution = '&copy; OpenStreetMap contributors';

  const ControlsGroup = () => (
    <div className='absolute top-4 right-4 z-1000 flex flex-col gap-2'>
      <button
        onClick={() => setIsMeasureMode(!isMeasureMode)}
        className={`p-2.5 rounded-full shadow-lg transition-all duration-200 border ${
          isMeasureMode
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title='Measure Distance (Click points on map)'
      >
        <Ruler className='h-5 w-5' />
      </button>

      <button
        onClick={() => setIsFullScreen(!isFullScreen)}
        className='p-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700'
        title={isFullScreen ? 'Exit Full Screen' : 'Enter Full Screen'}
      >
        {isFullScreen ? <Minimize className='h-5 w-5' /> : <Maximize className='h-5 w-5' />}
      </button>
    </div>
  );

  return (
    <>
      <div
        className={`relative h-full w-full transition-all duration-300 ${
          isFullScreen ? 'invisible' : 'visible'
        }`}
      >
        <MapLegend />
        <ControlsGroup />

        <MapContainer
          key='normal'
          bounds={initialBounds!}
          className='h-full w-full rounded-lg bg-gray-200 dark:bg-gray-800'
          preferCanvas={true}
          style={{ cursor: isMeasureMode ? 'crosshair' : 'grab' }}
        >
          <MeasureController isActive={isMeasureMode} onClose={() => setIsMeasureMode(false)} />

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
            isMeasureMode={isMeasureMode}
          />
        </MapContainer>
      </div>
      {isFullScreen && (
        <div className='fixed inset-0 z-9999 bg-white dark:bg-gray-900'>
          <MapLegend />
          <ControlsGroup />

          <MapContainer
            key='fullscreen'
            bounds={initialBounds!}
            className='h-full w-full bg-gray-200 dark:bg-gray-800'
            preferCanvas={true}
            style={{ cursor: isMeasureMode ? 'crosshair' : 'grab' }}
          >
            <MeasureController isActive={isMeasureMode} onClose={() => setIsMeasureMode(false)} />

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
              isMeasureMode={isMeasureMode}
            />
          </MapContainer>
        </div>
      )}
    </>
  );
}
