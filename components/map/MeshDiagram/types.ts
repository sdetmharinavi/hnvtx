// Add to existing types.ts in components/map/types.ts

import { PathConfig, PortDisplayInfo, RingMapNode } from "@/components/map/ClientRingMap/types";

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
}