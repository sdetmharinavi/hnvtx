export const desiredCpanConnectionColumnOrder = [
    "customer_name",
    "bandwidth_allocated_mbps",
    "sfp_type_id",
    "sfp_capacity",
    "sfp_port",
    "sfp_serial_no",
    "fiber_in",
    "fiber_out",
    "system_connection_id",
  ];
  
  export const desiredCpanSystemColumnOrder = [
    "area",
    "ring_no",
    "system_id",
  ];
  
  export const desiredEmployeeDesignationColumnOrder = [
    "name",
    "parent_id",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredEmployeeColumnOrder = [
    "employee_name",
    "employee_pers_no",
    "employee_designation_id",
    "employee_contact",
    "employee_email",
    "employee_addr",
    "employee_dob",
    "employee_doj",
    "maintenance_terminal_id",
    "remark",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredFiberJointConnectionColumnOrder = [
    "joint_id",
    "input_ofc_id",
    "input_fiber_no",
    "output_ofc_id",
    "output_fiber_no",
    "splice_loss_db",
    "logical_path_id",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredFiberJointColumnOrder = [
    "joint_name",
    "joint_category",
    "joint_type",
    "installed_date",
    "node_id",
    "maintenance_area_id",
    "location_description",
    "latitude",
    "longitude",
    "remark",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredLogicalFiberPathColumnOrder = [
    "path_name",
    "path_category",
    "path_type",
    "source_system_id",
    "destination_system_id",
    "source_port",
    "destination_port",
    "operational_status_category",
    "operational_status",
    "service_type",
    "bandwidth_gbps",
    "wavelength_nm",
    "total_distance_km",
    "total_loss_db",
    "commissioned_date",
    "remark",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredLookupTypeColumnOrder = [
    "category",
    "name",
    "code",
    "description",
    "sort_order",
    "is_system_default",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredMaanConnectionColumnOrder = [
    "customer_name",
    "bandwidth_allocated_mbps",
    "sfp_type_id",
    "sfp_capacity",
    "sfp_port",
    "sfp_serial_no",
    "fiber_in",
    "fiber_out",
    "system_connection_id",
  ];
  
  export const desiredMaanSystemColumnOrder = [
    "area",
    "ring_no",
    "system_id",
  ];
  
  export const desiredMaintenanceAreaColumnOrder = [
    "name",
    "area_type_id",
    "code",
    "parent_id",
    "address",
    "contact_person",
    "contact_number",
    "email",
    "latitude",
    "longitude",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredManagementPortColumnOrder = [
    "port_no",
    "name",
    "system_id",
    "node_id",
    "commissioned_on",
    "remark",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredNodeColumnOrder = [
    "name",
    "node_type_id",
    "maintenance_terminal_id",
    "latitude",
    "longitude",
    "remark",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredOfcCableColumnOrder = [
    "route_name",
    "ofc_type_id",
    "capacity",
    "ofc_owner_id",
    "sn_id",
    "en_id",
    "transnet_id",
    "transnet_rkm",
    "current_rkm",
    "maintenance_terminal_id",
    "asset_no",
    "commissioned_on",
    "remark",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredOfcConnectionColumnOrder = [
    "ofc_id",
    "connection_category",
    "connection_type",
    "system_id",
    "fiber_no_sn",
    "fiber_no_en",
    "source_port",
    "destination_port",
    "sn_power_dbm",
    "en_power_dbm",
    "route_loss_db",
    "sn_dom",
    "en_dom",
    "otdr_distance_sn_km",
    "otdr_distance_en_km",
    "logical_path_id",
    "path_segment_order",
    "remark",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  // "id", "created_at", "updated_at","active_count","inactive_count","maintenance_area_area_type_id","maintenance_area_code","maintenance_area_contact_number","maintenance_area_contact_person","maintenance_area_created_at","maintenance_area_email","maintenance_area_latitude","maintenance_area_longitude","maintenance_area_parent_id","maintenance_area_status","maintenance_area_updated_at","ring_type_category","ring_type_created_at","ring_type_id","ring_type_is_system_default","ring_type_name","ring_type_sort_order","ring_type_status","ring_type_updated_at","total_count","maintenance_terminal_id"
  export const desiredRingColumnOrder = [
    "name",
    "total_nodes",
    "maintenance_area_name",
    "ring_type_code",
    "description",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredSdhConnectionColumnOrder = [
    "stm_no",
    "carrier",
    "a_customer",
    "b_customer",
    "a_slot",
    "b_slot",
    "system_connection_id",
  ];
  
  export const desiredSdhNodeAssociationColumnOrder = [
    "sdh_system_id",
    "node_id",
    "node_position",
    "node_ip",
    "id",
  ];
  
  export const desiredSdhSystemColumnOrder = [
    "gne",
    "make",
    "system_id",
  ];
  
  export const desiredSystemConnectionColumnOrder = [
    "system_id",
    "connected_system_id",
    "media_type_id",
    "bandwidth_mbps",
    "sn_id",
    "sn_interface",
    "sn_ip",
    "en_id",
    "en_interface",
    "en_ip",
    "vlan",
    "commissioned_on",
    "remark",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredSystemColumnOrder = [
    "system_name",
    "system_type_id",
    "node_id",
    "s_no",
    "ip_address",
    "maintenance_terminal_id",
    "commissioned_on",
    "remark",
    "status",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredUserActivityLogColumnOrder = [
    "user_id",
    "user_role",
    "action_type",
    "table_name",
    "record_id",
    "details",
    "old_data",
    "new_data",
    "created_at",
    "id",
  ];
  
  export const desiredUserProfileColumnOrder = [
    "first_name",
    "last_name",
    "designation",
    "phone_number",
    "email", // Assuming email will be derived from user_profiles_extended or similar
    "role",
    "status",
    "date_of_birth",
    "address",
    "avatar_url",
    "preferences",
    "created_at",
    "updated_at",
    "id",
  ];
  
  export const desiredVmuxConnectionColumnOrder = [
    "c_code",
    "subscriber",
    "channel",
    "tk",
    "system_connection_id",
  ];
  
  export const desiredVmuxSystemColumnOrder = [
    "vm_id",
    "system_id",
  ];