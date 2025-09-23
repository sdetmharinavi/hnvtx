<!-- path: telecom_network_db/05_auditing/2_functions/2_log_data_changes.sql -->
```sql

CREATE OR REPLACE FUNCTION public.log_data_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_record_id TEXT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_record_id := NEW.id::TEXT;
        PERFORM public.log_user_activity(
            'INSERT',
            TG_TABLE_NAME,
            v_record_id,
            NULL,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_record_id := NEW.id::TEXT;
        PERFORM public.log_user_activity(
            'UPDATE',
            TG_TABLE_NAME,
            v_record_id,
            row_to_json(OLD)::jsonb,
            row_to_json(NEW)::jsonb
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_record_id := OLD.id::TEXT;
        PERFORM public.log_user_activity(
            'DELETE',
            TG_TABLE_NAME,
            v_record_id,
            row_to_json(OLD)::jsonb,
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;
```

<!-- path: telecom_network_db/05_auditing/2_functions/1_log_user_activity.sql -->
```sql

CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_action_type TEXT,
    p_table_name TEXT DEFAULT NULL,
    p_record_id TEXT DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_details TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id,
        user_role,
        action_type,
        table_name,
        record_id,
        old_data,
        new_data,
        details
    )
    VALUES (
        auth.uid(),
        public.get_my_role(),
        p_action_type,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        p_details
    );
END;
$$;
```

<!-- path: telecom_network_db/05_auditing/3_triggers/1_attach_logging_triggers.sql -->
```sql
-- REFACTORED: This script now automatically attaches the log_data_changes trigger
-- to all tables in the public schema that have an 'id' column and are not logs themselves.

DO $$
DECLARE
    table_rec RECORD;
    trigger_name text;
BEGIN
    -- Loop through all user tables in the 'public' schema
    FOR table_rec IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND t.table_name <> 'user_activity_logs'
          AND EXISTS (
              SELECT 1
              FROM information_schema.columns c
              WHERE c.table_schema = 'public'
                AND c.table_name = t.table_name
                AND c.column_name = 'id'
          )
    LOOP
        trigger_name := table_rec.table_name || '_log_trigger';

        -- Only create the trigger if it does not already exist
        IF NOT EXISTS (
            SELECT 1
            FROM pg_trigger trg
            JOIN pg_class cls ON trg.tgrelid = cls.oid
            JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
            WHERE trg.tgname = trigger_name
              AND nsp.nspname = 'public'
              AND cls.relname = table_rec.table_name
        ) THEN
            EXECUTE format('CREATE TRIGGER %I ' ||
                           'AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
                           'FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();',
                           trigger_name,
                           table_rec.table_name);

            RAISE NOTICE 'Created audit trigger on %.%', 'public', table_rec.table_name;
        ELSE
            RAISE NOTICE 'Trigger already exists on %.%, skipping.', 'public', table_rec.table_name;
        END IF;
    END LOOP;
END;
$$;

```

<!-- path: telecom_network_db/05_auditing/1_tables/1_user_activity_logs.sql -->
```sql

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        user_role TEXT,
        action_type TEXT NOT NULL,
        table_name TEXT,
        record_id TEXT,
        old_data JSONB,
        new_data JSONB,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON public.user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_table_name ON public.user_activity_logs(table_name);
-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create Policy to give access to admin role || isSuperAdmin only
DROP POLICY IF EXISTS allow_admin_select ON public.user_activity_logs;
DROP POLICY IF EXISTS allow_admin_insert ON public.user_activity_logs;
DROP POLICY IF EXISTS allow_admin_update ON public.user_activity_logs;
-- SELECT policies
CREATE POLICY allow_admin_select ON public.user_activity_logs FOR
SELECT TO admin USING (true);
-- INSERT policies
CREATE POLICY allow_admin_insert ON public.user_activity_logs FOR
INSERT TO admin WITH CHECK (true);
-- UPDATE policies
CREATE POLICY allow_admin_update ON public.user_activity_logs FOR
UPDATE TO admin USING (true) WITH CHECK (true);
-- Table Grant
GRANT ALL ON public.user_activity_logs TO admin;
```

<!-- path: telecom_network_db/03_network_systems/2_views/2_v_system_connections_complete.sql -->
```sql
-- This view now joins the new 'sfp_based_connections' table.
drop view if exists v_system_connections_complete;
create or replace view v_system_connections_complete with (security_invoker = true) as
select
  sc.id, sc.system_id, s.system_name, lt_system.name as system_type_name,
  s_sn.system_name as sn_name, na.name as sn_node_name, sc.sn_ip, sc.sn_interface,
  s_en.system_name as en_name, nb.name as en_node_name, sc.en_ip, sc.en_interface,
  lt_media.name as media_type_name, sc.bandwidth_mbps, cs.system_name as connected_system_name,
  lt_cs_type.name as connected_system_type_name, sc.vlan, sc.commissioned_on,
  sc.remark, sc.status, sc.created_at, sc.updated_at,
  -- SFP-based details (from consolidated table)
  sfpc.sfp_port, lt_sfp.name as sfp_type_name, sfpc.sfp_capacity,
  sfpc.sfp_serial_no, sfpc.fiber_in, sfpc.fiber_out, sfpc.customer_name, sfpc.bandwidth_allocated_mbps,
  -- SDH details
  scs.stm_no as sdh_stm_no, scs.carrier as sdh_carrier, scs.a_slot as sdh_a_slot,
  scs.a_customer as sdh_a_customer, scs.b_slot as sdh_b_slot, scs.b_customer as sdh_b_customer,
  -- VMUX details
  vcs.subscriber as vmux_subscriber, vcs.c_code as vmux_c_code, vcs.channel as vmux_channel, vcs.tk as vmux_tk,
  count(*) OVER() AS total_count,
  sum(case when sc.status = true then 1 else 0 end) over() as active_count,
  sum(case when sc.status = false then 1 else 0 end) over() as inactive_count
from system_connections sc
  join systems s on sc.system_id = s.id
  join lookup_types lt_system on s.system_type_id = lt_system.id
  left join systems s_sn on sc.sn_id = s_sn.id
  left join nodes na on s_sn.node_id = na.id
  left join systems s_en on sc.en_id = s_en.id
  left join nodes nb on s_en.node_id = nb.id
  left join systems cs on sc.connected_system_id = cs.id
  left join lookup_types lt_cs_type on cs.system_type_id = lt_cs_type.id
  left join lookup_types lt_media on sc.media_type_id = lt_media.id
  left join sfp_based_connections sfpc on sc.id = sfpc.system_connection_id
  left join lookup_types lt_sfp on sfpc.sfp_type_id = lt_sfp.id
  left join sdh_connections scs on sc.id = scs.system_connection_id
  left join vmux_connections vcs on sc.id = vcs.system_connection_id;
```

<!-- path: telecom_network_db/03_network_systems/2_views/3_v_ofc_connections_complete.sql -->
```sql
drop view if exists v_ofc_connections_complete;
create view v_ofc_connections_complete with (security_invoker = true) as
select 
  oc.id::uuid,
  oc.ofc_id::uuid,
  oc.fiber_no_sn::integer,
  oc.fiber_no_en::integer,
  oc.otdr_distance_sn_km::numeric(10,3),
  oc.sn_dom::date,
  oc.sn_power_dbm::numeric(10,3),
  oc.system_id::uuid,
  oc.otdr_distance_en_km::numeric(10,3),
  oc.en_dom::date,
  oc.en_power_dbm::numeric(10,3),
  oc.route_loss_db::numeric(10,3),
  oc.logical_path_id::uuid,
  oc.fiber_role::text,
  oc.path_segment_order::integer,
  oc.source_port::text,
  oc.destination_port::text,
  oc.connection_category::text,
  oc.connection_type::text,
  oc.remark::text,
  oc.status::boolean,
  oc.created_at::timestamptz,
  oc.updated_at::timestamptz,
  ofc.route_name as ofc_route_name,
  ma.name as maintenance_area_name,
  ofc.sn_id::uuid, 
  ofc.en_id::uuid, 
  ofc_type.name as ofc_type_name,
  na.name as sn_name, 
  s.system_name as system_name, 
  nb.name as en_name,
  count(*) OVER()::integer AS total_count,
  sum(case when oc.status = true then 1 else 0 end) over()::integer as active_count,
  sum(case when oc.status = false then 1 else 0 end) over()::integer as inactive_count
from ofc_connections oc
  join ofc_cables ofc on oc.ofc_id = ofc.id
  join lookup_types ofc_type on ofc.ofc_type_id = ofc_type.id
  left join nodes na on ofc.sn_id = na.id
  left join nodes nb on ofc.en_id = nb.id
  left join systems s on oc.system_id = s.id
  left join maintenance_areas ma on ofc.maintenance_terminal_id = ma.id;
```

<!-- path: telecom_network_db/03_network_systems/2_views/1_v_systems_complete.sql -->
```sql
-- This view joins the new 'ring_based_systems' table and uses clearer aliases.
drop view if exists v_systems_complete;
create view v_systems_complete with (security_invoker = true) as
select
  s.*,
  n.name as node_name,
  n.latitude,
  n.longitude,
  lt_system.name as system_type_name,
  lt_system.code as system_type_code,
  lt_system.category as system_category,
  ma.name as system_maintenance_terminal_name,
  rbs.ring_id as ring_id,
  ring_area.name as ring_logical_area_name,
  ss.gne as sdh_gne,
  ss.make as sdh_make,
  vs.vm_id as vmux_vm_id,
  count(*) OVER() AS total_count,
  sum(case when s.status = true then 1 else 0 end) over() as active_count,
  sum(case when s.status = false then 1 else 0 end) over() as inactive_count
from systems s
  join nodes n on s.node_id = n.id
  join lookup_types lt_system on s.system_type_id = lt_system.id
  left join maintenance_areas ma on s.maintenance_terminal_id = ma.id
  left join ring_based_systems rbs on s.id = rbs.system_id
  left join maintenance_areas ring_area on rbs.maintenance_area_id = ring_area.id
  left join sdh_systems ss on s.id = ss.system_id
  left join vmux_systems vs on s.id = vs.system_id;

```

<!-- path: telecom_network_db/03_network_systems/5_constraints/1_add_fk_constraints.sql -->
```sql
-- =================================================================
-- Add Cross-Module Foreign Key Constraints for Network Systems
-- =================================================================
-- This script adds foreign key constraints that link tables from
-- earlier modules to tables created within this module.
-- =================================================================

-- Add the foreign key from ofc_connections (module 02) to systems (module 03)
ALTER TABLE public.ofc_connections
ADD CONSTRAINT fk_ofc_connections_system
FOREIGN KEY (system_id) 
REFERENCES public.systems(id)
ON DELETE SET NULL; -- If a system is deleted, set the reference in ofc_connections to NULL
```

<!-- path: telecom_network_db/03_network_systems/4_triggers/1_updated_at_triggers.sql -->
```sql
-- REFACTORED: Triggers now target the new consolidated tables.

-- ADDED: Triggers for new consolidated tables
create trigger trigger_ring_based_systems_updated_at before
update on ring_based_systems for each row execute function update_updated_at_column();
create trigger trigger_sfp_based_connections_updated_at before
update on sfp_based_connections for each row execute function update_updated_at_column();

-- Triggers for other tables (unchanged)
create trigger trigger_sdh_systems_updated_at before
update on sdh_systems for each row execute function update_updated_at_column();
create trigger trigger_sdh_connections_updated_at before
update on sdh_connections for each row execute function update_updated_at_column();
create trigger trigger_vmux_systems_updated_at before
update on vmux_systems for each row execute function update_updated_at_column();
create trigger trigger_vmux_connections_updated_at before
update on vmux_connections for each row execute function update_updated_at_column();
create trigger trigger_systems_updated_at before
update on systems for each row execute function update_updated_at_column();
create trigger trigger_system_connections_updated_at before
update on system_connections for each row execute function update_updated_at_column();
create trigger trigger_management_ports_updated_at before
update on management_ports for each row execute function update_updated_at_column();
create trigger trigger_sdh_node_associations_updated_at before
update on sdh_node_associations for each row execute function update_updated_at_column();
```

<!-- path: telecom_network_db/03_network_systems/3_indexes/1_system_indexes.sql -->
```sql
-- REFACTORED: Indexes now target the new consolidated tables.

-- Indexes for the generic systems table (unchanged)
create index if not exists idx_systems_node_id on systems (node_id);
-- ...

-- Indexes for system-specific tables
-- ADDED: Indexes for the new consolidated tables
create index if not exists idx_ring_based_systems_ring_area on ring_based_systems (ring_id, maintenance_area_id);
create index if not exists idx_sfp_based_connections_customer on sfp_based_connections (customer_name);

-- REMOVED: Old indexes for cpan_systems and maan_systems/connections are no longer needed.
-- create index idx_cpan_systems_ring_area on cpan_systems (ring_no, area);
-- create index idx_maan_systems_ring_area on maan_systems (ring_no, area);
-- create index idx_maan_connections_customer on maan_connections (customer_name);

-- Indexes for other systems (unchanged)
create index if not exists idx_sdh_systems_make on sdh_systems (make);
-- ...
```

<!-- path: telecom_network_db/03_network_systems/3_indexes/2_fts_indexes.sql -->
```sql
-- Add GIN indexes for full-text search on Network Systems remark fields
create index idx_systems_remark_fts on systems using gin(to_tsvector('english', remark));
create index idx_system_connections_remark_fts on system_connections using gin(to_tsvector('english', remark));
create index idx_management_ports_remark_fts on management_ports using gin(to_tsvector('english', remark));
```

<!-- path: telecom_network_db/03_network_systems/1_tables/03_management_ports.sql -->
```sql
-- Management Network Ports
create table management_ports (
  id UUID primary key default gen_random_uuid(),
  port_no TEXT not null,
  name TEXT,
  node_id UUID references nodes (id),
  system_id UUID references systems (id),
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/03_network_systems/1_tables/01_systems.sql -->
```sql
-- Generic Systems Table (CPAN, MAAN, SDH, VMUX, etc.)
create table systems (
  id UUID primary key default gen_random_uuid(),
  system_type_id UUID references lookup_types (id) not null,
  node_id UUID references nodes (id) not null,
  system_name TEXT,
  ip_address INET,
  maintenance_terminal_id UUID references maintenance_areas (id),
  commissioned_on DATE,
  s_no TEXT,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/03_network_systems/1_tables/7_sdh_node_associations.sql -->
```sql
-- SDH Node Associations
create table sdh_node_associations (
  id UUID primary key default gen_random_uuid(),
  sdh_system_id UUID references sdh_systems (system_id) not null,
  node_id UUID references nodes (id) not null,
  node_position CHAR(1) check (
    node_position in ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')
  ),
  node_ip INET,
  constraint uq_sdh_system_position unique (sdh_system_id, node_position)
);
```

<!-- path: telecom_network_db/03_network_systems/1_tables/02_system_connections.sql -->
```sql
-- Generic System Connections Table
create table system_connections (
  id UUID primary key default gen_random_uuid(),
  system_id UUID references systems (id) not null,
  sn_id UUID references systems (id),
  en_id UUID references systems (id),
  connected_system_id UUID references systems (id),
  sn_ip INET,
  sn_interface TEXT,
  en_ip INET,
  en_interface TEXT,
  media_type_id UUID references lookup_types (id),
  bandwidth_mbps INTEGER,
  vlan TEXT,
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/03_network_systems/1_tables/05_sdh_systems.sql -->
```sql
-- Dedicated Table for SDH System Specific Details
create table sdh_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  gne TEXT,
  make TEXT
);
```

<!-- path: telecom_network_db/03_network_systems/1_tables/8_vmux_systems.sql -->
```sql
-- Dedicated Table for VMUX System Specific Details
create table vmux_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  vm_id TEXT
);
```

<!-- path: telecom_network_db/03_network_systems/1_tables/04_consolidated_system_tables.sql -->
```sql
-- REFACTORED: This file replaces the redundant cpan_systems, maan_systems, cpan_connections, and maan_connections tables.

-- New Consolidated Table for Ring-Based System Details (replaces cpan_systems and maan_systems)
create table ring_based_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  ring_id UUID references rings (id),
  maintenance_area_id UUID references maintenance_areas (id)
);

-- New Consolidated Table for SFP-Based Connection Details (replaces cpan_connections and maan_connections)
create table sfp_based_connections (
  system_connection_id UUID primary key references system_connections (id) on delete CASCADE,
  sfp_port TEXT,
  sfp_type_id UUID references lookup_types (id),
  sfp_capacity TEXT,
  sfp_serial_no TEXT,
  fiber_in INTEGER,
  fiber_out INTEGER,
  customer_name TEXT,
  bandwidth_allocated_mbps INTEGER
);

-- NOTE: The following tables have been removed and replaced by the consolidated tables above:
-- cpan_systems, maan_systems, cpan_connections, maan_connections.
```

<!-- path: telecom_network_db/03_network_systems/1_tables/06_sdh_connections.sql -->
```sql
-- Dedicated Table for SDH Connection Specific Details
create table sdh_connections (
  system_connection_id UUID primary key references system_connections (id) on delete CASCADE,
  stm_no TEXT,
  carrier TEXT,
  a_slot TEXT,
  a_customer TEXT,
  b_slot TEXT,
  b_customer TEXT
);
```

<!-- path: telecom_network_db/03_network_systems/1_tables/9_vmux_connections.sql -->
```sql
-- Dedicated Table for VMUX Connection Specific Details
create table vmux_connections (
  system_connection_id UUID primary key references system_connections (id) on delete CASCADE,
  subscriber TEXT,
  c_code TEXT,
  channel TEXT,
  tk TEXT
);
```

<!-- path: telecom_network_db/99_security/3_grants/1_user_management_grants.sql -->
```sql
-- Grants for utility functions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_user_details() TO authenticated;

