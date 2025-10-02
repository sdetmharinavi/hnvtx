<!-- path: data/cleanup/05_cleanup_core_infrastructure.sql -->
```sql
-- path: data/cleanup/05_cleanup_core_infrastructure.sql
-- Description: Drops all objects related to the Core Infrastructure module.

-- Drop Views
DROP VIEW IF EXISTS public.v_lookup_types;
DROP VIEW IF EXISTS public.v_maintenance_areas;
DROP VIEW IF EXISTS public.v_employee_designations;
DROP VIEW IF EXISTS public.v_employees;
DROP VIEW IF EXISTS public.v_rings;
DROP VIEW IF EXISTS public.v_nodes_complete;
DROP VIEW IF EXISTS public.v_ofc_cables_complete;
DROP VIEW IF EXISTS public.v_ofc_connections_complete; -- This view is created in network_systems, but depends on core tables.

-- Drop Functions
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.update_sn_dom_on_otdr_change();
DROP FUNCTION IF EXISTS public.update_en_dom_on_otdr_change();

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
```

<!-- path: data/cleanup/99_reverse_setup.sql -->
```sql
-- path: data/cleanup/99_reverse_setup.sql
-- Description: Drops all custom database roles. This must be run last.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Revoke role membership from 'authenticated' before dropping the roles.
    FOR r IN SELECT unnest(ARRAY['admin','cpan_admin','maan_admin','sdh_admin','vmux_admin','mng_admin','viewer']) as role_name
    LOOP
        EXECUTE format('REVOKE %I FROM authenticated', r.role_name);
    END LOOP;
END;
$$;

-- Drop the roles themselves
DROP ROLE IF EXISTS admin;
DROP ROLE IF EXISTS cpan_admin;
DROP ROLE IF EXISTS maan_admin;
DROP ROLE IF EXISTS sdh_admin;
DROP ROLE IF EXISTS vmux_admin;
DROP ROLE IF EXISTS mng_admin;
DROP ROLE IF EXISTS viewer;
```

<!-- path: data/cleanup/02_cleanup_auditing.sql -->
```sql
-- path: data/cleanup/02_cleanup_auditing.sql
-- Description: Drops all objects related to the auditing module.

-- Note: The triggers attached by the audit system are dropped when their respective tables are dropped with CASCADE.
-- We only need to drop the core audit objects.

DROP TABLE IF EXISTS public.user_activity_logs CASCADE;
DROP FUNCTION IF EXISTS public.log_user_activity(TEXT, TEXT, TEXT, JSONB, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.log_data_changes();
```

<!-- path: data/cleanup/01_cleanup_utilities.sql -->
```sql
-- path: data/cleanup/01_cleanup_utilities.sql
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
```

<!-- path: data/cleanup/03_cleanup_advanced_ofc.sql -->
```sql
-- path: data/cleanup/03_cleanup_advanced_ofc.sql
-- Description: Drops all objects related to the Advanced OFC module.

-- Drop Views
DROP VIEW IF EXISTS public.v_end_to_end_paths;
DROP VIEW IF EXISTS public.v_system_ring_paths_detailed;
DROP VIEW IF EXISTS public.v_cable_utilization;

-- Drop Tables (in reverse order of dependency)
-- fiber_splices depends on junction_closures, logical_fiber_paths, and ofc_cables.
-- logical_path_segments depends on logical_fiber_paths.
-- junction_closures depends on ofc_cables.
-- The CASCADE will handle dependencies within this group.
DROP TABLE IF EXISTS public.fiber_splices CASCADE;
DROP TABLE IF EXISTS public.logical_path_segments CASCADE;
DROP TABLE IF EXISTS public.logical_fiber_paths CASCADE;
DROP TABLE IF EXISTS public.fiber_joints CASCADE;
DROP TABLE IF EXISTS public.junction_closures CASCADE;
```

<!-- path: data/cleanup/04_cleanup_network_systems.sql -->
```sql
-- path: data/cleanup/04_cleanup_network_systems.sql
-- Description: Drops all objects related to the Network Systems module.

-- Drop Views first as they depend on the tables.
DROP VIEW IF EXISTS public.v_systems_complete;
DROP VIEW IF EXISTS public.v_system_connections_complete;
-- v_ofc_connections_complete is dropped in the core module cleanup.

-- Drop Tables (in reverse order of dependency)
-- The satellite tables depend on the main 'systems' and 'system_connections' tables.
DROP TABLE IF EXISTS public.sfp_based_connections CASCADE;
DROP TABLE IF EXISTS public.sdh_connections CASCADE;
DROP TABLE IF EXISTS public.vmux_connections CASCADE;
DROP TABLE IF EXISTS public.ring_based_systems CASCADE;

DROP TABLE IF EXISTS public.sdh_node_associations CASCADE;
DROP TABLE IF EXISTS public.sdh_systems CASCADE;
DROP TABLE IF EXISTS public.vmux_systems CASCADE;

DROP TABLE IF EXISTS public.management_ports CASCADE;
DROP TABLE IF EXISTS public.system_connections CASCADE;
DROP TABLE IF EXISTS public.systems CASCADE;
```

<!-- path: data/cleanup/06_cleanup_user_management.sql -->
```sql
-- path: data/cleanup/06_cleanup_user_management.sql
-- Description: Drops all objects related to the User Management module.

-- Drop Views
DROP VIEW IF EXISTS public.v_user_profiles_extended;

-- Drop Functions
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.get_my_user_details();
DROP FUNCTION IF EXISTS public.admin_get_all_users_extended(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INT, INT);
DROP FUNCTION IF EXISTS public.admin_get_user_by_id(UUID);
DROP FUNCTION IF EXISTS public.admin_update_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, DATE, JSONB, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_update_status(UUID[], TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_update_role(UUID[], TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_delete_users(UUID[]);
DROP FUNCTION IF EXISTS public.update_user_profile_timestamp();
DROP FUNCTION IF EXISTS public.sync_user_role_to_auth();
DROP FUNCTION IF EXISTS public.create_public_profile_for_new_user();

-- Drop Table
-- The CASCADE will remove triggers on this table and foreign keys from other tables referencing it.
-- It will also remove policies and grants associated with it.
DROP TABLE IF EXISTS public.user_profiles CASCADE;
```

<!-- path: data/cleanup/00_reverse_finalization.sql -->
```sql
-- path: data/cleanup/00_reverse_finalization.sql
-- Description: Removes cross-module foreign key constraints first.

ALTER TABLE public.ofc_connections DROP CONSTRAINT IF EXISTS fk_ofc_connections_system;
ALTER TABLE public.ofc_connections DROP CONSTRAINT IF EXISTS fk_ofc_connections_logical_path;
ALTER TABLE public.logical_fiber_paths DROP CONSTRAINT IF EXISTS fk_lfp_source_system;
ALTER TABLE public.logical_fiber_paths DROP CONSTRAINT IF EXISTS fk_lfp_destination_system;
```

