// Auto-generated from types/supabase-types.ts

import type { Json } from "@/types/supabase-types";

// ============= TABLES =============

export type AuthUsersRow = {
    aud: string | null;
    banned_until: string | null;
    confirmation_sent_at: string | null;
    confirmation_token: string | null;
    confirmed_at: string | null;
    created_at: string | null;
    deleted_at: string | null;
    email: string | null;
    email_change: string | null;
    email_change_confirm_status: number | null;
    email_change_sent_at: string | null;
    email_change_token_current: string | null;
    email_change_token_new: string | null;
    email_confirmed_at: string | null;
    encrypted_password: string | null;
    id: string;
    instance_id: string | null;
    invited_at: string | null;
    is_anonymous: boolean;
    is_sso_user: boolean;
    is_super_admin: boolean | null;
    last_sign_in_at: string | null;
    phone: string | null;
    phone_change: string | null;
    phone_change_sent_at: string | null;
    phone_change_token: string | null;
    phone_confirmed_at: string | null;
    raw_app_meta_data: Json | null;
    raw_user_meta_data: Json | null;
    reauthentication_sent_at: string | null;
    reauthentication_token: string | null;
    recovery_sent_at: string | null;
    recovery_token: string | null;
    role: string | null;
    updated_at: string | null;
};

export type AuthUsersInsert = {
    aud?: string | null;
    banned_until?: string | null;
    confirmation_sent_at?: string | null;
    confirmation_token?: string | null;
    confirmed_at?: string | null;
    created_at?: string | null;
    deleted_at?: string | null;
    email?: string | null;
    email_change?: string | null;
    email_change_confirm_status?: number | null;
    email_change_sent_at?: string | null;
    email_change_token_current?: string | null;
    email_change_token_new?: string | null;
    email_confirmed_at?: string | null;
    encrypted_password?: string | null;
    id: string;
    instance_id?: string | null;
    invited_at?: string | null;
    is_anonymous?: boolean;
    is_sso_user?: boolean;
    is_super_admin?: boolean | null;
    last_sign_in_at?: string | null;
    phone?: string | null;
    phone_change?: string | null;
    phone_change_sent_at?: string | null;
    phone_change_token?: string | null;
    phone_confirmed_at?: string | null;
    raw_app_meta_data?: Json | null;
    raw_user_meta_data?: Json | null;
    reauthentication_sent_at?: string | null;
    reauthentication_token?: string | null;
    recovery_sent_at?: string | null;
    recovery_token?: string | null;
    role?: string | null;
    updated_at?: string | null;
};

export type AuthUsersUpdate = {
    aud?: string | null;
    banned_until?: string | null;
    confirmation_sent_at?: string | null;
    confirmation_token?: string | null;
    confirmed_at?: string | null;
    created_at?: string | null;
    deleted_at?: string | null;
    email?: string | null;
    email_change?: string | null;
    email_change_confirm_status?: number | null;
    email_change_sent_at?: string | null;
    email_change_token_current?: string | null;
    email_change_token_new?: string | null;
    email_confirmed_at?: string | null;
    encrypted_password?: string | null;
    id?: string;
    instance_id?: string | null;
    invited_at?: string | null;
    is_anonymous?: boolean;
    is_sso_user?: boolean;
    is_super_admin?: boolean | null;
    last_sign_in_at?: string | null;
    phone?: string | null;
    phone_change?: string | null;
    phone_change_sent_at?: string | null;
    phone_change_token?: string | null;
    phone_confirmed_at?: string | null;
    raw_app_meta_data?: Json | null;
    raw_user_meta_data?: Json | null;
    reauthentication_sent_at?: string | null;
    reauthentication_token?: string | null;
    recovery_sent_at?: string | null;
    recovery_token?: string | null;
    role?: string | null;
    updated_at?: string | null;
};

export type Cable_segmentsRow = {
    created_at: string | null;
    distance_km: number;
    end_node_id: string;
    end_node_type: string;
    fiber_count: number;
    id: string;
    original_cable_id: string;
    segment_order: number;
    start_node_id: string;
    start_node_type: string;
    updated_at: string | null;
};

export type Cable_segmentsInsert = {
    created_at?: string | null;
    distance_km: number;
    end_node_id: string;
    end_node_type: string;
    fiber_count: number;
    id?: string;
    original_cable_id: string;
    segment_order: number;
    start_node_id: string;
    start_node_type: string;
    updated_at?: string | null;
};

export type Cable_segmentsUpdate = {
    created_at?: string | null;
    distance_km?: number;
    end_node_id?: string;
    end_node_type?: string;
    fiber_count?: number;
    id?: string;
    original_cable_id?: string;
    segment_order?: number;
    start_node_id?: string;
    start_node_type?: string;
    updated_at?: string | null;
};

export type Diary_notesRow = {
    content: string | null;
    created_at: string | null;
    id: string;
    note_date: string;
    tags: string[] | null;
    updated_at: string | null;
    user_id: string;
};

export type Diary_notesInsert = {
    content?: string | null;
    created_at?: string | null;
    id?: string;
    note_date?: string;
    tags?: string[] | null;
    updated_at?: string | null;
    user_id?: string;
};

export type Diary_notesUpdate = {
    content?: string | null;
    created_at?: string | null;
    id?: string;
    note_date?: string;
    tags?: string[] | null;
    updated_at?: string | null;
    user_id?: string;
};

export type E_filesRow = {
    category: string;
    created_at: string | null;
    current_holder_employee_id: string;
    description: string | null;
    file_number: string;
    id: string;
    initiator_employee_id: string;
    priority: string | null;
    recorded_by_user_id: string;
    status: string | null;
    subject: string;
    updated_at: string | null;
};

export type E_filesInsert = {
    category: string;
    created_at?: string | null;
    current_holder_employee_id: string;
    description?: string | null;
    file_number: string;
    id?: string;
    initiator_employee_id: string;
    priority?: string | null;
    recorded_by_user_id: string;
    status?: string | null;
    subject: string;
    updated_at?: string | null;
};

export type E_filesUpdate = {
    category?: string;
    created_at?: string | null;
    current_holder_employee_id?: string;
    description?: string | null;
    file_number?: string;
    id?: string;
    initiator_employee_id?: string;
    priority?: string | null;
    recorded_by_user_id?: string;
    status?: string | null;
    subject?: string;
    updated_at?: string | null;
};