-- Grants for admin functions
GRANT EXECUTE ON FUNCTION public.admin_get_all_users(
    text, text, text, timestamptz, timestamptz, integer, integer
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_user_by_id(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(
    uuid, text, text, text, text, date, jsonb, jsonb, text, text, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.admin_bulk_update_status(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_role(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_delete_users(uuid[]) TO authenticated;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant Table Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO admin;
GRANT SELECT ON public.user_profiles TO viewer;
```

<!-- path: telecom_network_db/99_security/3_grants/2_ofc_related.sql -->
```sql
-- =================================================================
-- GRANTS FOR NEW AND RELEVANT VIEWS
-- =================================================================
-- This script grants SELECT permissions on specific views required for
-- the OFC Details and Route Manager features.
-- =================================================================

-- Grant permissions for the complete OFC cables view.
-- This is essential for the Route Manager's dropdown and route details.
GRANT SELECT ON public.v_ofc_cables_complete TO viewer;
GRANT SELECT ON public.v_ofc_cables_complete TO admin;

-- Grant permissions for the complete OFC connections view.
-- This is used on the OFC details page.
GRANT SELECT ON public.v_ofc_connections_complete TO viewer;
GRANT SELECT ON public.v_ofc_connections_complete TO admin;

-- Grant permissions for the complete nodes view.
-- This is used as a relation by other views.
GRANT SELECT ON public.v_nodes_complete TO viewer;
GRANT SELECT ON public.v_nodes_complete TO admin;

-- Grant permissions for the detailed path view.
-- This is required for the upcoming fiber tracing feature.
GRANT SELECT ON public.v_system_ring_paths_detailed TO viewer;
GRANT SELECT ON public.v_system_ring_paths_detailed TO admin;

-- Grant permissions for the cable utilization view (used in future dashboards).
GRANT SELECT ON public.v_cable_utilization TO viewer;
GRANT SELECT ON public.v_cable_utilization TO admin;

-- Grant permissions for the end-to-end paths view.
GRANT SELECT ON public.v_end_to_end_paths TO viewer;
GRANT SELECT ON public.v_end_to_end_paths TO admin;

-- Also, ensure the underlying tables have the correct grants for the viewer role.
-- Your existing policies script likely handles this, but we add it here for safety.
GRANT ALL ON public.junction_closures TO admin;
GRANT ALL ON public.fiber_splices TO admin;
GRANT ALL ON public.ofc_cables TO admin;
GRANT ALL ON public.nodes TO admin;
GRANT SELECT ON public.junction_closures TO viewer;
GRANT SELECT ON public.fiber_splices TO viewer;
GRANT SELECT ON public.ofc_cables TO viewer;
GRANT SELECT ON public.nodes TO viewer;

```

<!-- path: telecom_network_db/99_security/1_setup/1_create_roles.sql -->
```sql
-- Create roles only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cpan_admin') THEN
        CREATE ROLE cpan_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'maan_admin') THEN
        CREATE ROLE maan_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sdh_admin') THEN
        CREATE ROLE sdh_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vmux_admin') THEN
        CREATE ROLE vmux_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mng_admin') THEN
        CREATE ROLE mng_admin NOINHERIT;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'viewer') THEN
        CREATE ROLE viewer NOINHERIT;
    END IF;
END
$$;

-- Safely grant membership to authenticated
DO $$
DECLARE
    r TEXT;
BEGIN
    FOR r IN 
        SELECT unnest(ARRAY['admin','cpan_admin','maan_admin','sdh_admin','vmux_admin','mng_admin','viewer'])
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_auth_members m
            JOIN pg_roles r1 ON r1.oid = m.roleid
            JOIN pg_roles r2 ON r2.oid = m.member
            WHERE r1.rolname = r
              AND r2.rolname = 'authenticated'
        ) THEN
            EXECUTE format('GRANT %I TO authenticated', r);
        END IF;
    END LOOP;
END
$$;

```

<!-- path: telecom_network_db/99_security/2_policies/4_route.sql -->
```sql
-- =================================================================
-- FINAL PERMISSIONS SCRIPT FOR ROUTE MANAGER
-- This script aligns with the existing security model by granting
-- permissions to specific roles, not the general 'authenticated' role.
-- =================================================================

-- Step 1: Grant Table-Level Permissions to Specific Roles

-- The 'admin' role gets full control over the new tables.
GRANT ALL ON public.junction_closures TO admin;
GRANT ALL ON public.fiber_splices TO admin;

-- The 'viewer' role needs SELECT permission on the new tables AND any tables joined by the RPC functions.
-- This is the critical step that was missing.
GRANT SELECT ON public.junction_closures TO viewer;
GRANT SELECT ON public.fiber_splices TO viewer;
GRANT SELECT ON public.ofc_cables TO viewer;
GRANT SELECT ON public.nodes TO viewer;
GRANT SELECT ON public.logical_fiber_paths TO viewer;


-- Step 2: Ensure Correct RLS Policies Are In Place for Specific Roles
-- This is idempotent and will replace any previous, incorrect policies for these tables.

-- RLS for `junction_closures`
DROP POLICY IF EXISTS "policy_admin_all_junction_closures" ON public.junction_closures;
CREATE POLICY "policy_admin_all_junction_closures" ON public.junction_closures
FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "policy_viewer_select_junction_closures" ON public.junction_closures;
CREATE POLICY "policy_viewer_select_junction_closures" ON public.junction_closures
FOR SELECT TO viewer USING (get_my_role() = 'viewer');

-- RLS for `fiber_splices`
DROP POLICY IF EXISTS "policy_admin_all_fiber_splices" ON public.fiber_splices;
CREATE POLICY "policy_admin_all_fiber_splices" ON public.fiber_splices
FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin');

DROP POLICY IF EXISTS "policy_viewer_select_fiber_splices" ON public.fiber_splices;
CREATE POLICY "policy_viewer_select_fiber_splices" ON public.fiber_splices
FOR SELECT TO viewer USING (get_my_role() = 'viewer');


-- Step 3: Grant EXECUTE on the functions to the 'authenticated' role
-- This allows any logged-in user to CALL the function. The security inside the function
-- and the RLS policies on the tables will then determine if the action is allowed.
GRANT EXECUTE ON FUNCTION public.get_jc_splicing_details(p_jc_id UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manage_splice(p_action TEXT, p_jc_id UUID, p_splice_id UUID, p_incoming_cable_id UUID, p_incoming_fiber_no INT, p_outgoing_cable_id UUID, p_outgoing_fiber_no INT, p_splice_type TEXT) TO authenticated;


-- Final confirmation
SELECT 'Final, targeted permissions for Route Manager have been applied successfully.' as status;
```

<!-- path: telecom_network_db/99_security/2_policies/3_system_tables_policies.sql -->
```sql
-- REFACTORED: This script defines all security (Grants and RLS Policies) for the entire Network Systems module.
-- It is structured to reduce boilerplate and improve maintainability.

-- =================================================================
-- PART 1: GRANTS AND RLS SETUP FOR ALL SYSTEM TABLES
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- List all tables related to network systems
  FOREACH tbl IN ARRAY ARRAY[
    'systems', 'system_connections', 'management_ports',
    'ring_based_systems', 'sfp_based_connections',
    'sdh_systems', 'sdh_connections', 'sdh_node_associations',
    'vmux_systems', 'vmux_connections'
  ]
  LOOP
    -- Step 1: Enable Row-Level Security on the table
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Step 2: Set Table-Level Grants for all relevant roles
    -- Admin has full power on all system tables
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin;', tbl);
    -- Viewer has read-only access on all system tables
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    -- Grant permissions to system-specific admins. RLS will handle row access.
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO cpan_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO maan_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO sdh_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO vmux_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO mng_admin;', tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 2: POLICIES FOR GENERIC TABLES (systems, system_connections)
-- These have complex logic checking the system_type of related records.
-- =================================================================

-- Policies for the 'systems' table
DO $$
BEGIN
  -- Clean up old policies for idempotency
  DROP POLICY IF EXISTS "Allow full access based on system type" ON public.systems;
  DROP POLICY IF EXISTS "Allow viewer read-access" ON public.systems;
  DROP POLICY IF EXISTS "Allow admin full access" ON public.systems;

  -- Viewer can see all systems
  CREATE POLICY "Allow viewer read-access" ON public.systems FOR SELECT TO viewer USING (true);

  -- Admin can do anything
  CREATE POLICY "Allow admin full access" ON public.systems FOR ALL TO admin USING (true) WITH CHECK (true);

  -- System-specific admins can access rows matching their designated system type
  CREATE POLICY "Allow full access based on system type" ON public.systems
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
  USING (
    (
      public.get_my_role() = 'cpan_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'CPAN')
    ) OR (
      public.get_my_role() = 'maan_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    ) OR (
      public.get_my_role() = 'sdh_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    ) OR (
      public.get_my_role() = 'vmux_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    ) OR (
      public.get_my_role() = 'mng_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  )
  WITH CHECK (
    -- The WITH CHECK clause re-uses the same logic for INSERTs and UPDATEs
    (
      public.get_my_role() = 'cpan_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'CPAN')
    ) OR (
      public.get_my_role() = 'maan_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    ) OR (
      public.get_my_role() = 'sdh_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    ) OR (
      public.get_my_role() = 'vmux_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    ) OR (
      public.get_my_role() = 'mng_admin' AND
      system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  );
END;
$$;


-- Policies for the 'system_connections' table
DO $$
BEGIN
  -- Clean up old policies for idempotency
  DROP POLICY IF EXISTS "Allow full access based on parent system type" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow viewer read-access" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow admin full access" ON public.system_connections;

  CREATE POLICY "Allow viewer read-access" ON public.system_connections FOR SELECT TO viewer USING (true);
  CREATE POLICY "Allow admin full access" ON public.system_connections FOR ALL TO admin USING (true) WITH CHECK (true);

  -- System-specific admins can access connections whose parent system matches their type.
  CREATE POLICY "Allow full access based on parent system type" ON public.system_connections
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
  USING (
    EXISTS (
      SELECT 1 FROM systems s WHERE s.id = system_connections.system_id AND (
        (
          public.get_my_role() = 'cpan_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'CPAN')
        ) OR (
          public.get_my_role() = 'maan_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
        ) OR (
          public.get_my_role() = 'sdh_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
        ) OR (
          public.get_my_role() = 'vmux_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
        ) OR (
          public.get_my_role() = 'mng_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
        )
      )
    )
  )
  WITH CHECK ( -- Re-use the same logic for INSERTs and UPDATEs
    EXISTS (
      SELECT 1 FROM systems s WHERE s.id = system_connections.system_id AND (
        (
          public.get_my_role() = 'cpan_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'CPAN')
        ) OR (
          public.get_my_role() = 'maan_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
        ) OR (
          public.get_my_role() = 'sdh_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
        ) OR (
          public.get_my_role() = 'vmux_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
        ) OR (
          public.get_my_role() = 'mng_admin' AND
          s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
        )
      )
    )
  );
END;
$$;


-- =================================================================
-- PART 3: AUTOMATED POLICIES FOR SYSTEM-SPECIFIC SUB-TABLES
-- These tables follow a simpler pattern: full access for admin and the designated system admin.
-- =================================================================
DO $$
DECLARE
    -- Use a 2D array to map tables to their specific admin roles
    -- Format: ARRAY['table_name', 'specific_admin_role']
    mappings TEXT[][] := ARRAY[
        ['ring_based_systems', 'cpan_admin'],
        ['ring_based_systems', 'maan_admin'], -- Both roles can manage this consolidated table
        ['sfp_based_connections', 'cpan_admin'],
        ['sfp_based_connections', 'maan_admin'], -- Both roles can manage this consolidated table
        ['sdh_systems', 'sdh_admin'],
        ['sdh_connections', 'sdh_admin'],
        ['sdh_node_associations', 'sdh_admin'],
        ['vmux_systems', 'vmux_admin'],
        ['vmux_connections', 'vmux_admin']
        -- Add new mappings here in the future
    ];
    tbl TEXT;
    specific_role TEXT;
    i INT;
BEGIN
    FOR i IN 1..array_length(mappings, 1)
    LOOP
        tbl := mappings[i][1];
        specific_role := mappings[i][2];

        -- Clean up old policies for idempotency
        EXECUTE format('DROP POLICY IF EXISTS "Allow viewer read-access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow admin full access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow %s full access" ON public.%I;', specific_role, tbl);

        -- Policy 1: Viewer can read everything
        EXECUTE format('CREATE POLICY "Allow viewer read-access" ON public.%I FOR SELECT TO viewer USING (true);', tbl);

        -- Policy 2: Admin can do everything
        EXECUTE format('CREATE POLICY "Allow admin full access" ON public.%I FOR ALL TO admin USING (true) WITH CHECK (true);', tbl);

        -- Policy 3: The specific system admin can do everything
        EXECUTE format($p$
            CREATE POLICY "Allow %s full access" ON public.%I
            FOR ALL TO %I
            USING (public.get_my_role() = %L)
            WITH CHECK (public.get_my_role() = %L);
        $p$, specific_role, tbl, specific_role, specific_role, specific_role);

        RAISE NOTICE 'Applied specific policies for role % on table %', specific_role, tbl;
    END LOOP;
END;
$$;
```

<!-- path: telecom_network_db/99_security/2_policies/2_core_tables_policies.sql -->
```sql
-- REFACTORED: This script now automatically applies standard policies and grants
-- ONLY to the core infrastructure and master data tables.
-- It explicitly EXCLUDES tables like 'systems' that have their own complex policies.

DO $$
DECLARE
  tbl TEXT;
  admin_role TEXT := 'admin';
  viewer_role TEXT := 'viewer';
BEGIN
  -- List ONLY the tables that follow the simple admin/viewer security model.
  FOREACH tbl IN ARRAY ARRAY[
    -- Core Infrastructure & Master Data
    'lookup_types', 'maintenance_areas', 'rings',
    'employee_designations', 'employees', 'nodes',
    'ofc_cables', 'ofc_connections',

    -- Advanced OFC
    'fiber_joints', 'logical_fiber_paths', 'logical_path_segments',

    -- File Management
    'folders', 'files'
  ]
  LOOP
    -- Step 1: Enable Row-Level Security
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    -- Step 2: Set Table-Level Grants
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO %I;', tbl, admin_role);
    EXECUTE format('GRANT SELECT ON public.%I TO %I;', tbl, viewer_role);

    -- Step 3: Create Row-Level Security Policies
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "policy_viewer_select_%s" ON public.%I;', tbl, tbl);

    -- Admin Policy: Full access for the 'admin' role
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I
      FOR ALL TO %I
      USING (public.get_my_role() = %L)
      WITH CHECK (public.get_my_role() = %L);
    $p$, tbl, tbl, admin_role, admin_role, admin_role);

    -- Viewer Policy: Read-only access for the 'viewer' role
    EXECUTE format($p$
      CREATE POLICY "policy_viewer_select_%s" ON public.%I
      FOR SELECT TO %I
      USING (public.get_my_role() = %L);
    $p$, tbl, tbl, viewer_role, viewer_role);

    RAISE NOTICE 'Applied baseline admin/viewer grants and policies to %', tbl;
  END LOOP;
END;
$$;
```

<!-- path: telecom_network_db/99_security/2_policies/1_user_profiles_policies.sql -->
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Super admins have full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;


-- Allow super admins full access to all rows
CREATE POLICY "Super admins have full access to user_profiles" 
ON user_profiles 
FOR ALL 
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile" 
ON user_profiles 
FOR SELECT 
USING ((select auth.uid()) = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON user_profiles 
FOR UPDATE 
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON user_profiles 
FOR INSERT 
WITH CHECK ((select auth.uid()) = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON user_profiles 
FOR DELETE 
USING ((select auth.uid()) = id);


```

<!-- path: telecom_network_db/01_user_management/3_functions/3_trigger_functions/2_sync_user_role_to_auth.sql -->
```sql
-- Function that will sync the role to auth.users
CREATE OR REPLACE FUNCTION sync_user_role_to_auth() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '' 
AS $$ 
BEGIN 
    IF (
        TG_OP = 'INSERT'
        OR (
            TG_OP = 'UPDATE'
            AND NEW.role IS DISTINCT FROM OLD.role
        )
    )
    AND NEW.role IS NOT NULL THEN
        UPDATE auth.users
        SET role = NEW.role
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/3_trigger_functions/3_create_public_profile_for_new_user.sql -->
```sql
-- USER CREATION FUNCTION
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '' 
AS $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = NEW.id
    ) THEN
        INSERT INTO public.user_profiles (
            id,
            first_name,
            last_name,
            avatar_url,
            phone_number,
            date_of_birth,
            address,
            preferences,
            status
        )
        VALUES (
            NEW.id,
            COALESCE(
                NEW.raw_user_meta_data->>'first_name',
                NEW.raw_user_meta_data->>'name',
                (
                    SELECT initcap(word)
                    FROM regexp_split_to_table(split_part(NEW.email, '@', 1), '[^a-zA-Z]+') AS word
                    WHERE word ~ '^[a-zA-Z]+'
                    LIMIT 1
                ), 'Placeholder'
            ), 
            COALESCE(
                NEW.raw_user_meta_data->>'last_name', 
                SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 2), 
                'User'
            ), 
            NEW.raw_user_meta_data->>'avatar_url', 
            NEW.raw_user_meta_data->>'phone_number', 
            CASE
                WHEN NEW.raw_user_meta_data->>'date_of_birth' ~ '^\d{4}-\d{2}-\d{2}$' THEN (NEW.raw_user_meta_data->>'date_of_birth')::date
                ELSE NULL
            END,
            COALESCE(NEW.raw_user_meta_data->'address', '{}'::jsonb),
            COALESCE(NEW.raw_user_meta_data->'preferences', '{}'::jsonb),
            'active'
        );
    END IF;
    RETURN NEW;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/3_trigger_functions/1_update_user_profile_timestamp.sql -->
```sql
-- TRIGGER FUNCTION for updating timestamps
CREATE OR REPLACE FUNCTION public.update_user_profile_timestamp() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = '' 
AS $$ 
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/1_admin_functions/3_admin_update_user_profile.sql -->
```sql
-- Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_profile (
    user_id uuid,
    update_first_name text DEFAULT NULL,
    update_last_name text DEFAULT NULL,
    update_avatar_url text DEFAULT NULL,
    update_phone_number text DEFAULT NULL,
    update_date_of_birth date DEFAULT NULL,
    update_address jsonb DEFAULT NULL,
    update_preferences jsonb DEFAULT NULL,
    update_role text DEFAULT NULL,
    update_designation text DEFAULT NULL,
    update_status text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin or updating their own profile
    IF NOT (
        public.is_super_admin()
        OR auth.uid() = user_id
    ) THEN 
        RAISE EXCEPTION 'Access denied. Insufficient privileges.';
    END IF;
    
    -- Update only non-null fields
    UPDATE public.user_profiles
    SET 
        first_name = COALESCE(update_first_name, first_name),
        last_name = COALESCE(update_last_name, last_name),
        avatar_url = CASE
            WHEN update_avatar_url = '' THEN NULL
            ELSE COALESCE(update_avatar_url, avatar_url)
        END,
        phone_number = CASE
            WHEN update_phone_number = '' THEN NULL
            ELSE COALESCE(update_phone_number, phone_number)
        END,
        date_of_birth = COALESCE(update_date_of_birth, date_of_birth),
        address = COALESCE(update_address, address),
        preferences = COALESCE(update_preferences, preferences),
        role = COALESCE(update_role, role),
        designation = COALESCE(update_designation, designation),
        status = COALESCE(update_status, status),
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/1_admin_functions/1_admin_get_all_users.sql -->
```sql
-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_all_users (
    search_query TEXT DEFAULT NULL,
    filter_role TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    id uuid,
    email text,
    first_name text,
    last_name text,
    avatar_url text,
    phone_number text,
    date_of_birth date,
    address jsonb,
    preferences jsonb,
    role text,
    designation text,
    status text,
    is_email_verified boolean,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz,
    total_count bigint
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE 
    total_records bigint;
BEGIN 
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN 
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Get total count first
    SELECT COUNT(*) INTO total_records
    FROM public.user_profiles p
    WHERE (
        search_query IS NULL
        OR p.first_name ILIKE '%' || search_query || '%'
        OR p.last_name ILIKE '%' || search_query || '%'
    )
    AND (
        filter_role IS NULL
        OR filter_role = 'all'
        OR p.role = filter_role
    )
    AND (
        filter_status IS NULL
        OR filter_status = 'all'
        OR p.status = filter_status
    )
    AND (
        date_from IS NULL
        OR p.created_at >= date_from
    )
    AND (
        date_to IS NULL
        OR p.created_at <= date_to
    );
    
    -- Return paginated results with auth data
    RETURN QUERY
    SELECT 
        p.id,
        CAST(u.email AS text) as email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.phone_number,
        p.date_of_birth,
        p.address,
        p.preferences,
        p.role,
        p.designation,
        p.status,
        (u.email_confirmed_at IS NOT NULL) as is_email_verified,
        u.last_sign_in_at,
        p.created_at,
        p.updated_at,
        total_records
    FROM public.user_profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE (
        search_query IS NULL
        OR p.first_name ILIKE '%' || search_query || '%'
        OR p.last_name ILIKE '%' || search_query || '%'
    )
    AND (
        filter_role IS NULL
        OR filter_role = 'all'
        OR p.role = filter_role
    )
    AND (
        filter_status IS NULL
        OR filter_status = 'all'
        OR p.status = filter_status
    )
    AND (
        date_from IS NULL
        OR p.created_at >= date_from
    )
    AND (
        date_to IS NULL
        OR p.created_at <= date_to
    )
    ORDER BY p.created_at DESC 
    OFFSET page_offset
    LIMIT page_limit;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/1_admin_functions/5_admin_bulk_update_role.sql -->
```sql
-- Function to bulk update user role (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_role (
    user_ids uuid[], 
    new_role text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN 
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Validate role
    IF new_role NOT IN (
        'admin',
        'viewer',
        'cpan_admin',
        'maan_admin',
        'sdh_admin',
        'vmux_admin',
        'mng_admin'
    ) THEN 
        RAISE EXCEPTION 'Invalid role.';
    END IF;
    
    UPDATE public.user_profiles
    SET 
        role = new_role,
        updated_at = NOW()
    WHERE id = ANY(user_ids);

    -- Log this bulk action
    PERFORM public.log_user_activity(
        'BULK_UPDATE_ROLE',
        'user_profiles',
        NULL,
        jsonb_build_object('user_ids', user_ids),
        jsonb_build_object('new_role', new_role),
        'Bulk role update performed by admin'
    );
    
    RETURN FOUND;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/1_admin_functions/6_admin_bulk_delete_users.sql -->
```sql
-- Function to bulk delete users (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_delete_users (
    user_ids uuid[]
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN 
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;

     -- Log this bulk action before deleting
    PERFORM public.log_user_activity(
        'BULK_DELETE',
        'user_profiles',
        NULL,
        jsonb_build_object('user_ids', user_ids),
        NULL,
        'Bulk user deletion performed by admin'
    );
    
    -- Delete from user_profiles (CASCADE will handle auth.users)
    DELETE FROM public.user_profiles
    WHERE id = ANY(user_ids);
    
    RETURN FOUND;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/1_admin_functions/2_admin_get_user_by_id.sql -->
```sql
-- Function to get a single user by ID (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_user_by_id (
    user_id uuid
) RETURNS TABLE (
    id uuid,
    email text,
    first_name text,
    last_name text,
    avatar_url text,
    phone_number text,
    date_of_birth date,
    address jsonb,
    preferences jsonb,
    role text,
    designation text,
    status text,
    is_email_verified boolean,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin or accessing their own profile
    IF NOT (
        public.is_super_admin()
        OR auth.uid() = user_id
    ) THEN 
        RAISE EXCEPTION 'Access denied. Insufficient privileges.';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        CAST(u.email AS text) as email,
        p.first_name,
        p.last_name,
        p.avatar_url,
        p.phone_number,
        p.date_of_birth,
        p.address,
        p.preferences,
        p.role,
        p.designation,
        p.status,
        (u.email_confirmed_at IS NOT NULL) as is_email_verified,
        u.last_sign_in_at,
        p.created_at,
        p.updated_at
    FROM public.user_profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE p.id = user_id;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/1_admin_functions/4_admin_bulk_update_status.sql -->
```sql
-- Function to bulk update user status (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_status (
    user_ids uuid[], 
    new_status text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$ 
BEGIN 
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN 
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Validate status
    IF new_status NOT IN ('active', 'inactive', 'suspended') THEN 
        RAISE EXCEPTION 'Invalid status. Must be active, inactive, or suspended.';
    END IF;
    
    UPDATE public.user_profiles
    SET 
        status = new_status,
        updated_at = NOW()
    WHERE id = ANY(user_ids);

    -- Log this bulk action
    PERFORM public.log_user_activity(
        'BULK_UPDATE_STATUS',
        'user_profiles',
        NULL,
        jsonb_build_object('user_ids', user_ids),
        jsonb_build_object('new_status', new_status),
        'Bulk status update performed by admin'
    );
    
    RETURN FOUND;
END;
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/2_utility_functions/3_get_my_user_details.sql -->
```sql
-- USER DETAILS FUNCTION
CREATE OR REPLACE FUNCTION get_my_user_details() 
RETURNS TABLE (
    id uuid,
    email text,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    is_super_admin boolean,
    is_email_verified boolean,
    first_name text,
    last_name text,
    avatar_url text,
    phone_number text,
    date_of_birth date,
    address jsonb,
    preferences jsonb,
    role text,
    designation text,
    updated_at timestamptz
) 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = '' 
AS $$
SELECT 
    u.id,
    u.email,
    u.last_sign_in_at,
    u.created_at,
    u.is_super_admin,
    (u.email_confirmed_at IS NOT NULL) AS is_email_verified,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.phone_number,
    p.date_of_birth,
    p.address,
    p.preferences,
    p.role,
    p.designation,
    p.updated_at
FROM auth.users AS u
LEFT JOIN public.user_profiles AS p ON u.id = p.id
WHERE u.id = auth.uid();
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/2_utility_functions/2_get_my_role.sql -->
```sql
-- GET MY ROLE FUNCTION
CREATE OR REPLACE FUNCTION public.get_my_role() 
RETURNS text 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = '' 
AS $$
SELECT role
FROM auth.users
WHERE id = auth.uid();
$$;
```

<!-- path: telecom_network_db/01_user_management/3_functions/2_utility_functions/1_is_super_admin.sql -->
```sql
-- SUPER ADMIN CHECK FUNCTION
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = '' 
STABLE 
AS $$
SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND is_super_admin = true
  );
$$;
```

<!-- path: telecom_network_db/01_user_management/2_views/1_v_user_profiles_extended.sql -->
```sql
-- Extended view combining auth.users and public.user_profiles
CREATE OR REPLACE VIEW v_user_profiles_extended WITH (security_invoker = true) AS
SELECT 
    u.id,
    u.email::text AS email,
    u.last_sign_in_at,
    u.created_at,
    u.is_super_admin,
    (u.email_confirmed_at IS NOT NULL) AS is_email_verified,
    p.first_name::text AS first_name,
    p.last_name::text AS last_name,
    p.avatar_url::text AS avatar_url,
    p.phone_number::text AS phone_number,
    p.date_of_birth,
    p.address,
    p.preferences,
    p.role::text AS role,
    p.designation::text AS designation,
    p.updated_at,
    p.status::text AS status,
    u.email_confirmed_at,
    u.phone_confirmed_at,
    (u.phone_confirmed_at IS NOT NULL) AS is_phone_verified,
    u.updated_at AS auth_updated_at,
    u.raw_user_meta_data,
    u.raw_app_meta_data,
    CONCAT(p.first_name::text, ' ', p.last_name::text) AS full_name,
    CASE 
        WHEN p.status::text = 'active' AND u.email_confirmed_at IS NOT NULL THEN 'active_verified'
        WHEN p.status::text = 'active' AND u.email_confirmed_at IS NULL THEN 'active_unverified'
        WHEN p.status::text = 'inactive' THEN 'inactive'
        WHEN p.status::text = 'suspended' THEN 'suspended'
        ELSE 'unknown'
    END::text AS computed_status,
    EXTRACT(DAYS FROM (NOW() - u.created_at))::INTEGER AS account_age_days,
    CASE 
        WHEN u.last_sign_in_at > NOW() - INTERVAL '1 day' THEN 'today'
        WHEN u.last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'this_week'
        WHEN u.last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'this_month'
        WHEN u.last_sign_in_at > NOW() - INTERVAL '90 days' THEN 'last_3_months'
        ELSE 'older'
    END::text AS last_activity_period
FROM auth.users u
JOIN user_profiles p ON u.id = p.id;
```

<!-- path: telecom_network_db/01_user_management/2_views/2_admin_get_all_users_extended.sql -->
```sql
-- Enhanced admin function that leverages the view structure
CREATE OR REPLACE FUNCTION admin_get_all_users_extended(
    search_query TEXT DEFAULT NULL,
    filter_role TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT NULL,
    filter_activity TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 50
) RETURNS TABLE (
    id uuid,
    email text,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    is_super_admin boolean,
    is_email_verified boolean,
    first_name text,
    last_name text,
    avatar_url text,
    phone_number text,
    date_of_birth date,
    address jsonb,
    preferences jsonb,
    role text,
    designation text,
    updated_at timestamptz,
    status text,
    full_name text,
    computed_status text,
    account_age_days integer,
    last_activity_period text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
DECLARE 
    total_records bigint;
BEGIN
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;
    
    -- Get total count
    SELECT COUNT(*) INTO total_records
    FROM v_user_profiles_extended v
    WHERE (
        search_query IS NULL 
        OR v.first_name ILIKE '%' || search_query || '%'
        OR v.last_name ILIKE '%' || search_query || '%'
        OR v.email ILIKE '%' || search_query || '%'
        OR v.full_name ILIKE '%' || search_query || '%'
    )
    AND (
        filter_role IS NULL 
        OR filter_role = 'all' 
        OR v.role = filter_role
    )
    AND (
        filter_status IS NULL 
        OR filter_status = 'all' 
        OR v.status = filter_status
    )
    AND (
        filter_activity IS NULL 
        OR filter_activity = 'all' 
        OR v.last_activity_period = filter_activity
    )
    AND (
        date_from IS NULL 
        OR v.created_at >= date_from
    )
    AND (
        date_to IS NULL 
        OR v.created_at <= date_to
    );
    
    -- Return paginated results
    RETURN QUERY
    SELECT 
        v.id,
        v.email,
        v.last_sign_in_at,
        v.created_at,
        v.is_super_admin,
        v.is_email_verified,
        v.first_name,
        v.last_name,
        v.avatar_url,
        v.phone_number,
        v.date_of_birth,
        v.address,
        v.preferences,
        v.role,
        v.designation,
        v.updated_at,
        v.status,
        v.full_name,
        v.computed_status,
        v.account_age_days,
        v.last_activity_period,
        total_records,
        active_count,
        inactive_count
    FROM public.v_user_profiles_extended v
    WHERE (
        search_query IS NULL 
        OR v.first_name ILIKE '%' || search_query || '%'
        OR v.last_name ILIKE '%' || search_query || '%'
        OR v.email ILIKE '%' || search_query || '%'
        OR v.full_name ILIKE '%' || search_query || '%'
    )
    AND (
        filter_role IS NULL 
        OR filter_role = 'all' 
        OR v.role = filter_role
    )
    AND (
        filter_status IS NULL 
        OR filter_status = 'all' 
        OR v.status = filter_status
    )
    AND (
        filter_activity IS NULL 
        OR filter_activity = 'all' 
        OR v.last_activity_period = filter_activity
    )
    AND (
        date_from IS NULL 
        OR v.created_at >= date_from
    )
    AND (
        date_to IS NULL 
        OR v.created_at <= date_to
    )
    ORDER BY v.created_at DESC
    OFFSET page_offset
    LIMIT page_limit;
END;
$$;

-- Grant execute permission on the enhanced admin function
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_extended(
    text, text, text, text, timestamptz, timestamptz, integer, integer
) TO authenticated;

```

<!-- path: telecom_network_db/01_user_management/5_triggers/3_sync_user_role_trigger.sql -->
```sql
-- CREATE TRIGGER for role sync on update
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'sync_user_role_trigger'
    ) THEN 
        CREATE TRIGGER sync_user_role_trigger
        AFTER UPDATE ON public.user_profiles 
        FOR EACH ROW
        WHEN (NEW.role IS DISTINCT FROM OLD.role) 
        EXECUTE FUNCTION sync_user_role_to_auth();
    END IF;
END $$;
```

<!-- path: telecom_network_db/01_user_management/5_triggers/4_sync_user_role_insert_trigger.sql -->
```sql
-- CREATE TRIGGER for role sync on insert
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'sync_user_role_insert_trigger'
    ) THEN 
        CREATE TRIGGER sync_user_role_insert_trigger
        AFTER INSERT ON public.user_profiles 
        FOR EACH ROW 
        EXECUTE FUNCTION sync_user_role_to_auth();
    END IF;
END $$;
```

<!-- path: telecom_network_db/01_user_management/5_triggers/2_update_user_profile_updated_at.sql -->
```sql
-- CREATE TRIGGER for profile updates
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_user_profile_updated_at'
    ) THEN 
        CREATE TRIGGER update_user_profile_updated_at 
        BEFORE UPDATE ON public.user_profiles 
        FOR EACH ROW 
        EXECUTE FUNCTION public.update_user_profile_timestamp();
    END IF;
END $$;
```

<!-- path: telecom_network_db/01_user_management/5_triggers/1_on_auth_user_created.sql -->
```sql
-- CREATE TRIGGER for new auth users
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN 
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users 
        FOR EACH ROW 
        EXECUTE FUNCTION public.create_public_profile_for_new_user();
    END IF;
END $$;
```

<!-- path: telecom_network_db/01_user_management/4_indexes/1_user_profile_indexes.sql -->
```sql
-- =================================================================
-- Indexes for User Management Module
-- =================================================================
-- This script creates indexes on the user_profiles table to improve
-- performance for filtering, searching, and sorting operations,
-- particularly for the admin user management interface.
-- =================================================================

-- Index for filtering users by their role
CREATE INDEX idx_user_profiles_role ON public.user_profiles (role);

-- Index for filtering users by their status (e.g., active, inactive)
CREATE INDEX idx_user_profiles_status ON public.user_profiles (status);

-- Composite index for efficient searching and sorting by user's full name
CREATE INDEX idx_user_profiles_last_name_first_name ON public.user_profiles (last_name, first_name);

-- Index on the creation timestamp to speed up date range filters
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles (created_at);

-- Optional: Indexes for JSONB columns
-- Use GIN indexes on JSONB columns if you plan to frequently query
-- specific keys within the address or preferences data.
--
-- Example:
-- CREATE INDEX idx_user_profiles_address_gin ON public.user_profiles USING GIN (address);
-- CREATE INDEX idx_user_profiles_preferences_gin ON public.user_profiles USING GIN (preferences);
```

<!-- path: telecom_network_db/01_user_management/1_tables/1_user_profiles.sql -->
```sql
-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name TEXT NOT NULL CHECK (first_name <> ''),
  last_name TEXT NOT NULL CHECK (last_name <> ''),
  avatar_url TEXT,
  phone_number TEXT CHECK (
    phone_number IS NULL
    OR phone_number ~ '^\+?[1-9]\d{1,14}$'
  ),
  date_of_birth DATE CHECK (
    date_of_birth IS NULL
    OR (
      date_of_birth > '1900-01-01'
      AND date_of_birth < CURRENT_DATE
    )
  ),
  role TEXT DEFAULT 'viewer' CHECK (
    role IN (
      'admin',
      'viewer',
      'cpan_admin',
      'maan_admin',
      'sdh_admin',
      'vmux_admin',
      'mng_admin'
    )
  ),
  designation TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

<!-- path: telecom_network_db/06_utility_functions/3_aggregation_functions/2_get_entity_counts.sql -->
```sql
-- Function: get_entity_counts
-- Description: A generic function to get total, active, and inactive counts for any table/view.
-- It's ideal for dashboards and KPIs where only aggregate numbers are needed.

CREATE OR REPLACE FUNCTION get_entity_counts(
    p_entity_name TEXT,
    p_filters JSONB DEFAULT '{}'
)
RETURNS TABLE (
    total_count BIGINT,
    active_count BIGINT,
    inactive_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    sql_query TEXT;
    sql_where TEXT := 'WHERE 1=1';
    filter_key TEXT;
    filter_value JSONB;
BEGIN
    -- Build WHERE clause from simple filters (assumes status column exists for active/inactive)
    IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
        LOOP
            sql_where := sql_where || format(' AND %I = %L', filter_key, trim(both '"' from filter_value::text));
        END LOOP;
    END IF;

    -- Construct the final aggregation query
    sql_query := format(
        'SELECT ' ||
        'count(*), ' ||
        'count(*) FILTER (WHERE status = true), ' ||
        'count(*) FILTER (WHERE status = false) ' ||
        'FROM %I ' || -- Use %I for the entity (table/view) name
        '%s', -- The WHERE clause
        p_entity_name,
        sql_where
    );

    -- Execute the query
    RETURN QUERY EXECUTE sql_query;
END;
$$;

GRANT EXECUTE ON FUNCTION get_entity_counts(TEXT, JSONB) TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/3_aggregation_functions/1_aggregate_query.sql -->
```sql
-- Function: aggregate_query
CREATE OR REPLACE FUNCTION aggregate_query(
    table_name TEXT,
    aggregation_options JSONB,
    filters JSONB DEFAULT '{}'::jsonb,
    order_by JSONB DEFAULT '[]'::jsonb
) 
RETURNS TABLE(result JSONB) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp 
AS $$
DECLARE 
  query_text TEXT;
  select_clause TEXT := '';
  where_clause TEXT := '';
  group_clause TEXT := '';
  order_clause TEXT := '';
  agg_parts TEXT[] := ARRAY[]::TEXT[];
BEGIN 
  -- COUNT
  IF (aggregation_options->>'count')::boolean THEN 
    agg_parts := array_append(agg_parts, 'COUNT(*) as count');
  ELSIF aggregation_options->'count' IS NOT NULL THEN 
    agg_parts := array_append(agg_parts, format('COUNT(%I) as count', aggregation_options->>'count'));
  END IF;
  
  -- SUM
  IF aggregation_options->'sum' IS NOT NULL THEN
    SELECT array_cat(agg_parts, array_agg(format('SUM(%I) as sum_%s', value, value)))
    INTO agg_parts
    FROM jsonb_array_elements_text(aggregation_options->'sum') AS value;
  END IF;
  
  -- AVG
  IF aggregation_options->'avg' IS NOT NULL THEN
    SELECT array_cat(agg_parts, array_agg(format('AVG(%I) as avg_%s', value, value)))
    INTO agg_parts
    FROM jsonb_array_elements_text(aggregation_options->'avg') AS value;
  END IF;
  
  -- MIN
  IF aggregation_options->'min' IS NOT NULL THEN
    SELECT array_cat(agg_parts, array_agg(format('MIN(%I) as min_%s', value, value)))
    INTO agg_parts
    FROM jsonb_array_elements_text(aggregation_options->'min') AS value;
  END IF;
  
  -- MAX
  IF aggregation_options->'max' IS NOT NULL THEN
    SELECT array_cat(agg_parts, array_agg(format('MAX(%I) as max_%s', value, value)))
    INTO agg_parts
    FROM jsonb_array_elements_text(aggregation_options->'max') AS value;
  END IF;
  
  -- GROUP BY
  IF aggregation_options->'groupBy' IS NOT NULL THEN
    SELECT string_agg(format('%I', value), ', ') INTO group_clause
    FROM jsonb_array_elements_text(aggregation_options->'groupBy') AS value;
    
    SELECT string_agg(format('%I', value), ', ') INTO select_clause
    FROM jsonb_array_elements_text(aggregation_options->'groupBy') AS value;
    
    group_clause := 'GROUP BY ' || group_clause;
  END IF;
  
  IF select_clause != '' AND array_length(agg_parts, 1) > 0 THEN 
    select_clause := select_clause || ', ' || array_to_string(agg_parts, ', ');
  ELSIF array_length(agg_parts, 1) > 0 THEN 
    select_clause := array_to_string(agg_parts, ', ');
  ELSE 
    select_clause := '*';
  END IF;
  
  -- WHERE
  IF jsonb_typeof(filters) = 'object' AND filters != '{}'::jsonb THEN
    SELECT string_agg(format('%I = %L', key, filters->key), ' AND ') 
    INTO where_clause
    FROM jsonb_each_text(filters);
    
    IF where_clause IS NOT NULL THEN 
      where_clause := 'WHERE ' || where_clause;
    END IF;
  END IF;
  
  -- ORDER BY
  IF jsonb_typeof(order_by) = 'array' AND jsonb_array_length(order_by) > 0 THEN
    SELECT string_agg(
      format('%I %s', item->>'column', 
        CASE WHEN (item->>'ascending')::boolean THEN 'ASC' ELSE 'DESC' END),
      ', '
    ) INTO order_clause
    FROM jsonb_array_elements(order_by) AS item;
    
    IF order_clause IS NOT NULL THEN 
      order_clause := 'ORDER BY ' || order_clause;
    END IF;
  END IF;
  
  query_text := format(
    'SELECT %s FROM %I %s %s %s',
    select_clause,
    table_name,
    where_clause,
    group_clause,
    order_clause
  );
  
  RETURN QUERY EXECUTE format('SELECT row_to_json(t)::jsonb FROM (%s) t', query_text);
END;
$$;

GRANT EXECUTE ON FUNCTION aggregate_query TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/6_add_otdr_length_to_splices.sql -->
```sql
-- path: migrations/add_otdr_length_to_splices.sql

ALTER TABLE public.fiber_splices
ADD COLUMN IF NOT EXISTS otdr_length_km NUMERIC(10, 3);

COMMENT ON COLUMN public.fiber_splices.otdr_length_km IS 'The measured OTDR distance in kilometers for the incoming fiber arriving at this splice.';
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/8_evolve_cable_with_jc.sql -->
```sql
-- This function evolves a simple ofc_cable into a segmented logical_fiber_path
-- when the first Junction Closure is added.
CREATE OR REPLACE FUNCTION public.evolve_cable_with_jc(
    p_cable_id UUID,
    p_jc_id UUID
)
RETURNS UUID -- Returns the ID of the new logical_fiber_path
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_logical_path_id UUID;
    v_cable RECORD;
    v_jc RECORD;
BEGIN
    -- 1. Get cable and JC details
    SELECT * INTO v_cable FROM public.ofc_cables WHERE id = p_cable_id;
    SELECT * INTO v_jc FROM public.junction_closures WHERE id = p_jc_id;

    IF v_cable IS NULL OR v_jc IS NULL THEN
        RAISE EXCEPTION 'Cable or Junction Closure not found';
    END IF;

    -- 2. Create a new Logical Fiber Path to represent the original A to B route
    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, destination_system_id, total_distance_km, path_type_id)
    VALUES (
        v_cable.route_name || ' (Path)',
        v_cable.sn_id, -- Using start/end nodes as placeholders for systems
        v_cable.en_id,
        v_cable.current_rkm,
        (SELECT id FROM lookup_types WHERE category = 'OFC_PATH_TYPE' AND name = 'Main Route' LIMIT 1)
    ) RETURNING id INTO v_logical_path_id;

    -- 3. De-normalize the original ofc_connections into two new physical cables representing the segments
    --    This creates the "segment1_A-B" and "segment2_A-B" as physical entities.
    
    -- Segment 1: Start Node -> JC
    INSERT INTO public.ofc_cables (route_name, sn_id, en_id, ofc_type_id, capacity, ofc_owner_id, current_rkm, maintenance_terminal_id, status)
    VALUES (
        v_cable.route_name || ' | Seg 1: ' || v_cable.sn_id || '->' || v_jc.id,
        v_cable.sn_id,
        v_jc.id, -- The JC acts as the end node for this segment
        v_cable.ofc_type_id,
        v_cable.capacity,
        v_cable.ofc_owner_id,
        v_jc.position_km,
        v_cable.maintenance_terminal_id,
        true
    );

    -- Segment 2: JC -> End Node
    INSERT INTO public.ofc_cables (route_name, sn_id, en_id, ofc_type_id, capacity, ofc_owner_id, current_rkm, maintenance_terminal_id, status)
    VALUES (
        v_cable.route_name || ' | Seg 2: ' || v_jc.id || '->' || v_cable.en_id,
        v_jc.id, -- The JC acts as the start node for this segment
        v_cable.en_id,
        v_cable.ofc_type_id,
        v_cable.capacity,
        v_cable.ofc_owner_id,
        v_cable.current_rkm - v_jc.position_km,
        v_cable.maintenance_terminal_id,
        true
    );

    -- 4. Archive the original cable by marking it inactive.
    UPDATE public.ofc_cables SET status = false, remark = 'Archived. Evolved into segmented path ' || v_logical_path_id WHERE id = v_cable.id;

    -- 5. Create default "straight-through" splices in the JC for all fibers
    -- This assumes the new segments are now distinct cables in the DB.
    FOR i IN 1..v_cable.capacity LOOP
        INSERT INTO public.fiber_splices(jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, logical_path_id)
        VALUES(p_jc_id, (SELECT id FROM ofc_cables WHERE en_id = v_jc.id), i, (SELECT id FROM ofc_cables WHERE sn_id = v_jc.id), i, v_logical_path_id);
    END LOOP;

    RETURN v_logical_path_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.evolve_cable_with_jc(UUID, UUID) TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/7_manage_splice_v2.sql -->
```sql
-- This RPC function handles creating, deleting, and updating splices.
CREATE OR REPLACE FUNCTION manage_splice(
    p_action TEXT,
    p_jc_id UUID,
    p_splice_id UUID DEFAULT NULL,
    p_incoming_cable_id UUID DEFAULT NULL,
    p_incoming_fiber_no INT DEFAULT NULL,
    p_outgoing_cable_id UUID DEFAULT NULL,
    p_outgoing_fiber_no INT DEFAULT NULL,
    p_splice_type TEXT DEFAULT 'pass_through',
    p_otdr_length_km NUMERIC DEFAULT NULL
)
RETURNS RECORD
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_action = 'create' THEN
        INSERT INTO public.fiber_splices (jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, splice_type, otdr_length_km)
        VALUES (p_jc_id, p_incoming_cable_id, p_incoming_fiber_no, p_outgoing_cable_id, p_outgoing_fiber_no, p_splice_type, p_otdr_length_km)
        RETURNING id, 'created' INTO result;
    ELSIF p_action = 'delete' THEN
        DELETE FROM public.fiber_splices WHERE id = p_splice_id AND jc_id = p_jc_id
        RETURNING id, 'deleted' INTO result;
        IF NOT FOUND THEN RAISE EXCEPTION 'Splice not found.'; END IF;
    ELSIF p_action = 'update_otdr' THEN
        UPDATE public.fiber_splices
        SET otdr_length_km = p_otdr_length_km, updated_at = now()
        WHERE id = p_splice_id AND jc_id = p_jc_id
        RETURNING id, 'updated' INTO result;
        IF NOT FOUND THEN RAISE EXCEPTION 'Splice not found.'; END IF;
    ELSE
        RAISE EXCEPTION 'Invalid action.';
    END IF;

    RETURN result;
END;
$$;
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/3_get_jc_splicing_details.sql -->
```sql
-- This function gets all the data needed for the Splice Matrix UI for a specific JC.
CREATE OR REPLACE FUNCTION get_jc_splicing_details(p_jc_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    WITH connected_cables AS (
        SELECT DISTINCT cable_id FROM (
            -- 1. Get cables already involved in a splice at this JC
            SELECT incoming_cable_id as cable_id FROM public.fiber_splices WHERE jc_id = p_jc_id
            UNION
            SELECT outgoing_cable_id as cable_id FROM public.fiber_splices WHERE jc_id = p_jc_id AND outgoing_cable_id IS NOT NULL
            UNION
            -- 2. Always include the JC's parent cable, even if no splices exist yet
            SELECT ofc_cable_id as cable_id FROM public.junction_closures WHERE id = p_jc_id AND ofc_cable_id IS NOT NULL
        ) AS cables
    ),
    cables_with_fibers AS (
        SELECT
            c.id AS cable_id, c.route_name, c.capacity,
            sn.name as start_node_name, en.name as end_node_name,
            generate_series(1, c.capacity) AS fiber_no
        FROM public.ofc_cables c
        JOIN connected_cables cc ON c.id = cc.cable_id
        LEFT JOIN public.nodes sn ON c.sn_id = sn.id
        LEFT JOIN public.nodes en ON c.en_id = en.id
    ),
    fiber_splice_info AS (
        SELECT
            cf.cable_id, cf.route_name, cf.start_node_name, cf.end_node_name, cf.capacity, cf.fiber_no,
            inc_splice.id AS splice_id,
            inc_splice.outgoing_cable_id, inc_splice.outgoing_fiber_no, out_cable.route_name AS outgoing_route_name,
            out_splice.id AS reflected_splice_id,
            out_splice.incoming_cable_id, out_splice.incoming_fiber_no, inc_cable.route_name as incoming_route_name,
            CASE
                WHEN inc_splice.splice_type = 'termination' THEN 'terminated'
                WHEN inc_splice.id IS NOT NULL THEN 'used_as_incoming'
                WHEN out_splice.id IS NOT NULL THEN 'used_as_outgoing'
                ELSE 'available'
            END as status,
            COALESCE(inc_splice.logical_path_id, out_splice.logical_path_id) as logical_path_id
        FROM cables_with_fibers cf
        LEFT JOIN public.fiber_splices inc_splice ON cf.cable_id = inc_splice.incoming_cable_id AND cf.fiber_no = inc_splice.incoming_fiber_no AND inc_splice.jc_id = p_jc_id
        LEFT JOIN public.fiber_splices out_splice ON cf.cable_id = out_splice.outgoing_cable_id AND cf.fiber_no = out_splice.outgoing_fiber_no AND out_splice.jc_id = p_jc_id
        LEFT JOIN public.ofc_cables out_cable ON inc_splice.outgoing_cable_id = out_cable.id
        LEFT JOIN public.ofc_cables inc_cable ON out_splice.incoming_cable_id = inc_cable.id
    )
    SELECT jsonb_build_object(
        'jc_details', (SELECT to_jsonb(jc.*) FROM public.junction_closures jc WHERE jc.id = p_jc_id),
        'cables', (
            SELECT jsonb_agg(DISTINCT jsonb_build_object(
                'cable_id', fsi.cable_id, 'route_name', fsi.route_name, 'capacity', fsi.capacity,
                'start_node', fsi.start_node_name, 'end_node', fsi.end_node_name,
                'fibers', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'fiber_no', sub.fiber_no,
                        'status', sub.status,
                        'splice_id', COALESCE(sub.splice_id, sub.reflected_splice_id),
                        'connected_to_cable', COALESCE(sub.outgoing_route_name, sub.incoming_route_name),
                        'connected_to_fiber', COALESCE(sub.outgoing_fiber_no, sub.incoming_fiber_no)
                    ) ORDER BY sub.fiber_no)
                    FROM fiber_splice_info sub WHERE sub.cable_id = fsi.cable_id
                )
            ))
            FROM fiber_splice_info fsi
        )
    ) INTO result;

    RETURN result;
END;
$$;
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/get_cables_at_jc.sql -->
```sql
-- This function finds all relevant OFC cables that are present at a specific Junction Closure.
-- It is used to populate the "Add Cable to Matrix" dropdown in the Splice Matrix modal.
CREATE OR REPLACE FUNCTION get_cables_at_jc(p_jc_id UUID)
RETURNS TABLE (
    id UUID,
    route_name TEXT,
    capacity INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH jc_info AS (
        SELECT
            oc.sn_id,
            oc.en_id
        FROM public.junction_closures jc
        JOIN public.ofc_cables oc ON jc.ofc_cable_id = oc.id
        WHERE jc.id = p_jc_id
    )
    SELECT
        c.id,
        c.route_name,
        c.capacity
    FROM public.ofc_cables c
    WHERE
        c.sn_id IN (SELECT sn_id FROM jc_info)
        OR c.en_id IN (SELECT en_id FROM jc_info)
        OR c.sn_id IN (SELECT en_id FROM jc_info)
        OR c.en_id IN (SELECT sn_id FROM jc_info);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cables_at_jc(UUID) TO authenticated;

```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/2_provision_fiber_on_path.sql -->
```sql
-- REFACTORED: This function now correctly uses the p_physical_path_id parameter
-- to identify which segments to update, making it robust and accurate.
CREATE OR REPLACE FUNCTION public.provision_ring_path(
    p_system_id UUID,
    p_path_name TEXT,
    p_working_fiber_no INT,
    p_protection_fiber_no INT,
    p_physical_path_id UUID
) RETURNS TABLE(working_path_id UUID, protection_path_id UUID) AS $$
DECLARE
    v_working_path_id UUID;
    v_protection_path_id UUID;
    v_active_status_id UUID;
BEGIN
    -- Step 0: Get the UUID for the 'active' status.
    SELECT id INTO v_active_status_id
    FROM public.lookup_types
    WHERE category = 'OFC_PATH_STATUSES' AND name = 'active'
    LIMIT 1;

    IF v_active_status_id IS NULL THEN
        RAISE EXCEPTION 'Operational status "active" not found in lookup_types table.';
    END IF;

    -- Step 1 & 2: Create the "Working" and "Protection" logical paths.
    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, operational_status_id)
    VALUES (p_path_name || ' (Working)', p_system_id, 'working', v_active_status_id)
    RETURNING id INTO v_working_path_id;

    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, working_path_id, operational_status_id)
    VALUES (p_path_name || ' (Protection)', p_system_id, 'protection', v_working_path_id, v_active_status_id)
    RETURNING id INTO v_protection_path_id;

    -- Step 3: Provision the WORKING fiber across all segments of the PROVIDED physical path.
    UPDATE public.ofc_connections
    SET 
        logical_path_id = v_working_path_id,
        fiber_role = 'working'
    WHERE
        fiber_no_sn = p_working_fiber_no
        AND ofc_id IN (
            SELECT lps.ofc_cable_id FROM logical_path_segments lps
            WHERE lps.logical_path_id = p_physical_path_id -- CORRECTED: Use the passed-in ID
        );

    -- Step 4: Provision the PROTECTION fiber across all segments.
    UPDATE public.ofc_connections
    SET 
        logical_path_id = v_protection_path_id,
        fiber_role = 'protection'
    WHERE
        fiber_no_sn = p_protection_fiber_no
        AND ofc_id IN (
            SELECT lps.ofc_cable_id FROM logical_path_segments lps
            WHERE lps.logical_path_id = p_physical_path_id -- CORRECTED: Use the passed-in ID
        );

    RETURN QUERY SELECT v_working_path_id, v_protection_path_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.provision_ring_path(UUID, TEXT, INT, INT, UUID) TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/1_bulk_update.sql -->
```sql
-- Function: bulk_update
CREATE OR REPLACE FUNCTION bulk_update(
    table_name TEXT,
    updates JSONB,
    batch_size INTEGER DEFAULT 1000
) 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp 
AS $$
DECLARE 
  update_item JSONB;
  query_text TEXT;
  result_count INTEGER := 0;
  batch_count INTEGER := 0;
BEGIN 
  FOR update_item IN SELECT value FROM jsonb_array_elements(updates) 
  LOOP 
    query_text := format(
      'UPDATE %I SET %s WHERE id = %L RETURNING *',
      table_name,
      (SELECT string_agg(format('%I = %L', key, update_item->'data'->key), ', ')
       FROM jsonb_each_text(update_item->'data')),
      update_item->>'id'
    );
    
    EXECUTE query_text;
    result_count := result_count + 1;
    batch_count := batch_count + 1;
    
    IF batch_count >= batch_size THEN 
      batch_count := 0;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('updated_count', result_count);
END;
$$;

GRANT EXECUTE ON FUNCTION bulk_update TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/trace_fiber_path.sql -->
```sql
-- This powerful recursive function traces a fiber's path from a starting point.
-- VERSION 2: Corrected to remove the invalid reference to jc.node_id.
CREATE OR REPLACE FUNCTION trace_fiber_path(
    p_start_cable_id UUID,
    p_start_fiber_no INT
)
RETURNS TABLE (
    segment_order BIGINT,
    path_type TEXT,
    element_id UUID,
    element_name TEXT,
    details TEXT,
    fiber_no INT,
    distance_km NUMERIC,
    loss_db NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE path_traversal AS (
        -- ANCHOR: Start with the initial cable.
        SELECT
            1::BIGINT AS segment_order,
            p_start_cable_id AS current_cable_id,
            p_start_fiber_no AS current_fiber_no,
            0::NUMERIC AS last_position_km

        UNION ALL

        -- RECURSIVE: Find the next splice and hop to the next cable.
        SELECT
            p.segment_order + 1,
            s.outgoing_cable_id,
            s.outgoing_fiber_no,
            jc.position_km
        FROM path_traversal p
        JOIN public.fiber_splices s ON p.current_cable_id = s.incoming_cable_id AND p.current_fiber_no = s.incoming_fiber_no
        JOIN public.junction_closures jc ON s.jc_id = jc.id
        -- Continue only if there is an outgoing connection
        WHERE s.outgoing_cable_id IS NOT NULL
          AND p.segment_order < 50 -- Safety break to prevent infinite loops
    )
    -- FINAL SELECT: This part builds the human-readable output from the traversal path.
    SELECT
        ROW_NUMBER() OVER (ORDER BY pt.segment_order, z.type_order) AS final_segment_order,
        z.path_type, z.element_id, z.element_name, z.details, z.fiber_no, z.distance_km, z.loss_db
    FROM path_traversal pt
    CROSS JOIN LATERAL (
        -- Row for the CABLE segment
        SELECT
            1 as type_order,
            'CABLE'::TEXT AS path_type,
            pt.current_cable_id AS element_id,
            c.route_name AS element_name,
            (sn.name || ' → ' || en.name)::TEXT AS details,
            pt.current_fiber_no AS fiber_no,
            -- Calculate segment distance accurately
            ABS(
                COALESCE(
                    (SELECT jc_next.position_km
                     FROM junction_closures jc_next
                     JOIN fiber_splices s_next ON jc_next.id = s_next.jc_id
                     WHERE s_next.incoming_cable_id = pt.current_cable_id
                       AND s_next.incoming_fiber_no = pt.current_fiber_no
                     LIMIT 1),
                    c.current_rkm
                ) - pt.last_position_km
            ) AS distance_km,
            NULL::NUMERIC AS loss_db
        FROM public.ofc_cables c
        JOIN public.nodes sn ON c.sn_id = sn.id
        JOIN public.nodes en ON c.en_id = en.id
        WHERE c.id = pt.current_cable_id

        UNION ALL

        -- Row for the JUNCTION CLOSURE (if it exists)
        SELECT
            2 as type_order,
            'JC'::TEXT,
            s.jc_id,
            jc.name,
            'Splice'::TEXT,
            s.outgoing_fiber_no,
            NULL::NUMERIC,
            s.loss_db
        FROM public.fiber_splices s
        JOIN public.junction_closures jc ON s.jc_id = jc.id
        WHERE s.incoming_cable_id = pt.current_cable_id
          AND s.incoming_fiber_no = pt.current_fiber_no

    ) AS z
    WHERE z.element_id IS NOT NULL
    ORDER BY final_segment_order;
END;
$$;
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/get_all_splices.sql -->
```sql
-- path: functions/get_all_splices.sql
CREATE OR REPLACE FUNCTION get_all_splices()
RETURNS TABLE (
    splice_id UUID,
    jc_id UUID,
    jc_name TEXT,
    jc_position_km NUMERIC,
    incoming_cable_id UUID,
    incoming_fiber_no INT,
    outgoing_cable_id UUID,
    outgoing_fiber_no INT,
    otdr_length_km NUMERIC,
    loss_db NUMERIC
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    SELECT
        s.id as splice_id,
        s.jc_id,
        jc.name as jc_name,
        jc.position_km,
        s.incoming_cable_id,
        s.incoming_fiber_no,
        s.outgoing_cable_id,
        s.outgoing_fiber_no,
        s.otdr_length_km,
        s.loss_db
    FROM
        public.fiber_splices s
    JOIN
        public.junction_closures jc ON s.jc_id = jc.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_splices() TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/5_data_operation_functions/4_auto_splice_jc.sql -->
```sql
-- This function automatically creates 1-to-1 "straight" splices for available fibers between two cables.
CREATE OR REPLACE FUNCTION auto_splice_straight(
    p_jc_id UUID,
    p_cable1_id UUID,
    p_cable2_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cable1_capacity INT;
    cable2_capacity INT;
    i INT;
    splice_count INT := 0;
    available_fibers_c1 INT[];
    available_fibers_c2 INT[];
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT capacity INTO cable1_capacity FROM public.ofc_cables WHERE id = p_cable1_id;
    SELECT capacity INTO cable2_capacity FROM public.ofc_cables WHERE id = p_cable2_id;

    IF cable1_capacity IS NULL OR cable2_capacity IS NULL THEN
        RAISE EXCEPTION 'One or both cables not found.';
    END IF;

    -- Find available fibers for Cable 1
    SELECT array_agg(s.i) INTO available_fibers_c1
    FROM generate_series(1, cable1_capacity) s(i)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.fiber_splices fs
        WHERE fs.jc_id = p_jc_id
        AND (
            (fs.incoming_cable_id = p_cable1_id AND fs.incoming_fiber_no = s.i) OR
            (fs.outgoing_cable_id = p_cable1_id AND fs.outgoing_fiber_no = s.i)
        )
    );

    -- Find available fibers for Cable 2
    SELECT array_agg(s.i) INTO available_fibers_c2
    FROM generate_series(1, cable2_capacity) s(i)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.fiber_splices fs
        WHERE fs.jc_id = p_jc_id
        AND (
            (fs.incoming_cable_id = p_cable2_id AND fs.incoming_fiber_no = s.i) OR
            (fs.outgoing_cable_id = p_cable2_id AND fs.outgoing_fiber_no = s.i)
        )
    );

    -- Loop through the minimum of the two available fiber lists
    FOR i IN 1..LEAST(cardinality(available_fibers_c1), cardinality(available_fibers_c2))
    LOOP
        INSERT INTO public.fiber_splices (jc_id, incoming_cable_id, incoming_fiber_no, outgoing_cable_id, outgoing_fiber_no, splice_type)
        VALUES (p_jc_id, p_cable1_id, available_fibers_c1[i], p_cable2_id, available_fibers_c2[i], 'pass_through');
        splice_count := splice_count + 1;
    END LOOP;

    RETURN jsonb_build_object('status', 'success', 'splices_created', splice_count);
END;
$$;
```

<!-- path: telecom_network_db/06_utility_functions/3_lookup_type_functions.sql -->
```sql
-- get_lookup_type_id function with secure search_path
create or replace function get_lookup_type_id(p_category TEXT, p_name TEXT) 
RETURNS UUID SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
DECLARE 
  v_type_id UUID;
BEGIN
  SELECT id INTO v_type_id
  FROM lookup_types
  WHERE category = p_category
    AND name = p_name
    AND status = true;
  
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'Lookup type not found: category=%, name=%', p_category, p_name;
  END IF;
  
  RETURN v_type_id;
END;
$$;

-- Function to add_lookup_type function with secure search_path
create or replace function add_lookup_type(
  p_category TEXT,
  p_name TEXT,
  p_code TEXT default null,
  p_description TEXT default null,
  p_sort_order INTEGER default 0
) RETURNS UUID SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
DECLARE
  v_type_id UUID;
BEGIN
  INSERT INTO lookup_types (category, name, code, description, sort_order)
  VALUES (p_category, p_name, p_code, p_description, p_sort_order)
  RETURNING id INTO v_type_id;
  
  RETURN v_type_id;
END;
$$;

-- Function to get_lookup_types_by_category function with secure search_path
create or replace function get_lookup_types_by_category(p_category TEXT) 
RETURNS table (
  id UUID,
  name TEXT,
  code TEXT,
  description TEXT,
  sort_order INTEGER
) SECURITY INVOKER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  RETURN QUERY
  SELECT lt.id, lt.name, lt.code, lt.description, lt.sort_order
  FROM lookup_types lt
  WHERE lt.category = p_category
    AND lt.status = true
  ORDER BY lt.sort_order, lt.name;
END;
$$;
```

<!-- path: telecom_network_db/06_utility_functions/6_dashboard_functions/1_dashboard_overview.sql -->
```sql
DROP FUNCTION IF EXISTS public.get_dashboard_overview;

CREATE OR REPLACE FUNCTION public.get_dashboard_overview () RETURNS JSONB SECURITY INVOKER LANGUAGE plpgsql
SET
  search_path = '' -- Already correct
  AS $$
DECLARE
    result jsonb;
BEGIN
    -- [Your existing code remains the same]
    SELECT jsonb_build_object(
        -- Chart 1: System Status Overview (e.g., for a Pie Chart)
        'system_status_counts', (
            SELECT jsonb_object_agg(
                CASE WHEN status THEN 'Active' ELSE 'Inactive' END,
                count
            )
            FROM (
                SELECT status, COUNT(*) as count
                FROM public.systems
                GROUP BY status
            ) as s
        ),

        -- Chart 2: Node Status Overview (e.g., for a Pie Chart)
        'node_status_counts', (
            SELECT jsonb_object_agg(
                CASE WHEN status THEN 'Active' ELSE 'Inactive' END,
                count
            )
            FROM (
                SELECT status, COUNT(*) as count
                FROM public.nodes
                GROUP BY status
            ) as n
        ),

        -- Chart 3: Fiber Path Health (e.g., for a Bar Chart)
        'path_operational_status', (
            SELECT jsonb_object_agg(operational_status, count)
            FROM (
                SELECT operational_status, COUNT(*) as count
                FROM public.logical_fiber_paths
                GROUP BY operational_status
            ) as p
        ),

        -- Chart 4: Cable Utilization Summary (e.g., for Gauges or KPIs)
        'cable_utilization_summary', (
            SELECT jsonb_build_object(
                'average_utilization_percent', ROUND(AVG(utilization_percent)::numeric, 2),
                'high_utilization_count', COUNT(*) FILTER (WHERE utilization_percent > 80),
                'total_cables', COUNT(*)
            )
            FROM public.v_cable_utilization
        ),

        -- Chart 5: Recent User Activity (e.g., for a Line Chart)
        'user_activity_last_30_days', (
            SELECT jsonb_agg(
                jsonb_build_object('date', day::date, 'count', COALESCE(activity_count, 0))
                ORDER BY day
            )
            FROM generate_series(
                CURRENT_DATE - interval '29 days',
                CURRENT_DATE,
                '1 day'
            ) as s(day)
            LEFT JOIN (
                SELECT created_at::date as activity_date, COUNT(*) as activity_count
                FROM public.user_activity_logs
                WHERE created_at >= CURRENT_DATE - interval '29 days'
                GROUP BY activity_date
            ) as activity ON s.day = activity.activity_date
        ),
        
        -- Chart 6: Systems by Maintenance Area (e.g., for a Bar Chart)
        'systems_per_maintenance_area', (
           SELECT jsonb_object_agg(ma.name, s.system_count)
           FROM (
               SELECT maintenance_terminal_id, COUNT(id) as system_count
               FROM public.systems
               WHERE maintenance_terminal_id IS NOT NULL
               GROUP BY maintenance_terminal_id
           ) as s
           JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id
        )

    ) INTO result;

    RETURN result;
EXCEPTION 
    WHEN OTHERS THEN
        -- Add error handling
        RAISE WARNING 'Error in get_dashboard_overview: %', SQLERRM;
        RETURN NULL;
END;
$$;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/9_get_paged_employees_with_count.sql -->
```sql
-- Function: get_paged_employees_with_count
DROP FUNCTION IF EXISTS public.get_paged_employees_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_employees_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'employee_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    employee_name text,
    employee_pers_no text,
    employee_contact text,
    employee_email text,
    employee_dob date,
    employee_doj date,
    employee_designation_id text,
    employee_addr text,
    maintenance_terminal_id text,
    remark text,
    status boolean,
    created_at text,
    updated_at text,
    employee_designation_name text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
)
AS $$
DECLARE
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
    LOOP
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN
        IF jsonb_typeof(filter_value) = 'boolean' THEN
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSIF right(filter_key, 3) = '_id' THEN
          where_clause := where_clause || format(
            ' AND %I::text = %L',
            filter_key,
            trim(BOTH '"' FROM filter_value::text)
          );
        ELSE
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT
      e.id::text,
      e.employee_name::text,
      e.employee_pers_no::text,
      e.employee_contact::text,
      e.employee_email::text,
      e.employee_dob::date,
      e.employee_doj::date,
      e.employee_designation_id::text,
      e.employee_addr::text,
      e.maintenance_terminal_id::text,
      e.remark::text,
      e.status::boolean,
      e.created_at::text,
      e.updated_at::text,
      e.employee_designation_name::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN e.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT e.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_employees_with_count e
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_paged_employees_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_employees_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/6_get_paged_lookup_types_with_count.sql -->
```sql
-- Function: get_paged_lookup_types_with_count
DROP FUNCTION IF EXISTS public.get_paged_lookup_types_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_lookup_types_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    category text,
    name text,
    code text,
    description text,
    sort_order integer,
    is_system_default boolean,
    status boolean,
    created_at text,
    updated_at text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
)
AS $$
DECLARE
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
    LOOP
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN
        IF jsonb_typeof(filter_value) = 'boolean' THEN
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSIF right(filter_key, 3) = '_id' THEN
          where_clause := where_clause || format(
            ' AND %I::text = %L',
            filter_key,
            trim(BOTH '"' FROM filter_value::text)
          );
        ELSE
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT
      lt.id::text,
      lt.category::text,
      lt.name::text,
      lt.code::text,
      lt.description::text,
      lt.sort_order::integer,
      lt.is_system_default::boolean,
      lt.status::boolean,
      lt.created_at::text,
      lt.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN lt.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT lt.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_lookup_types_with_count lt
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_paged_lookup_types_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_lookup_types_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/2_paged_ofc_cables_complete.sql -->
```sql
-- Function: get_paged_ofc_cables_complete
DROP FUNCTION IF EXISTS public.get_paged_ofc_cables_complete;
CREATE OR REPLACE FUNCTION public.get_paged_ofc_cables_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'route_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    id text,
    asset_no text,
    route_name text,
    sn_id text,
    en_id text,
    capacity integer,
    ofc_owner_code text,
    ofc_owner_id text,
    ofc_owner_name text,
    commissioned_on text,
    created_at text,
    current_rkm numeric,
    maintenance_area_code text,
    maintenance_area_name text,
    maintenance_terminal_id text,
    ofc_type_code text,
    ofc_type_id text,
    ofc_type_name text,
    remark text,
    status boolean,
    transnet_id text,
    transnet_rkm numeric,
    updated_at text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
) 
AS $$
DECLARE 
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN 
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN 
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) 
    LOOP 
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN 
        IF jsonb_typeof(filter_value) = 'boolean' THEN 
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN 
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSE 
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT 
      v.id::text,
      v.asset_no::text,
      v.route_name::text,
      v.sn_id::text,
      v.en_id::text,
      v.capacity,
      v.ofc_owner_code::text,
      v.ofc_owner_id::text,
      v.ofc_owner_name::text,
      v.commissioned_on::text,
      v.created_at::text,
      v.current_rkm,
      v.maintenance_area_code::text,
      v.maintenance_area_name::text,
      v.maintenance_terminal_id::text,
      v.ofc_type_code::text,
      v.ofc_type_id::text,
      v.ofc_type_name::text,
      v.remark::text,
      v.status,
      v.transnet_id::text,
      v.transnet_rkm,
      v.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_cables_complete v
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L 
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_paged_ofc_cables_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_ofc_cables_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/11_get_system_path_details.sql -->
```sql
-- This function securely fetches the ordered segments for a specific logical path.
-- It ensures the calling user has RLS permission to view the source system of the path.

CREATE OR REPLACE FUNCTION public.get_system_path_details(
    p_path_id UUID
)
RETURNS SETOF public.v_system_ring_paths_detailed -- Returns rows matching the view's structure
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Security Check: The user can only get path details if they have permission
    -- to see the source system that this path belongs to.
    -- The EXISTS clause correctly and implicitly applies the RLS policies of the
    -- 'systems' table for the current user (auth.uid()).
    IF NOT EXISTS (
        SELECT 1
        FROM public.logical_fiber_paths lfp
        WHERE lfp.id = p_path_id
          AND EXISTS (SELECT 1 FROM public.systems s WHERE s.id = lfp.source_system_id)
    ) THEN
        -- If the user cannot see the source system, return an empty set.
        RETURN;
    END IF;

    -- If the security check passes, return the detailed path segments.
    RETURN QUERY
    SELECT *
    FROM public.v_system_ring_paths_detailed
    WHERE logical_path_id = p_path_id
    ORDER BY path_order ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_system_path_details(UUID) TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/1_paged_nodes_complete.sql -->
```sql
-- Function: get_paged_nodes_complete (no ring relationship)
DROP FUNCTION IF EXISTS public.get_paged_nodes_complete;

CREATE OR REPLACE FUNCTION public.get_paged_nodes_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    id text,
    name text,
    created_at text,
    latitude numeric,
    longitude numeric,
    maintenance_area_code text,
    maintenance_area_name text,
    maintenance_area_type_name text,
    maintenance_terminal_id text,
    node_type_code text,
    node_type_id text,
    node_type_name text,
    remark text,
    status boolean,
    updated_at text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
) 
AS $$
DECLARE 
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN 
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN 
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) 
    LOOP 
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN 
        IF jsonb_typeof(filter_value) = 'boolean' THEN 
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN 
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSIF right(filter_key, 3) = '_id' THEN
          -- For id fields, use exact match instead of ILIKE
          where_clause := where_clause || format(
            ' AND %I::text = %L',
            filter_key,
            trim(BOTH '"' FROM filter_value::text)
          );
        ELSE 
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT 
      v.id::text,
      v.name::text,
      v.created_at::text,
      v.latitude::numeric,
      v.longitude::numeric,
      v.maintenance_area_code::text,
      v.maintenance_area_name::text,
      v.maintenance_area_type_name::text,
      v.maintenance_terminal_id::text,
      v.node_type_code::text,
      v.node_type_id::text,
      v.node_type_name::text,
      v.remark::text,
      v.status,
      v.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_nodes_complete v
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L 
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_paged_nodes_complete(integer, integer, text, text, jsonb) TO authenticated;

ALTER FUNCTION public.get_paged_nodes_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;

```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/10_get_paged_rings_with_count.sql -->
```sql
-- Function: get_paged_rings_with_count
DROP FUNCTION IF EXISTS public.get_paged_rings_with_count;

CREATE OR REPLACE FUNCTION public.get_paged_rings_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    -- rings
    id uuid,
    name text,
    description text,
    ring_type_id uuid,
    maintenance_terminal_id uuid,
    total_nodes integer,
    status boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,

    -- lookup_types (ring type)
    ring_type_name text,
    ring_type_code text,
    ring_type_category text,
    ring_type_sort_order integer,
    ring_type_is_system_default boolean,
    ring_type_status boolean,
    ring_type_created_at timestamp with time zone,
    ring_type_updated_at timestamp with time zone,

    -- maintenance_areas
    maintenance_area_name text,
    maintenance_area_code text,
    maintenance_area_email text,
    maintenance_area_contact_person text,
    maintenance_area_contact_number text,
    maintenance_area_latitude DECIMAL(10, 8),
    maintenance_area_longitude DECIMAL(11, 8),
    maintenance_area_area_type_id uuid,
    maintenance_area_parent_id uuid,
    maintenance_area_status boolean,
    maintenance_area_created_at timestamp with time zone,
    maintenance_area_updated_at timestamp with time zone,

    -- counts
    total_count bigint,
    active_count bigint,
    inactive_count bigint
)
AS $$
DECLARE
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
    LOOP
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN
        IF jsonb_typeof(filter_value) = 'boolean' THEN
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSIF right(filter_key, 3) = '_id' THEN
          where_clause := where_clause || format(
            ' AND %I::text = %L',
            filter_key,
            trim(BOTH '"' FROM filter_value::text)
          );
        ELSE
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT
      r.id,
      r.name,
      r.description,
      r.ring_type_id,
      r.maintenance_terminal_id,
      r.total_nodes,
      r.status,
      r.created_at,
      r.updated_at,

      r.ring_type_name,
      r.ring_type_code,
      r.ring_type_category,
      r.ring_type_sort_order,
      r.ring_type_is_system_default,
      r.ring_type_status,
      r.ring_type_created_at,
      r.ring_type_updated_at,

      r.maintenance_area_name,
      r.maintenance_area_code,
      r.maintenance_area_email,
      r.maintenance_area_contact_person,
      r.maintenance_area_contact_number,
      r.maintenance_area_latitude,
      r.maintenance_area_longitude,
      r.maintenance_area_area_type_id,
      r.maintenance_area_parent_id,
      r.maintenance_area_status,
      r.maintenance_area_created_at,
      r.maintenance_area_updated_at,

      count(*) OVER() AS total_count,
      sum(CASE WHEN r.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT r.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_rings_with_count r
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_paged_rings_with_count(integer, integer, text, text, jsonb) TO authenticated;

ALTER FUNCTION public.get_paged_rings_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;

```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/3_paged_ofc_connections_complete.sql -->
```sql
-- -- Function: get_paged_ofc_connections_complete
-- DROP FUNCTION IF EXISTS public.get_paged_ofc_connections_complete;
-- CREATE OR REPLACE FUNCTION public.get_paged_ofc_connections_complete(
--     p_limit integer,
--     p_offset integer,
--     p_order_by text DEFAULT 'ofc_route_name', -- Changed default to a valid column
--     p_order_dir text DEFAULT 'asc',
--     p_filters jsonb DEFAULT '{}'::jsonb
-- ) 
-- RETURNS TABLE(
--     -- Replaced with columns from v_ofc_connections_complete
--     id text,
--     ofc_id text,
--     ofc_route_name text,
--     ofc_type_name text,
--     sn_id text,
--     sn_name text,
--     sn_dom text,
--     fiber_no_sn integer,
--     system_name text,
--     otdr_distance_sn_km numeric,
--     en_id text,
--     en_name text,
--     en_dom text,
--     fiber_no_en integer,
--     maintenance_area_name text,
--     otdr_distance_en_km numeric,
--     status boolean,
--     remark text,
--     created_at text,
--     updated_at text,
--     total_count bigint,
--     active_count bigint,
--     inactive_count bigint
-- ) 
-- AS $$
-- DECLARE 
--   sql_query text;
--   where_clause text := '';
--   filter_key text;
--   filter_value jsonb;
-- BEGIN 
--   IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN 
--     FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) 
--     LOOP 
--       IF filter_value IS NOT NULL AND filter_value::text != '""' THEN 
--         IF jsonb_typeof(filter_value) = 'boolean' THEN 
--           where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
--         ELSIF filter_key = 'or' THEN 
--           where_clause := where_clause || format(' AND %s', filter_value->>0);
--         ELSE 
--           where_clause := where_clause || format(
--             ' AND %I::text ILIKE %L',
--             filter_key,
--             '%' || trim(BOTH '"' FROM filter_value::text) || '%'
--           );
--         END IF;
--       END IF;
--     END LOOP;
--   END IF;

--   sql_query := format(
--     $query$
--     SELECT 
--       -- Replaced with columns from v_ofc_connections_complete
--       v.id::text,
--       v.ofc_id::text,
--       v.ofc_route_name::text,
--       v.ofc_type_name::text,
--       v.sn_id::text,
--       v.sn_name::text,
--       v.sn_dom::text,
--       v.fiber_no_sn,
--       v.system_name::text,
--       v.otdr_distance_sn_km,
--       v.en_id::text,
--       v.en_name::text,
--       v.en_dom::text,
--       v.fiber_no_en,
--       v.maintenance_area_name::text,
--       v.otdr_distance_en_km,
--       v.status,
--       v.remark::text,
--       v.created_at::text,
--       v.updated_at::text,
--       count(*) OVER() AS total_count,
--       sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
--       sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
--     FROM public.v_ofc_connections_complete v -- Corrected the view name
--     WHERE 1 = 1 %s
--     ORDER BY %I %s
--     LIMIT %L OFFSET %L 
--     $query$,
--     where_clause,
--     p_order_by,
--     p_order_dir,
--     p_limit,
--     p_offset
--   );

--   RETURN QUERY EXECUTE sql_query;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -- Corrected the function name in the GRANT and ALTER statements
-- GRANT EXECUTE ON FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb) TO authenticated;
-- ALTER FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb)
-- SET search_path = public, auth, pg_temp;

-- Function: get_paged_ofc_connections_complete
DROP FUNCTION IF EXISTS public.get_paged_ofc_connections_complete;

-- CREATE OR REPLACE FUNCTION public.get_paged_ofc_connections_complete(
--     p_limit integer,
--     p_offset integer,
--     p_order_by text DEFAULT 'fiber_no_sn', -- must exist in view
--     p_order_dir text DEFAULT 'asc',
--     p_filters jsonb DEFAULT '{}'::jsonb
-- ) 
-- RETURNS TABLE(
--     id text,
--     ofc_id text,
--     ofc_route_name text,
--     ofc_type_name text,
--     sn_id text,
--     sn_name text,
--     sn_dom text,
--     fiber_no_sn integer,
--     sn_power_dbm numeric,
--     source_port text,
--     system_id text,
--     system_name text,
--     otdr_distance_sn_km numeric,
--     en_id text,
--     en_name text,
--     en_dom text,
--     fiber_no_en integer,
--     en_power_dbm numeric,
--     destination_port text,
--     maintenance_area_name text,
--     otdr_distance_en_km numeric,
--     route_loss_db numeric,
--     connection_category text,
--     connection_type text,
--     logical_path_id text,
--     path_segment_order integer,
--     fiber_role text, -- ADDED THIS FIELD
--     status boolean,
--     remark text,
--     created_at text,
--     updated_at text,
--     total_count bigint,
--     active_count bigint,
--     inactive_count bigint
-- ) 
-- AS $$
-- DECLARE 
--   sql_query text;
--   where_clause text := '';
--   filter_key text;
--   filter_value jsonb;
-- BEGIN 
--   -- Build WHERE clause dynamically
--   IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN 
--     FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) 
--     LOOP 
--       IF filter_value IS NOT NULL AND filter_value::text != '""' THEN 
--         IF jsonb_typeof(filter_value) = 'boolean' THEN 
--           where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
--         ELSIF filter_key = 'or' THEN 
--           where_clause := where_clause || format(' AND %s', filter_value->>0);
--         ELSE 
--           where_clause := where_clause || format(
--             ' AND %I::text ILIKE %L',
--             filter_key,
--             '%' || trim(BOTH '"' FROM filter_value::text) || '%'
--           );
--         END IF;
--       END IF;
--     END LOOP;
--   END IF;

--   -- Build dynamic query
--   sql_query := format(
--     $query$
--     SELECT 
--       v.id::text,
--       v.ofc_id::text,
--       v.ofc_route_name::text,
--       v.ofc_type_name::text,
--       v.sn_id::text,
--       v.sn_name::text,
--       v.sn_dom::text,
--       v.fiber_no_sn,
--       v.sn_power_dbm,
--       v.source_port::text,
--       v.system_id::text,
--       v.system_name::text,
--       v.otdr_distance_sn_km,
--       v.en_id::text,
--       v.en_name::text,
--       v.en_dom::text,
--       v.fiber_no_en,
--       v.en_power_dbm,
--       v.destination_port::text,
--       v.maintenance_area_name::text,
--       v.otdr_distance_en_km,
--       v.route_loss_db,
--       v.connection_category::text,
--       v.connection_type::text,
--       v.logical_path_id::text,
--       v.path_segment_order,
--       v.fiber_role::text, -- ADDED THIS FIELD
--       v.status,
--       v.remark::text,
--       v.created_at::text,
--       v.updated_at::text,
--       count(*) OVER() AS total_count,
--       sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
--       sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
--     FROM public.v_ofc_connections_complete v
--     WHERE 1 = 1 %s
--     ORDER BY %I %s
--     LIMIT %L OFFSET %L 
--     $query$,
--     where_clause,
--     p_order_by,
--     p_order_dir,
--     p_limit,
--     p_offset
--   );

--   RETURN QUERY EXECUTE sql_query;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- -- Permissions
-- GRANT EXECUTE ON FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb) TO authenticated;

-- ALTER FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb)
-- SET search_path = public, auth, pg_temp;

DROP FUNCTION IF EXISTS public.get_paged_ofc_connections_complete;

CREATE OR REPLACE FUNCTION public.get_paged_ofc_connections_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'fiber_no_sn', -- must exist in view
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    id text,
    ofc_id text,
    ofc_route_name text,
    ofc_type_name text,
    sn_id text,
    sn_name text,
    sn_dom text,
    fiber_no_sn integer,
    sn_power_dbm numeric,
    source_port text,
    system_id text,
    system_name text,
    otdr_distance_sn_km numeric,
    en_id text,
    en_name text,
    en_dom text,
    fiber_no_en integer,
    en_power_dbm numeric,
    destination_port text,
    maintenance_area_name text,
    otdr_distance_en_km numeric,
    route_loss_db numeric,
    connection_category text,
    connection_type text,
    logical_path_id text,
    path_segment_order integer,
    fiber_role text,
    status boolean,
    remark text,
    created_at text,
    updated_at text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
) 
AS $$
DECLARE 
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN 
  -- Build WHERE clause dynamically
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN 
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) 
    LOOP 
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN 
        IF jsonb_typeof(filter_value) = 'boolean' THEN 
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN 
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSE 
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Build dynamic query
  sql_query := format(
    $query$
    SELECT 
      COALESCE(v.id::text, '') AS id,
      COALESCE(v.ofc_id::text, '') AS ofc_id,
      v.ofc_route_name::text,
      v.ofc_type_name::text,
      v.sn_id::text,
      v.sn_name::text,
      v.sn_dom::text,
      COALESCE(v.fiber_no_sn, 0)::integer AS fiber_no_sn,
      v.sn_power_dbm,
      v.source_port::text,
      v.system_id::text,
      v.system_name::text,
      v.otdr_distance_sn_km,
      v.en_id::text,
      v.en_name::text,
      v.en_dom::text,
      COALESCE(v.fiber_no_en, 0)::integer AS fiber_no_en,
      v.en_power_dbm,
      v.destination_port::text,
      v.maintenance_area_name::text,
      v.otdr_distance_en_km,
      v.route_loss_db,
      COALESCE(v.connection_category::text, '') AS connection_category,
      COALESCE(v.connection_type::text, '') AS connection_type,
      v.logical_path_id::text,
      v.path_segment_order,
      v.fiber_role::text,
      v.status,
      v.remark::text,
      v.created_at::text,
      v.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_connections_complete v
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L 
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb) TO authenticated;

ALTER FUNCTION public.get_paged_ofc_connections_complete(
    integer, integer, text, text, jsonb
) SET search_path = public, auth, pg_temp;


```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/8_get_paged_employee_designations_with_count.sql -->
```sql
-- Function: get_paged_employee_designations_with_count
DROP FUNCTION IF EXISTS public.get_paged_employee_designations_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_employee_designations_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    name text,
    parent_id text,
    status boolean,
    created_at text,
    updated_at text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
)
AS $$
DECLARE
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
    LOOP
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN
        IF jsonb_typeof(filter_value) = 'boolean' THEN
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSIF right(filter_key, 3) = '_id' THEN
          where_clause := where_clause || format(
            ' AND %I::text = %L',
            filter_key,
            trim(BOTH '"' FROM filter_value::text)
          );
        ELSE
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT
      ed.id::text,
      ed.name::text,
      ed.parent_id::text,
      ed.status::boolean,
      ed.created_at::text,
      ed.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN ed.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT ed.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_employee_designations_with_count ed
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_paged_employee_designations_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_employee_designations_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/12_get_continuous_available_fibers.sql -->
```sql
-- REFACTORED: This is the most robust version of the function.
-- It ensures correct counting and avoids potential GROUP BY pitfalls.
CREATE OR REPLACE FUNCTION public.get_continuous_available_fibers(
    p_path_id UUID
) RETURNS TABLE(fiber_no INT) AS $$
DECLARE
    path_cable_count INT;
BEGIN
    -- Step 1: Get the total number of unique physical cable segments in the path.
    SELECT COUNT(DISTINCT seg.ofc_cable_id)
    INTO path_cable_count
    FROM public.logical_path_segments seg
    WHERE seg.logical_path_id = p_path_id AND seg.ofc_cable_id IS NOT NULL;

    -- If the path has no cable segments, there are no fibers to return.
    IF COALESCE(path_cable_count, 0) = 0 THEN
        RETURN;
    END IF;

    -- Step 2: Find all fiber numbers that appear on exactly `path_cable_count` cables within the path.
    RETURN QUERY
    SELECT
        conn.fiber_no_sn::INT
    FROM
        public.ofc_connections conn
    -- This JOIN ensures we only consider connections on the cables in our specific path.
    JOIN public.logical_path_segments seg ON conn.ofc_id = seg.ofc_cable_id
    WHERE
        seg.logical_path_id = p_path_id
        -- And the fiber must be unassigned and active.
        AND conn.logical_path_id IS NULL
        AND conn.status = TRUE
    GROUP BY
        conn.fiber_no_sn
    -- The crucial check:
    HAVING
        COUNT(conn.ofc_id) = path_cable_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_continuous_available_fibers(UUID) TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/5_paged_system_connections_complete.sql -->
```sql
-- Function: get_paged_v_system_connections_complete
-- Corrected name to be consistent with pg standards
DROP FUNCTION IF EXISTS public.get_paged_system_connections_complete;
CREATE OR REPLACE FUNCTION public.get_paged_system_connections_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'system_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    -- Replaced with columns from v_system_connections_complete
    id text,
    system_id text,
    system_name text,
    system_type_name text,
    media_type_name text,
    sn_name text,
    sn_interface text,
    sn_ip text,
    en_name text,
    sn_node_name text, -- ADDED
    en_node_name text, -- ADDED
    en_interface text,
    en_ip text,
    connected_system_name text,
    connected_system_type_name text,
    bandwidth_mbps integer,
    vlan text,
    commissioned_on text,
    status boolean,
    remark text,
    created_at text,
    updated_at text,
    sdh_stm_no text,
    sdh_carrier text,
    sdh_a_slot text,
    sdh_a_customer text,
    sdh_b_slot text,
    sdh_b_customer text,
    maan_fiber_in integer,
    maan_fiber_out integer,
    maan_sfp_port text,
    maan_sfp_serial_no text,
    maan_sfp_capacity text,
    maan_sfp_type_name text,
    maan_customer_name text,
    maan_bandwidth_allocated_mbps integer,
    vmux_channel text,
    vmux_subscriber text,
    vmux_c_code text,
    vmux_tk text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
) 
AS $$
DECLARE 
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN 
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN 
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) 
    LOOP 
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN 
        IF jsonb_typeof(filter_value) = 'boolean' THEN
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSE
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT 
      -- Replaced with columns from v_system_connections_complete
      v.id::text,
      v.system_id::text,
      v.system_name::text,
      v.system_type_name::text,
      v.media_type_name::text,
      v.sn_name::text,
      v.sn_interface::text,
      v.sn_ip::text,
      v.en_name::text,
      v.sn_node_name::text, -- ADDED
      v.en_node_name::text, -- ADDED
      v.en_interface::text,
      v.en_ip::text,
      v.connected_system_name::text,
      v.connected_system_type_name::text,
      v.bandwidth_mbps,
      v.vlan::text,
      v.commissioned_on::text,
      v.status,
      v.remark::text,
      v.created_at::text,
      v.updated_at::text,
      v.sdh_stm_no::text,
      v.sdh_carrier::text,
      v.sdh_a_slot::text,
      v.sdh_a_customer::text,
      v.sdh_b_slot::text,
      v.sdh_b_customer::text,
      v.maan_fiber_in,
      v.maan_fiber_out,
      v.maan_sfp_port::text,
      v.maan_sfp_serial_no::text,
      v.maan_sfp_capacity::text,
      v.maan_sfp_type_name::text,
      v.maan_customer_name::text,
      v.maan_bandwidth_allocated_mbps,
      v.vmux_channel::text,
      v.vmux_subscriber::text,
      v.vmux_c_code::text,
      v.vmux_tk::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_system_connections_complete v -- Corrected the view name
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L 
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corrected the function name in the GRANT and ALTER statements
GRANT EXECUTE ON FUNCTION public.get_paged_system_connections_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_system_connections_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/4_paged_systems_complete.sql -->
```sql
-- REFACTORED: This function is now synchronized with the improved v_systems_complete view.
-- It uses the new, more descriptive column names.

DROP FUNCTION IF EXISTS get_paged_v_systems_complete;
CREATE OR REPLACE FUNCTION get_paged_v_systems_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'system_name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    commissioned_on text,
    created_at text,
    id text,
    ip_address inet,
    latitude numeric,
    longitude numeric,
    
    -- UPDATED: Changed from 'maan_area' to the new, clearer alias.
    ring_logical_area_name text,
    -- UPDATED: Changed from 'maan_ring_no' to the actual UUID field.
    ring_id text,
    
    -- RENAMED: For clarity and consistency.
    system_maintenance_terminal_name text,
    
    node_name text,
    remark text,
    s_no text,
    sdh_gne text,
    sdh_make text,
    status boolean,
    system_category text,
    system_name text,
    system_type_code text,
    system_type_name text,
    updated_at text,
    vmux_vm_id text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
)
AS $$
DECLARE
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN
  -- The filter building logic remains unchanged
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
    LOOP
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN
        where_clause := where_clause || format(
          ' AND %I::text ILIKE %L',
          filter_key,
          '%' || trim(filter_value::text, '"') || '%'
        );
      END IF;
    END LOOP;
  END IF;

  -- The main query is updated to select the new column names
  sql_query := format(
    $query$
    SELECT
      v.commissioned_on::text,
      v.created_at::text,
      v.id::text,
      v.ip_address,
      v.latitude::numeric,
      v.longitude::numeric,
      
      -- UPDATED: Selecting the new, correct column names from the view
      v.ring_logical_area_name::text,
      v.ring_id::text,
      v.system_maintenance_terminal_name::text,
      
      v.node_name,
      v.remark,
      v.s_no,
      v.sdh_gne,
      v.sdh_make,
      v.status,
      v.system_category,
      v.system_name,
      v.system_type_code,
      v.system_type_name,
      v.updated_at::text,
      v.vmux_vm_id,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_systems_complete v
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_paged_v_systems_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_v_systems_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: telecom_network_db/06_utility_functions/4_pagination_functions/7_get_paged_maintenance_areas_with_count.sql -->
```sql
-- Function: get_paged_maintenance_areas_with_count
DROP FUNCTION IF EXISTS public.get_paged_maintenance_areas_with_count;
CREATE OR REPLACE FUNCTION public.get_paged_maintenance_areas_with_count(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'name',
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
    id text,
    name text,
    code text,
    area_type_id text,
    parent_id text,
    contact_person text,
    contact_number text,
    email text,
    latitude numeric,
    longitude numeric,
    address text,
    status boolean,
    created_at text,
    updated_at text,
    maintenance_area_type_name text,
    maintenance_area_type_code text,
    maintenance_area_type_category text,
    maintenance_area_type_sort_order integer,
    maintenance_area_type_is_system_default boolean,
    maintenance_area_type_status boolean,
    maintenance_area_type_created_at text,
    maintenance_area_type_updated_at text,
    total_count bigint,
    active_count bigint,
    inactive_count bigint
)
AS $$
DECLARE
  sql_query text;
  where_clause text := '';
  filter_key text;
  filter_value jsonb;
BEGIN
  IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' THEN
    FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters)
    LOOP
      IF filter_value IS NOT NULL AND filter_value::text != '""' THEN
        IF jsonb_typeof(filter_value) = 'boolean' THEN
          where_clause := where_clause || format(' AND %I = %L', filter_key, filter_value::text::boolean);
        ELSIF filter_key = 'or' THEN
          where_clause := where_clause || format(' AND %s', filter_value->>0);
        ELSIF right(filter_key, 3) = '_id' THEN
          where_clause := where_clause || format(
            ' AND %I::text = %L',
            filter_key,
            trim(BOTH '"' FROM filter_value::text)
          );
        ELSE
          where_clause := where_clause || format(
            ' AND %I::text ILIKE %L',
            filter_key,
            '%' || trim(BOTH '"' FROM filter_value::text) || '%'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT
      ma.id::text,
      ma.name::text,
      ma.code::text,
      ma.area_type_id::text,
      ma.parent_id::text,
      ma.contact_person::text,
      ma.contact_number::text,
      ma.email::text,
      ma.latitude::numeric,
      ma.longitude::numeric,
      ma.address::text,
      ma.status::boolean,
      ma.created_at::text,
      ma.updated_at::text,
      ma.maintenance_area_type_name::text,
      ma.maintenance_area_type_code::text,
      ma.maintenance_area_type_category::text,
      ma.maintenance_area_type_sort_order::integer,
      ma.maintenance_area_type_is_system_default::boolean,
      ma.maintenance_area_type_status::boolean,
      ma.maintenance_area_type_created_at::text,
      ma.maintenance_area_type_updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN ma.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT ma.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_maintenance_areas_with_count ma
    WHERE 1 = 1 %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L
    $query$,
    where_clause,
    p_order_by,
    p_order_dir,
    p_limit,
    p_offset
  );

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_paged_maintenance_areas_with_count(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_maintenance_areas_with_count(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
```

<!-- path: telecom_network_db/06_utility_functions/2_query_execution_functions/1_execute_sql.sql -->
```sql
-- Function: execute_sql
DROP FUNCTION IF EXISTS public.execute_sql(TEXT);
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT) 
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp 
AS $$
DECLARE 
  cleaned_query TEXT;
  result_json JSON;
BEGIN 
  -- Remove leading whitespace and convert to lowercase
  cleaned_query := lower(regexp_replace(sql_query, '^\s*', ''));
  
  -- Allow only SELECT or WITH queries
  IF cleaned_query NOT LIKE 'select %' AND cleaned_query NOT LIKE 'with %' THEN 
    RAISE EXCEPTION 'Only SELECT statements are allowed';
  END IF;
  
  -- Execute query and aggregate result to JSON
  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result_json;
  RETURN json_build_object('result', COALESCE(result_json, '[]'::json));
  
EXCEPTION WHEN OTHERS THEN 
  RETURN json_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;
```

<!-- path: telecom_network_db/06_utility_functions/2_query_execution_functions/2_get_unique_values.sql -->
```sql
-- Function: get_unique_values
CREATE OR REPLACE FUNCTION get_unique_values(
    table_name TEXT,
    column_name TEXT,
    filters JSONB DEFAULT '{}'::jsonb,
    order_by JSONB DEFAULT '[]'::jsonb,
    limit_count INTEGER DEFAULT NULL
) 
RETURNS TABLE(value JSONB) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp 
AS $$
DECLARE 
  query_text TEXT;
  where_clause TEXT := '';
  order_clause TEXT := '';
  limit_clause TEXT := '';
BEGIN 
  IF jsonb_typeof(filters) = 'object' AND filters != '{}'::jsonb THEN
    SELECT string_agg(format('%I = %L', key, filters->key), ' AND ') 
    INTO where_clause
    FROM jsonb_each_text(filters);
    
    IF where_clause IS NOT NULL THEN 
      where_clause := 'WHERE ' || where_clause;
    END IF;
  END IF;

  IF jsonb_typeof(order_by) = 'array' AND jsonb_array_length(order_by) > 0 THEN
    SELECT string_agg(
      format('%I %s', item->>'column', 
        CASE WHEN (item->>'ascending')::boolean THEN 'ASC' ELSE 'DESC' END),
      ', '
    ) INTO order_clause
    FROM jsonb_array_elements(order_by) AS item;
    
    IF order_clause IS NOT NULL THEN 
      order_clause := 'ORDER BY ' || order_clause;
    END IF;
  END IF;

  IF limit_count IS NOT NULL THEN 
    limit_clause := format('LIMIT %s', limit_count);
  END IF;

  query_text := format(
    'SELECT DISTINCT %I as value FROM %I %s %s %s',
    column_name,
    table_name,
    where_clause,
    order_clause,
    limit_clause
  );

  RETURN QUERY EXECUTE format('SELECT to_jsonb(value) FROM (%s) t', query_text);
END;
$$;

GRANT EXECUTE ON FUNCTION get_unique_values TO authenticated;
```

<!-- path: telecom_network_db/02_core_infrastructure/3_views/3_v_employee_designations_with_count.sql -->
```sql
-- Complete Node Information View (SECURITY INVOKER)
create view v_employee_designations_with_count with (security_invoker = true) as
select ed.*,
  -- The following columns were attempting to get designation attributes from lookup_types,
  -- but employee_designations itself holds the 'name' directly and does not
  -- have foreign keys to lookup_types for category, code, etc.
  -- If there's a requirement to categorize designations using lookup_types,
  -- a 'designation_category_id' column would be needed in employee_designations.
  -- For now, we only select what's directly available or meaningfully joined.
  count(*) OVER() AS total_count,
  sum(CASE WHEN ed.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ed.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from employee_designations ed;
```

<!-- path: telecom_network_db/02_core_infrastructure/3_views/7_v_ofc_cables_complete.sql -->
```sql
-- Complete OFC Cables View (SECURITY INVOKER) - VERSION 2 (Corrected with Node Joins)
DROP VIEW IF EXISTS v_ofc_cables_complete;
CREATE VIEW v_ofc_cables_complete WITH (security_invoker = true) AS
SELECT
  ofc.id,
  ofc.route_name,
  ofc.sn_id,
  ofc.en_id,
  sn.name as sn_name, -- ADDED: Start Node Name
  en.name as en_name, -- ADDED: End Node Name
  ofc.capacity,
  ofc.ofc_type_id,
  lt_ofc.name as ofc_type_name,
  lt_ofc.code as ofc_type_code,
  ofc.ofc_owner_id,
  lt_ofc_owner.name as ofc_owner_name,
  lt_ofc_owner.code as ofc_owner_code,
  ofc.asset_no,
  ofc.transnet_id,
  ofc.transnet_rkm,
  ofc.current_rkm,
  ofc.maintenance_terminal_id,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  ofc.commissioned_on,
  ofc.status,
  ofc.remark,
  ofc.created_at,
  ofc.updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN ofc.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ofc.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM ofc_cables ofc
  LEFT JOIN nodes sn ON ofc.sn_id = sn.id -- ADDED: Join for Start Node
  LEFT JOIN nodes en ON ofc.en_id = en.id -- ADDED: Join for End Node
  LEFT JOIN lookup_types lt_ofc ON ofc.ofc_type_id = lt_ofc.id
  LEFT JOIN lookup_types lt_ofc_owner ON ofc.ofc_owner_id = lt_ofc_owner.id
  LEFT JOIN maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id;
```

<!-- path: telecom_network_db/02_core_infrastructure/3_views/1_v_lookup_types_with_count.sql -->
```sql
-- Complete Node Information View (SECURITY INVOKER)
create view v_lookup_types_with_count with (security_invoker = true) as
select lt.*,
  count(*) OVER() AS total_count,
  sum(CASE WHEN lt.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN lt.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from lookup_types lt;
```

<!-- path: telecom_network_db/02_core_infrastructure/3_views/4_v_employees_with_count.sql -->
```sql
-- Complete Node Information View (SECURITY INVOKER)
create view v_employees_with_count with (security_invoker = true) as
select e.*,
  ed.name as employee_designation_name,
  -- Removed lt_ed columns as they are not sourced from employee_designations,
  -- and there's no direct lookup_type join for designation attributes in this view.
  -- If you need these, you'd join employee_designations.id to lookup_types.id if employee_designations.id
  -- was a foreign key to lookup_types, but it's not based on your schema.
  -- The original employee_designations table itself has 'name', which is already selected.
  count(*) OVER() AS total_count,
  sum(CASE WHEN e.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN e.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from employees e
  left join employee_designations ed on e.employee_designation_id = ed.id;
```

<!-- path: telecom_network_db/02_core_infrastructure/3_views/2_v_maintenance_areas_with_count.sql -->
```sql
-- Complete Node Information View (SECURITY INVOKER)
create view v_maintenance_areas_with_count with (security_invoker = true) as
select ma.*,
  lt_ma.name as maintenance_area_type_name,
  lt_ma.code as maintenance_area_type_code,
  lt_ma.category as maintenance_area_type_category,
  lt_ma.sort_order as maintenance_area_type_sort_order,
  lt_ma.is_system_default as maintenance_area_type_is_system_default,
  lt_ma.status as maintenance_area_type_status,
  lt_ma.created_at as maintenance_area_type_created_at,
  lt_ma.updated_at as maintenance_area_type_updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN ma.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN ma.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
from maintenance_areas ma
  left join lookup_types lt_ma on ma.area_type_id = lt_ma.id;
```

<!-- path: telecom_network_db/02_core_infrastructure/3_views/6_v_nodes_complete.sql -->
```sql
-- Complete Node Information View (SECURITY INVOKER)
create or replace view v_nodes_complete
with (security_invoker = true) as
select 
  n.*,
  lt_node.name as node_type_name,
  lt_node.code as node_type_code,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  lt_ma.name as maintenance_area_type_name,
  count(*) OVER() AS total_count,
  sum(case when n.status = true then 1 else 0 end) over() as active_count,
  sum(case when n.status = false then 1 else 0 end) over() as inactive_count

from nodes n
  left join lookup_types lt_node on n.node_type_id = lt_node.id
  left join maintenance_areas ma on n.maintenance_terminal_id = ma.id
  left join lookup_types lt_ma on ma.area_type_id = lt_ma.id;

```

<!-- path: telecom_network_db/02_core_infrastructure/3_views/5_v_rings_with_count.sql -->
```sql
-- Complete Node Information View (SECURITY INVOKER)
create view v_rings_with_count with (security_invoker = true) as
select r.*,
  lt_ring.name as ring_type_name,
  lt_ring.code as ring_type_code,
  lt_ring.category as ring_type_category,
  lt_ring.sort_order as ring_type_sort_order,
  lt_ring.is_system_default as ring_type_is_system_default,
  lt_ring.status as ring_type_status,
  lt_ring.created_at as ring_type_created_at,
  lt_ring.updated_at as ring_type_updated_at,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  ma.email as maintenance_area_email,
  ma.contact_person as maintenance_area_contact_person,
  ma.contact_number as maintenance_area_contact_number,
  ma.latitude as maintenance_area_latitude,
  ma.longitude as maintenance_area_longitude,
  ma.area_type_id as maintenance_area_area_type_id,
  ma.parent_id as maintenance_area_parent_id,
  ma.status as maintenance_area_status,
  ma.created_at as maintenance_area_created_at,
  ma.updated_at as maintenance_area_updated_at,
  count(*) OVER() AS total_count,
  sum(CASE WHEN r.status = true THEN 1 ELSE 0 END) OVER() AS active_count,
  sum(CASE WHEN r.status = false THEN 1 ELSE 0 END) OVER() AS inactive_count
FROM rings r
  LEFT JOIN lookup_types lt_ring ON r.ring_type_id = lt_ring.id
  LEFT JOIN maintenance_areas ma ON r.maintenance_terminal_id = ma.id;

```

<!-- path: telecom_network_db/02_core_infrastructure/2_functions/1_update_updated_at_column.sql -->
```sql
-- update_updated_at_column function with secure search_path
create or replace function update_updated_at_column() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

<!-- path: telecom_network_db/02_core_infrastructure/2_functions/3_dom_update_functions.sql -->
```sql
-- update_sn_dom_on_otdr_change function with secure search_path
create or replace function update_sn_dom_on_otdr_change() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  IF NEW.otdr_distance_sn_km IS DISTINCT FROM OLD.otdr_distance_sn_km THEN
    IF NEW.sn_dom IS NULL OR abs(coalesce(NEW.otdr_distance_sn_km, 0) - coalesce(OLD.otdr_distance_sn_km, 0)) > 0.05 THEN
      NEW.sn_dom := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- update_en_dom_on_otdr_change function with secure search_path
create or replace function update_en_dom_on_otdr_change() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  IF NEW.otdr_distance_en_km IS DISTINCT FROM OLD.otdr_distance_en_km THEN
    IF NEW.en_dom IS NULL OR abs(coalesce(NEW.otdr_distance_en_km, 0) - coalesce(OLD.otdr_distance_en_km, 0)) > 0.05 THEN
      NEW.en_dom := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
```

<!-- path: telecom_network_db/02_core_infrastructure/6_files/files_rows.sql -->
```sql
create table public.folders (
  id UUID primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamp with time zone null default now(),
  constraint folders_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_folders_user_id on public.folders using btree (user_id) TABLESPACE pg_default;


create table public.files (
  id UUID primary key default gen_random_uuid(),
  user_id uuid not null,
  folder_id uuid null,
  file_name text not null,
  file_type text not null,
  file_size text not null,
  file_route text not null,
  file_url text not null,
  uploaded_at timestamp with time zone null default now(),
  constraint files_folder_id_fkey foreign KEY (folder_id) references folders (id),
  constraint files_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists idx_files_user_id on public.files using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_files_folder_id on public.files using btree (folder_id) TABLESPACE pg_default;


```

<!-- path: telecom_network_db/02_core_infrastructure/5_triggers/3_dom_update_triggers.sql -->
```sql
-- Trigger for ofc_connections table to apply dom update logic
create trigger trigger_update_sn_dom_on_otdr_change before update on ofc_connections for each row execute function update_sn_dom_on_otdr_change();
create trigger trigger_update_en_dom_on_otdr_change before update on ofc_connections for each row execute function update_en_dom_on_otdr_change();
```

<!-- path: telecom_network_db/02_core_infrastructure/5_triggers/2_updated_at_triggers.sql -->
```sql
-- Apply timestamp triggers to all tables
create trigger trigger_lookup_types_updated_at before
update on lookup_types for each row execute function update_updated_at_column();
create trigger trigger_maintenance_areas_updated_at before
update on maintenance_areas for each row execute function update_updated_at_column();
create trigger trigger_rings_updated_at before
update on rings for each row execute function update_updated_at_column();
create trigger trigger_employee_designations_updated_at before
update on employee_designations for each row execute function update_updated_at_column();
create trigger trigger_employees_updated_at before
update on employees for each row execute function update_updated_at_column();
create trigger trigger_nodes_updated_at before
update on nodes for each row execute function update_updated_at_column();
create trigger trigger_ofc_cables_updated_at before
update on ofc_cables for each row execute function update_updated_at_column();
create trigger trigger_ofc_connections_updated_at before
update on ofc_connections for each row execute function update_updated_at_column();


```

<!-- path: telecom_network_db/02_core_infrastructure/4_indexes/1_core_indexes.sql -->
```sql
-- Core Infrastructure and Master Table Indexes

-- Indexes for nodes
create index idx_nodes_type_id on nodes (node_type_id);
create index idx_nodes_maintenance_area on nodes (maintenance_terminal_id);
create index idx_nodes_coordinates on nodes (latitude, longitude);
create index idx_nodes_status on nodes (status);

-- Indexes for ofc_connections
create index idx_ofc_connections_ofc_id on ofc_connections (ofc_id);
create index idx_ofc_connections_system_id on ofc_connections (system_id);
create index idx_ofc_connections_logical_path_id on ofc_connections (logical_path_id);

-- Indexes from master tables
create index idx_maintenance_areas_parent_id ON public.maintenance_areas (parent_id);
create index idx_employee_designations_parent_id ON public.employee_designations (parent_id);
create index idx_employees_employee_designation_id ON public.employees (employee_designation_id);
create index idx_employees_maintenance_terminal_id ON public.employees (maintenance_terminal_id);



```

<!-- path: telecom_network_db/02_core_infrastructure/4_indexes/2_fts_indexes.sql -->
```sql
-- Add GIN indexes for full-text search on Core Infrastructure remark fields
create index idx_employees_remark_fts on employees using gin(to_tsvector('english', remark));
create index idx_nodes_remark_fts on nodes using gin(to_tsvector('english', remark));
create index idx_ofc_cables_remark_fts on ofc_cables using gin(to_tsvector('english', remark));
create index idx_ofc_connections_remark_fts on ofc_connections using gin(to_tsvector('english', remark));
```

<!-- path: telecom_network_db/02_core_infrastructure/1_tables/8_ofc_connections.sql -->
```sql
-- OFC Connection Details (Fiber connections between nodes)
create table ofc_connections (
  id UUID primary key default gen_random_uuid(),
  ofc_id UUID references ofc_cables (id) not null,
  fiber_no_sn INTEGER NOT NULL, -- Physical fiber number in the cable
  fiber_no_en INTEGER NOT NULL,
  
  -- Technical measurements
  otdr_distance_sn_km DECIMAL(10, 3),
  sn_dom DATE,
  sn_power_dbm DECIMAL(10, 3),
  system_id UUID, -- IMPORTANT: Foreign key to systems table is added in module 03
  
  -- Technical measurements
  otdr_distance_en_km DECIMAL(10, 3),
  en_dom DATE,
  en_power_dbm DECIMAL(10, 3),
  route_loss_db DECIMAL(10, 3),
  
  -- Logical path information
  logical_path_id UUID,
  -- NEW: Define the fiber's role within the logical path
  fiber_role TEXT CHECK (fiber_role IN ('working', 'protection')),
  path_segment_order INTEGER DEFAULT 1, -- Order in multi-segment paths
  source_port TEXT,
  destination_port TEXT,
  
  -- Metadata
  -- ✅ Enforce category + name
  connection_category TEXT NOT NULL DEFAULT 'OFC_JOINT_TYPES',
  connection_type TEXT NOT NULL DEFAULT 'straight',
  CONSTRAINT fk_connection_type FOREIGN KEY (connection_category, connection_type)
    REFERENCES lookup_types(category, name),
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/02_core_infrastructure/1_tables/3_employee_designations.sql -->
```sql
-- Employee Designation Table
create table employee_designations (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null unique,
  parent_id UUID references employee_designations(id) on delete set null,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/02_core_infrastructure/1_tables/2_maintenance_areas.sql -->
```sql
-- Maintenance Areas/Terminals Master Table
create table maintenance_areas (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null,
  code TEXT unique,
  area_type_id UUID references lookup_types (id),
  parent_id UUID references maintenance_areas (id),
  contact_person TEXT,
  contact_number TEXT,
  email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/02_core_infrastructure/1_tables/5_rings.sql -->
```sql
-- Ring Master Table
create table rings (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null,
  ring_type_id UUID references lookup_types (id),
  description TEXT,
  maintenance_terminal_id UUID references maintenance_areas (id),
  total_nodes INTEGER default 0,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/02_core_infrastructure/1_tables/7_ofc_cables.sql -->
```sql
-- Unified OFC (Optical Fiber Cable) Table
create table ofc_cables (
  id UUID primary key default gen_random_uuid(),
  route_name TEXT not null,
  sn_id UUID references nodes (id) not null,
  en_id UUID references nodes (id) not null,
  ofc_type_id UUID references lookup_types (id) not null,
  capacity INTEGER not null,
  ofc_owner_id UUID references lookup_types (id) not null,
  current_rkm DECIMAL(10, 3),
  transnet_id TEXT,
  transnet_rkm DECIMAL(10, 3),
  asset_no TEXT,
  maintenance_terminal_id UUID references maintenance_areas (id),
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/02_core_infrastructure/1_tables/4_employees.sql -->
```sql
-- Employee Master Table
create table employees (
  id UUID primary key default gen_random_uuid(),
  employee_name TEXT not null,
  employee_pers_no TEXT unique,
  employee_contact TEXT,
  employee_email TEXT,
  employee_dob DATE,
  employee_doj DATE,
  employee_designation_id UUID references employee_designations (id),
  employee_addr TEXT,
  maintenance_terminal_id UUID references maintenance_areas (id),
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/02_core_infrastructure/1_tables/1_lookup_types.sql -->
```sql
-- Centralized Lookup Types Table
create table lookup_types (
  id UUID primary key default gen_random_uuid(),
  category TEXT not null,
  name TEXT not null,
  code TEXT,
  description TEXT,
  sort_order INTEGER default 0,
  is_system_default BOOLEAN default false,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW(),
  constraint uq_lookup_types_category_name unique (category, name),
  constraint uq_lookup_types_category_code unique (category, code)
);

create index idx_lookup_types_category on lookup_types (category);
create index idx_lookup_types_name on lookup_types (name);
```

<!-- path: telecom_network_db/02_core_infrastructure/1_tables/6_nodes.sql -->
```sql
-- Unified Node List (Physical Locations/Sites)
create table nodes (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null,
  node_type_id UUID references lookup_types (id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  maintenance_terminal_id UUID references maintenance_areas (id),
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
```

<!-- path: telecom_network_db/04_advanced_ofc/2_views/1_v_end_to_end_paths.sql -->
```sql
-- REFACTORED: This view now correctly joins with lookup_types to get the
-- human-readable operational status name from the new operational_status_id field.

DROP VIEW IF EXISTS v_end_to_end_paths;
CREATE VIEW v_end_to_end_paths WITH (security_invoker = true) AS
SELECT 
  lfp.id as path_id,
  lfp.path_name,
  lfp.source_system_id,
  lfp.destination_system_id,
  lfp.total_distance_km,
  lfp.total_loss_db,
  
  -- CORRECTED: Join to lookup_types to get the status name
  lt_status.name as operational_status,
  
  COUNT(lps.id) as segment_count, -- Count from logical_path_segments for accuracy
  STRING_AGG(DISTINCT oc.route_name, ' -> ' ORDER BY oc.route_name) as route_names
FROM 
  logical_fiber_paths lfp
  -- Join to get the operational status name
  LEFT JOIN lookup_types lt_status ON lfp.operational_status_id = lt_status.id
  -- Join through the segment table to find the associated cables
  LEFT JOIN logical_path_segments lps ON lfp.id = lps.logical_path_id
  LEFT JOIN ofc_cables oc ON lps.ofc_cable_id = oc.id
GROUP BY 
  lfp.id, 
  lfp.path_name, 
  lfp.source_system_id, 
  lfp.destination_system_id, 
  lfp.total_distance_km, 
  lfp.total_loss_db, 
  lt_status.name; -- Group by the name from the joined table
```

<!-- path: telecom_network_db/04_advanced_ofc/2_views/8_v_system_ring_paths_detailed.sql -->
```sql
-- This view depends on tables now created in this module, so it belongs here.
DROP VIEW IF EXISTS public.v_system_ring_paths_detailed;

CREATE VIEW public.v_system_ring_paths_detailed WITH (security_invoker = true) AS
SELECT
  srp.id,
  srp.logical_path_id,
  lp.path_name,
  lp.source_system_id,
  srp.ofc_cable_id,
  srp.path_order,
  oc.route_name,
  oc.sn_id AS start_node_id,
  sn.name AS start_node_name,
  oc.en_id AS end_node_id,
  en.name AS end_node_name,
  srp.created_at
FROM
  public.logical_path_segments srp
  JOIN public.logical_fiber_paths lp ON srp.logical_path_id = lp.id
  JOIN public.ofc_cables oc ON srp.ofc_cable_id = oc.id
  LEFT JOIN public.nodes sn ON oc.sn_id = sn.id
  LEFT JOIN public.nodes en ON oc.en_id = en.id
ORDER BY
  srp.logical_path_id,
  srp.path_order;
```

<!-- path: telecom_network_db/04_advanced_ofc/2_views/2_v_cable_utilization.sql -->
```sql
-- View for cable utilization
DROP VIEW IF EXISTS v_cable_utilization;
CREATE VIEW v_cable_utilization WITH (security_invoker = true) AS
SELECT 
  oc.id as cable_id,
  oc.route_name,
  oc.capacity,
  -- Count only fibers that are part of a working path and where the path's status is 'active'
  COUNT(lfp.id) FILTER (
    WHERE lt_status.name = 'active' AND conn.fiber_role = 'working'
  ) as used_fibers,
  
  -- Available fibers are total capacity minus all assigned fibers (both working and protection)
  (oc.capacity - COUNT(conn.id)) as available_fibers,
  
  -- Utilization is based on actively used "working" fibers
  ROUND(
    (COUNT(lfp.id) FILTER (WHERE lt_status.name = 'active' AND conn.fiber_role = 'working')::DECIMAL / NULLIF(oc.capacity, 0)) * 100, 2
  ) as utilization_percent
FROM 
  ofc_cables oc
  LEFT JOIN ofc_connections conn ON oc.id = conn.ofc_id
  LEFT JOIN logical_fiber_paths lfp ON conn.logical_path_id = lfp.id
  -- JOIN to lookup_types to get the status name
  LEFT JOIN lookup_types lt_status ON lfp.operational_status_id = lt_status.id
GROUP BY 
  oc.id, oc.route_name, oc.capacity;
```

<!-- path: telecom_network_db/04_advanced_ofc/5_constraints/1_add_fk_constraints.sql -->
```sql
-- =================================================================
-- Add Cross-Module Foreign Key Constraints
-- =================================================================
-- This script adds foreign key constraints that link tables from
-- earlier modules (like core_infrastructure) to tables created
-- within this module. This avoids dependency errors during the
-- initial schema creation.
-- =================================================================

-- Add the foreign key from ofc_connections (module 02) to logical_fiber_paths (module 04)
ALTER TABLE public.ofc_connections
ADD CONSTRAINT fk_ofc_connections_logical_path
FOREIGN KEY (logical_path_id) 
REFERENCES public.logical_fiber_paths(id)
ON DELETE SET NULL; -- Optional: Defines behavior if a logical path is deleted


-- Add FKs from logical_fiber_paths (module 02) to systems (module 03)
ALTER TABLE public.logical_fiber_paths
ADD CONSTRAINT fk_lfp_source_system
FOREIGN KEY (source_system_id)
REFERENCES public.systems(id)
ON DELETE SET NULL;

ALTER TABLE public.logical_fiber_paths
ADD CONSTRAINT fk_lfp_destination_system
FOREIGN KEY (destination_system_id)
REFERENCES public.systems(id)
ON DELETE SET NULL;
```

<!-- path: telecom_network_db/04_advanced_ofc/4_triggers/1_updated_at_triggers.sql -->
```sql
-- ADDED: Triggers for new advanced tables
create trigger trigger_fiber_joints_updated_at before update on fiber_joints for each row execute function update_updated_at_column();
create trigger trigger_logical_fiber_paths_updated_at before update on logical_fiber_paths for each row execute function update_updated_at_column();
create trigger trigger_logical_path_segments_updated_at before update on logical_path_segments for each row execute function update_updated_at_column();
```

<!-- path: telecom_network_db/04_advanced_ofc/3_indexes/1_advanced_ofc_indexes.sql -->
```sql
-- ADDED: Indexes for new advanced tables
CREATE INDEX idx_fiber_joints_node_id ON public.fiber_joints (node_id);
CREATE INDEX idx_logical_fiber_paths_source_system_id ON public.logical_fiber_paths (source_system_id);
CREATE INDEX idx_logical_path_segments_path_id ON public.logical_path_segments(logical_path_id);
```

<!-- path: telecom_network_db/04_advanced_ofc/1_tables/9_advanced_ofc_tables.sql -->
```sql
-- This file creates the new foundational tables for advanced path management.
-- They are placed in the core module to resolve dependency issues.

-- 1. Fiber Joints Table
CREATE TABLE fiber_joints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joint_name TEXT NOT NULL,
  joint_category TEXT NOT NULL DEFAULT 'OFC_JOINT_TYPES',
  joint_type TEXT NOT NULL DEFAULT 'straight',
  CONSTRAINT fk_joint_type FOREIGN KEY (joint_category, joint_type) REFERENCES lookup_types(category, name),
  location_description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  node_id UUID REFERENCES nodes (id),
  maintenance_area_id UUID REFERENCES maintenance_areas (id),
  installed_date DATE,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Logical Fiber Paths Table (This is the SOURCE OF TRUTH)
CREATE TABLE logical_fiber_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_name TEXT,
  
  -- NEW: Link a protection path back to its working path
  working_path_id UUID REFERENCES logical_fiber_paths(id) ON DELETE SET NULL,
  path_role TEXT NOT NULL DEFAULT 'working' CHECK (path_role IN ('working', 'protection')),
  
  -- CORRECTED: Use a single UUID to reference the lookup_types table.
  path_type_id UUID REFERENCES lookup_types(id) ON DELETE SET NULL,
  
  source_system_id UUID, -- Foreign key is deferred to a later script
  destination_system_id UUID, -- Foreign key is deferred
  operational_status_id UUID REFERENCES lookup_types(id) ON DELETE SET NULL,
  
  -- ... (rest of the columns: source_port, total_distance_km, etc.)
  source_port TEXT,
  destination_port TEXT,
  total_distance_km DECIMAL(10, 3),
  total_loss_db DECIMAL(10, 3),
  service_type TEXT,
  bandwidth_gbps INTEGER,
  wavelength_nm INTEGER,
  commissioned_date DATE,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Logical Path Segments (The linking table)
CREATE TABLE logical_path_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logical_path_id UUID NOT NULL REFERENCES logical_fiber_paths(id) ON DELETE CASCADE,
  ofc_cable_id UUID REFERENCES ofc_cables(id),
  fiber_joint_id UUID REFERENCES fiber_joints(id),
  path_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((ofc_cable_id IS NOT NULL AND fiber_joint_id IS NULL) OR (ofc_cable_id IS NULL AND fiber_joint_id IS NOT NULL)),
  UNIQUE (logical_path_id, path_order)
);
```

<!-- path: telecom_network_db/04_advanced_ofc/1_tables/2_fiber_splices.sql -->
```sql
-- This is the core routing table. It tracks every single fiber connection inside a JC.
CREATE TABLE IF NOT EXISTS public.fiber_splices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jc_id UUID NOT NULL REFERENCES public.junction_closures(id) ON DELETE CASCADE,

    -- Incoming Fiber
    incoming_cable_id UUID NOT NULL REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    incoming_fiber_no INT NOT NULL,

    -- Outgoing Fiber (can be null for termination)
    outgoing_cable_id UUID REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    outgoing_fiber_no INT,

    -- Metadata
    splice_type TEXT NOT NULL DEFAULT 'pass_through' CHECK (splice_type IN ('pass_through', 'branch', 'termination')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'faulty', 'reserved')),
    logical_path_id UUID REFERENCES public.logical_fiber_paths(id) ON DELETE SET NULL,
    loss_db NUMERIC(5, 2),
    otdr_length_km NUMERIC(10, 3), -- OTDR up to this splice point

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,

    -- CONSTRAINTS
    CONSTRAINT unique_incoming_fiber_in_jc UNIQUE (jc_id, incoming_cable_id, incoming_fiber_no),
    CONSTRAINT unique_outgoing_fiber_in_jc UNIQUE (jc_id, outgoing_cable_id, outgoing_fiber_no),
    CONSTRAINT check_no_self_splice CHECK (incoming_cable_id <> outgoing_cable_id OR incoming_fiber_no <> outgoing_fiber_no)
);

COMMENT ON TABLE public.fiber_splices IS 'Tracks individual fiber connections (splices) within a junction closure.';
COMMENT ON COLUMN public.fiber_splices.splice_type IS 'Type of splice: pass_through, branch, or termination (if outgoing is NULL).';
```

<!-- path: telecom_network_db/04_advanced_ofc/1_tables/1_junction_closures.sql -->
```sql
-- Represents a physical junction closure (splice box) along an OFC route.
CREATE TABLE IF NOT EXISTS public.junction_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    ofc_cable_id UUID REFERENCES public.ofc_cables(id) ON DELETE CASCADE, -- The main cable this JC is physically located on
    position_km NUMERIC(10, 3), -- Distance in KM from the start of the ofc_cable
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE public.junction_closures IS 'Physical junction closures (splice boxes) along OFC routes.';
COMMENT ON COLUMN public.junction_closures.ofc_cable_id IS 'The primary OFC cable this JC is physically located on.';
COMMENT ON COLUMN public.junction_closures.position_km IS 'The distance in kilometers from the start node of the ofc_cable.';

```

