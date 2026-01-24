// hooks/data/localDb.ts
import Dexie, { Table } from 'dexie';

import {
  Lookup_typesRowSchema as Lookup_typesRow,
  Maintenance_areasRowSchema as Maintenance_areasRow,
  Employee_designationsRowSchema as Employee_designationsRow,
  EmployeesRowSchema as EmployeesRow,
  NodesRowSchema as NodesRow,
  RingsRowSchema as RingsRow,
  Ofc_cablesRowSchema as Ofc_cablesRow,
  SystemsRowSchema as SystemsRow,
  Cable_segmentsRowSchema as Cable_segmentsRow,
  Junction_closuresRowSchema as Junction_closuresRow,
  Fiber_splicesRowSchema as Fiber_splicesRow,
  System_connectionsRowSchema as System_connectionsRow,
  Inventory_itemsRowSchema,
  FilesRowSchema,
  FoldersRowSchema,
  V_nodes_completeRowSchema,
  V_ofc_cables_completeRowSchema,
  V_systems_completeRowSchema,
  V_ringsRowSchema,
  V_employeesRowSchema,
  V_maintenance_areasRowSchema,
  V_cable_utilizationRowSchema,
  V_ring_nodesRowSchema,
  V_employee_designationsRowSchema,
  V_inventory_itemsRowSchema,
  Ring_based_systemsRowSchema,
  V_ofc_connections_completeRowSchema,
  V_system_connections_completeRowSchema,
  V_ports_management_completeRowSchema,
  Ports_managementRowSchema,
  ServicesRowSchema,
  V_servicesRowSchema,
  Logical_fiber_pathsRowSchema,
  V_end_to_end_pathsRowSchema,
  V_audit_logsRowSchema,
  V_inventory_transactions_extendedRowSchema,
  Diary_notesRowSchema,
  Logical_pathsRowSchema,
  Ofc_connectionsRowSchema,
  E_filesRowSchema,
  File_movementsRowSchema,
  V_e_files_extendedRowSchema,
  V_file_movements_extendedRowSchema,
  User_activity_logsRowSchema,
  V_lookup_typesRowSchema,
  Logical_path_segmentsRowSchema,
  Sdh_connectionsRowSchema,
  V_junction_closures_completeRowSchema,
  V_cable_segments_at_jcRowSchema,
} from '@/schemas/zod-schemas';
// ADDED
import { TechnicalNoteRow, VTechnicalNoteRow } from '@/schemas/notes-schemas';
import { PublicTableName, Row, PublicTableOrViewName } from '@/hooks/database';
import { Json } from '@/types/supabase-types';

export type StoredUserProfiles = {
  id: string;
  first_name: string;
  last_name: string;
  role: string | null;
  email?: string | null;
  status?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  date_of_birth?: string | null;
  address: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    country?: string | null;
  } | null;
  preferences: {
    language?: string | null;
    theme?: string | null;
    needsOnboarding?: boolean | null;
    showOnboardingPrompt?: boolean | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type StoredVUserProfilesExtended = {
  id: string | null;
  email: string | null;
  full_name: string | null;
  role: string | null;
  status: string | null;
  is_super_admin: boolean | null;
  last_sign_in_at: string | null;
  is_email_verified: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  account_age_days: number | null;
  address: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    country?: string | null;
  } | null;
  auth_updated_at: string | null;
  avatar_url: string | null;
  computed_status: string | null;
  date_of_birth: string | null;
  designation: string | null;
  email_confirmed_at: string | null;
  first_name: string | null;
  is_phone_verified: boolean | null;
  last_activity_period: string | null;
  last_name: string | null;
  phone_confirmed_at: string | null;
  phone_number: string | null;
  preferences: {
    language?: string | null;
    theme?: string | null;
    needsOnboarding?: boolean | null;
    showOnboardingPrompt?: boolean | null;
  } | null;
  raw_app_meta_data: Json | null;
  raw_user_meta_data: Json | null;
};

export interface SyncStatus {
  tableName: string;
  lastSynced: string | null;
  status: 'pending' | 'syncing' | 'success' | 'error';
  error?: string;
  count?: number;
}

