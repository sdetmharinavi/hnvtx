// path: components/bsnl/types.ts
import {
  v_nodes_completeRowSchema,
  v_ofc_cables_completeRowSchema,
  v_systems_completeRowSchema,
  ofc_connectionsRowSchema
} from '@/schemas/zod-schemas';
import { z } from 'zod';

export type BsnlNode = z.infer<typeof v_nodes_completeRowSchema>;
export type BsnlCable = z.infer<typeof v_ofc_cables_completeRowSchema>;
export type BsnlSystem = z.infer<typeof v_systems_completeRowSchema>;
export type BsnlConnection = z.infer<typeof ofc_connectionsRowSchema>;

// CORRECTED: Added and exported missing types
export interface FiberRoutePath {
  nodeId: string;
  ofcId: string;
  fiberNumber: number;
  action: 'terminate' | 'pass_through' | 'tap' | 'cascade';
  tapTo?: {
    ofcId: string;
    fiberNumber: number;
  };
}

export interface FiberAllocation {
  fiberNumber: number;
  systemId: string;
  allocatedAt: string;
  routePath: FiberRoutePath[];
  status: 'active' | 'standby' | 'faulty';
}

export interface AllocationSaveData {
  systemId: string;
  topology: 'p2p-unprotected' | 'p2p-protected' | 'ring' | 'tap-spur';
  paths: {
    working: FiberRoutePath[];
    protection: FiberRoutePath[];
    taps: { [key: string]: FiberRoutePath[] };
  };
}
// END CORRECTION

export interface SearchFilters {
  query: string;
  status: string[];
  type: string[];
  region: string[];
  district: string[];
  priority: string[];
}