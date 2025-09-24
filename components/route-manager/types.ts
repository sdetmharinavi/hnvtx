// path: components/route-manager/types.ts

import { Ofc_cablesRowSchema, V_junction_closures_completeRowSchema, V_ofc_cables_completeRowSchema } from "@/schemas/zod-schemas";

// The high-level route object, fetched for the selection dropdown
// export interface OfcForSelection {
//   id: string;
//   route_name: string;
//   capacity?: number; // FIXED: Added capacity as it's selected in the hook
// }

// Create a new schema with only the fields we want
export type OfcForSelection = Pick<Ofc_cablesRowSchema, 'id' | 'route_name' | 'capacity'>;

export type JunctionClosure = Pick<V_junction_closures_completeRowSchema, 'id' | 'node_id' | 'name' | 'ofc_cable_id' | 'latitude' | 'longitude' | 'position_km'>;

export type CableRoute = Pick<V_ofc_cables_completeRowSchema, 'id' | 'route_name' | 'capacity' | 'sn_id' | 'sn_name' | 'en_id' | 'en_name'>;


// Detailed data for a selected route, fetched on the client
export interface RouteDetailsPayload {
  route: CableRoute;
  junction_closures: JunctionClosure[];
}

// Information for a single fiber within the Splice Matrix
export interface FiberInfo {
  fiber_no: number;
  status: 'available' | 'used_as_incoming' | 'used_as_outgoing' | 'terminated';
  splice_id: string | null;
  connected_to_cable: string | null;
  connected_to_fiber: number | null;
}

// Represents a cable column within the Splice Matrix
export interface CableInJc {
  cable_id: string;
  route_name: string;
  capacity: number;
  start_node: string;
  end_node: string;
  fibers: FiberInfo[];
}

// The full data payload returned by the get_jc_splicing_details RPC function
export interface JcSplicingDetails {
  jc_details: JunctionClosure;
  cables: CableInJc[];
}

// Represents a single row from the fiber_splices table
export interface SpliceConnection {
    splice_id: string;
    jc_id: string;
    jc_name: string;
    jc_position_km: number | null;
    incoming_cable_id: string;
    incoming_fiber_no: number;
    outgoing_cable_id: string | null;
    outgoing_fiber_no: number | null;
    otdr_length_km: number | null;
    loss_db: number | null;
}

// Represents the tree structure for the fiber trace visualization
export interface FiberTraceNode {
  type: 'NODE' | 'JC';
  id: string;
  name: string;
  children: {
    cable: {
      id: string;
      name: string;
      distance_km: number | null;
      is_otdr: boolean;
      fiber_no: number;
    };
    downstreamNode: FiberTraceNode | null;
  }[];
}

// NEW: Props for the SpliceMatrixModal component
export interface SpliceMatrixModalProps {
  jc: JunctionClosure | null;
  isOpen: boolean;
  onClose: () => void;
}

// NEW: Type for the return value of the auto-splice RPC
export interface AutoSpliceResult {
  splices_created: number;
}

// ========================================================================================================================


// The high-level route object, fetched on the server for initial selection
export interface RouteForSelection {
    id: string;
    route_name: string;
    evolution_status: 'simple' | 'with_jcs' | 'fully_segmented';
  }

  // Detailed data for a selected route, fetched on the client
  export interface Site {
    id: string;
    name: string;
  }

  export interface Equipment {
    id: string;
    name: string;
    equipment_type: 'junction_closure';
    latitude: number;
    longitude: number;
    status: 'existing' | 'planned'; // 'existing' from DB, 'planned' is new
    attributes: {
      jc_type: 'inline' | 'branching' | 'terminal';
      capacity: number;
      position_on_route: number; // 0-100%
    };
  }

  export interface CableSegment {
    id: string;
    segment_order: number;
    start_point_id: string;
    end_point_id: string;
    start_point_type: 'site' | 'equipment';
    end_point_type: 'site' | 'equipment';
    fiber_count: number;
    distance_km: number;
  }

  export interface FiberSplice {
    id: string;
    equipment_id: string; // The JC equipment ID
    incoming_segment_id: string;
    incoming_fiber_number: number;
    outgoing_segment_id: string;
    outgoing_fiber_number: number;
    splice_type: 'through' | 'tap' | 'split';
    status: 'active' | 'spare' | 'faulty';
  }

  // Payload for the POST request to commit changes
  export interface EvolutionCommitPayload {
    plannedEquipment: Omit<Equipment, 'status' | 'id'>[];
    plannedSegments: Omit<CableSegment, 'id'>[];
    plannedSplices: Omit<FiberSplice, 'id'>[];
  }