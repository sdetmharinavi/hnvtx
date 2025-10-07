// Auto-generated from types/supabase-types.ts

import type { Json, Database } from "@/types/supabase-types";

// ============= TABLES =============

export type AuthAudit_log_entriesRow = {
    created_at: string | null;
    id: string;
    instance_id: string | null;
    ip_address: string;
    payload: Json | null;
};

export type AuthAudit_log_entriesInsert = {
    created_at?: string | null;
    id: string;
    instance_id?: string | null;
    ip_address?: string;
    payload?: Json | null;
};

export type AuthAudit_log_entriesUpdate = {
    created_at?: string | null;
    id?: string;
    instance_id?: string | null;
    ip_address?: string;
    payload?: Json | null;
};

export type AuthFlow_stateRow = {
    auth_code: string;
    auth_code_issued_at: string | null;
    authentication_method: string;
    code_challenge: string;
    code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"];
    created_at: string | null;
    id: string;
    provider_access_token: string | null;
    provider_refresh_token: string | null;
    provider_type: string;
    updated_at: string | null;
    user_id: string | null;
};

export type AuthFlow_stateInsert = {
    auth_code: string;
    auth_code_issued_at?: string | null;
    authentication_method: string;
    code_challenge: string;
    code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"];
    created_at?: string | null;
    id: string;
    provider_access_token?: string | null;
    provider_refresh_token?: string | null;
    provider_type: string;
    updated_at?: string | null;
    user_id?: string | null;
};

export type AuthFlow_stateUpdate = {
    auth_code?: string;
    auth_code_issued_at?: string | null;
    authentication_method?: string;
    code_challenge?: string;
    code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"];
    created_at?: string | null;
    id?: string;
    provider_access_token?: string | null;
    provider_refresh_token?: string | null;
    provider_type?: string;
    updated_at?: string | null;
    user_id?: string | null;
};

export type AuthIdentitiesRow = {
    created_at: string | null;
    email: string | null;
    id: string;
    identity_data: Json;
    last_sign_in_at: string | null;
    provider: string;
    provider_id: string;
    updated_at: string | null;
    user_id: string;
};

export type AuthIdentitiesInsert = {
    created_at?: string | null;
    email?: string | null;
    id?: string;
    identity_data: Json;
    last_sign_in_at?: string | null;
    provider: string;
    provider_id: string;
    updated_at?: string | null;
    user_id: string;
};

export type AuthIdentitiesUpdate = {
    created_at?: string | null;
    email?: string | null;
    id?: string;
    identity_data?: Json;
    last_sign_in_at?: string | null;
    provider?: string;
    provider_id?: string;
    updated_at?: string | null;
    user_id?: string;
};

export type AuthInstancesRow = {
    created_at: string | null;
    id: string;
    raw_base_config: string | null;
    updated_at: string | null;
    uuid: string | null;
};

export type AuthInstancesInsert = {
    created_at?: string | null;
    id: string;
    raw_base_config?: string | null;
    updated_at?: string | null;
    uuid?: string | null;
};

export type AuthInstancesUpdate = {
    created_at?: string | null;
    id?: string;
    raw_base_config?: string | null;
    updated_at?: string | null;
    uuid?: string | null;
};

export type AuthMfa_amr_claimsRow = {
    authentication_method: string;
    created_at: string;
    id: string;
    session_id: string;
    updated_at: string;
};

export type AuthMfa_amr_claimsInsert = {
    authentication_method: string;
    created_at: string;
    id: string;
    session_id: string;
    updated_at: string;
};

export type AuthMfa_amr_claimsUpdate = {
    authentication_method?: string;
    created_at?: string;
    id?: string;
    session_id?: string;
    updated_at?: string;
};

export type AuthMfa_challengesRow = {
    created_at: string;
    factor_id: string;
    id: string;
    ip_address: unknown;
    otp_code: string | null;
    verified_at: string | null;
    web_authn_session_data: Json | null;
};

export type AuthMfa_challengesInsert = {
    created_at: string;
    factor_id: string;
    id: string;
    ip_address: unknown;
    otp_code?: string | null;
    verified_at?: string | null;
    web_authn_session_data?: Json | null;
};

export type AuthMfa_challengesUpdate = {
    created_at?: string;
    factor_id?: string;
    id?: string;
    ip_address?: unknown;
    otp_code?: string | null;
    verified_at?: string | null;
    web_authn_session_data?: Json | null;
};

