// components/map/MeshDiagram/types.ts
import { PathConfig, PortDisplayInfo, RingMapNode, SegmentConfigMap } from "@/components/map/ClientRingMap/types";
import { V_port_power_readingsRowSchema } from "@/schemas/zod-schemas";
import L from 'leaflet';

export interface MeshDiagramProps {
  nodes: RingMapNode[];
  connections: Array<[RingMapNode, RingMapNode]>;
  ringName?: string;
  onBack?: () => void;
  segmentConfigs?: SegmentConfigMap; 
  nodePorts?: Map<string, PortDisplayInfo[]>;
  showPowerLevels: boolean;
  setShowPowerLevels: (show: boolean) => void;
  powerData: Record<string, V_port_power_readingsRowSchema>;
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
  curveOffset?: number; 
}