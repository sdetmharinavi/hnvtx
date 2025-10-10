// path: components/bsnl/types.ts
import {
  V_nodes_completeRowSchema,
  V_ofc_cables_completeRowSchema,
  V_systems_completeRowSchema,
} from '@/schemas/zod-schemas';

export type BsnlNode = V_nodes_completeRowSchema;
export type BsnlCable = V_ofc_cables_completeRowSchema;
export type BsnlSystem = V_systems_completeRowSchema;

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