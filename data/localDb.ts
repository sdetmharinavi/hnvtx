// data/localDb.ts
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
  User_profilesRowSchema as User_profilesRow,
  // Import View types
  V_nodes_completeRowSchema,
  V_ofc_cables_completeRowSchema,
  V_systems_completeRowSchema,
  V_ringsRowSchema,
  V_employeesRowSchema,
  V_maintenance_areasRowSchema,
  V_cable_utilizationRowSchema,
} from '@/schemas/zod-schemas';
import { PublicTableName, Row } from '@/hooks/database';

export interface SyncStatus {
  tableName: string;
  lastSynced: string | null;
  status: 'pending' | 'syncing' | 'success' | 'error';
  error?: string;
}

export interface MutationTask {
  id?: number; // Auto-incremented primary key
  tableName: PublicTableName;
  type: 'insert' | 'update' | 'delete';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any; // The data for the operation
  timestamp: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  attempts: number;
  lastAttempt?: string;
  error?: string;
}

export class HNVTXDatabase extends Dexie {
  // Mirrored tables from Supabase
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
  user_profiles!: Table<User_profilesRow, string>;

  // Tables for Supabase Views
  v_nodes_complete!: Table<V_nodes_completeRowSchema, string>;
  v_ofc_cables_complete!: Table<V_ofc_cables_completeRowSchema, string>;
  v_systems_complete!: Table<V_systems_completeRowSchema, string>;
  v_rings!: Table<V_ringsRowSchema, string>;
  v_employees!: Table<V_employeesRowSchema, string>;
  v_maintenance_areas!: Table<V_maintenance_areasRowSchema, string>;
  v_cable_utilization!: Table<V_cable_utilizationRowSchema, string>;

  // Local-only tables for managing offline state
  sync_status!: Table<SyncStatus, string>;
  mutation_queue!: Table<MutationTask, number>;

  constructor() {
    super('HNVTXDatabase');
    // THE FIX: Increment version number to 3 to apply the new schema changes.
    this.version(3).stores({
      // Base Tables
      lookup_types: 'id, category, name',
      maintenance_areas: 'id, name, parent_id, area_type_id',
      employee_designations: 'id, name, parent_id',
      employees: 'id, employee_name, employee_pers_no, employee_designation_id, maintenance_terminal_id',
      nodes: 'id, name, node_type_id, maintenance_terminal_id',
      rings: 'id, name, ring_type_id, maintenance_terminal_id',
      ofc_cables: 'id, route_name, sn_id, en_id, ofc_type_id',
      systems: 'id, system_name, node_id, system_type_id',
      cable_segments: 'id, original_cable_id, start_node_id, end_node_id',
      junction_closures: 'id, node_id, ofc_cable_id',
      fiber_splices: 'id, jc_id, incoming_segment_id, outgoing_segment_id, logical_path_id',
      system_connections: 'id, system_id, sn_id, en_id, connected_system_id',
      user_profiles: 'id, first_name, last_name, role',

      // View Tables
      v_nodes_complete: 'id, name, node_type_name, maintenance_area_name',
      v_ofc_cables_complete: 'id, route_name, sn_name, en_name, ofc_type_name',
      v_systems_complete: 'id, system_name, node_name, system_type_name',
      v_rings: 'id, name, ring_type_name, maintenance_area_name',
      v_employees: 'id, employee_name, employee_designation_name, maintenance_area_name',
      v_maintenance_areas: 'id, name, code, maintenance_area_type_name',
      v_cable_utilization: 'cable_id, route_name', // NEWLY ADDED
      
      // Local-only tables
      sync_status: 'tableName',
      mutation_queue: '++id, timestamp, status, tableName',
    });
  }
}

export const localDb = new HNVTXDatabase();

export function getTable<T extends PublicTableName>(tableName: T): Table<Row<T>, string> {
    switch (tableName) {
        case 'lookup_types': return localDb.lookup_types as Table<Row<T>, string>;
        case 'maintenance_areas': return localDb.maintenance_areas as Table<Row<T>, string>;
        case 'employee_designations': return localDb.employee_designations as Table<Row<T>, string>;
        case 'employees': return localDb.employees as Table<Row<T>, string>;
        case 'nodes': return localDb.nodes as Table<Row<T>, string>;
        case 'rings': return localDb.rings as Table<Row<T>, string>;
        case 'ofc_cables': return localDb.ofc_cables as Table<Row<T>, string>;
        case 'systems': return localDb.systems as Table<Row<T>, string>;
        case 'cable_segments': return localDb.cable_segments as Table<Row<T>, string>;
        case 'junction_closures': return localDb.junction_closures as Table<Row<T>, string>;
        case 'fiber_splices': return localDb.fiber_splices as Table<Row<T>, string>;
        case 'system_connections': return localDb.system_connections as Table<Row<T>, string>;
        case 'user_profiles': return localDb.user_profiles as Table<Row<T>, string>;
        default:
            throw new Error(`Invalid table name "${tableName}" provided to getTable.`);
    }
}