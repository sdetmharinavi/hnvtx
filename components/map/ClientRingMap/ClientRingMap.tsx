// components/map/ClientRingMap/ClientRingMap.tsx
'use client';

import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { formatIP } from '@/utils/formatters';
import { applyJitterToNodes, getConnectionColor, getMultiLineCurveOffset } from '@/utils/mapUtils';
import { MapLegend } from '../MapLegend';
import { ConnectionLine } from './ConnectionLine';
import { NodeMarker } from './NodeMarker';
import { MapControls } from './MapControls';
import { MapController } from './controllers/MapController';
import { FullscreenControl } from './controllers/FullscreenControl';
import { MapFlyToController } from './controllers/MapFlyToController';
import { MapNode, PortDisplayInfo, RingMapNode, SegmentConfigMap } from './types';
import { RotatedDragOverlay } from './controllers/RotatedDragOverlay';

interface ClientRingMapProps {
  nodes: MapNode[];
  solidLines?: Array<[RingMapNode, RingMapNode]>;
  dashedLines?: Array<[RingMapNode, RingMapNode]>;
  highlightedNodeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
  onBack?: () => void;
  flyToCoordinates?: [number, number] | null;
  showControls?: boolean;
  segmentConfigs?: SegmentConfigMap;
  nodePorts?: Map<string, PortDisplayInfo[]>;
}

// Helper to group parallel lines
const groupLines = (lines: Array<[RingMapNode, RingMapNode]>) => {
  const groups = new Map<string, Array<[RingMapNode, RingMapNode]>>();
  lines.forEach((line) => {
    const [start, end] = line;
    const key = [start.id, end.id].sort().join('-');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(line);
  });
  return groups;
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
  const [labelPositions, setLabelPositions] = useState<Record<string, [number, number]>>({});

  // Rotation State
  const [rotation, setRotation] = useState(0);

  // Container Dimensions State
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const groupedSolidLines = useMemo(() => groupLines(solidLines), [solidLines]);

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
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updateDimensions);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isFullScreen]);

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

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setRotation(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [dimensions, rotation]);

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

  const handleRotate = (deg: number) => {
    setRotation((prev) => prev + deg);
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  if (displayNodes.length === 0)
    return <div className="py-10 text-center">No nodes to display</div>;

  const isRotated90 = Math.abs(rotation) % 180 === 90;

  const containerStyle = isRotated90
    ? {
        width: `${dimensions.height}px`,
        height: `${dimensions.width}px`,
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transition: 'transform 0.5s ease-in-out, width 0.3s, height 0.3s',
      }
    : {
        width: '100%',
        height: '100%',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.5s ease-in-out',
      };

  const wrapperClass = isFullScreen
    ? 'fixed inset-0 z-[100] bg-gray-100 dark:bg-gray-900 overflow-hidden'
    : 'relative h-full w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900';

  return (
    <div className={wrapperClass} ref={containerRef}>
      <MapLegend />
      {showControls && (
        <MapControls
          onBack={onBack}
          showAllNodePopups={showAllNodePopups}
          setShowAllNodePopups={setShowAllNodePopups}
          showAllLinePopups={showAllLinePopups}
          setShowAllLinePopups={setShowAllLinePopups}
          onRotate={handleRotate}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      )}

      <div style={containerStyle}>
        <MapContainer
          center={bounds?.getCenter() || [22.57, 88.36]}
          bounds={bounds || undefined}
          zoom={13}
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
          className="z-0 bg-gray-200 dark:bg-gray-800"
          closePopupOnClick={false}
          zoomControl={false}
        >
          <MapController isFullScreen={isFullScreen} />
          <FullscreenControl isFullScreen={isFullScreen} setIsFullScreen={setIsFullScreen} />
          <MapFlyToController coords={flyToCoordinates} />
          <RotatedDragOverlay rotation={rotation} />

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

          {Array.from(groupedSolidLines.values()).map((groupLines) => {
            return groupLines.map(([start, end], index) => {
              const sortedKey = [start.id, end.id].sort().join('-');
              const configs = segmentConfigs[sortedKey] || [];
              const config = configs[index] || configs[0];

              let lineColor = undefined;
              if (config?.color) {
                lineColor = config.color;
              } else if (config?.connectionId) {
                lineColor = getConnectionColor(config.connectionId);
              }

              const startPos = nodePosMap.get(start.id!);
              const endPos = nodePosMap.get(end.id!);

              if (!startPos || !endPos) return null;

              const curveOffset = getMultiLineCurveOffset(index, groupLines.length);

              return (
                <ConnectionLine
                  key={`solid-${start.id}-${end.id}-${index}`}
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
                  curveOffset={curveOffset}
                />
              );
            });
          })}

          {dashedLines
            .filter(([s, t]) => s.lat != null && t.lat != null)
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

          {displayNodes.map((node, i) => {
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
                rotation={rotation}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
