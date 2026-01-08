import { z } from 'zod';
import { v_ring_nodesRowSchema } from '@/schemas/zod-schemas';

// The RingMapNode is the primary, feature-rich node type, derived directly from the view.
export type RingMapNode = z.infer<typeof v_ring_nodesRowSchema> & { system_type: string | null };

// The MapNode can be a simplified version or a partial type for more generic use cases.
// For simplicity and type safety, we can often just use RingMapNode everywhere.
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
}

export type DisplayNode<T> = T & {
  displayLat: number;
  displayLng: number;
};