export interface MutationTask {
  id?: number;
  tableName: PublicTableName;
  type: 'insert' | 'update' | 'delete' | 'bulk_upsert';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

export interface RouteDistanceCache {
  id: string;
  distance_km: number;
  source: string;
  timestamp: number;
}

export class HNVTMDatabase extends Dexie {
  lookup_types!: Table<Lookup_typesRow, string>;
  maintenance_areas!: Table<Maintenance_areasRow, string>;
  employee_designations!: Table<Employee_designationsRow, string>;
  employees!: Table<EmployeesRow, string>;
  nodes!: Table<NodesRow, string>;
  rings!: Table<RingsRow, string>;
  ofc_cables!: Table<Ofc_cablesRow, string>;
  systems!: Table<SystemsRow, string>;
  cable_segments!: Table<Cable_segmentsRow, string>;
  junction_closures!: Table<Junction_closuresRow, string>;
  fiber_splices!: Table<Fiber_splicesRow, string>;
  system_connections!: Table<System_connectionsRow, string>;
  user_profiles!: Table<StoredUserProfiles, string>;
  diary_notes!: Table<Diary_notesRowSchema, string>;
  inventory_items!: Table<Inventory_itemsRowSchema, string>;
  ring_based_systems!: Table<Ring_based_systemsRowSchema, [string, string]>;
  ports_management!: Table<Ports_managementRowSchema, string>;
  services!: Table<ServicesRowSchema, string>;
  inventory_transactions!: Table<V_inventory_transactions_extendedRowSchema, string>;
  logical_fiber_paths!: Table<Logical_fiber_pathsRowSchema, string>;

  logical_paths!: Table<Logical_pathsRowSchema, string>;
  ofc_connections!: Table<Ofc_connectionsRowSchema, string>;

  files!: Table<FilesRowSchema, string>;
  folders!: Table<FoldersRowSchema, string>;

  // Added technical notes
  technical_notes!: Table<TechnicalNoteRow, string>;
  v_technical_notes!: Table<VTechnicalNoteRow, string>;

  v_nodes_complete!: Table<V_nodes_completeRowSchema, string>;
  v_ofc_cables_complete!: Table<V_ofc_cables_completeRowSchema, string>;
  v_systems_complete!: Table<V_systems_completeRowSchema, string>;
  v_rings!: Table<V_ringsRowSchema, string>;
  v_employees!: Table<V_employeesRowSchema, string>;
  v_maintenance_areas!: Table<V_maintenance_areasRowSchema, string>;
  v_cable_utilization!: Table<V_cable_utilizationRowSchema, string>;
  v_ring_nodes!: Table<V_ring_nodesRowSchema, string>;
  v_employee_designations!: Table<V_employee_designationsRowSchema, string>;
  v_inventory_items!: Table<V_inventory_itemsRowSchema, string>;
  v_user_profiles_extended!: Table<StoredVUserProfilesExtended, string>;
  v_ofc_connections_complete!: Table<V_ofc_connections_completeRowSchema, string>;
  v_system_connections_complete!: Table<V_system_connections_completeRowSchema, string>;
  v_ports_management_complete!: Table<V_ports_management_completeRowSchema, string>;
  v_audit_logs!: Table<V_audit_logsRowSchema, number>;
  v_services!: Table<V_servicesRowSchema, string>;
  v_end_to_end_paths!: Table<V_end_to_end_pathsRowSchema, string>;
  v_inventory_transactions_extended!: Table<V_inventory_transactions_extendedRowSchema, string>;

  e_files!: Table<E_filesRowSchema, string>;
  file_movements!: Table<File_movementsRowSchema, string>;
  v_e_files_extended!: Table<V_e_files_extendedRowSchema, string>;
  v_file_movements_extended!: Table<V_file_movements_extendedRowSchema, string>;

  user_activity_logs!: Table<User_activity_logsRowSchema, number>;
  v_lookup_types!: Table<V_lookup_typesRowSchema, string>;
  logical_path_segments!: Table<Logical_path_segmentsRowSchema, string>;
  sdh_connections!: Table<Sdh_connectionsRowSchema, string>;
  v_junction_closures_complete!: Table<V_junction_closures_completeRowSchema, string>;
  v_cable_segments_at_jc!: Table<V_cable_segments_at_jcRowSchema, string>;

  sync_status!: Table<SyncStatus, string>;
  mutation_queue!: Table<MutationTask, number>;
  route_distances!: Table<RouteDistanceCache, string>;

