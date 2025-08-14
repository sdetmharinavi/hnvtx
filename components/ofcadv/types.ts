// lib/types.ts

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