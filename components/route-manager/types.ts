// path: components/route-manager/types.ts

import { Fiber_splicesRowSchema, Junction_closuresRowSchema, NodesRowSchema, Ofc_cablesRowSchema, V_cable_segments_at_jcRowSchema, V_junction_closures_completeRowSchema, V_ofc_cables_completeRowSchema } from "@/schemas/zod-schemas";

// Create a new schema with only the fields we want
export type OfcForSelection = Pick<Ofc_cablesRowSchema, 'id' | 'route_name' | 'capacity'>;

export type JunctionClosure = Pick<V_junction_closures_completeRowSchema, 'id' | 'node_id' | 'name' | 'ofc_cable_id' | 'latitude' | 'longitude' | 'position_km'>;

export type CableSegment = Pick<V_cable_segments_at_jcRowSchema, 'id' | 'segment_order' | 'start_node_id' | 'end_node_id' | 'fiber_count'> & { distance_km: number; start_point_type: 'site' | 'equipment'; end_point_type: 'site' | 'equipment'; };

export type FiberSplice = Pick<Fiber_splicesRowSchema, 'id' | 'jc_id' | 'incoming_segment_id' | 'incoming_fiber_no' | 'outgoing_segment_id' | 'outgoing_fiber_no' | 'splice_type' | 'status' | 'logical_path_id' | 'loss_db' | 'otdr_length_km' | 'created_at' | 'updated_at'>;

export type CableRoute = {
  id: V_ofc_cables_completeRowSchema['id'];
  name: V_ofc_cables_completeRowSchema['route_name'];
  capacity: V_ofc_cables_completeRowSchema['capacity'];
  distance_km: V_ofc_cables_completeRowSchema['current_rkm'];
  start_site: {
    id: V_ofc_cables_completeRowSchema['sn_id'];
    name: V_ofc_cables_completeRowSchema['sn_name'];
  };
  end_site: {
    id: V_ofc_cables_completeRowSchema['en_id'];
    name: V_ofc_cables_completeRowSchema['en_name'];
  };
  evolution_status: 'simple' | 'with_jcs' | 'fully_segmented';
};

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

// Detailed data for a selected route, fetched on the client
export interface RouteDetailsPayload {
  route: CableRoute;
  equipment: Equipment[]; // existing JCs
  segments: CableSegment[];
  splices: FiberSplice[];
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
  cable_id: CableRoute['id'];
  route_name: CableRoute['name'];
  capacity: CableRoute['capacity'];
  start_site: CableRoute['start_site'];
  end_site: CableRoute['end_site'];
  fibers: FiberInfo[];
}

// Represents the data returned by the get_jc_splicing_details RPC
export interface JcSplicingDetails {
  junction_closure: {
    id: string;
    name: string;
  };
  cables_at_jc: CableInJc[];
  segments_at_jc?: Array<{
    segment_id: string;
    segment_name: string;
    fiber_count: number;
    fibers?: FiberInfo[] | null;
  }> | null;
}

// Represents a single row from the fiber_splices table
export type SpliceConnection = Pick<Fiber_splicesRowSchema, 'id' | 'jc_id' | 'incoming_segment_id' | 'incoming_fiber_no' | 'outgoing_segment_id' | 'outgoing_fiber_no' | 'otdr_length_km' | 'loss_db'> & Pick<NodesRowSchema, 'name' > & Pick<Junction_closuresRowSchema, 'position_km' >;

export interface FiberTraceSegment {
    segment_order: number;
    path_type: 'CABLE' | 'JC';
    element_id: string;
    element_name: string;
    details: string;
    fiber_no: number;
    distance_km: number | null;
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


// // The high-level route object, fetched on the server for initial selection
// export interface RouteForSelection {
//     id: string;
//     route_name: string;
//     evolution_status: 'simple' | 'with_jcs' | 'fully_segmented';
//   }

//   // Detailed data for a selected route, fetched on the client
//   export interface Site {
//     id: string;
//     name: string;
//   }

//   export interface Equipment {
//     id: string;
//     name: string;
//     equipment_type: 'junction_closure';
//     latitude: number;
//     longitude: number;
//     status: 'existing' | 'planned'; // 'existing' from DB, 'planned' is new
//     attributes: {
//       jc_type: 'inline' | 'branching' | 'terminal';
//       capacity: number;
//       position_on_route: number; // 0-100%
//     };
//   }



//   export interface CableSegment {
//     id: string;
//     segment_order: number;
//     start_point_id: string;
//     end_point_id: string;
//     start_point_type: 'site' | 'equipment';
//     end_point_type: 'site' | 'equipment';
//     fiber_count: number;
//     distance_km: number;
//   }



//   export interface FiberSplice {
//     id: string;
//     jc_id: string; // Junction closure ID
//     incoming_cable_id: string; // Incoming cable ID
//     incoming_fiber_no: number; // Incoming fiber number
//     outgoing_cable_id: string | null; // Outgoing cable ID (nullable for termination)
//     outgoing_fiber_no: number | null; // Outgoing fiber number (nullable for termination)
//     splice_type: 'pass_through' | 'branch' | 'termination'; // Match SQL constraints
//     status: 'active' | 'faulty' | 'reserved'; // Match SQL constraints
//     logical_path_id?: string | null; // Optional logical path reference
//     loss_db?: number | null; // Optional loss measurement
//     otdr_length_km?: number | null; // Optional OTDR measurement
//     created_at?: string; // Optional timestamps
//     updated_at?: string;
//   }

export interface Site {
    id: string;
    name: string;
}

  // Payload for the POST request to commit changes
  export interface EvolutionCommitPayload {
    plannedEquipment: Omit<Equipment, 'status' | 'id'>[];
    plannedSegments: Omit<CableSegment, 'id'>[];
    plannedSplices: Omit<FiberSplice, 'id'>[];
  }