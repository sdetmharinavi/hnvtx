// components/map/ClientRingMap/types.ts
import { z } from 'zod';
import { v_ring_nodesRowSchema } from '@/schemas/zod-schemas';

export type RingMapNode = z.infer<typeof v_ring_nodesRowSchema> & { system_type: string | null };

export type MapNode = RingMapNode;

export interface PortDisplayInfo {
  port: string;
  color: string;
  targetNodeName?: string;
}

export interface FiberMetric {
  label: string;
  role: string;
  direction: string;
  distance?: number | null;
  power?: number | null;
  connectionId?: string | null;
}

export interface PathConfig {
  source?: string;
  sourcePort?: string;
  dest?: string;
  destPort?: string;
  fiberMetrics?: FiberMetric[];
  cableName?: string;
  capacity?: number;
  fiberInfo?: string;
  connectionId?: string;
  color?: string;
  bandwidthGbps?: number; // ADDED
}

export type SegmentConfigMap = Record<string, PathConfig[]>;

export type DisplayNode<T> = T & {
  displayLat: number;
  displayLng: number;
};

export type LogicalPath = {
  id: string;
  path_name: string;
  path_role: string | null;
  system_connection_id: string | null;
  bandwidth_gbps: number | null;
  remark: string | null;
  source_system_id: string | null;
  destination_system_id: string | null;
  source_port: string | null;
  destination_port: string | null;
  // ADDED: Type to hold the nested relationship join
  system_connections?: { bandwidth: string | null } | { bandwidth: string | null }[] | null;
};

export type LogicalPathsMap = Record<string, LogicalPath[]>;