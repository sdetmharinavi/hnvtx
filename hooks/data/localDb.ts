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
} from '@/schemas/zod-schemas';
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
  address: { street?: string | null; city?: string | null; state?: string | null; zip_code?: string | null; country?: string | null; } | null;
  preferences: { language?: string | null; theme?: string | null; needsOnboarding?: boolean | null; showOnboardingPrompt?: boolean | null; } | null;
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
  address: { street?: string | null; city?: string | null; state?: string | null; zip_code?: string | null; country?: string | null; } | null;
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
  preferences: { language?: string | null; theme?: string | null; needsOnboarding?: boolean | null; showOnboardingPrompt?: boolean | null; } | null;
  raw_app_meta_data: Json | null;
  raw_user_meta_data: Json | null;
};

export interface SyncStatus {
  tableName: string;
  lastSynced: string | null;
  status: 'pending' | 'syncing' | 'success' | 'error';
  error?: string;
  count?: number; // Track how many items are synced
}

export interface MutationTask {
  id?: number;
  tableName: PublicTableName;
  type: 'insert' | 'update' | 'delete';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  attempts: number;
  lastAttempt?: string;
  error?: string;
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
  services!: Table<ServicesRowSchema , string>;
  inventory_transactions!: Table<V_inventory_transactions_extendedRowSchema, string>;
  logical_fiber_paths!: Table<Logical_fiber_pathsRowSchema, string>;

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

  sync_status!: Table<SyncStatus, string>;
  mutation_queue!: Table<MutationTask, number>;

  constructor() {
    super('HNVTMDatabase');

    // VERSION 25: Ensure indexes are optimized for searching and sorting
    // Added created_at indexes to logs/history tables for incremental sync
    this.version(25).stores({
      lookup_types: '&id, category, name',
      maintenance_areas: '&id, name, parent_id, area_type_id',
      employee_designations: '&id, name, parent_id',
      employees: '&id, employee_name, employee_pers_no',
      nodes: '&id, name, node_type_id',
      rings: '&id, name, ring_type_id',
      ofc_cables: '&id, route_name, sn_id, en_id',
      systems: '&id, system_name, node_id',
      cable_segments: '&id, original_cable_id',
      junction_closures: '&id, node_id',
      fiber_splices: '&id, jc_id',
      system_connections: '&id, system_id',
      user_profiles: '&id, first_name, last_name, role',
      diary_notes: '&id, &[user_id+note_date], note_date',
      inventory_items: '&id, asset_no, name',
      ring_based_systems: '&[system_id+ring_id], ring_id, system_id',
      ports_management: '&id, [system_id+port], system_id',
      services: '&id, name',
      logical_fiber_paths: '&id, path_name, system_connection_id',
      inventory_transactions: '&id, inventory_item_id, created_at',

      v_nodes_complete: '&id, name',
      v_ofc_cables_complete: '&id, route_name',
      v_systems_complete: '&id, system_name',
      v_rings: '&id, name',
      v_employees: '&id, employee_name',
      v_maintenance_areas: '&id, name',
      v_cable_utilization: 'cable_id',
      v_ring_nodes: '&[id+ring_id], ring_id',
      v_employee_designations: '&id, name',
      v_inventory_items: '&id, asset_no, name',
      v_user_profiles_extended: '&id, email, full_name, role, status',
      v_ofc_connections_complete: '&id, ofc_id, system_id',
      v_system_connections_complete: '&id, system_id, en_id, connected_system_name, service_name, created_at',
      v_ports_management_complete: '&id, system_id, port',
      // Added created_at index for incremental sync on audit logs
      v_audit_logs: '&id, action_type, table_name, created_at',
      v_services: '&id, name, node_name',
      v_end_to_end_paths: '&path_id, path_name',
      // Added created_at index for incremental sync on inventory history
      v_inventory_transactions_extended: '&id, inventory_item_id, transaction_type, created_at',

      sync_status: 'tableName',
      mutation_queue: '++id, timestamp, status',
    });
  }
}

export const localDb = new HNVTMDatabase();

export function getTable<T extends PublicTableOrViewName>(tableName: T): Table<Row<T>, string | number | [string, string]> {
    const table = localDb.table(tableName);
    if (!table) {
        throw new Error(`Table ${tableName} does not exist`);
    }
    return table as Table<Row<T>, string | number | [string, string]>;
}