export type AuthMfa_factorsRow = {
    created_at: string;
    factor_type: Database["auth"]["Enums"]["factor_type"];
    friendly_name: string | null;
    id: string;
    last_challenged_at: string | null;
    phone: string | null;
    secret: string | null;
    status: Database["auth"]["Enums"]["factor_status"];
    updated_at: string;
    user_id: string;
    web_authn_aaguid: string | null;
    web_authn_credential: Json | null;
};

export type AuthMfa_factorsInsert = {
    created_at: string;
    factor_type: Database["auth"]["Enums"]["factor_type"];
    friendly_name?: string | null;
    id: string;
    last_challenged_at?: string | null;
    phone?: string | null;
    secret?: string | null;
    status: Database["auth"]["Enums"]["factor_status"];
    updated_at: string;
    user_id: string;
    web_authn_aaguid?: string | null;
    web_authn_credential?: Json | null;
};

export type AuthMfa_factorsUpdate = {
    created_at?: string;
    factor_type?: Database["auth"]["Enums"]["factor_type"];
    friendly_name?: string | null;
    id?: string;
    last_challenged_at?: string | null;
    phone?: string | null;
    secret?: string | null;
    status?: Database["auth"]["Enums"]["factor_status"];
    updated_at?: string;
    user_id?: string;
    web_authn_aaguid?: string | null;
    web_authn_credential?: Json | null;
};

export type AuthOauth_clientsRow = {
    client_id: string;
    client_name: string | null;
    client_secret_hash: string;
    client_uri: string | null;
    created_at: string;
    deleted_at: string | null;
    grant_types: string;
    id: string;
    logo_uri: string | null;
    redirect_uris: string;
    registration_type: Database["auth"]["Enums"]["oauth_registration_type"];
    updated_at: string;
};

export type AuthOauth_clientsInsert = {
    client_id: string;
    client_name?: string | null;
    client_secret_hash: string;
    client_uri?: string | null;
    created_at?: string;
    deleted_at?: string | null;
    grant_types: string;
    id: string;
    logo_uri?: string | null;
    redirect_uris: string;
    registration_type: Database["auth"]["Enums"]["oauth_registration_type"];
    updated_at?: string;
};

export type AuthOauth_clientsUpdate = {
    client_id?: string;
    client_name?: string | null;
    client_secret_hash?: string;
    client_uri?: string | null;
    created_at?: string;
    deleted_at?: string | null;
    grant_types?: string;
    id?: string;
    logo_uri?: string | null;
    redirect_uris?: string;
    registration_type?: Database["auth"]["Enums"]["oauth_registration_type"];
    updated_at?: string;
};

export type AuthOne_time_tokensRow = {
    created_at: string;
    id: string;
    relates_to: string;
    token_hash: string;
    token_type: Database["auth"]["Enums"]["one_time_token_type"];
    updated_at: string;
    user_id: string;
};

export type AuthOne_time_tokensInsert = {
    created_at?: string;
    id: string;
    relates_to: string;
    token_hash: string;
    token_type: Database["auth"]["Enums"]["one_time_token_type"];
    updated_at?: string;
    user_id: string;
};

export type AuthOne_time_tokensUpdate = {
    created_at?: string;
    id?: string;
    relates_to?: string;
    token_hash?: string;
    token_type?: Database["auth"]["Enums"]["one_time_token_type"];
    updated_at?: string;
    user_id?: string;
};

export type AuthRefresh_tokensRow = {
    created_at: string | null;
    id: number;
    instance_id: string | null;
    parent: string | null;
    revoked: boolean | null;
    session_id: string | null;
    token: string | null;
    updated_at: string | null;
    user_id: string | null;
};

export type AuthRefresh_tokensInsert = {
    created_at?: string | null;
    id?: number;
    instance_id?: string | null;
    parent?: string | null;
    revoked?: boolean | null;
    session_id?: string | null;
    token?: string | null;
    updated_at?: string | null;
    user_id?: string | null;
};

export type AuthRefresh_tokensUpdate = {
    created_at?: string | null;
    id?: number;
    instance_id?: string | null;
    parent?: string | null;
    revoked?: boolean | null;
    session_id?: string | null;
    token?: string | null;
    updated_at?: string | null;
    user_id?: string | null;
};

