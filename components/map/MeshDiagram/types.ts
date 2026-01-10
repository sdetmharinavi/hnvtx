// components/map/MeshDiagram/types.ts

import { PathConfig, PortDisplayInfo, RingMapNode } from "@/components/map/ClientRingMap/types";
import L from 'leaflet'; // Ensure Leaflet types are imported if used in props

export interface MeshDiagramProps {
  nodes: RingMapNode[];
  connections: Array<[RingMapNode, RingMapNode]>;
  ringName?: string;
  onBack?: () => void;
  segmentConfigs?: Record<string, PathConfig>;
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
  // ADDED: Full node objects
  start: RingMapNode; 
  end: RingMapNode;
}