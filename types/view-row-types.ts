import { Row } from "@/hooks/database";

export type RingTypeRowsWithCount = Row<'v_rings_with_count'>
export type NodeRowsWithCount = Row<'v_nodes_complete'>
export type OfcCableRowsWithCount = Row<'v_ofc_cables_complete'>
export type OfcConnectionRowsWithCount = Row<'v_ofc_connections_complete'>
export type SystemConnectionRowsWithCount = Row<'v_system_connections_complete'>
export type SystemRowsWithCount = Row<'v_systems_complete'>
export type UserProfileRowsWithCount = Row<'v_user_profiles_extended'>
export type LookupTypeRowsWithCount = Row<'v_lookup_types_with_count'>
export type EmployeeDesignationRowsWithCount = Row<'v_employee_designations_with_count'>
export type MaintenanceAreaRowsWithCount = Row<'v_maintenance_areas_with_count'>
export type EmployeeRowsWithCount = Row<'v_employees_with_count'>

export type  SystemRowsWithCountWithRelations = Row<'v_systems_complete'> & {
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
    
