import { Row } from "@/hooks/database";

export type RingRowsWithRelations = Row<'rings'> & {
  ring_type?: {
    id: string;
    code: string;
  } | null;
  maintenance_terminal?: {
    id: string;
    name: string;
  } | null;
};
  
  export type EmployeeDesignationRowsWithRelations = Row<'employee_designations'> & {
    parent?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type EmployeeRowsWithRelations = Row<'employees'> & {
    employee_designation?: {
      id: string;
      name: string;
    } | null;
    maintenance_terminal?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type FiberJointConnectionRowsWithRelations = Row<'fiber_joint_connections'> & {
    input_ofc_cable?: {
      id: string;
      route_name: string;
    } | null;
    fiber_joint?: {
      id: string;
      joint_name: string;
    } | null;
    logical_fiber_path?: {
      id: string;
      path_name: string;
    } | null;
    output_ofc_cable?: {
      id: string;
      route_name: string;
    } | null;
  };
  
  export type FiberJointRowsWithRelations = Row<'fiber_joints'> & {
    maintenance_area?: {
      id: string;
      name: string;
    } | null;
    node?: {
      id: string;
      name: string;
    } | null;
    joint_type_lookup?: {
      category: string;
      name: string;
    } | null;
  };
  
  export type LogicalFiberPathRowsWithRelations = Row<'logical_fiber_paths'> & {
    operational_status_lookup?: {
      category: string;
      name: string;
    } | null;
    path_type_lookup?: {
      category: string;
      name: string;
    } | null;
    destination_system?: {
      id: string;
      system_name: string;
    } | null;
    source_system?: {
      id: string;
      system_name: string;
    } | null;
  };
  
  
  export type MaintenanceAreaRowsWithRelations = Row<'maintenance_areas'> & {
    area_type?: {
      id: string;
      name: string;
    } | null;
    parent?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type ManagementPortRowsWithRelations = Row<'management_ports'> & {
    node?: {
      id: string;
      name: string;
    } | null;
    system?: {
      id: string;
      system_name: string;
    } | null;
  };
  
  export type NodeRowsWithRelations = Row<'nodes'> & {
    maintenance_terminal?: {
      id: string;
      name: string;
    } | null;
    node_type?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type OfcCableRowsWithRelations = Row<'ofc_cables'> & {
    en_node?: {
      id: string;
      name: string;
    } | null;
    maintenance_terminal?: {
      id: string;
      name: string;
    } | null;
    ofc_owner?: {
      id: string;
      name: string;
    } | null;
    ofc_type?: {
      id: string;
      name: string;
    } | null;
    sn_node?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type OfcConnectionRowsWithRelations = Row<'ofc_connections'> & {
    connection_type_lookup?: {
      category: string;
      name: string;
    } | null;
    logical_fiber_path?: {
      id: string;
      path_name: string;
    } | null;
    system?: {
      id: string;
      system_name: string;
    } | null;
    ofc_cable?: {
      id: string;
      route_name: string;
    } | null;
  };
  
  export type SdhConnectionRowsWithRelations = Row<'sdh_connections'> & {
    system_connection?: {
      id: string;
    } | null;
  };
  
  export type SdhNodeAssociationRowsWithRelations = Row<'sdh_node_associations'> & {
    node?: {
      id: string;
      name: string;
    } | null;
    sdh_system?: {
      system_id: string;
    } | null;
  };
  
  export type SdhSystemRowsWithRelations = Row<'sdh_systems'> & {
    system?: {
      id: string;
    } | null;
  };
  
  export type SystemConnectionRowsWithRelations = Row<'system_connections'> & {
    connected_system?: {
      id: string;
      system_name: string;
    } | null;
    en_system?: {
      id: string;
      system_name: string;
    } | null;
    media_type?: {
      id: string;
      name: string;
    } | null;
    sn_system?: {
      id: string;
      system_name: string;
    } | null;
    system?: {
      id: string;
      system_name: string;
    } | null;
  };
  
  // In your types file, update the SystemRowsWithRelations type:
export type SystemRowsWithRelations = Row<'systems'> & {
  maintenance_terminal?: {
    id: string;
    name: string;
  } | null;
  node?: {
    id: string;
    name: string;
  } | null;
  system_type?: {
    id: string;
    name: string;
  } | null;
  // Add this to make commissioned_on required
  commissioned_on: Date | null;
} & {
  // This makes all fields from the base Row type required
  [K in keyof Row<'systems'>]: Row<'systems'>[K];
};
  
  export type UserActivityLogRowsWithRelations = Row<'user_activity_logs'> & {
    user_profile_extended?: {
      id: string;
    } | null;
  };
  
  export type UserProfileRowsWithRelations = Row<'user_profiles'> & {
    user_profile_extended?: {
      id: string;
    } | null;
  };
  
  export type VmuxConnectionRowsWithRelations = Row<'vmux_connections'> & {
    system_connection?: {
      id: string;
    } | null;
  };
  
  export type VmuxSystemRowsWithRelations = Row<'vmux_systems'> & {
    system?: {
      id: string;
    } | null;
  };