export type Employee_designationsRow = {
    created_at: string | null;
    id: string;
    name: string;
    parent_id: string | null;
    status: boolean | null;
    updated_at: string | null;
};

export type Employee_designationsInsert = {
    created_at?: string | null;
    id?: string;
    name: string;
    parent_id?: string | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type Employee_designationsUpdate = {
    created_at?: string | null;
    id?: string;
    name?: string;
    parent_id?: string | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type EmployeesRow = {
    created_at: string | null;
    employee_addr: string | null;
    employee_contact: string | null;
    employee_designation_id: string | null;
    employee_dob: string | null;
    employee_doj: string | null;
    employee_email: string | null;
    employee_name: string;
    employee_pers_no: string | null;
    id: string;
    maintenance_terminal_id: string | null;
    remark: string | null;
    status: boolean | null;
    updated_at: string | null;
};

export type EmployeesInsert = {
    created_at?: string | null;
    employee_addr?: string | null;
    employee_contact?: string | null;
    employee_designation_id?: string | null;
    employee_dob?: string | null;
    employee_doj?: string | null;
    employee_email?: string | null;
    employee_name: string;
    employee_pers_no?: string | null;
    id?: string;
    maintenance_terminal_id?: string | null;
    remark?: string | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type EmployeesUpdate = {
    created_at?: string | null;
    employee_addr?: string | null;
    employee_contact?: string | null;
    employee_designation_id?: string | null;
    employee_dob?: string | null;
    employee_doj?: string | null;
    employee_email?: string | null;
    employee_name?: string;
    employee_pers_no?: string | null;
    id?: string;
    maintenance_terminal_id?: string | null;
    remark?: string | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type Fiber_splicesRow = {
    created_at: string | null;
    id: string;
    incoming_fiber_no: number;
    incoming_segment_id: string;
    jc_id: string;
    logical_path_id: string | null;
    loss_db: number | null;
    outgoing_fiber_no: number | null;
    outgoing_segment_id: string | null;
    splice_type_id: string;
    updated_at: string | null;
};

export type Fiber_splicesInsert = {
    created_at?: string | null;
    id?: string;
    incoming_fiber_no: number;
    incoming_segment_id: string;
    jc_id: string;
    logical_path_id?: string | null;
    loss_db?: number | null;
    outgoing_fiber_no?: number | null;
    outgoing_segment_id?: string | null;
    splice_type_id: string;
    updated_at?: string | null;
};

export type Fiber_splicesUpdate = {
    created_at?: string | null;
    id?: string;
    incoming_fiber_no?: number;
    incoming_segment_id?: string;
    jc_id?: string;
    logical_path_id?: string | null;
    loss_db?: number | null;
    outgoing_fiber_no?: number | null;
    outgoing_segment_id?: string | null;
    splice_type_id?: string;
    updated_at?: string | null;
};

export type File_movementsRow = {
    action_type: string;
    created_at: string | null;
    file_id: string;
    from_employee_id: string | null;
    id: string;
    performed_by_user_id: string;
    remarks: string | null;
    to_employee_id: string;
};

export type File_movementsInsert = {
    action_type: string;
    created_at?: string | null;
    file_id: string;
    from_employee_id?: string | null;
    id?: string;
    performed_by_user_id?: string;
    remarks?: string | null;
    to_employee_id: string;
};

export type File_movementsUpdate = {
    action_type?: string;
    created_at?: string | null;
    file_id?: string;
    from_employee_id?: string | null;
    id?: string;
    performed_by_user_id?: string;
    remarks?: string | null;
    to_employee_id?: string;
};

export type FilesRow = {
    file_name: string;
    file_route: string;
    file_size: string;
    file_type: string;
    file_url: string;
    folder_id: string | null;
    id: string;
    uploaded_at: string | null;
    user_id: string;
};

export type FilesInsert = {
    file_name: string;
    file_route: string;
    file_size: string;
    file_type: string;
    file_url: string;
    folder_id?: string | null;
    id?: string;
    uploaded_at?: string | null;
    user_id: string;
};

export type FilesUpdate = {
    file_name?: string;
    file_route?: string;
    file_size?: string;
    file_type?: string;
    file_url?: string;
    folder_id?: string | null;
    id?: string;
    uploaded_at?: string | null;
    user_id?: string;
};

export type FoldersRow = {
    created_at: string | null;
    id: string;
    name: string;
    user_id: string;
};

export type FoldersInsert = {
    created_at?: string | null;
    id?: string;
    name: string;
    user_id: string;
};

export type FoldersUpdate = {
    created_at?: string | null;
    id?: string;
    name?: string;
    user_id?: string;
};

export type Inventory_itemsRow = {
    asset_no: string | null;
    category_id: string | null;
    cost: number | null;
    created_at: string | null;
    description: string | null;
    functional_location_id: string | null;
    id: string;
    location_id: string | null;
    name: string;
    purchase_date: string | null;
    quantity: number;
    status_id: string | null;
    updated_at: string | null;
    vendor: string | null;
};

export type Inventory_itemsInsert = {
    asset_no?: string | null;
    category_id?: string | null;
    cost?: number | null;
    created_at?: string | null;
    description?: string | null;
    functional_location_id?: string | null;
    id?: string;
    location_id?: string | null;
    name: string;
    purchase_date?: string | null;
    quantity?: number;
    status_id?: string | null;
    updated_at?: string | null;
    vendor?: string | null;
};

export type Inventory_itemsUpdate = {
    asset_no?: string | null;
    category_id?: string | null;
    cost?: number | null;
    created_at?: string | null;
    description?: string | null;
    functional_location_id?: string | null;
    id?: string;
    location_id?: string | null;
    name?: string;
    purchase_date?: string | null;
    quantity?: number;
    status_id?: string | null;
    updated_at?: string | null;
    vendor?: string | null;
};

export type Inventory_transactionsRow = {
    created_at: string | null;
    id: string;
    inventory_item_id: string;
    issue_reason: string | null;
    issued_date: string | null;
    issued_to: string | null;
    performed_by_user_id: string | null;
    quantity: number;
    total_cost_calculated: number | null;
    transaction_type: string;
    unit_cost_at_time: number | null;
};

export type Inventory_transactionsInsert = {
    created_at?: string | null;
    id?: string;
    inventory_item_id: string;
    issue_reason?: string | null;
    issued_date?: string | null;
    issued_to?: string | null;
    performed_by_user_id?: string | null;
    quantity: number;
    total_cost_calculated?: number | null;
    transaction_type: string;
    unit_cost_at_time?: number | null;
};

export type Inventory_transactionsUpdate = {
    created_at?: string | null;
    id?: string;
    inventory_item_id?: string;
    issue_reason?: string | null;
    issued_date?: string | null;
    issued_to?: string | null;
    performed_by_user_id?: string | null;
    quantity?: number;
    total_cost_calculated?: number | null;
    transaction_type?: string;
    unit_cost_at_time?: number | null;
};

export type Junction_closuresRow = {
    created_at: string | null;
    id: string;
    node_id: string;
    ofc_cable_id: string;
    position_km: number | null;
    updated_at: string | null;
};

export type Junction_closuresInsert = {
    created_at?: string | null;
    id?: string;
    node_id: string;
    ofc_cable_id: string;
    position_km?: number | null;
    updated_at?: string | null;
};

export type Junction_closuresUpdate = {
    created_at?: string | null;
    id?: string;
    node_id?: string;
    ofc_cable_id?: string;
    position_km?: number | null;
    updated_at?: string | null;
};

export type Logical_fiber_pathsRow = {
    bandwidth_gbps: number | null;
    commissioned_date: string | null;
    created_at: string | null;
    destination_port: string | null;
    destination_system_id: string | null;
    id: string;
    operational_status_id: string | null;
    path_name: string | null;
    path_role: string;
    path_type_id: string | null;
    remark: string | null;
    service_type: string | null;
    source_port: string | null;
    source_system_id: string | null;
    system_connection_id: string | null;
    total_distance_km: number | null;
    total_loss_db: number | null;
    updated_at: string | null;
    wavelength_nm: number | null;
    working_path_id: string | null;
};

export type Logical_fiber_pathsInsert = {
    bandwidth_gbps?: number | null;
    commissioned_date?: string | null;
    created_at?: string | null;
    destination_port?: string | null;
    destination_system_id?: string | null;
    id?: string;
    operational_status_id?: string | null;
    path_name?: string | null;
    path_role?: string;
    path_type_id?: string | null;
    remark?: string | null;
    service_type?: string | null;
    source_port?: string | null;
    source_system_id?: string | null;
    system_connection_id?: string | null;
    total_distance_km?: number | null;
    total_loss_db?: number | null;
    updated_at?: string | null;
    wavelength_nm?: number | null;
    working_path_id?: string | null;
};

export type Logical_fiber_pathsUpdate = {
    bandwidth_gbps?: number | null;
    commissioned_date?: string | null;
    created_at?: string | null;
    destination_port?: string | null;
    destination_system_id?: string | null;
    id?: string;
    operational_status_id?: string | null;
    path_name?: string | null;
    path_role?: string;
    path_type_id?: string | null;
    remark?: string | null;
    service_type?: string | null;
    source_port?: string | null;
    source_system_id?: string | null;
    system_connection_id?: string | null;
    total_distance_km?: number | null;
    total_loss_db?: number | null;
    updated_at?: string | null;
    wavelength_nm?: number | null;
    working_path_id?: string | null;
};

export type Logical_path_segmentsRow = {
    created_at: string | null;
    id: string;
    logical_path_id: string;
    ofc_cable_id: string | null;
    path_order: number;
    updated_at: string | null;
};

export type Logical_path_segmentsInsert = {
    created_at?: string | null;
    id?: string;
    logical_path_id: string;
    ofc_cable_id?: string | null;
    path_order: number;
    updated_at?: string | null;
};

export type Logical_path_segmentsUpdate = {
    created_at?: string | null;
    id?: string;
    logical_path_id?: string;
    ofc_cable_id?: string | null;
    path_order?: number;
    updated_at?: string | null;
};

export type Logical_pathsRow = {
    created_at: string | null;
    destination_port: string | null;
    destination_system_id: string | null;
    end_node_id: string | null;
    id: string;
    name: string;
    ring_id: string | null;
    source_port: string | null;
    source_system_id: string | null;
    start_node_id: string | null;
    status: string | null;
    updated_at: string | null;
};

export type Logical_pathsInsert = {
    created_at?: string | null;
    destination_port?: string | null;
    destination_system_id?: string | null;
    end_node_id?: string | null;
    id?: string;
    name: string;
    ring_id?: string | null;
    source_port?: string | null;
    source_system_id?: string | null;
    start_node_id?: string | null;
    status?: string | null;
    updated_at?: string | null;
};

export type Logical_pathsUpdate = {
    created_at?: string | null;
    destination_port?: string | null;
    destination_system_id?: string | null;
    end_node_id?: string | null;
    id?: string;
    name?: string;
    ring_id?: string | null;
    source_port?: string | null;
    source_system_id?: string | null;
    start_node_id?: string | null;
    status?: string | null;
    updated_at?: string | null;
};

export type Lookup_typesRow = {
    category: string;
    code: string | null;
    created_at: string | null;
    description: string | null;
    id: string;
    is_ring_based: boolean | null;
    is_system_default: boolean | null;
    name: string;
    sort_order: number | null;
    status: boolean | null;
    updated_at: string | null;
};

export type Lookup_typesInsert = {
    category: string;
    code?: string | null;
    created_at?: string | null;
    description?: string | null;
    id?: string;
    is_ring_based?: boolean | null;
    is_system_default?: boolean | null;
    name: string;
    sort_order?: number | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type Lookup_typesUpdate = {
    category?: string;
    code?: string | null;
    created_at?: string | null;
    description?: string | null;
    id?: string;
    is_ring_based?: boolean | null;
    is_system_default?: boolean | null;
    name?: string;
    sort_order?: number | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type Maintenance_areasRow = {
    address: string | null;
    area_type_id: string | null;
    code: string | null;
    contact_number: string | null;
    contact_person: string | null;
    created_at: string | null;
    email: string | null;
    id: string;
    latitude: number | null;
    longitude: number | null;
    name: string;
    parent_id: string | null;
    status: boolean | null;
    updated_at: string | null;
};

export type Maintenance_areasInsert = {
    address?: string | null;
    area_type_id?: string | null;
    code?: string | null;
    contact_number?: string | null;
    contact_person?: string | null;
    created_at?: string | null;
    email?: string | null;
    id?: string;
    latitude?: number | null;
    longitude?: number | null;
    name: string;
    parent_id?: string | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type Maintenance_areasUpdate = {
    address?: string | null;
    area_type_id?: string | null;
    code?: string | null;
    contact_number?: string | null;
    contact_person?: string | null;
    created_at?: string | null;
    email?: string | null;
    id?: string;
    latitude?: number | null;
    longitude?: number | null;
    name?: string;
    parent_id?: string | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type NodesRow = {
    created_at: string | null;
    id: string;
    latitude: number | null;
    longitude: number | null;
    maintenance_terminal_id: string | null;
    name: string;
    node_type_id: string | null;
    remark: string | null;
    status: boolean | null;
    updated_at: string | null;
};

export type NodesInsert = {
    created_at?: string | null;
    id?: string;
    latitude?: number | null;
    longitude?: number | null;
    maintenance_terminal_id?: string | null;
    name: string;
    node_type_id?: string | null;
    remark?: string | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type NodesUpdate = {
    created_at?: string | null;
    id?: string;
    latitude?: number | null;
    longitude?: number | null;
    maintenance_terminal_id?: string | null;
    name?: string;
    node_type_id?: string | null;
    remark?: string | null;
    status?: boolean | null;
    updated_at?: string | null;
};

export type Ofc_cablesRow = {
    asset_no: string | null;
    capacity: number;
    commissioned_on: string | null;
    created_at: string | null;
    current_rkm: number | null;
    en_id: string;
    id: string;
    maintenance_terminal_id: string | null;
    ofc_owner_id: string;
    ofc_type_id: string;
    remark: string | null;
    route_name: string;
    sn_id: string;
    status: boolean | null;
    transnet_id: string | null;
    transnet_rkm: number | null;
    updated_at: string | null;
};

export type Ofc_cablesInsert = {
    asset_no?: string | null;
    capacity: number;
    commissioned_on?: string | null;
    created_at?: string | null;
    current_rkm?: number | null;
    en_id: string;
    id?: string;
    maintenance_terminal_id?: string | null;
    ofc_owner_id: string;
    ofc_type_id: string;
    remark?: string | null;
    route_name: string;
    sn_id: string;
    status?: boolean | null;
    transnet_id?: string | null;
    transnet_rkm?: number | null;
    updated_at?: string | null;
};

export type Ofc_cablesUpdate = {
    asset_no?: string | null;
    capacity?: number;
    commissioned_on?: string | null;
    created_at?: string | null;
    current_rkm?: number | null;
    en_id?: string;
    id?: string;
    maintenance_terminal_id?: string | null;
    ofc_owner_id?: string;
    ofc_type_id?: string;
    remark?: string | null;
    route_name?: string;
    sn_id?: string;
    status?: boolean | null;
    transnet_id?: string | null;
    transnet_rkm?: number | null;
    updated_at?: string | null;
};

export type Ofc_connectionsRow = {
    connection_category: string;
    connection_type: string;
    created_at: string | null;
    destination_port: string | null;
    en_dom: string | null;
    en_power_dbm: number | null;
    fiber_no_en: number;
    fiber_no_sn: number;
    fiber_role: string | null;
    id: string;
    logical_path_id: string | null;
    ofc_id: string;
    otdr_distance_en_km: number | null;
    otdr_distance_sn_km: number | null;
    path_direction: string | null;
    path_segment_order: number | null;
    remark: string | null;
    route_loss_db: number | null;
    sn_dom: string | null;
    sn_power_dbm: number | null;
    source_port: string | null;
    status: boolean | null;
    system_id: string | null;
    updated_at: string | null;
    updated_en_id: string | null;
    updated_fiber_no_en: number | null;
    updated_fiber_no_sn: number | null;
    updated_sn_id: string | null;
};

export type Ofc_connectionsInsert = {
    connection_category?: string;
    connection_type?: string;
    created_at?: string | null;
    destination_port?: string | null;
    en_dom?: string | null;
    en_power_dbm?: number | null;
    fiber_no_en: number;
    fiber_no_sn: number;
    fiber_role?: string | null;
    id?: string;
    logical_path_id?: string | null;
    ofc_id: string;
    otdr_distance_en_km?: number | null;
    otdr_distance_sn_km?: number | null;
    path_direction?: string | null;
    path_segment_order?: number | null;
    remark?: string | null;
    route_loss_db?: number | null;
    sn_dom?: string | null;
    sn_power_dbm?: number | null;
    source_port?: string | null;
    status?: boolean | null;
    system_id?: string | null;
    updated_at?: string | null;
    updated_en_id?: string | null;
    updated_fiber_no_en?: number | null;
    updated_fiber_no_sn?: number | null;
    updated_sn_id?: string | null;
};

export type Ofc_connectionsUpdate = {
    connection_category?: string;
    connection_type?: string;
    created_at?: string | null;
    destination_port?: string | null;
    en_dom?: string | null;
    en_power_dbm?: number | null;
    fiber_no_en?: number;
    fiber_no_sn?: number;
    fiber_role?: string | null;
    id?: string;
    logical_path_id?: string | null;
    ofc_id?: string;
    otdr_distance_en_km?: number | null;
    otdr_distance_sn_km?: number | null;
    path_direction?: string | null;
    path_segment_order?: number | null;
    remark?: string | null;
    route_loss_db?: number | null;
    sn_dom?: string | null;
    sn_power_dbm?: number | null;
    source_port?: string | null;
    status?: boolean | null;
    system_id?: string | null;
    updated_at?: string | null;
    updated_en_id?: string | null;
    updated_fiber_no_en?: number | null;
    updated_fiber_no_sn?: number | null;
    updated_sn_id?: string | null;
};

export type Ports_managementRow = {
    created_at: string | null;
    id: string;
    port: string | null;
    port_admin_status: boolean | null;
    port_capacity: string | null;
    port_type_id: string | null;
    port_utilization: boolean | null;
    services_count: number | null;
    sfp_serial_no: string | null;
    system_id: string;
    updated_at: string | null;
};

export type Ports_managementInsert = {
    created_at?: string | null;
    id?: string;
    port?: string | null;
    port_admin_status?: boolean | null;
    port_capacity?: string | null;
    port_type_id?: string | null;
    port_utilization?: boolean | null;
    services_count?: number | null;
    sfp_serial_no?: string | null;
    system_id: string;
    updated_at?: string | null;
};

export type Ports_managementUpdate = {
    created_at?: string | null;
    id?: string;
    port?: string | null;
    port_admin_status?: boolean | null;
    port_capacity?: string | null;
    port_type_id?: string | null;
    port_utilization?: boolean | null;
    services_count?: number | null;
    sfp_serial_no?: string | null;
    system_id?: string;
    updated_at?: string | null;
};

export type Ring_based_systemsRow = {
    maintenance_area_id: string | null;
    order_in_ring: number | null;
    ring_id: string;
    system_id: string;
};

export type Ring_based_systemsInsert = {
    maintenance_area_id?: string | null;
    order_in_ring?: number | null;
    ring_id: string;
    system_id: string;
};

export type Ring_based_systemsUpdate = {
    maintenance_area_id?: string | null;
    order_in_ring?: number | null;
    ring_id?: string;
    system_id?: string;
};

export type RingsRow = {
    bts_status: string | null;
    created_at: string | null;
    description: string | null;
    id: string;
    is_closed_loop: boolean | null;
    maintenance_terminal_id: string | null;
    name: string;
    ofc_status: string | null;
    ring_type_id: string | null;
    spec_status: string | null;
    status: boolean | null;
    topology_config: Json | null;
    total_nodes: number | null;
    updated_at: string | null;
};

export type RingsInsert = {
    bts_status?: string | null;
    created_at?: string | null;
    description?: string | null;
    id?: string;
    is_closed_loop?: boolean | null;
    maintenance_terminal_id?: string | null;
    name: string;
    ofc_status?: string | null;
    ring_type_id?: string | null;
    spec_status?: string | null;
    status?: boolean | null;
    topology_config?: Json | null;
    total_nodes?: number | null;
    updated_at?: string | null;
};

export type RingsUpdate = {
    bts_status?: string | null;
    created_at?: string | null;
    description?: string | null;
    id?: string;
    is_closed_loop?: boolean | null;
    maintenance_terminal_id?: string | null;
    name?: string;
    ofc_status?: string | null;
    ring_type_id?: string | null;
    spec_status?: string | null;
    status?: boolean | null;
    topology_config?: Json | null;
    total_nodes?: number | null;
    updated_at?: string | null;
};

export type Sdh_connectionsRow = {
    a_customer: string | null;
    a_slot: string | null;
    b_customer: string | null;
    b_slot: string | null;
    carrier: string | null;
    stm_no: string | null;
    system_connection_id: string;
};

export type Sdh_connectionsInsert = {
    a_customer?: string | null;
    a_slot?: string | null;
    b_customer?: string | null;
    b_slot?: string | null;
    carrier?: string | null;
    stm_no?: string | null;
    system_connection_id: string;
};

export type Sdh_connectionsUpdate = {
    a_customer?: string | null;
    a_slot?: string | null;
    b_customer?: string | null;
    b_slot?: string | null;
    carrier?: string | null;
    stm_no?: string | null;
    system_connection_id?: string;
};

export type ServicesRow = {
    bandwidth_allocated: string | null;
    created_at: string | null;
    description: string | null;
    end_node_id: string | null;
    id: string;
    lc_id: string | null;
    link_type_id: string | null;
    name: string;
    node_id: string;
    status: boolean | null;
    unique_id: string | null;
    updated_at: string | null;
    vlan: string | null;
};

export type ServicesInsert = {
    bandwidth_allocated?: string | null;
    created_at?: string | null;
    description?: string | null;
    end_node_id?: string | null;
    id?: string;
    lc_id?: string | null;
    link_type_id?: string | null;
    name: string;
    node_id: string;
    status?: boolean | null;
    unique_id?: string | null;
    updated_at?: string | null;
    vlan?: string | null;
};

export type ServicesUpdate = {
    bandwidth_allocated?: string | null;
    created_at?: string | null;
    description?: string | null;
    end_node_id?: string | null;
    id?: string;
    lc_id?: string | null;
    link_type_id?: string | null;
    name?: string;
    node_id?: string;
    status?: boolean | null;
    unique_id?: string | null;
    updated_at?: string | null;
    vlan?: string | null;
};

export type System_connectionsRow = {
    bandwidth: string | null;
    commissioned_on: string | null;
    created_at: string | null;
    en_id: string | null;
    en_interface: string | null;
    en_ip: unknown;
    en_protection_interface: string | null;
    id: string;
    media_type_id: string | null;
    protection_fiber_in_ids: string[] | null;
    protection_fiber_out_ids: string[] | null;
    remark: string | null;
    service_id: string | null;
    services_interface: string | null;
    services_ip: unknown;
    sn_id: string | null;
    sn_interface: string | null;
    sn_ip: unknown;
    status: boolean | null;
    system_id: string;
    system_protection_interface: string | null;
    system_working_interface: string | null;
    updated_at: string | null;
    working_fiber_in_ids: string[] | null;
    working_fiber_out_ids: string[] | null;
};

export type System_connectionsInsert = {
    bandwidth?: string | null;
    commissioned_on?: string | null;
    created_at?: string | null;
    en_id?: string | null;
    en_interface?: string | null;
    en_ip?: unknown;
    en_protection_interface?: string | null;
    id?: string;
    media_type_id?: string | null;
    protection_fiber_in_ids?: string[] | null;
    protection_fiber_out_ids?: string[] | null;
    remark?: string | null;
    service_id?: string | null;
    services_interface?: string | null;
    services_ip?: unknown;
    sn_id?: string | null;
    sn_interface?: string | null;
    sn_ip?: unknown;
    status?: boolean | null;
    system_id: string;
    system_protection_interface?: string | null;
    system_working_interface?: string | null;
    updated_at?: string | null;
    working_fiber_in_ids?: string[] | null;
    working_fiber_out_ids?: string[] | null;
};

export type System_connectionsUpdate = {
    bandwidth?: string | null;
    commissioned_on?: string | null;
    created_at?: string | null;
    en_id?: string | null;
    en_interface?: string | null;
    en_ip?: unknown;
    en_protection_interface?: string | null;
    id?: string;
    media_type_id?: string | null;
    protection_fiber_in_ids?: string[] | null;
    protection_fiber_out_ids?: string[] | null;
    remark?: string | null;
    service_id?: string | null;
    services_interface?: string | null;
    services_ip?: unknown;
    sn_id?: string | null;
    sn_interface?: string | null;
    sn_ip?: unknown;
    status?: boolean | null;
    system_id?: string;
    system_protection_interface?: string | null;
    system_working_interface?: string | null;
    updated_at?: string | null;
    working_fiber_in_ids?: string[] | null;
    working_fiber_out_ids?: string[] | null;
};

export type SystemsRow = {
    commissioned_on: string | null;
    created_at: string | null;
    id: string;
    ip_address: unknown;
    is_hub: boolean | null;
    maan_node_id: string | null;
    maintenance_terminal_id: string | null;
    make: string | null;
    node_id: string;
    remark: string | null;
    s_no: string | null;
    status: boolean | null;
    system_capacity_id: string | null;
    system_name: string | null;
    system_type_id: string;
    updated_at: string | null;
};

export type SystemsInsert = {
    commissioned_on?: string | null;
    created_at?: string | null;
    id?: string;
    ip_address?: unknown;
    is_hub?: boolean | null;
    maan_node_id?: string | null;
    maintenance_terminal_id?: string | null;
    make?: string | null;
    node_id: string;
    remark?: string | null;
    s_no?: string | null;
    status?: boolean | null;
    system_capacity_id?: string | null;
    system_name?: string | null;
    system_type_id: string;
    updated_at?: string | null;
};

export type SystemsUpdate = {
    commissioned_on?: string | null;
    created_at?: string | null;
    id?: string;
    ip_address?: unknown;
    is_hub?: boolean | null;
    maan_node_id?: string | null;
    maintenance_terminal_id?: string | null;
    make?: string | null;
    node_id?: string;
    remark?: string | null;
    s_no?: string | null;
    status?: boolean | null;
    system_capacity_id?: string | null;
    system_name?: string | null;
    system_type_id?: string;
    updated_at?: string | null;
};

export type User_activity_logsRow = {
    action_type: string;
    created_at: string | null;
    details: string | null;
    id: number;
    new_data: Json | null;
    old_data: Json | null;
    record_id: string | null;
    table_name: string | null;
    user_id: string | null;
    user_role: string | null;
};

export type User_activity_logsInsert = {
    action_type: string;
    created_at?: string | null;
    details?: string | null;
    id?: number;
    new_data?: Json | null;
    old_data?: Json | null;
    record_id?: string | null;
    table_name?: string | null;
    user_id?: string | null;
    user_role?: string | null;
};

export type User_activity_logsUpdate = {
    action_type?: string;
    created_at?: string | null;
    details?: string | null;
    id?: number;
    new_data?: Json | null;
    old_data?: Json | null;
    record_id?: string | null;
    table_name?: string | null;
    user_id?: string | null;
    user_role?: string | null;
};

export type User_profilesRow = {
    address: Json | null;
    avatar_url: string | null;
    created_at: string | null;
    date_of_birth: string | null;
    designation: string | null;
    first_name: string;
    id: string;
    last_name: string;
    phone_number: string | null;
    preferences: Json | null;
    role: string | null;
    status: string | null;
    updated_at: string | null;
};

export type User_profilesInsert = {
    address?: Json | null;
    avatar_url?: string | null;
    created_at?: string | null;
    date_of_birth?: string | null;
    designation?: string | null;
    first_name: string;
    id: string;
    last_name: string;
    phone_number?: string | null;
    preferences?: Json | null;
    role?: string | null;
    status?: string | null;
    updated_at?: string | null;
};

export type User_profilesUpdate = {
    address?: Json | null;
    avatar_url?: string | null;
    created_at?: string | null;
    date_of_birth?: string | null;
    designation?: string | null;
    first_name?: string;
    id?: string;
    last_name?: string;
    phone_number?: string | null;
    preferences?: Json | null;
    role?: string | null;
    status?: string | null;
    updated_at?: string | null;
};

// ============= VIEWS =============

export type V_audit_logsRow = {
    action_type: string | null;
    created_at: string | null;
    details: string | null;
    id: number | null;
    new_data: Json | null;
    old_data: Json | null;
    performed_by_avatar: string | null;
    performed_by_email: string | null;
    performed_by_name: string | null;
    record_id: string | null;
    table_name: string | null;
    user_id: string | null;
    user_role: string | null;
};

export type V_cable_segments_at_jcRow = {
    end_node_id: string | null;
    fiber_count: number | null;
    id: string | null;
    jc_node_id: string | null;
    original_cable_id: string | null;
    segment_order: number | null;
    start_node_id: string | null;
};

export type V_cable_utilizationRow = {
    available_fibers: number | null;
    cable_id: string | null;
    capacity: number | null;
    route_name: string | null;
    used_fibers: number | null;
    utilization_percent: number | null;
};

export type V_e_files_extendedRow = {
    category: string | null;
    created_at: string | null;
    current_holder_area: string | null;
    current_holder_designation: string | null;
    current_holder_employee_id: string | null;
    current_holder_name: string | null;
    description: string | null;
    file_number: string | null;
    id: string | null;
    initiator_designation: string | null;
    initiator_employee_id: string | null;
    initiator_name: string | null;
    priority: string | null;
    recorded_by_name: string | null;
    recorded_by_user_id: string | null;
    status: string | null;
    subject: string | null;
    updated_at: string | null;
};

export type V_employee_designationsRow = {
    created_at: string | null;
    id: string | null;
    name: string | null;
    parent_id: string | null;
    status: boolean | null;
    updated_at: string | null;
};

export type V_employeesRow = {
    created_at: string | null;
    employee_addr: string | null;
    employee_contact: string | null;
    employee_designation_id: string | null;
    employee_designation_name: string | null;
    employee_dob: string | null;
    employee_doj: string | null;
    employee_email: string | null;
    employee_name: string | null;
    employee_pers_no: string | null;
    id: string | null;
    maintenance_area_name: string | null;
    maintenance_terminal_id: string | null;
    remark: string | null;
    status: boolean | null;
    updated_at: string | null;
};

export type V_end_to_end_pathsRow = {
    destination_system_id: string | null;
    operational_status: string | null;
    path_id: string | null;
    path_name: string | null;
    route_names: string | null;
    segment_count: number | null;
    source_system_id: string | null;
    total_distance_km: number | null;
    total_loss_db: number | null;
};

export type V_file_movements_extendedRow = {
    action_type: string | null;
    created_at: string | null;
    file_id: string | null;
    from_employee_designation: string | null;
    from_employee_id: string | null;
    from_employee_name: string | null;
    id: string | null;
    performed_by_name: string | null;
    performed_by_user_id: string | null;
    remarks: string | null;
    to_employee_designation: string | null;
    to_employee_id: string | null;
    to_employee_name: string | null;
};

export type V_inventory_itemsRow = {
    asset_no: string | null;
    category_id: string | null;
    category_name: string | null;
    cost: number | null;
    created_at: string | null;
    description: string | null;
    functional_location: string | null;
    functional_location_id: string | null;
    id: string | null;
    last_issue_reason: string | null;
    last_issued_date: string | null;
    last_issued_to: string | null;
    location_id: string | null;
    name: string | null;
    purchase_date: string | null;
    quantity: number | null;
    status_id: string | null;
    status_name: string | null;
    store_location: string | null;
    total_value: number | null;
    updated_at: string | null;
    vendor: string | null;
};

export type V_inventory_transactions_extendedRow = {
    asset_no: string | null;
    created_at: string | null;
    id: string | null;
    inventory_item_id: string | null;
    issue_reason: string | null;
    issued_date: string | null;
    issued_to: string | null;
    item_name: string | null;
    performed_by_email: string | null;
    performed_by_name: string | null;
    performed_by_user_id: string | null;
    quantity: number | null;
    total_cost_calculated: number | null;
    transaction_type: string | null;
    unit_cost_at_time: number | null;
};

export type V_junction_closures_completeRow = {
    id: string | null;
    latitude: number | null;
    longitude: number | null;
    name: string | null;
    node_id: string | null;
    ofc_cable_id: string | null;
    position_km: number | null;
};

export type V_lookup_typesRow = {
    category: string | null;
    code: string | null;
    created_at: string | null;
    description: string | null;
    id: string | null;
    is_ring_based: boolean | null;
    is_system_default: boolean | null;
    name: string | null;
    sort_order: number | null;
    status: boolean | null;
    updated_at: string | null;
};

export type V_maintenance_areasRow = {
    address: string | null;
    area_type_id: string | null;
    code: string | null;
    contact_number: string | null;
    contact_person: string | null;
    created_at: string | null;
    email: string | null;
    id: string | null;
    latitude: number | null;
    longitude: number | null;
    maintenance_area_type_code: string | null;
    maintenance_area_type_name: string | null;
    name: string | null;
    parent_id: string | null;
    status: boolean | null;
    updated_at: string | null;
};

export type V_nodes_completeRow = {
    created_at: string | null;
    id: string | null;
    latitude: number | null;
    longitude: number | null;
    maintenance_area_name: string | null;
    maintenance_terminal_id: string | null;
    name: string | null;
    node_type_code: string | null;
    node_type_id: string | null;
    node_type_name: string | null;
    remark: string | null;
    status: boolean | null;
    updated_at: string | null;
};

export type V_ofc_cables_completeRow = {
    asset_no: string | null;
    capacity: number | null;
    commissioned_on: string | null;
    created_at: string | null;
    current_rkm: number | null;
    en_id: string | null;
    en_name: string | null;
    en_node_type_name: string | null;
    id: string | null;
    maintenance_area_code: string | null;
    maintenance_area_name: string | null;
    maintenance_terminal_id: string | null;
    ofc_owner_code: string | null;
    ofc_owner_id: string | null;
    ofc_owner_name: string | null;
    ofc_type_code: string | null;
    ofc_type_id: string | null;
    ofc_type_name: string | null;
    remark: string | null;
    route_name: string | null;
    sn_id: string | null;
    sn_name: string | null;
    sn_node_type_name: string | null;
    status: boolean | null;
    transnet_id: string | null;
    transnet_rkm: number | null;
    updated_at: string | null;
};

export type V_ofc_connections_completeRow = {
    connection_category: string | null;
    connection_type: string | null;
    created_at: string | null;
    destination_port: string | null;
    en_dom: string | null;
    en_id: string | null;
    en_name: string | null;
    en_power_dbm: number | null;
    fiber_no_en: number | null;
    fiber_no_sn: number | null;
    fiber_role: string | null;
    id: string | null;
    logical_path_id: string | null;
    maintenance_area_name: string | null;
    ofc_id: string | null;
    ofc_route_name: string | null;
    ofc_type_name: string | null;
    otdr_distance_en_km: number | null;
    otdr_distance_sn_km: number | null;
    path_direction: string | null;
    path_segment_order: number | null;
    remark: string | null;
    route_loss_db: number | null;
    sn_dom: string | null;
    sn_id: string | null;
    sn_name: string | null;
    sn_power_dbm: number | null;
    source_port: string | null;
    status: boolean | null;
    system_id: string | null;
    system_name: string | null;
    updated_at: string | null;
    updated_en_id: string | null;
    updated_en_name: string | null;
    updated_fiber_no_en: number | null;
    updated_fiber_no_sn: number | null;
    updated_sn_id: string | null;
    updated_sn_name: string | null;
};

export type V_ports_management_completeRow = {
    created_at: string | null;
    id: string | null;
    port: string | null;
    port_admin_status: boolean | null;
    port_capacity: string | null;
    port_type_code: string | null;
    port_type_id: string | null;
    port_type_name: string | null;
    port_utilization: boolean | null;
    services_count: number | null;
    sfp_serial_no: string | null;
    system_id: string | null;
    system_name: string | null;
    updated_at: string | null;
};

export type V_ring_nodesRow = {
    id: string | null;
    ip: string | null;
    is_hub: boolean | null;
    lat: number | null;
    long: number | null;
    name: string | null;
    node_id: string | null;
    order_in_ring: number | null;
    remark: string | null;
    ring_id: string | null;
    ring_name: string | null;
    ring_status: boolean | null;
    system_node_name: string | null;
    system_status: boolean | null;
    system_type: string | null;
    system_type_code: string | null;
    type: string | null;
};

export type V_ringsRow = {
    bts_status: string | null;
    created_at: string | null;
    description: string | null;
    id: string | null;
    is_closed_loop: boolean | null;
    maintenance_area_name: string | null;
    maintenance_terminal_id: string | null;
    name: string | null;
    ofc_status: string | null;
    ring_type_code: string | null;
    ring_type_id: string | null;
    ring_type_name: string | null;
    spec_status: string | null;
    status: boolean | null;
    topology_config: Json | null;
    total_nodes: number | null;
    updated_at: string | null;
};

export type V_servicesRow = {
    bandwidth_allocated: string | null;
    created_at: string | null;
    description: string | null;
    end_node_id: string | null;
    end_node_name: string | null;
    id: string | null;
    lc_id: string | null;
    link_type_id: string | null;
    link_type_name: string | null;
    maintenance_area_name: string | null;
    name: string | null;
    node_id: string | null;
    node_name: string | null;
    status: boolean | null;
    unique_id: string | null;
    updated_at: string | null;
    vlan: string | null;
};

export type V_system_connections_completeRow = {
    bandwidth: string | null;
    bandwidth_allocated: string | null;
    commissioned_on: string | null;
    connected_link_type_id: string | null;
    connected_link_type_name: string | null;
    connected_system_name: string | null;
    connected_system_type_name: string | null;
    created_at: string | null;
    en_id: string | null;
    en_interface: string | null;
    en_ip: unknown;
    en_name: string | null;
    en_node_id: string | null;
    en_node_name: string | null;
    en_protection_interface: string | null;
    en_system_type_name: string | null;
    id: string | null;
    lc_id: string | null;
    media_type_id: string | null;
    media_type_name: string | null;
    protection_fiber_in_ids: string[] | null;
    protection_fiber_out_ids: string[] | null;
    remark: string | null;
    sdh_a_customer: string | null;
    sdh_a_slot: string | null;
    sdh_b_customer: string | null;
    sdh_b_slot: string | null;
    sdh_carrier: string | null;
    sdh_stm_no: string | null;
    service_end_node_id: string | null;
    service_end_node_name: string | null;
    service_id: string | null;
    service_name: string | null;
    service_node_id: string | null;
    service_node_name: string | null;
    services_interface: string | null;
    services_ip: unknown;
    sn_id: string | null;
    sn_interface: string | null;
    sn_ip: unknown;
    sn_name: string | null;
    sn_node_id: string | null;
    sn_node_name: string | null;
    sn_system_type_name: string | null;
    status: boolean | null;
    system_id: string | null;
    system_name: string | null;
    system_protection_interface: string | null;
    system_type_name: string | null;
    system_working_interface: string | null;
    unique_id: string | null;
    updated_at: string | null;
    vlan: string | null;
    working_fiber_in_ids: string[] | null;
    working_fiber_out_ids: string[] | null;
};

export type V_systems_completeRow = {
    commissioned_on: string | null;
    created_at: string | null;
    id: string | null;
    ip_address: string | null;
    is_hub: boolean | null;
    is_ring_based: boolean | null;
    latitude: number | null;
    longitude: number | null;
    maan_node_id: string | null;
    maintenance_terminal_id: string | null;
    make: string | null;
    node_id: string | null;
    node_name: string | null;
    node_type_name: string | null;
    order_in_ring: number | null;
    remark: string | null;
    ring_associations: Json | null;
    ring_id: string | null;
    ring_logical_area_name: string | null;
    s_no: string | null;
    status: boolean | null;
    system_capacity_id: string | null;
    system_capacity_name: string | null;
    system_category: string | null;
    system_maintenance_terminal_name: string | null;
    system_name: string | null;
    system_type_code: string | null;
    system_type_id: string | null;
    system_type_name: string | null;
    updated_at: string | null;
};

export type V_user_profiles_extendedRow = {
    account_age_days: number | null;
    address: Json | null;
    auth_updated_at: string | null;
    avatar_url: string | null;
    computed_status: string | null;
    created_at: string | null;
    date_of_birth: string | null;
    designation: string | null;
    email: string | null;
    email_confirmed_at: string | null;
    first_name: string | null;
    full_name: string | null;
    id: string | null;
    is_email_verified: boolean | null;
    is_phone_verified: boolean | null;
    is_super_admin: boolean | null;
    last_activity_period: string | null;
    last_name: string | null;
    last_sign_in_at: string | null;
    phone_confirmed_at: string | null;
    phone_number: string | null;
    preferences: Json | null;
    raw_app_meta_data: Json | null;
    raw_user_meta_data: Json | null;
    role: string | null;
    status: string | null;
    updated_at: string | null;
};

// ============= ENUMS =============

export type AuthAal_level = "aal1" | "aal2" | "aal3";

export type AuthCode_challenge_method = "s256" | "plain";

export type AuthFactor_status = "unverified" | "verified";

export type AuthFactor_type = "totp" | "webauthn" | "phone";

export type AuthOauth_authorization_status = "pending" | "approved" | "denied" | "expired";

export type AuthOauth_client_type = "public" | "confidential";

export type AuthOauth_registration_type = "dynamic" | "manual";

export type AuthOauth_response_type = "code";

export type AuthOne_time_token_type = "confirmation_token" | "reauthentication_token" | "recovery_token" | "email_change_token_new" | "email_change_token_current" | "phone_change_token";

// ============= HELPERS =============

export const tableNames = [
  "cable_segments",
  "diary_notes",
  "e_files",
  "employee_designations",
  "employees",
  "fiber_splices",
  "file_movements",
  "files",
  "folders",
  "inventory_items",
  "inventory_transactions",
  "junction_closures",
  "logical_fiber_paths",
  "logical_path_segments",
  "logical_paths",
  "lookup_types",
  "maintenance_areas",
  "nodes",
  "ofc_cables",
  "ofc_connections",
  "ports_management",
  "ring_based_systems",
  "rings",
  "sdh_connections",
  "services",
  "system_connections",
  "systems",
  "user_activity_logs",
  "user_profiles"
] as const;

export const viewNames = [
  "v_audit_logs",
  "v_cable_segments_at_jc",
  "v_cable_utilization",
  "v_e_files_extended",
  "v_employee_designations",
  "v_employees",
  "v_end_to_end_paths",
  "v_file_movements_extended",
  "v_inventory_items",
  "v_inventory_transactions_extended",
  "v_junction_closures_complete",
  "v_lookup_types",
  "v_maintenance_areas",
  "v_nodes_complete",
  "v_ofc_cables_complete",
  "v_ofc_connections_complete",
  "v_ports_management_complete",
  "v_ring_nodes",
  "v_rings",
  "v_services",
  "v_system_connections_complete",
  "v_systems_complete",
  "v_user_profiles_extended"
] as const;

