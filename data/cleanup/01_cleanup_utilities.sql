-- Path: supabase/cleanup/01_cleanup_utilities.sql
-- Description: Drops all generic utility, dashboard, and pagination functions.

-- Drop Pagination and Dashboard Functions
DROP FUNCTION IF EXISTS public.get_dashboard_overview();
DROP FUNCTION IF EXISTS public.get_entity_counts(TEXT, JSONB);
DROP FUNCTION IF EXISTS internal.build_where_clause(JSONB);
DROP FUNCTION IF EXISTS public.get_paged_nodes_complete(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_ofc_cables_complete(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_ofc_connections_complete(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_systems_complete(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_system_connections_complete(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_lookup_types(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_maintenance_areas(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_employee_designations(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_employees(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_paged_rings(INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_system_path_details(UUID);
DROP FUNCTION IF EXISTS public.get_continuous_available_fibers(UUID);

-- Drop Generic Utility Functions
DROP FUNCTION IF EXISTS public.execute_sql(TEXT);
DROP FUNCTION IF EXISTS public.get_unique_values(TEXT, TEXT, JSONB, JSONB, INTEGER);
DROP FUNCTION IF EXISTS public.get_lookup_type_id(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_lookup_type(TEXT, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_lookup_types_by_category(TEXT);
DROP FUNCTION IF EXISTS public.bulk_update(TEXT, JSONB, INTEGER);
DROP FUNCTION IF EXISTS public.provision_ring_path(UUID, TEXT, INT, INT, UUID);
DROP FUNCTION IF EXISTS public.auto_splice_straight(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.manage_splice(TEXT, UUID, UUID, UUID, INT, UUID, INT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS public.get_cables_at_jc(UUID);
DROP FUNCTION IF EXISTS public.get_all_splices();
DROP FUNCTION IF EXISTS public.trace_fiber_path(UUID, INT);