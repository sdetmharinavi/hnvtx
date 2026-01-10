// components/map/MeshDiagram/types.ts

import { PathConfig, PortDisplayInfo, RingMapNode, SegmentConfigMap } from "@/components/map/ClientRingMap/types";
import L from 'leaflet';

export interface MeshDiagramProps {
  nodes: RingMapNode[];
  connections: Array<[RingMapNode, RingMapNode]>;
  ringName?: string;
  onBack?: () => void;
  segmentConfigs?: SegmentConfigMap; // Updated to use the correct type
  nodePorts?: Map<string, PortDisplayInfo[]>;
}

export interface MeshConnectionLineProps {
  startPos: L.LatLng;
  endPos: L.LatLng;
  isSpur: boolean;
  config?: PathConfig;
  theme: string;
  startNodeName: string;
  endNodeName: string;
  nodesLength: number;
  customColor?: string;
  start: RingMapNode; 
  end: RingMapNode;
  curveOffset?: number; // Added
}