import { Employee_designationsRowSchema, EmployeesRowSchema, Logical_fiber_pathsRowSchema, Maintenance_areasRowSchema, Management_portsInsertSchema, NodesRowSchema, Ofc_cablesRowSchema, Ofc_connectionsRowSchema, RingsRowSchema, Sdh_connectionsRowSchema, Sdh_node_associationsRowSchema, Sdh_systemsRowSchema, System_connectionsRowSchema, SystemsRowSchema, User_profilesRowSchema, V_system_connections_completeRowSchema, V_systems_completeRowSchema, Vmux_connectionsRowSchema, Vmux_systemsRowSchema } from "@/schemas/zod-schemas";


export type RingRowsWithRelations = RingsRowSchema & {
  ring_type?: {
    id: string;
    code: string;
  } | null;
  maintenance_terminal?: {
    id: string;
    name: string;
  } | null;
};
  
  export type EmployeeDesignationRowsWithRelations = Employee_designationsRowSchema & {
    parent?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type EmployeeRowsWithRelations = EmployeesRowSchema & {
    employee_designation?: {
      id: string;
      name: string;
    } | null;
    maintenance_terminal?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type LogicalFiberPathRowsWithRelations = Logical_fiber_pathsRowSchema & {
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
  
  
  export type MaintenanceAreaRowsWithRelations = Maintenance_areasRowSchema & {
    area_type?: {
      id: string;
      name: string;
    } | null;
    parent?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type ManagementPortRowsWithRelations = Management_portsInsertSchema & {
    node?: {
      id: string;
      name: string;
    } | null;
    system?: {
      id: string;
      system_name: string;
    } | null;
  };
  
  export type NodeRowsWithRelations = NodesRowSchema & {
    maintenance_terminal?: {
      id: string;
      name: string;
    } | null;
    node_type?: {
      id: string;
      name: string;
    } | null;
  };
  
  export type OfcCableRowsWithRelations = Ofc_cablesRowSchema & {
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
  
  export type OfcConnectionRowsWithRelations = Ofc_connectionsRowSchema & {
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
  
  export type SdhConnectionRowsWithRelations = Sdh_connectionsRowSchema & {
    system_connection?: {
      id: string;
    } | null;
  };
  
  export type SdhNodeAssociationRowsWithRelations = Sdh_node_associationsRowSchema & {
    node?: {
      id: string;
      name: string;
    } | null;
    sdh_system?: {
      system_id: string;
    } | null;
  };
  
  export type SdhSystemRowsWithRelations = Sdh_systemsRowSchema & {
    system?: {
      id: string;
    } | null;
  };
  
  export type SystemConnectionRowsWithRelations = System_connectionsRowSchema & {
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
export type SystemRowsWithRelations = SystemsRowSchema & {
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
  [K in keyof SystemsRowSchema]: SystemsRowSchema[K];
};
  
  // export type UserActivityLogRowsWithRelations = User_activity_logsRowSchema & {
  //   user_profile_extended?: {
  //     id: string;
  //   } | null;
  // };
  
  export type UserProfileRowsWithRelations = User_profilesRowSchema & {
    user_profile_extended?: {
      id: string;
    } | null;
  };
  
  export type VmuxConnectionRowsWithRelations = Vmux_connectionsRowSchema & {
    system_connection?: {
      id: string;
    } | null;
  };
  
  export type VmuxSystemRowsWithRelations = Vmux_systemsRowSchema & {
    system?: {
      id: string;
    } | null;
  };

  export type  SystemRowsWithCountWithRelations = V_systems_completeRowSchema & {
    system_type?: {
        id: string;
        name: string;
    } | null;
    node?: {
        id: string;
        name: string;
    } | null;
    maintenance_terminal?: {
        id: string;
        name: string;
    } | null;
};

export type OfcConnectionRowsWithCountWithRelations = V_system_connections_completeRowSchema & {
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

    
