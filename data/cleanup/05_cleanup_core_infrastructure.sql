-- path: data/cleanup/05_cleanup_core_infrastructure.sql
-- Description: Drops all objects related to the Core Infrastructure module. [UPDATED]

-- Drop Views
DROP VIEW IF EXISTS public.v_lookup_types;
DROP VIEW IF EXISTS public.v_maintenance_areas;
DROP VIEW IF EXISTS public.v_employee_designations;
DROP VIEW IF EXISTS public.v_employees;
DROP VIEW IF EXISTS public.v_nodes_complete;
DROP VIEW IF EXISTS public.v_ofc_cables_complete;
DROP VIEW IF EXISTS public.v_ofc_connections_complete;

-- Drop Functions
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.update_sn_dom_on_otdr_change();
DROP FUNCTION IF EXISTS public.update_en_dom_on_otdr_change();
DROP FUNCTION IF EXISTS public.create_initial_connections_for_cable();

-- Drop Tables (in reverse order of dependency)
-- CASCADE will handle triggers and indexes on these tables.
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.ofc_connections CASCADE;
DROP TABLE IF EXISTS public.ofc_cables CASCADE;
DROP TABLE IF EXISTS public.nodes CASCADE;
DROP TABLE IF EXISTS public.rings CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.employee_designations CASCADE;
DROP TABLE IF EXISTS public.maintenance_areas CASCADE;
DROP TABLE IF EXISTS public.lookup_types CASCADE;