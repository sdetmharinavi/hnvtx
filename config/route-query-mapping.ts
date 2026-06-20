// config/route-query-mapping.ts

import { PublicTableOrViewName } from '@/hooks/database/queries-type-helpers';

/**
 * Maps frontend routes to the React Query keys used to fetch their data.
 * This allows the Sidebar to prefetch data on hover.
 */
export const ROUTE_QUERY_MAP: Record<string, { key: string; tableName?: PublicTableOrViewName }> = {
  '/dashboard/systems': { key: 'systems-data', tableName: 'v_systems_complete' },
  '/dashboard/nodes': { key: 'nodes-data', tableName: 'v_nodes_complete' },
  '/dashboard/ofc': { key: 'ofc_cables-data', tableName: 'v_ofc_cables_complete' },
  '/dashboard/ofc/connections': { key: 'ofc_connections-data', tableName: 'v_ofc_connections_complete' },
  '/dashboard/services': { key: 'services-data', tableName: 'v_services' },
  '/dashboard/employees': { key: 'employees-data', tableName: 'v_employees' },
  '/dashboard/users': { key: 'admin-users-list', tableName: 'v_user_profiles_extended' },
  '/dashboard/rings': { key: 'rings-manager-data', tableName: 'v_rings' },
  '/dashboard/maintenance-areas': { key: 'maintenance_areas-data', tableName: 'v_maintenance_areas' },
  '/dashboard/designations': { key: 'employee_designations-data', tableName: 'v_employee_designations' },
  '/dashboard/lookup': { key: 'lookup_types-data', tableName: 'lookup_types' },
  '/dashboard/categories': { key: 'categories-data-all', tableName: 'lookup_types' },
  '/dashboard/audit-logs': { key: 'v_audit_logs-data', tableName: 'v_audit_logs' },
  '/dashboard/inventory': { key: 'inventory_items-data', tableName: 'v_inventory_items' },
  '/dashboard/notes': { key: 'technical_notes-data', tableName: 'v_technical_notes' },
  '/dashboard/systems/connections': { key: 'system_connections-data', tableName: 'v_system_connections_complete' },
};