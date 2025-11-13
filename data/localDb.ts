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
  V_nodes_completeRowSchema,
  V_ofc_cables_completeRowSchema,
  V_systems_completeRowSchema,
  V_ringsRowSchema,
  V_employeesRowSchema,
  V_maintenance_areasRowSchema,
  V_cable_utilizationRowSchema,
  V_ring_nodesRowSchema,
  Diary_notesRowSchema,
} from '@/schemas/zod-schemas';
import { PublicTableName, Row, PublicTableOrViewName } from '@/hooks/database';

export interface SyncStatus {
  tableName: string;
  lastSynced: string | null;
  status: 'pending' | 'syncing' | 'success' | 'error';
  error?: string;
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
  user_profiles!: Table<User_profilesRow, string>;
  diary_notes!: Table<Diary_notesRowSchema, string>;

  v_nodes_complete!: Table<V_nodes_completeRowSchema, string>;
  v_ofc_cables_complete!: Table<V_ofc_cables_completeRowSchema, string>;
  v_systems_complete!: Table<V_systems_completeRowSchema, string>;
  v_rings!: Table<V_ringsRowSchema, string>;
  v_employees!: Table<V_employeesRowSchema, string>;
  v_maintenance_areas!: Table<V_maintenance_areasRowSchema, string>;
  v_cable_utilization!: Table<V_cable_utilizationRowSchema, string>;
  v_ring_nodes!: Table<V_ring_nodesRowSchema, string>;

  sync_status!: Table<SyncStatus, string>;
  mutation_queue!: Table<MutationTask, number>;

  constructor() {
    super('HNVTMDatabase');
    // THE FIX: Incremented version number to apply schema changes.
    this.version(6).stores({
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
      system_connections: 'id, system_id, sn_id, en_id, connected_system_type_id',
      user_profiles: 'id, first_name, last_name, role',
      // THE FIX: Added a compound index on user_id and note_date for efficient lookups.
      diary_notes: 'id, &[user_id+note_date], note_date',
      v_nodes_complete: 'id, name, node_type_id',
      v_ofc_cables_complete: 'id, route_name, sn_id, en_id',
      v_systems_complete: 'id, system_name, node_id, system_type_id',
      v_rings: 'id, name, ring_type_id',
      v_employees: 'id, employee_name, employee_designation_id',
      v_maintenance_areas: 'id, name, area_type_id',
      v_cable_utilization: 'cable_id',
      v_ring_nodes: 'id, ring_id, name',
      
      sync_status: 'tableName',
      mutation_queue: '++id, timestamp, status, tableName',
    });
  }
}

export const localDb = new HNVTMDatabase();

export function getTable<T extends PublicTableOrViewName>(tableName: T): Table<Row<T>, string> {
    const table = localDb.table(tableName);
    if (!table) {
        throw new Error(`Invalid table or view name "${tableName}" provided to getTable.`);
    }
    return table as Table<Row<T>, string>;
}