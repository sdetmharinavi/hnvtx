// path: components/route-manager/types.ts

export interface OfcForSelection {
  id: string;
  route_name: string;
  capacity?: number;
}

export interface JunctionClosure {
  id: string;
  name: string;
  position_km: number | null;
  ofc_cable_id?: string;
  capacity?: number;
}

export interface RouteDetailsPayload {
  route: {
    id: string;
    route_name: string;
    start_node: { id: string; name: string };
    end_node: { id: string; name: string };
    capacity: number;
    current_rkm: number | null;
  };
  junction_closures: JunctionClosure[];
}

export interface FiberInfo {
  fiber_no: number;
  status: 'available' | 'used_as_incoming' | 'used_as_outgoing' | 'terminated';
  splice_id: string | null; 
  connected_to_cable: string | null;
  connected_to_fiber: number | null;
}

export interface CableInJc {
  cable_id: string;
  route_name: string;
  capacity: number;
  start_node: string;
  end_node: string;
  fibers: FiberInfo[];
}

export interface JcSplicingDetails {
  jc_details: JunctionClosure;
  cables: CableInJc[];
}

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

// *** THE CORRECTED TYPE ***
// This type is simpler and more directly matches the visual elements we need.
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
    downstreamNode: FiberTraceNode | null; // Can be another NODE or JC
  }[];
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

  // The complete data payload returned by the client-side API call
  export interface RouteDetailsPayload {
    route: {
      id: string;
      name: string;
      start_site: Site;
      end_site: Site;
      capacity: number;
      distance_km: number;
      evolution_status: 'simple' | 'with_jcs' | 'fully_segmented';
    };
    equipment: Equipment[];
  }

  // Payload for the POST request to commit changes
  export interface EvolutionCommitPayload {
    plannedEquipment: Omit<Equipment, 'status' | 'id'>[];
    plannedSegments: Omit<CableSegment, 'id'>[];
    plannedSplices: Omit<FiberSplice, 'id'>[];
  }