  constructor() {
    super('HNVTMDatabase');
    // Bumped version number to force schema update
    this.version(39).stores({
      // ... previous stores ...
      lookup_types: '&id, category, name, sort_order, status',
      v_lookup_types: '&id, category, name',

      maintenance_areas: '&id, name, parent_id, area_type_id, status',
      v_maintenance_areas: '&id, name, area_type_id, status',

      employee_designations: '&id, name, parent_id',
      v_employee_designations: '&id, name, status',

      employees: '&id, employee_name, employee_pers_no, status',
      v_employees: '&id, employee_name, employee_designation_id, maintenance_terminal_id, status',

      nodes: '&id, name, node_type_id, status',
      v_nodes_complete: '&id, name, node_type_id, maintenance_terminal_id, status',

      ofc_cables: '&id, route_name, sn_id, en_id, status',
      v_ofc_cables_complete: '&id, route_name, ofc_type_id, maintenance_terminal_id, status',

      ofc_connections: '&id, ofc_id, system_id, [ofc_id+fiber_no_sn], status, updated_at',
      v_ofc_connections_complete: '&id, ofc_id, system_id, ofc_route_name, status, updated_at',

      cable_segments: '&id, original_cable_id',
      junction_closures: '&id, node_id, ofc_cable_id',
      fiber_splices: '&id, jc_id',

      v_cable_utilization: 'cable_id',
      v_junction_closures_complete: '&id, node_id, ofc_cable_id',
      v_cable_segments_at_jc: '&id, original_cable_id',

      rings: '&id, name, ring_type_id, status',
      v_rings: '&id, name, ring_type_id, maintenance_terminal_id, status',
      ring_based_systems: '&[system_id+ring_id], ring_id, system_id',
      v_ring_nodes: '&[id+ring_id], ring_id, node_id',

      systems: '&id, system_name, node_id, status, updated_at',
      v_systems_complete:
        '&id, system_name, system_type_name, maintenance_terminal_id, node_id, status, [system_name+ip_address], updated_at',

      system_connections: '&id, system_id, status, updated_at',
      v_system_connections_complete:
        '&id, system_id, en_id, connected_system_name, service_name, created_at, status, updated_at',

      ports_management: '&id, [system_id+port], system_id, updated_at',
      v_ports_management_complete:
        '&id, system_id, port, port_admin_status, port_utilization, updated_at',

      services: '&id, name, updated_at',
      v_services: '&id, name, node_name, link_type_id, status, updated_at',

      logical_fiber_paths: '&id, path_name, system_connection_id',
      logical_path_segments: '&id, logical_path_id',
      logical_paths: '&id, ring_id, start_node_id, end_node_id',
      v_end_to_end_paths: '&path_id, path_name',

      sdh_connections: '&system_connection_id',

      inventory_items: '&id, asset_no, name',
      v_inventory_items: '&id, asset_no, name, category_id, location_id',

      inventory_transactions: '&id, inventory_item_id, created_at',
      v_inventory_transactions_extended: '&id, inventory_item_id, transaction_type, created_at',

      e_files: '&id, file_number, current_holder_employee_id, status',
      v_e_files_extended: '&id, file_number, status, current_holder_name, updated_at',

      file_movements: '&id, file_id, created_at',
      v_file_movements_extended: '&id, file_id, created_at',

      user_profiles: '&id, first_name, last_name, role, status',
      v_user_profiles_extended: '&id, email, full_name, role, status',
      diary_notes: '&id, &[user_id+note_date], note_date',

      files: '&id, folder_id, user_id, file_name, uploaded_at',
      folders: '&id, user_id, name',

      // ADDED: Notes
      technical_notes: '&id, title, is_published, created_at, updated_at',
      v_technical_notes: '&id, title, is_published, author_id, created_at, updated_at',

      user_activity_logs: '&id, action_type, table_name, created_at',
      v_audit_logs: '&id, action_type, table_name, created_at',

      sync_status: 'tableName',
      mutation_queue: '++id, timestamp, status, tableName',
      route_distances: 'id, timestamp',
    });
  }
}

export const localDb = new HNVTMDatabase();

export function getTable<T extends PublicTableOrViewName>(
  tableName: T,
): Table<Row<T>, string | number | [string, string]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (localDb as any)[tableName];
  if (!table) {
    console.warn(`Table ${tableName} not defined in localDb class.`);
    throw new Error(`Table ${tableName} does not exist in localDb`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return table as Table<Row<T>, any>;
}
