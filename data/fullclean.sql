--===== cleanups/DropAllTablesexceptauth.sql =====
-- 1️⃣ Drop all views
DROP VIEW IF EXISTS 
    v_nodes_complete,
    v_systems_complete,
    v_ofc_cables_complete,
    v_ofc_connections_complete,
    v_system_connections_complete,
    v_user_profiles_extended
CASCADE;

-- 2️⃣ Drop all triggers
-- Drop triggers from "nodes"
DO $$
BEGIN
    IF to_regclass('public.nodes') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_update_ring_node_count ON nodes CASCADE';
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_nodes_updated_at ON nodes CASCADE';
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_update_dom_on_otdr_change ON nodes CASCADE';
    END IF;
END
$$;

-- Drop triggers from "lookup_types"
DO $$
BEGIN
    IF to_regclass('public.lookup_types') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_lookup_types_updated_at ON lookup_types CASCADE';
    END IF;
END
$$;

-- Drop triggers from "maintenance_areas"
DO $$
BEGIN
    IF to_regclass('public.maintenance_areas') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_maintenance_areas_updated_at ON maintenance_areas CASCADE';
    END IF;
END
$$;

-- Drop triggers from "rings"
DO $$
BEGIN
    IF to_regclass('public.rings') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_rings_updated_at ON rings CASCADE';
    END IF;
END
$$;

-- Drop triggers from "employees"
DO $$
BEGIN
    IF to_regclass('public.employees') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_employees_updated_at ON employees CASCADE';
    END IF;
END
$$;

-- Drop triggers from "ofc_cables"
DO $$
BEGIN
    IF to_regclass('public.ofc_cables') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_ofc_cables_updated_at ON ofc_cables CASCADE';
    END IF;
END
$$;

-- Drop triggers from "systems"
DO $$
BEGIN
    IF to_regclass('public.systems') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_systems_updated_at ON systems CASCADE';
    END IF;
END
$$;

-- Drop triggers from "maan_systems"
DO $$
BEGIN
    IF to_regclass('public.maan_systems') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_maan_systems_updated_at ON maan_systems CASCADE';
    END IF;
END
$$;

-- Drop triggers from "sdh_systems"
DO $$
BEGIN
    IF to_regclass('public.sdh_systems') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_sdh_systems_updated_at ON sdh_systems CASCADE';
    END IF;
END
$$;

-- Drop triggers from "vmux_systems"
DO $$
BEGIN
    IF to_regclass('public.vmux_systems') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_vmux_systems_updated_at ON vmux_systems CASCADE';
    END IF;
END
$$;

-- Drop triggers from "ofc_connections"
DO $$
BEGIN
    IF to_regclass('public.ofc_connections') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_ofc_connections_updated_at ON ofc_connections CASCADE';
    END IF;
END
$$;

-- Drop triggers from "system_connections"
DO $$
BEGIN
    IF to_regclass('public.system_connections') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_system_connections_updated_at ON system_connections CASCADE';
    END IF;
END
$$;

-- Drop triggers from "maan_connections"
DO $$
BEGIN
    IF to_regclass('public.maan_connections') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_maan_connections_updated_at ON maan_connections CASCADE';
    END IF;
END
$$;

-- Drop triggers from "sdh_connections"
DO $$
BEGIN
    IF to_regclass('public.sdh_connections') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_sdh_connections_updated_at ON sdh_connections CASCADE';
    END IF;
END
$$;

-- Drop triggers from "vmux_connections"
DO $$
BEGIN
    IF to_regclass('public.vmux_connections') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_vmux_connections_updated_at ON vmux_connections CASCADE';
    END IF;
END
$$;

-- Drop triggers from "management_ports"
DO $$
BEGIN
    IF to_regclass('public.management_ports') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_management_ports_updated_at ON management_ports CASCADE';
    END IF;
END
$$;

-- Drop triggers from "sdh_node_associations"
DO $$
BEGIN
    IF to_regclass('public.sdh_node_associations') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_sdh_node_associations_updated_at ON sdh_node_associations CASCADE';
    END IF;
END
$$;

-- Drop triggers from "employee_designations"
DO $$
BEGIN
    IF to_regclass('public.employee_designations') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_employee_designations_updated_at ON employee_designations CASCADE';
    END IF;
