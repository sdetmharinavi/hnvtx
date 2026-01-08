'use client';

import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { formatIP } from '@/utils/formatters';
import { applyJitterToNodes, getConnectionColor, DisplayNode } from '@/utils/mapUtils';
import { MapLegend } from '../MapLegend';
import { ConnectionLine } from './ConnectionLine';
import { NodeMarker } from './NodeMarker';
import { MapControls } from './MapControls';
import { MapController } from './controllers/MapController';
import { FullscreenControl } from './controllers/FullscreenControl';
import { MapFlyToController } from './controllers/MapFlyToController';
import { MapNode, PathConfig, PortDisplayInfo, RingMapNode } from './types';

interface ClientRingMapProps {
  nodes: MapNode[];
  solidLines?: Array<[RingMapNode, RingMapNode]>;
  dashedLines?: Array<[RingMapNode, RingMapNode]>;
  highlightedNodeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
  onBack?: () => void;
  flyToCoordinates?: [number, number] | null;
  showControls?: boolean;
  segmentConfigs?: Record<string, PathConfig>;
  nodePorts?: Map<string, PortDisplayInfo[]>;
}

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
  const [labelPositions, setLabelPositions] = useState<Record<string, [number, number]>>({});

  const mapRef = useRef<L.Map>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker }>({});
  const polylineRefs = useRef<{ [key: string]: L.Polyline }>({});

  const displayNodes = useMemo(() => applyJitterToNodes(nodes as RingMapNode[]), [nodes]);

  const nodePosMap = useMemo(() => {
    const map = new Map<string, L.LatLng>();
    displayNodes.forEach((n) => {
      if (n.id) map.set(n.id, new L.LatLng(n.displayLat, n.displayLng));
    });
    return map;
  }, [displayNodes]);

  const mapCenter = useMemo(() => {
    if (displayNodes.length === 0) return { lat: 0, lng: 0 };
    const sumLat = displayNodes.reduce((acc, node) => acc + node.displayLat, 0);
    const sumLng = displayNodes.reduce((acc, node) => acc + node.displayLng, 0);
    return {
      lat: sumLat / displayNodes.length,
      lng: sumLng / displayNodes.length,
    };
  }, [displayNodes]);

  const solidLineSet = useMemo(() => {
    const set = new Set<string>();
    solidLines?.forEach(([s, e]) => set.add(`${s.id}-${e.id}`));
    return set;
  }, [solidLines]);

  const setPolylineRef = (key: string, el: L.Polyline | null) => {
    if (el) {
      polylineRefs.current[key] = el;
      if (showAllLinePopups) el.openPopup();
    } else {
      delete polylineRefs.current[key];
    }
  };

  useEffect(() => {
    import('@/utils/mapUtils').then((utils) => {
      utils.fixLeafletIcons();
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
    setLabelPositions((prev) => ({
      ...prev,
      [nodeId]: [position.lat, position.lng],
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
        <MapControls
          onBack={onBack}
          showAllNodePopups={showAllNodePopups}
          setShowAllNodePopups={setShowAllNodePopups}
          showAllLinePopups={showAllLinePopups}
          setShowAllLinePopups={setShowAllLinePopups}
        />
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

        {solidLines
          .filter(
            ([start, end]) =>
              start.lat !== null && start.long !== null && end.lat !== null && end.long !== null
          )
          .map(([start, end], i) => {
            const key1 = `${start.id}-${end.id}`;
            const config = enhancedSegmentConfigs ? enhancedSegmentConfigs[key1] : undefined;

            let lineColor = undefined;
            if (config?.connectionId) {
              lineColor = getConnectionColor(config.connectionId);
            }

            const startPos = nodePosMap.get(start.id!);
            const endPos = nodePosMap.get(end.id!);

            if (!startPos || !endPos) return null;

            const hasReverse = solidLineSet.has(`${end.id}-${start.id}`);

            return (
              <ConnectionLine
                key={`solid-${start.id}-${end.id}-${i}`}
                start={start}
                end={end}
                startPos={startPos}
                endPos={endPos}
                type="solid"
                theme={theme}
                showPopup={showAllLinePopups}
                setPolylineRef={setPolylineRef}
                config={config}
                customColor={lineColor}
                hasReverse={hasReverse}
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
          .map(([source, target], i) => {
            const startPos = nodePosMap.get(source.id!);
            const endPos = nodePosMap.get(target.id!);

            if (!startPos || !endPos) return null;

            return (
              <ConnectionLine
                key={`dashed-${source.id}-${target.id}-${i}`}
                start={source}
                end={target}
                startPos={startPos}
                endPos={endPos}
                type="dashed"
                theme={theme}
                showPopup={showAllLinePopups}
                setPolylineRef={setPolylineRef}
                hasReverse={false}
              />
            );
          })}

        {displayNodes.map((node: DisplayNode<RingMapNode>, i) => {
          const isHighlighted = highlightedNodeIds?.includes(node.id!);
          const displayIp = formatIP(node.ip);
          const portsList = nodePorts?.get(node.id!) || [];
          const nodePos: [number, number] = [node.displayLat, node.displayLng];

          return (
            <NodeMarker
              key={node.id! + i}
              node={node}
              nodePos={nodePos}
              labelPos={labelPositions[node.id!]}
              mapCenter={mapCenter}
              theme={theme}
              isHighlighted={isHighlighted}
              portsList={portsList}
              displayIp={displayIp}
              markerRefs={markerRefs}
              onNodeClick={onNodeClick}
              onLabelDragEnd={handleLabelDragEnd}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