export type AuthSaml_providersRow = {
    attribute_mapping: Json | null;
    created_at: string | null;
    entity_id: string;
    id: string;
    metadata_url: string | null;
    metadata_xml: string;
    name_id_format: string | null;
    sso_provider_id: string;
    updated_at: string | null;
};

export type AuthSaml_providersInsert = {
    attribute_mapping?: Json | null;
    created_at?: string | null;
    entity_id: string;
    id: string;
    metadata_url?: string | null;
    metadata_xml: string;
    name_id_format?: string | null;
    sso_provider_id: string;
    updated_at?: string | null;
};

export type AuthSaml_providersUpdate = {
    attribute_mapping?: Json | null;
    created_at?: string | null;
    entity_id?: string;
    id?: string;
    metadata_url?: string | null;
    metadata_xml?: string;
    name_id_format?: string | null;
    sso_provider_id?: string;
    updated_at?: string | null;
};

export type AuthSaml_relay_statesRow = {
    created_at: string | null;
    flow_state_id: string | null;
    for_email: string | null;
    id: string;
    redirect_to: string | null;
    request_id: string;
    sso_provider_id: string;
    updated_at: string | null;
};

export type AuthSaml_relay_statesInsert = {
    created_at?: string | null;
    flow_state_id?: string | null;
    for_email?: string | null;
    id: string;
    redirect_to?: string | null;
    request_id: string;
    sso_provider_id: string;
    updated_at?: string | null;
};

export type AuthSaml_relay_statesUpdate = {
    created_at?: string | null;
    flow_state_id?: string | null;
    for_email?: string | null;
    id?: string;
    redirect_to?: string | null;
    request_id?: string;
    sso_provider_id?: string;
    updated_at?: string | null;
};

export type AuthSchema_migrationsRow = {
    version: string;
};

export type AuthSchema_migrationsInsert = {
    version: string;
};

export type AuthSchema_migrationsUpdate = {
    version?: string;
};

export type AuthSessionsRow = {
    aal: Database["auth"]["Enums"]["aal_level"] | null;
    created_at: string | null;
    factor_id: string | null;
    id: string;
    ip: unknown | null;
    not_after: string | null;
    refreshed_at: string | null;
    tag: string | null;
    updated_at: string | null;
    user_agent: string | null;
    user_id: string;
};

export type AuthSessionsInsert = {
    aal?: Database["auth"]["Enums"]["aal_level"] | null;
    created_at?: string | null;
    factor_id?: string | null;
    id: string;
    ip?: unknown | null;
    not_after?: string | null;
    refreshed_at?: string | null;
    tag?: string | null;
    updated_at?: string | null;
    user_agent?: string | null;
    user_id: string;
};

export type AuthSessionsUpdate = {
    aal?: Database["auth"]["Enums"]["aal_level"] | null;
    created_at?: string | null;
    factor_id?: string | null;
    id?: string;
    ip?: unknown | null;
    not_after?: string | null;
    refreshed_at?: string | null;
    tag?: string | null;
    updated_at?: string | null;
    user_agent?: string | null;
    user_id?: string;
};

export type AuthSso_domainsRow = {
    created_at: string | null;
    domain: string;
    id: string;
    sso_provider_id: string;
    updated_at: string | null;
};

export type AuthSso_domainsInsert = {
    created_at?: string | null;
    domain: string;
    id: string;
    sso_provider_id: string;
    updated_at?: string | null;
};

export type AuthSso_domainsUpdate = {
    created_at?: string | null;
    domain?: string;
    id?: string;
    sso_provider_id?: string;
    updated_at?: string | null;
};

export type AuthSso_providersRow = {
    created_at: string | null;
    disabled: boolean | null;
    id: string;
    resource_id: string | null;
    updated_at: string | null;
};

export type AuthSso_providersInsert = {
    created_at?: string | null;
    disabled?: boolean | null;
    id: string;
    resource_id?: string | null;
    updated_at?: string | null;
};

export type AuthSso_providersUpdate = {
    created_at?: string | null;
    disabled?: boolean | null;
    id?: string;
    resource_id?: string | null;
    updated_at?: string | null;
};

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