END
$$;

-- Drop triggers from "user_profiles"
DO $$
BEGIN
    IF to_regclass('public.user_profiles') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles CASCADE';
    END IF;
END
$$;

-- Drop triggers from "cpan_systems"
DO $$
BEGIN
    IF to_regclass('public.cpan_systems') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_cpan_systems_updated_at ON cpan_systems CASCADE';
    END IF;
END
$$;

-- Drop triggers from "cpan_connections"
DO $$
BEGIN
    IF to_regclass('public.cpan_connections') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trigger_cpan_connections_updated_at ON cpan_connections CASCADE';
    END IF;
END
$$;


-- 3️⃣ Drop all functions
DROP FUNCTION IF EXISTS 
    update_ring_node_count,
    update_updated_at_column,
    get_lookup_type_id,
    add_lookup_type,
    get_lookup_types_by_category,
    update_dom_on_otdr_change,

CASCADE;

-- 4️⃣ Drop all tables
DROP TABLE IF EXISTS 
    maan_connections,
    sdh_connections,
    vmux_connections,
    management_ports,
    sdh_node_associations,
    maan_systems,
    sdh_systems,
    vmux_systems,
    ofc_connections,
    system_connections,
    systems,
    ofc_cables,
    nodes,
    employees,
    rings,
    maintenance_areas,
    lookup_types,
    employee_designations,
    user_profiles,
    cpan_systems,
    cpan_connections,
CASCADE;

-- 5️⃣ Drop any remaining indexes (should auto-remove with table drops, but to be sure)
DROP INDEX IF EXISTS 
    idx_employees_remark_fts,
    idx_nodes_remark_fts,
    idx_ofc_cables_remark_fts,
    idx_systems_remark_fts,
    idx_ofc_connections_remark_fts,
    idx_system_connections_remark_fts,
    idx_management_ports_remark_fts
CASCADE;

--===== cleanups/clean_and_safe_drop_for_all_public_functions.sql =====
DO $$
DECLARE 
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE;', r.func_signature);
  END LOOP;
END $$;

--===== cleanups/CleanupUserProfiles.sql =====
-- 1️⃣ Drop the dependent view first
DROP VIEW IF EXISTS public.user_profile_details CASCADE;

-- 2️⃣ Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profile_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.user_profiles;
DROP TRIGGER IF EXISTS sync_user_role_insert_trigger ON public.user_profiles;

-- 3️⃣ Drop RLS policies
DROP POLICY IF EXISTS "users_select_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "super_admin_delete_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "users_select_own_profile_or_superadmin" ON public.user_profiles;
DROP POLICY IF EXISTS "users_insert_own_profile_or_superadmin" ON public.user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile_or_superadmin" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_own_profile_access_or_superadmin" ON public.user_profiles;

-- 4️⃣ Drop functions (if you no longer need them)
DROP FUNCTION IF EXISTS public.get_my_profile();
DROP FUNCTION IF EXISTS public.update_my_profile(
  TEXT, TEXT, TEXT, TEXT, DATE, JSONB, JSONB
);
DROP FUNCTION IF EXISTS public.get_my_user_details();
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.admin_get_all_users(
  TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER
);
DROP FUNCTION IF EXISTS public.admin_get_user_by_id(UUID);
DROP FUNCTION IF EXISTS public.admin_update_user_profile(
  UUID, TEXT, TEXT, TEXT, TEXT, DATE, JSONB, JSONB, TEXT, TEXT, TEXT
);
DROP FUNCTION IF EXISTS public.admin_bulk_update_status(UUID[], TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_update_role(UUID[], TEXT);
DROP FUNCTION IF EXISTS public.admin_bulk_delete_users(UUID[]);
DROP FUNCTION IF EXISTS public.update_user_profile_timestamp();
DROP FUNCTION IF EXISTS public.sync_user_role_to_auth();
DROP FUNCTION IF EXISTS public.create_public_profile_for_new_user();

-- 5️⃣ Drop indexes
DROP INDEX IF EXISTS idx_user_profiles_updated_at;
DROP INDEX IF EXISTS idx_user_profiles_phone;

-- 6️⃣ Finally drop the table
DROP TABLE IF EXISTS public.user_profiles CASCADE;