export type Lookup_typesRow = {
    category: string;
    code: string | null;
    created_at: string | null;
    description: string | null;
    id: string;
    is_ring_based: boolean | null;
    is_sdh: boolean | null;
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
    is_sdh?: boolean | null;
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
    is_sdh?: boolean | null;
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

export type Management_portsRow = {
    commissioned_on: string | null;
    created_at: string | null;
    id: string;
    name: string | null;
    node_id: string | null;
    port_no: string;
    remark: string | null;
    status: boolean | null;
    system_id: string | null;
    updated_at: string | null;
};

export type Management_portsInsert = {
    commissioned_on?: string | null;
    created_at?: string | null;
    id?: string;
    name?: string | null;
    node_id?: string | null;
    port_no: string;
    remark?: string | null;
    status?: boolean | null;
    system_id?: string | null;
    updated_at?: string | null;
};

export type Management_portsUpdate = {
    commissioned_on?: string | null;
    created_at?: string | null;
    id?: string;
    name?: string | null;
    node_id?: string | null;
    port_no?: string;
    remark?: string | null;
    status?: boolean | null;
    system_id?: string | null;
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

export type Ring_based_systemsRow = {
    maintenance_area_id: string | null;
    ring_id: string | null;
    system_id: string;
};

export type Ring_based_systemsInsert = {
    maintenance_area_id?: string | null;
    ring_id?: string | null;
    system_id: string;
};

export type Ring_based_systemsUpdate = {
    maintenance_area_id?: string | null;
    ring_id?: string | null;
    system_id?: string;
};

export type RingsRow = {
    created_at: string | null;
    description: string | null;
    id: string;
    maintenance_terminal_id: string | null;
    name: string;
    ring_type_id: string | null;
    status: boolean | null;
    total_nodes: number | null;
    updated_at: string | null;
};

export type RingsInsert = {
    created_at?: string | null;
    description?: string | null;
    id?: string;
    maintenance_terminal_id?: string | null;
    name: string;
    ring_type_id?: string | null;
    status?: boolean | null;
    total_nodes?: number | null;
    updated_at?: string | null;
};

export type RingsUpdate = {
    created_at?: string | null;
    description?: string | null;
    id?: string;
    maintenance_terminal_id?: string | null;
    name?: string;
    ring_type_id?: string | null;
    status?: boolean | null;
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

export type Sdh_node_associationsRow = {
    id: string;
    node_id: string;
    node_ip: unknown | null;
    node_position: string | null;
    sdh_system_id: string;
};

export type Sdh_node_associationsInsert = {
    id?: string;
    node_id: string;
    node_ip?: unknown | null;
    node_position?: string | null;
    sdh_system_id: string;
};

export type Sdh_node_associationsUpdate = {
    id?: string;
    node_id?: string;
    node_ip?: unknown | null;
    node_position?: string | null;
    sdh_system_id?: string;
};

export type Sdh_systemsRow = {
    gne: string | null;
    system_id: string;
};

export type Sdh_systemsInsert = {
    gne?: string | null;
    system_id: string;
};

export type Sdh_systemsUpdate = {
    gne?: string | null;
    system_id?: string;
};

export type Sfp_based_connectionsRow = {
    bandwidth_allocated_mbps: number | null;
    customer_name: string | null;
    fiber_in: number | null;
    fiber_out: number | null;
    sfp_capacity: string | null;
    sfp_port: string | null;
    sfp_serial_no: string | null;
    sfp_type_id: string | null;
    system_connection_id: string;
};

export type Sfp_based_connectionsInsert = {
    bandwidth_allocated_mbps?: number | null;
    customer_name?: string | null;
    fiber_in?: number | null;
    fiber_out?: number | null;
    sfp_capacity?: string | null;
    sfp_port?: string | null;
    sfp_serial_no?: string | null;
    sfp_type_id?: string | null;
    system_connection_id: string;
};

export type Sfp_based_connectionsUpdate = {
    bandwidth_allocated_mbps?: number | null;
    customer_name?: string | null;
    fiber_in?: number | null;
    fiber_out?: number | null;
    sfp_capacity?: string | null;
    sfp_port?: string | null;
    sfp_serial_no?: string | null;
    sfp_type_id?: string | null;
    system_connection_id?: string;
};

export type System_connectionsRow = {
    bandwidth_mbps: number | null;
    commissioned_on: string | null;
    connected_system_id: string | null;
    created_at: string | null;
    en_id: string | null;
    en_interface: string | null;
    en_ip: unknown | null;
    id: string;
    media_type_id: string | null;
    remark: string | null;
    sn_id: string | null;
    sn_interface: string | null;
    sn_ip: unknown | null;
    status: boolean | null;
    system_id: string;
    updated_at: string | null;
    vlan: string | null;
};

export type System_connectionsInsert = {
    bandwidth_mbps?: number | null;
    commissioned_on?: string | null;
    connected_system_id?: string | null;
    created_at?: string | null;
    en_id?: string | null;
    en_interface?: string | null;
    en_ip?: unknown | null;
    id?: string;
    media_type_id?: string | null;
    remark?: string | null;
    sn_id?: string | null;
    sn_interface?: string | null;
    sn_ip?: unknown | null;
    status?: boolean | null;
    system_id: string;
    updated_at?: string | null;
    vlan?: string | null;
};

export type System_connectionsUpdate = {
    bandwidth_mbps?: number | null;
    commissioned_on?: string | null;
    connected_system_id?: string | null;
    created_at?: string | null;
    en_id?: string | null;
    en_interface?: string | null;
    en_ip?: unknown | null;
    id?: string;
    media_type_id?: string | null;
    remark?: string | null;
    sn_id?: string | null;
    sn_interface?: string | null;
    sn_ip?: unknown | null;
    status?: boolean | null;
    system_id?: string;
    updated_at?: string | null;
    vlan?: string | null;
};

export type SystemsRow = {
    commissioned_on: string | null;
    created_at: string | null;
    id: string;
    ip_address: unknown | null;
    maintenance_terminal_id: string | null;
    make: string | null;
    node_id: string;
    remark: string | null;
    s_no: string | null;
    status: boolean | null;
    system_name: string | null;
    system_type_id: string;
    updated_at: string | null;
};

export type SystemsInsert = {
    commissioned_on?: string | null;
    created_at?: string | null;
    id?: string;
    ip_address?: unknown | null;
    maintenance_terminal_id?: string | null;
    make?: string | null;
    node_id: string;
    remark?: string | null;
    s_no?: string | null;
    status?: boolean | null;
    system_name?: string | null;
    system_type_id: string;
    updated_at?: string | null;
};

export type SystemsUpdate = {
    commissioned_on?: string | null;
    created_at?: string | null;
    id?: string;
    ip_address?: unknown | null;
    maintenance_terminal_id?: string | null;
    make?: string | null;
    node_id?: string;
    remark?: string | null;
    s_no?: string | null;
    status?: boolean | null;
    system_name?: string | null;
    system_type_id?: string;
    updated_at?: string | null;
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

export type Vmux_connectionsRow = {
    c_code: string | null;
    channel: string | null;
    subscriber: string | null;
    system_connection_id: string;
    tk: string | null;
};

export type Vmux_connectionsInsert = {
    c_code?: string | null;
    channel?: string | null;
    subscriber?: string | null;
    system_connection_id: string;
    tk?: string | null;
};

export type Vmux_connectionsUpdate = {
    c_code?: string | null;
    channel?: string | null;
    subscriber?: string | null;
    system_connection_id?: string;
    tk?: string | null;
};

export type Vmux_systemsRow = {
    system_id: string;
    vm_id: string | null;
};

export type Vmux_systemsInsert = {
    system_id: string;
    vm_id?: string | null;
};

export type Vmux_systemsUpdate = {
    system_id?: string;
    vm_id?: string | null;
};

// ============= VIEWS =============

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
    is_sdh: boolean | null;
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

export type V_ring_nodesRow = {
    id: string | null;
    ip: string | null;
    lat: number | null;
    long: number | null;
    name: string | null;
    order_in_ring: number | null;
    remark: string | null;
    ring_id: string | null;
    ring_name: string | null;
    ring_status: boolean | null;
    system_status: boolean | null;
    type: string | null;
};

export type V_ringsRow = {
    created_at: string | null;
    description: string | null;
    id: string | null;
    maintenance_area_name: string | null;
    maintenance_terminal_id: string | null;
    name: string | null;
    ring_type_code: string | null;
    ring_type_id: string | null;
    ring_type_name: string | null;
    status: boolean | null;
    total_nodes: number | null;
    updated_at: string | null;
};

export type V_system_connections_completeRow = {
    bandwidth_allocated_mbps: number | null;
    bandwidth_mbps: number | null;
    commissioned_on: string | null;
    connected_system_name: string | null;
    connected_system_type_name: string | null;
    created_at: string | null;
    customer_name: string | null;
    en_interface: string | null;
    en_ip: unknown | null;
    en_name: string | null;
    en_node_name: string | null;
    fiber_in: number | null;
    fiber_out: number | null;
    id: string | null;
    media_type_name: string | null;
    remark: string | null;
    sdh_a_customer: string | null;
    sdh_a_slot: string | null;
    sdh_b_customer: string | null;
    sdh_b_slot: string | null;
    sdh_carrier: string | null;
    sdh_stm_no: string | null;
    sfp_capacity: string | null;
    sfp_port: string | null;
    sfp_serial_no: string | null;
    sfp_type_name: string | null;
    sn_interface: string | null;
    sn_ip: unknown | null;
    sn_name: string | null;
    sn_node_name: string | null;
    status: boolean | null;
    system_id: string | null;
    system_name: string | null;
    system_type_name: string | null;
    updated_at: string | null;
    vlan: string | null;
    vmux_c_code: string | null;
    vmux_channel: string | null;
    vmux_subscriber: string | null;
    vmux_tk: string | null;
};

export type V_system_ring_paths_detailedRow = {
    created_at: string | null;
    end_node_id: string | null;
    end_node_name: string | null;
    id: string | null;
    logical_path_id: string | null;
    ofc_cable_id: string | null;
    path_name: string | null;
    path_order: number | null;
    route_name: string | null;
    source_system_id: string | null;
    start_node_id: string | null;
    start_node_name: string | null;
};

export type V_systems_completeRow = {
    commissioned_on: string | null;
    created_at: string | null;
    id: string | null;
    ip_address: unknown | null;
    latitude: number | null;
    longitude: number | null;
    maintenance_terminal_id: string | null;
    make: string | null;
    node_id: string | null;
    node_name: string | null;
    node_type_name: string | null;
    remark: string | null;
    ring_id: string | null;
    ring_logical_area_name: string | null;
    s_no: string | null;
    sdh_gne: string | null;
    status: boolean | null;
    system_category: string | null;
    system_maintenance_terminal_name: string | null;
    system_name: string | null;
    system_type_code: string | null;
    system_type_id: string | null;
    system_type_name: string | null;
    updated_at: string | null;
    vmux_vm_id: string | null;
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

export type AuthOauth_registration_type = "dynamic" | "manual";

export type AuthOne_time_token_type = "confirmation_token" | "reauthentication_token" | "recovery_token" | "email_change_token_new" | "email_change_token_current" | "phone_change_token";

// ============= HELPERS =============

export const tableNames = [
  "audit_log_entries",
  "flow_state",
  "identities",
  "instances",
  "mfa_amr_claims",
  "mfa_challenges",
  "mfa_factors",
  "oauth_clients",
  "one_time_tokens",
  "refresh_tokens",
  "saml_providers",
  "saml_relay_states",
  "schema_migrations",
  "sessions",
  "sso_domains",
  "sso_providers",
  "users",
  "cable_segments",
  "employee_designations",
  "employees",
  "fiber_splices",
  "files",
  "folders",
  "junction_closures",
  "logical_fiber_paths",
  "logical_path_segments",
  "lookup_types",
  "maintenance_areas",
  "management_ports",
  "nodes",
  "ofc_cables",
  "ofc_connections",
  "ring_based_systems",
  "rings",
  "sdh_connections",
  "sdh_node_associations",
  "sdh_systems",
  "sfp_based_connections",
  "system_connections",
  "systems",
  "user_profiles",
  "vmux_connections",
  "vmux_systems"
] as const;

export const viewNames = [
  "v_cable_segments_at_jc",
  "v_cable_utilization",
  "v_employee_designations",
  "v_employees",
  "v_end_to_end_paths",
  "v_junction_closures_complete",
  "v_lookup_types",
  "v_maintenance_areas",
  "v_nodes_complete",
  "v_ofc_cables_complete",
  "v_ofc_connections_complete",
  "v_ring_nodes",
  "v_rings",
  "v_system_connections_complete",
  "v_system_ring_paths_detailed",
  "v_systems_complete",
  "v_user_profiles_extended"
] as const;

