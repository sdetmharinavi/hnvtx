--===== telecom_network_db/12_indexes/1_core_indexes.sql =====
-- Core indexes
create index idx_nodes_ring_id on nodes (ring_id);
create index idx_nodes_type_id on nodes (node_type_id);
create index idx_nodes_maintenance_area on nodes (maintenance_terminal_id);
create index idx_nodes_coordinates on nodes (latitude, longitude);
create index idx_nodes_status on nodes (status);
create index idx_systems_node_id on systems (node_id);
create index idx_systems_type_id on systems (system_type_id);
create index idx_systems_maintenance_area on systems (maintenance_terminal_id);
create index idx_ofc_connections_ofc_id on ofc_connections (ofc_id);
create index idx_ofc_connections_nodes on ofc_connections (source_id, destination_id);
create index idx_ofc_connections_systems on ofc_connections (system_sn_id, system_en_id);
create index idx_system_connections_system_id on system_connections (system_id);
create index idx_system_connections_nodes on system_connections (sn_id, en_id);
create index idx_system_connections_connected_system on system_connections (connected_system_id);
--===== telecom_network_db/12_indexes/2_composite_indexes.sql =====
-- Composite indexes for common queries
create index idx_nodes_ring_order on nodes (ring_id, order_in_ring) where ring_id is not null;
create index idx_systems_node_type on systems (node_id, system_type_id);
--===== telecom_network_db/12_indexes/4_system_specific_indexes.sql =====
-- Indexes for new specific system/connection tables
create index idx_cpan_systems_ring_area on cpan_systems (ring_no, area);
create index idx_maan_systems_ring_area on maan_systems (ring_no, area);
create index idx_sdh_systems_make on sdh_systems (make);
create index idx_vmux_systems_vmid on vmux_systems (vm_id);
create index idx_maan_connections_customer on maan_connections (customer_name);
create index idx_sdh_connections_carrier on sdh_connections (carrier);
create index idx_sdh_connections_customers on sdh_connections (a_customer, b_customer);
create index idx_vmux_connections_subscriber on vmux_connections (subscriber);
create index idx_management_ports_port_no on management_ports (port_no);
--===== telecom_network_db/12_indexes/3_lookup_type_indexes.sql =====
-- Additional indexes for lookup_types usage
create index idx_ofc_cables_type_id on ofc_cables (ofc_type_id);
create index idx_rings_type_id on rings (ring_type_id);
create index idx_maintenance_areas_type_id on maintenance_areas (area_type_id);
create index idx_system_connections_media_type on system_connections (media_type_id);
--===== telecom_network_db/9_advanced_ofc/3_views/1_v_end_to_end_paths.sql =====
-- View for end-to-end fiber paths
CREATE VIEW v_end_to_end_paths with (security_invoker = true) AS
SELECT 
  lfp.id as path_id,
  lfp.path_name,
  lfp.source_system_id,
  lfp.destination_system_id,
  lfp.total_distance_km,
  lfp.total_loss_db,
  lfp.operational_status,
  COUNT(oce.id) as segment_count,
  STRING_AGG(DISTINCT oc.route_name, ' -> ' ORDER BY oc.route_name) as route_names
FROM logical_fiber_paths lfp
LEFT JOIN ofc_connections oce ON lfp.id = oce.logical_path_id
LEFT JOIN ofc_cables oc ON oce.ofc_id = oc.id
GROUP BY lfp.id, lfp.path_name, lfp.source_system_id, lfp.destination_system_id, 
         lfp.total_distance_km, lfp.total_loss_db, lfp.operational_status;
--===== telecom_network_db/9_advanced_ofc/3_views/2_v_cable_utilization.sql =====
-- View for cable utilization
CREATE VIEW v_cable_utilization with (security_invoker = true) AS
SELECT 
  oc.id as cable_id,
  oc.route_name,
  oc.capacity,
  COUNT(oce.id) as used_fibers,
  (oc.capacity - COUNT(oce.id)) as available_fibers,
  ROUND((COUNT(oce.id)::DECIMAL / oc.capacity) * 100, 2) as utilization_percent
FROM ofc_cables oc
LEFT JOIN ofc_connections oce ON oc.id = oce.ofc_id AND oce.status = true
GROUP BY oc.id, oc.route_name, oc.capacity;
--===== telecom_network_db/9_advanced_ofc/5_triggers/1_updated_at_triggers.sql =====
-- Apply timestamp triggers to all tables
create trigger trigger_fiber_joints_updated_at before update on fiber_joints for each row execute function update_updated_at_column();
create trigger trigger_logical_fiber_paths_updated_at before update on logical_fiber_paths for each row execute function update_updated_at_column();
create trigger trigger_fiber_joint_connections_updated_at before update on fiber_joint_connections for each row execute function update_updated_at_column();
--===== telecom_network_db/9_advanced_ofc/2_indexes/1_indexes.sql =====
-- 6. Indexes for performance
CREATE INDEX idx_ofc_connections_logical_path ON ofc_connections(logical_path_id);

--===== telecom_network_db/9_advanced_ofc/4_rls_policies/1_enable_rls.sql =====
-- Enable RLS on all tables
ALTER TABLE fiber_joints ENABLE ROW LEVEL SECURITY;
ALTER TABLE logical_fiber_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiber_joint_connections ENABLE ROW LEVEL SECURITY;
--===== telecom_network_db/9_advanced_ofc/4_rls_policies/2_core_tables_policies.sql =====
-- Core tables RLS policies (lookup_types, maintenance_areas, rings, etc.)
DO $$
DECLARE 
  tbl text;
BEGIN 
  FOREACH tbl IN ARRAY ARRAY[
    'fiber_joints', 'logical_fiber_paths', 'fiber_joint_connections'
  ] 
  LOOP 
    -- Cleanup old policies
    EXECUTE format('DROP POLICY IF EXISTS policy_select_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_insert_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_update_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_delete_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_write_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS allow_admin_select ON public.%s;', tbl);

    -- SELECT policies
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);

    EXECUTE format($f$
      CREATE POLICY allow_admin_select ON public.%I 
      FOR SELECT TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- INSERT policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_insert ON public.%I 
      FOR INSERT TO admin 
      WITH CHECK (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- UPDATE policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_update ON public.%I 
      FOR UPDATE TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin')
      WITH CHECK (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- DELETE policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_delete ON public.%I 
      FOR DELETE TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);
  END LOOP;
END;
$$;
--===== telecom_network_db/9_advanced_ofc/4_rls_policies/6_role_grants.sql =====
-- Grant full access to admin
GRANT ALL ON public.fiber_joints TO admin;
GRANT ALL ON public.logical_fiber_paths TO admin;
GRANT ALL ON public.fiber_joint_connections TO admin;

-- Grant read-only (SELECT) access to viewer on all tables
GRANT SELECT ON public.fiber_joints TO viewer;
GRANT SELECT ON public.logical_fiber_paths TO viewer;
GRANT SELECT ON public.fiber_joint_connections TO viewer;
--===== telecom_network_db/9_advanced_ofc/1_tables/2_logical_fiber_paths.sql =====
-- 4. Logical paths table (end-to-end connectivity)
CREATE TABLE logical_fiber_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_name TEXT,
  
  -- End-to-end connectivity
  source_system_id UUID REFERENCES systems (id),
  source_port TEXT,
  destination_system_id UUID REFERENCES systems (id),
  destination_port TEXT,
  
  -- Path characteristics
  total_distance_km DECIMAL(10, 3),
  total_loss_db DECIMAL(10, 3),
  -- ✅ Enforce category + name
  path_category TEXT NOT NULL DEFAULT 'OFC_PATH_TYPES',
  path_type TEXT NOT NULL DEFAULT 'Point-to-Point',
  CONSTRAINT fk_path_type FOREIGN KEY (path_category, path_type)
    REFERENCES lookup_types(category, name),
  
  -- Service information
  service_type TEXT,
  bandwidth_gbps INTEGER,
  wavelength_nm INTEGER,
  
  -- Status and metadata
  -- ✅ Enforce category + name
  operational_status_category TEXT NOT NULL DEFAULT 'OFC_PATH_STATUSES',
  operational_status TEXT NOT NULL DEFAULT 'planned',
  CONSTRAINT fk_operational_status FOREIGN KEY (operational_status_category, operational_status)
    REFERENCES lookup_types(category, name),
  commissioned_date DATE,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
--===== telecom_network_db/9_advanced_ofc/1_tables/1_fiber_joints.sql =====
-- 3. New joints table for splice points and T-connections
CREATE TABLE fiber_joints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joint_name TEXT NOT NULL,
  -- ✅ Enforce category + name
  joint_category TEXT NOT NULL DEFAULT 'OFC_JOINT_TYPES',
  joint_type TEXT NOT NULL DEFAULT 'straight',
  CONSTRAINT fk_joint_type FOREIGN KEY (joint_category, joint_type)
    REFERENCES lookup_types(category, name),
  location_description TEXT,
  
  -- Geographic information
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Physical location reference
  node_id UUID REFERENCES nodes (id), -- If joint is at a node location
  maintenance_area_id UUID REFERENCES maintenance_areas (id),
  
  installed_date DATE,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
--===== telecom_network_db/9_advanced_ofc/1_tables/3_fiber_joint_connections.sql =====
-- 5. Junction table for complex fiber routing through joints
CREATE TABLE fiber_joint_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joint_id UUID REFERENCES fiber_joints (id) NOT NULL,
  
  -- Input side
  input_ofc_id UUID REFERENCES ofc_cables (id) NOT NULL,
  input_fiber_no INTEGER NOT NULL,
  
  -- Output side
  output_ofc_id UUID REFERENCES ofc_cables (id) NOT NULL,
  output_fiber_no INTEGER NOT NULL,
  
  -- Connection metadata
  splice_loss_db DECIMAL(5, 3),
  logical_path_id UUID REFERENCES logical_fiber_paths (id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique connections per joint
  UNIQUE(joint_id, input_ofc_id, input_fiber_no),
  UNIQUE(joint_id, output_ofc_id, output_fiber_no)
);

--===== telecom_network_db/6_functions/3_lookup_type_functions.sql =====
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
--===== telecom_network_db/6_functions/2_update_updated_at_column.sql =====
-- update_updated_at_column function with secure search_path
create or replace function update_updated_at_column() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
--===== telecom_network_db/6_functions/4_dom_update_functions.sql =====
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
--===== telecom_network_db/6_functions/1_update_ring_node_count.sql =====
-- update_ring_node_count function with secure search_path
create or replace function update_ring_node_count() RETURNS TRIGGER SECURITY DEFINER
set search_path = public, pg_catalog
LANGUAGE plpgsql as $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE rings
    SET total_nodes = (
      SELECT COUNT(*)
      FROM nodes
      WHERE ring_id = NEW.ring_id
        AND status = true
    )
    WHERE id = NEW.ring_id;
  END IF;
  
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.ring_id IS DISTINCT FROM NEW.ring_id) THEN
    UPDATE rings
    SET total_nodes = (
      SELECT COUNT(*)
      FROM nodes
      WHERE ring_id = OLD.ring_id
        AND status = true
    )
    WHERE id = OLD.ring_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;
--===== telecom_network_db/8_triggers/3_dom_update_triggers.sql =====
-- Trigger for ofc_connections table to apply dom update logic
create trigger trigger_update_sn_dom_on_otdr_change before update on ofc_connections for each row execute function update_sn_dom_on_otdr_change();
create trigger trigger_update_en_dom_on_otdr_change before update on ofc_connections for each row execute function update_en_dom_on_otdr_change();
--===== telecom_network_db/8_triggers/2_updated_at_triggers.sql =====
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
create trigger trigger_cpan_systems_updated_at before
update on cpan_systems for each row execute function update_updated_at_column();
create trigger trigger_cpan_connections_updated_at before
update on cpan_connections for each row execute function update_updated_at_column();
create trigger trigger_maan_systems_updated_at before
update on maan_systems for each row execute function update_updated_at_column();
create trigger trigger_maan_connections_updated_at before
update on maan_connections for each row execute function update_updated_at_column();
create trigger trigger_sdh_systems_updated_at before
update on sdh_systems for each row execute function update_updated_at_column();
create trigger trigger_sdh_connections_updated_at before
update on sdh_connections for each row execute function update_updated_at_column();
create trigger trigger_vmux_systems_updated_at before
update on vmux_systems for each row execute function update_updated_at_column();
create trigger trigger_vmux_connections_updated_at before
update on vmux_connections for each row execute function update_updated_at_column();
create trigger trigger_ofc_cables_updated_at before
update on ofc_cables for each row execute function update_updated_at_column();
create trigger trigger_systems_updated_at before
update on systems for each row execute function update_updated_at_column();
create trigger trigger_ofc_connections_updated_at before
update on ofc_connections for each row execute function update_updated_at_column();
create trigger trigger_system_connections_updated_at before
update on system_connections for each row execute function update_updated_at_column();
create trigger trigger_management_ports_updated_at before
update on management_ports for each row execute function update_updated_at_column();
create trigger trigger_sdh_node_associations_updated_at before
update on sdh_node_associations for each row execute function update_updated_at_column();
--===== telecom_network_db/8_triggers/1_ring_node_count_trigger.sql =====
-- Trigger to automatically update ring node counts
create trigger trigger_update_ring_node_count
after insert or update or delete on nodes 
for each row execute function update_ring_node_count();
--===== telecom_network_db/4_system_specific_tables/8_vmux_connections.sql =====
-- Dedicated Table for VMUX Connection Specific Details
create table vmux_connections (
  system_connection_id UUID primary key references system_connections (id) on delete CASCADE,
  subscriber TEXT,
  c_code TEXT,
  channel TEXT,
  tk TEXT
);
--===== telecom_network_db/4_system_specific_tables/6_maan_connections.sql =====
-- Dedicated Table for MAAN Connection Specific Details
create table maan_connections (
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
--===== telecom_network_db/4_system_specific_tables/7_sdh_connections.sql =====
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
--===== telecom_network_db/4_system_specific_tables/2_maan_systems.sql =====
-- Dedicated Table for MAAN System Specific Details
create table maan_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  ring_no TEXT,
  area TEXT
);
--===== telecom_network_db/4_system_specific_tables/4_vmux_systems.sql =====
-- Dedicated Table for VMUX System Specific Details
create table vmux_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  vm_id TEXT
);
--===== telecom_network_db/4_system_specific_tables/5_cpan_connections.sql =====
-- Dedicated Table for CPAN Connection Specific Details
create table cpan_connections (
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
--===== telecom_network_db/4_system_specific_tables/1_cpan_systems.sql =====
-- Dedicated Table for CPAN System Specific Details
create table cpan_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  ring_no TEXT,
  area TEXT
);
--===== telecom_network_db/4_system_specific_tables/3_sdh_systems.sql =====
-- Dedicated Table for SDH System Specific Details
create table sdh_systems (
  system_id UUID primary key references systems (id) on delete CASCADE,
  gne TEXT,
  make TEXT
);
--===== telecom_network_db/4_system_specific_tables/9_sdh_node_associations.sql =====
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
--===== telecom_network_db/2_master_tables/3_employee_designations.sql =====
-- Employee Designation Table
create table employee_designations (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null unique,
  parent_id UUID references employee_designations(id) on delete set null,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
--===== telecom_network_db/2_master_tables/2_maintenance_areas.sql =====
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
--===== telecom_network_db/2_master_tables/4_employees.sql =====
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
--===== telecom_network_db/2_master_tables/1_lookup_types.sql =====
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
--===== telecom_network_db/10_auditing/2_functions/2_log_data_changes.sql =====
--===== telecom_network_db/12_auditing/2_functions/2_log_data_changes.sql =====
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
--===== telecom_network_db/10_auditing/2_functions/1_log_user_activity.sql =====
--===== telecom_network_db/12_auditing/2_functions/1_log_user_activity.sql =====
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
--===== telecom_network_db/10_auditing/3_triggers/1_attach_logging_triggers.sql =====
--===== telecom_network_db/12_auditing/3_triggers/1_attach_logging_triggers.sql =====
--===== telecom_network_db/12_auditing/3_triggers/1_attach_logging_triggers.sql =====

-- Attaching log trigger to User Profiles
CREATE TRIGGER user_profiles_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Attaching log trigger to Core Infrastructure Tables
CREATE TRIGGER nodes_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.nodes
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER rings_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.rings
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER ofc_cables_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ofc_cables
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Attaching log trigger to Connection Tables
CREATE TRIGGER ofc_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ofc_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER system_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.system_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Attaching log trigger to Master Data
CREATE TRIGGER maintenance_areas_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_areas
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- Attaching log trigger to system specific Tables
CREATE TRIGGER cpan_systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.cpan_systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER maan_systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.maan_systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();


CREATE TRIGGER sdh_systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sdh_systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER vmux_systems_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vmux_systems
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER cpan_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.cpan_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER maan_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.maan_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();


CREATE TRIGGER sdh_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sdh_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

CREATE TRIGGER vmux_connections_log_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vmux_connections
FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

--===== telecom_network_db/10_auditing/1_tables/1_user_activity_logs.sql =====
--===== telecom_network_db/12_auditing/1_tables/1_user_activity_logs.sql =====
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
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
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
--===== telecom_network_db/5_views/3_ofc_cables_complete.sql =====
-- Complete OFC Cables View (SECURITY INVOKER)
create view v_ofc_cables_complete with (security_invoker = true) as
select ofc.*,
  lt_ofc.name as ofc_type_name,
  lt_ofc.code as ofc_type_code,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code
from ofc_cables ofc
  join lookup_types lt_ofc on ofc.ofc_type_id = lt_ofc.id
  left join maintenance_areas ma on ofc.maintenance_terminal_id = ma.id;
--===== telecom_network_db/5_views/2_systems_complete.sql =====
-- Complete System Information View (SECURITY INVOKER)
create view v_systems_complete with (security_invoker = true) as
select s.id,
  s.system_name,
  s.ip_address,
  s.commissioned_on,
  s.remark,
  s.s_no,
  s.status,
  s.created_at,
  s.updated_at,
  n.name as node_name,
  n.latitude,
  n.longitude,
  n.ip_address as node_ip,
  lt_system.name as system_type_name,
  lt_system.code as system_type_code,
  lt_system.category as system_category,
  ma.name as maintenance_area_name,
  ms.ring_no as maan_ring_no,
  ms.area as maan_area,
  ss.gne as sdh_gne,
  ss.make as sdh_make,
  vs.vm_id as vmux_vm_id
from systems s
  join nodes n on s.node_id = n.id
  join lookup_types lt_system on s.system_type_id = lt_system.id
  left join maintenance_areas ma on s.maintenance_terminal_id = ma.id
  left join cpan_systems cs on s.id = cs.system_id
  left join maan_systems ms on s.id = ms.system_id
  left join sdh_systems ss on s.id = ss.system_id
  left join vmux_systems vs on s.id = vs.system_id;
--===== telecom_network_db/5_views/1_nodes_complete.sql =====
-- Complete Node Information View (SECURITY INVOKER)
create view v_nodes_complete with (security_invoker = true) as
select n.*,
  r.name as ring_name,
  r.ring_type_id,
  lt_node.name as node_type_name,
  lt_node.code as node_type_code,
  lt_ring.name as ring_type_name,
  lt_ring.code as ring_type_code,
  ma.name as maintenance_area_name,
  ma.code as maintenance_area_code,
  lt_ma.name as maintenance_area_type_name
from nodes n
  left join rings r on n.ring_id = r.id
  left join lookup_types lt_node on n.node_type_id = lt_node.id
  left join lookup_types lt_ring on r.ring_type_id = lt_ring.id
  left join maintenance_areas ma on n.maintenance_terminal_id = ma.id
  left join lookup_types lt_ma on ma.area_type_id = lt_ma.id;
--===== telecom_network_db/5_views/4_ofc_connections_complete.sql =====
-- OFC Connections View (SECURITY INVOKER)
create view v_ofc_connections_complete with (security_invoker = true) as
select oc.id,
  oc.ofc_id,
  ofc.route_name as ofc_route_name,
  ofc.sn_id,
  ofc.en_id,
  ofc_type.name as ofc_type_name,
  na.name as sn_name,
  oc.fiber_no_sn,
  oc.otdr_distance_sn_km,
  oc.sn_dom,
  sa.system_name as system_sn_name,
  nb.name as en_name,
  oc.fiber_no_en,
  oc.otdr_distance_en_km,
  oc.en_dom,
  sb.system_name as system_en_name,
  oc.remark,
  oc.status,
  oc.created_at,
  oc.updated_at
from ofc_connections oc
  join ofc_cables ofc on oc.ofc_id = ofc.id
  join lookup_types ofc_type on ofc.ofc_type_id = ofc_type.id
  left join nodes na on ofc.sn_id = na.id
  left join nodes nb on ofc.en_id = nb.id
  left join systems sa on oc.system_sn_id = sa.id
  left join systems sb on oc.system_en_id = sb.id;
--===== telecom_network_db/5_views/5_system_connections_complete.sql =====
-- System Connections with Lookup Details View (SECURITY INVOKER)
create view v_system_connections_complete with (security_invoker = true) as
select sc.id,
  sc.system_id,
  s.system_name,
  lt_system.name as system_type_name,
  na.name as sn_name,
  nb.name as en_name,
  sc.sn_ip,
  sc.sn_interface,
  sc.en_ip,
  sc.en_interface,
  lt_media.name as media_type_name,
  sc.bandwidth_mbps,
  cs.system_name as connected_system_name,
  lt_cs_type.name as connected_system_type_name,
  sc.vlan,
  sc.commissioned_on,
  sc.remark,
  sc.status,
  sc.created_at,
  sc.updated_at,
  mcs.sfp_port as maan_sfp_port,
  lt_sfp.name as maan_sfp_type_name,
  mcs.sfp_capacity as maan_sfp_capacity,
  mcs.sfp_serial_no as maan_sfp_serial_no,
  mcs.fiber_in as maan_fiber_in,
  mcs.fiber_out as maan_fiber_out,
  mcs.customer_name as maan_customer_name,
  mcs.bandwidth_allocated_mbps as maan_bandwidth_allocated_mbps,
  scs.stm_no as sdh_stm_no,
  scs.carrier as sdh_carrier,
  scs.a_slot as sdh_a_slot,
  scs.a_customer as sdh_a_customer,
  scs.b_slot as sdh_b_slot,
  scs.b_customer as sdh_b_customer,
  vcs.subscriber as vmux_subscriber,
  vcs.c_code as vmux_c_code,
  vcs.channel as vmux_channel,
  vcs.tk as vmux_tk
from system_connections sc
  join systems s on sc.system_id = s.id
  join lookup_types lt_system on s.system_type_id = lt_system.id
  left join nodes na on sc.sn_id = na.id
  left join nodes nb on sc.en_id = nb.id
  left join systems cs on sc.connected_system_id = cs.id
  left join lookup_types lt_cs_type on cs.system_type_id = lt_cs_type.id
  left join lookup_types lt_media on sc.media_type_id = lt_media.id
  left join maan_connections mcs on sc.id = mcs.system_connection_id
  left join sdh_connections scs on sc.id = scs.system_connection_id
  left join vmux_connections vcs on sc.id = vcs.system_connection_id
  left join lookup_types lt_sfp on mcs.sfp_type_id = lt_sfp.id;
--===== telecom_network_db/13_rls_policies/5_sdh_node_associations_policies.sql =====
-- SDH node associations RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY['sdh_node_associations'] LOOP
    -- Drop viewer_read_access first (common)
    EXECUTE format(
      'DROP POLICY IF EXISTS viewer_read_access ON public.%I;',
      tbl
    );
    EXECUTE format(
      $f$ CREATE POLICY viewer_read_access ON public.%I
           FOR SELECT TO viewer
           USING ((SELECT auth.jwt())->>'role' = 'viewer'); $f$,
      tbl
    );
  END LOOP;

  -- SDH Node Associations: only admin
  FOREACH tbl IN ARRAY ARRAY['sdh_node_associations'] LOOP
    FOREACH role IN ARRAY ARRAY['admin'] LOOP
      
      -- SELECT
      EXECUTE format(
        'DROP POLICY IF EXISTS allow_%s_select ON public.%I;',
        role, tbl
      );
      EXECUTE format(
        $f$ CREATE POLICY allow_%s_select ON public.%I
             FOR SELECT TO %I
             USING ((SELECT auth.jwt())->>'role' = %L); $f$,
        role, tbl, role, role
      );

      -- INSERT
      EXECUTE format(
        'DROP POLICY IF EXISTS allow_%s_insert ON public.%I;',
        role, tbl
      );
      EXECUTE format(
        $f$ CREATE POLICY allow_%s_insert ON public.%I
             FOR INSERT TO %I
             WITH CHECK ((SELECT auth.jwt())->>'role' = %L); $f$,
        role, tbl, role, role
      );

      -- UPDATE
      EXECUTE format(
        'DROP POLICY IF EXISTS allow_%s_update ON public.%I;',
        role, tbl
      );
      EXECUTE format(
        $f$ CREATE POLICY allow_%s_update ON public.%I
             FOR UPDATE TO %I
             USING ((SELECT auth.jwt())->>'role' = %L)
             WITH CHECK ((SELECT auth.jwt())->>'role' = %L); $f$,
        role, tbl, role, role, role
      );

      -- DELETE
      EXECUTE format(
        'DROP POLICY IF EXISTS allow_%s_delete ON public.%I;',
        role, tbl
      );
      EXECUTE format(
        $f$ CREATE POLICY allow_%s_delete ON public.%I
             FOR DELETE TO %I
             USING ((SELECT auth.jwt())->>'role' = %L); $f$,
        role, tbl, role, role
      );

    END LOOP;
  END LOOP;
END;
$$;

--===== telecom_network_db/13_rls_policies/4_management_ports_policies.sql =====
-- Management ports RLS policies
DO $$ 
BEGIN 
  -- Drop old policies
  DROP POLICY IF EXISTS policy_select_mng ON public.management_ports;
  DROP POLICY IF EXISTS policy_insert_mng ON public.management_ports;
  DROP POLICY IF EXISTS policy_update_mng ON public.management_ports;
  DROP POLICY IF EXISTS allow_admin_select ON public.management_ports;
  DROP POLICY IF EXISTS allow_admin_insert ON public.management_ports;
  DROP POLICY IF EXISTS allow_admin_update ON public.management_ports;
  DROP POLICY IF EXISTS viewer_read_access ON public.management_ports;
  DROP POLICY IF EXISTS mng_admin_access ON public.management_ports;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.management_ports FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.management_ports FOR SELECT TO admin USING (true);
  CREATE POLICY mng_admin_access ON public.management_ports FOR SELECT TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.management_ports FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY mng_admin_insert ON public.management_ports FOR INSERT TO mng_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.management_ports FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY mng_admin_update ON public.management_ports FOR UPDATE TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin'
  );
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/10_vmux_connections.sql =====
-- VMUX connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['vmux_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- VMUX connections: admin + vmux_admin
  FOREACH tbl IN ARRAY ARRAY ['vmux_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'vmux_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/4_maan_systems.sql =====
-- MAAN systems RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_maan ON public.maan_systems;
  DROP POLICY IF EXISTS policy_insert_maan ON public.maan_systems;
  DROP POLICY IF EXISTS policy_update_maan ON public.maan_systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.maan_systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.maan_systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.maan_systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.maan_systems;
  DROP POLICY IF EXISTS maan_admin_access ON public.maan_systems;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.maan_systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.maan_systems FOR SELECT TO admin USING (true);
  CREATE POLICY maan_admin_access ON public.maan_systems FOR SELECT TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.maan_systems FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY maan_admin_insert ON public.maan_systems FOR INSERT TO maan_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.maan_systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY maan_admin_update ON public.maan_systems FOR UPDATE TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin'
  );
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/8_maan_connections.sql =====
-- MAAN connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['maan_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- Maan connections: admin + maan_admin
  FOREACH tbl IN ARRAY ARRAY ['maan_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'maan_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/9_sdh_connections.sql =====
-- SDH connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['sdh_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- SDH connections: admin + sdh_admin
  FOREACH tbl IN ARRAY ARRAY ['sdh_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'sdh_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/7_cpan_connections.sql =====
-- CPAN connections RLS policies
DO $$
DECLARE 
  tbl text;
  role text;
BEGIN 
  -- Tables with extended access
  FOREACH tbl IN ARRAY ARRAY ['cpan_connections'] 
  LOOP 
    -- Drop viewer_read_access first (common)
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);
  END LOOP;

  -- CPAN connections: admin + cpan_admin
  FOREACH tbl IN ARRAY ARRAY ['cpan_connections'] 
  LOOP 
    FOREACH role IN ARRAY ARRAY ['admin', 'cpan_admin'] 
    LOOP 
      -- SELECT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_select ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_select ON public.%I 
        FOR SELECT TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- INSERT
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_insert ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_insert ON public.%I 
        FOR INSERT TO %I 
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);

      -- UPDATE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_update ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_update ON public.%I 
        FOR UPDATE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s')
        WITH CHECK (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role, role);

      -- DELETE
      EXECUTE format('DROP POLICY IF EXISTS allow_%s_delete ON public.%s;', role, tbl);
      EXECUTE format($f$
        CREATE POLICY allow_%s_delete ON public.%I 
        FOR DELETE TO %I 
        USING (((SELECT auth.jwt())->>'role') = '%s');
      $f$, role, tbl, role, role);
    END LOOP;
  END LOOP;
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/6_vmux_systems.sql =====
-- VMUX systems RLS policies
DO $$ 
BEGIN 
  -- Drop old policies
  DROP POLICY IF EXISTS policy_select_vmux ON public.vmux_systems;
  DROP POLICY IF EXISTS policy_insert_vmux ON public.vmux_systems;
  DROP POLICY IF EXISTS policy_update_vmux ON public.vmux_systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.vmux_systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.vmux_systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.vmux_systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.vmux_systems;
  DROP POLICY IF EXISTS vmux_admin_access ON public.vmux_systems;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.vmux_systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.vmux_systems FOR SELECT TO admin USING (true);
  CREATE POLICY vmux_admin_access ON public.vmux_systems FOR SELECT TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.vmux_systems FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY vmux_admin_insert ON public.vmux_systems FOR INSERT TO vmux_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.vmux_systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY vmux_admin_update ON public.vmux_systems FOR UPDATE TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin'
  );
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/2_generic_connections.sql =====
-- Generic system_connections table RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_system_connections ON public.system_connections;
  DROP POLICY IF EXISTS policy_insert_system_connections ON public.system_connections;
  DROP POLICY IF EXISTS policy_update_system_connections ON public.system_connections;
  DROP POLICY IF EXISTS policy_delete_system_connections ON public.system_connections;
  DROP POLICY IF EXISTS viewer_read_access ON public.system_connections;
  DROP POLICY IF EXISTS allow_admin_select ON public.system_connections;
  DROP POLICY IF EXISTS allow_admin_insert ON public.system_connections;
  DROP POLICY IF EXISTS allow_admin_update ON public.system_connections;
  DROP POLICY IF EXISTS allow_admin_delete ON public.system_connections;
  DROP POLICY IF EXISTS maan_admin_access ON public.system_connections;
  DROP POLICY IF EXISTS sdh_admin_access ON public.system_connections;
  DROP POLICY IF EXISTS vmux_admin_access ON public.system_connections;
  DROP POLICY IF EXISTS mng_admin_access ON public.system_connections;

  -- SELECT POLICIES
  CREATE POLICY viewer_read_access ON public.system_connections FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.system_connections FOR SELECT TO admin USING (true);
  
  CREATE POLICY maan_admin_access ON public.system_connections FOR SELECT TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    )
  );
  
  CREATE POLICY sdh_admin_access ON public.system_connections FOR SELECT TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    )
  );
  
  CREATE POLICY vmux_admin_access ON public.system_connections FOR SELECT TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    )
  );
  
  CREATE POLICY mng_admin_access ON public.system_connections FOR SELECT TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  );

  -- INSERT POLICIES
  CREATE POLICY allow_admin_insert ON public.system_connections FOR INSERT TO admin WITH CHECK (true);
  
  CREATE POLICY maan_admin_insert ON public.system_connections FOR INSERT TO maan_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    )
  );
  
  CREATE POLICY sdh_admin_insert ON public.system_connections FOR INSERT TO sdh_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    )
  );
  
  CREATE POLICY vmux_admin_insert ON public.system_connections FOR INSERT TO vmux_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    )
  );
  
  CREATE POLICY mng_admin_insert ON public.system_connections FOR INSERT TO mng_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  );

  -- UPDATE POLICIES
  CREATE POLICY allow_admin_update ON public.system_connections FOR UPDATE TO admin USING (true) WITH CHECK (true);
  
  CREATE POLICY maan_admin_update ON public.system_connections FOR UPDATE TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    )
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
    )
  );
  
  CREATE POLICY sdh_admin_update ON public.system_connections FOR UPDATE TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    )
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
    )
  );
  
  CREATE POLICY vmux_admin_update ON public.system_connections FOR UPDATE TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    )
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
    )
  );
  
  CREATE POLICY mng_admin_update ON public.system_connections FOR UPDATE TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    EXISTS (
      SELECT 1 FROM systems s 
      WHERE s.id = system_connections.system_id AND
      s.system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
    )
  );

  -- DELETE POLICY (admin only)
  CREATE POLICY allow_admin_delete ON public.system_connections FOR DELETE TO admin USING (true);
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/5_sdh_systems.sql =====
-- SDH systems RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_sdh ON public.sdh_systems;
  DROP POLICY IF EXISTS policy_insert_sdh ON public.sdh_systems;
  DROP POLICY IF EXISTS policy_update_sdh ON public.sdh_systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.sdh_systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.sdh_systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.sdh_systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.sdh_systems;
  DROP POLICY IF EXISTS sdh_admin_access ON public.sdh_systems;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.sdh_systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.sdh_systems FOR SELECT TO admin USING (true);
  CREATE POLICY sdh_admin_access ON public.sdh_systems FOR SELECT TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.sdh_systems FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY sdh_admin_insert ON public.sdh_systems FOR INSERT TO sdh_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.sdh_systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY sdh_admin_update ON public.sdh_systems FOR UPDATE TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin'
  );
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/1_generic_systems.sql =====
-- Generic systems table RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_systems ON public.systems;
  DROP POLICY IF EXISTS policy_insert_systems ON public.systems;
  DROP POLICY IF EXISTS policy_update_systems ON public.systems;
  DROP POLICY IF EXISTS policy_delete_systems ON public.systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.systems;
  DROP POLICY IF EXISTS allow_admin_delete ON public.systems;
  DROP POLICY IF EXISTS maan_admin_access ON public.systems;
  DROP POLICY IF EXISTS sdh_admin_access ON public.systems;
  DROP POLICY IF EXISTS vmux_admin_access ON public.systems;
  DROP POLICY IF EXISTS mng_admin_access ON public.systems;

  -- SELECT POLICIES
  CREATE POLICY viewer_read_access ON public.systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.systems FOR SELECT TO admin USING (true);
  
  CREATE POLICY maan_admin_access ON public.systems FOR SELECT TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
  );
  
  CREATE POLICY sdh_admin_access ON public.systems FOR SELECT TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
  );
  
  CREATE POLICY vmux_admin_access ON public.systems FOR SELECT TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
  );
  
  CREATE POLICY mng_admin_access ON public.systems FOR SELECT TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
  );

  -- INSERT POLICIES
  CREATE POLICY allow_admin_insert ON public.systems FOR INSERT TO admin WITH CHECK (true);
  
  CREATE POLICY maan_admin_insert ON public.systems FOR INSERT TO maan_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
  );
  
  CREATE POLICY sdh_admin_insert ON public.systems FOR INSERT TO sdh_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
  );
  
  CREATE POLICY vmux_admin_insert ON public.systems FOR INSERT TO vmux_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
  );
  
  CREATE POLICY mng_admin_insert ON public.systems FOR INSERT TO mng_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
  );

  -- UPDATE POLICIES
  CREATE POLICY allow_admin_update ON public.systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  
  CREATE POLICY maan_admin_update ON public.systems FOR UPDATE TO maan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'maan_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MAAN')
  );
  
  CREATE POLICY sdh_admin_update ON public.systems FOR UPDATE TO sdh_admin USING (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'sdh_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'SDH')
  );
  
  CREATE POLICY vmux_admin_update ON public.systems FOR UPDATE TO vmux_admin USING (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'vmux_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'VMUX')
  );
  
  CREATE POLICY mng_admin_update ON public.systems FOR UPDATE TO mng_admin USING (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'mng_admin' AND
    system_type_id = (SELECT id FROM lookup_types WHERE category = 'SYSTEM' AND name = 'MNGPAN')
  );

  -- DELETE POLICY (admin only)
  CREATE POLICY allow_admin_delete ON public.systems FOR DELETE TO admin USING (true);
END;
$$;
--===== telecom_network_db/13_rls_policies/3_system_tables_policies/3_cpan_systems.sql =====
-- CPAN systems RLS policies
DO $$ 
BEGIN 
  -- Cleanup old policies
  DROP POLICY IF EXISTS policy_select_cpan ON public.cpan_systems;
  DROP POLICY IF EXISTS policy_insert_cpan ON public.cpan_systems;
  DROP POLICY IF EXISTS policy_update_cpan ON public.cpan_systems;
  DROP POLICY IF EXISTS allow_admin_select ON public.cpan_systems;
  DROP POLICY IF EXISTS allow_admin_insert ON public.cpan_systems;
  DROP POLICY IF EXISTS allow_admin_update ON public.cpan_systems;
  DROP POLICY IF EXISTS viewer_read_access ON public.cpan_systems;
  DROP POLICY IF EXISTS cpan_admin_access ON public.cpan_systems;

  -- SELECT policies
  CREATE POLICY viewer_read_access ON public.cpan_systems FOR SELECT TO viewer USING (true);
  CREATE POLICY allow_admin_select ON public.cpan_systems FOR SELECT TO admin USING (true);
  CREATE POLICY cpan_admin_access ON public.cpan_systems FOR SELECT TO cpan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'cpan_admin'
  );

  -- INSERT policies
  CREATE POLICY allow_admin_insert ON public.cpan_systems FOR INSERT TO admin WITH CHECK (true);
  CREATE POLICY cpan_admin_insert ON public.cpan_systems FOR INSERT TO cpan_admin WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'cpan_admin'
  );

  -- UPDATE policies
  CREATE POLICY allow_admin_update ON public.cpan_systems FOR UPDATE TO admin USING (true) WITH CHECK (true);
  CREATE POLICY cpan_admin_update ON public.cpan_systems FOR UPDATE TO cpan_admin USING (
    ((SELECT auth.jwt())->>'role') = 'cpan_admin'
  ) WITH CHECK (
    ((SELECT auth.jwt())->>'role') = 'cpan_admin'
  );
END;
$$;
--===== telecom_network_db/13_rls_policies/1_enable_rls.sql =====
-- Enable RLS on all tables
ALTER TABLE lookup_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofc_cables ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpan_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE maan_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdh_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE vmux_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofc_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpan_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE maan_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdh_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vmux_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdh_node_associations ENABLE ROW LEVEL SECURITY;
--===== telecom_network_db/13_rls_policies/2_core_tables_policies.sql =====
-- Core tables RLS policies (lookup_types, maintenance_areas, rings, etc.)
DO $$
DECLARE 
  tbl text;
BEGIN 
  FOREACH tbl IN ARRAY ARRAY[
    'lookup_types', 'maintenance_areas', 'rings', 
    'employee_designations', 'employees', 'nodes', 
    'ofc_cables', 'ofc_connections'
  ] 
  LOOP 
    -- Cleanup old policies
    EXECUTE format('DROP POLICY IF EXISTS policy_select_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_insert_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_update_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_delete_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS policy_write_%s ON public.%s;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS viewer_read_access ON public.%s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS allow_admin_select ON public.%s;', tbl);

    -- SELECT policies
    EXECUTE format($f$
      CREATE POLICY viewer_read_access ON public.%I 
      FOR SELECT TO viewer 
      USING (((SELECT auth.jwt())->>'role') = 'viewer');
    $f$, tbl);

    EXECUTE format($f$
      CREATE POLICY allow_admin_select ON public.%I 
      FOR SELECT TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- INSERT policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_insert ON public.%I 
      FOR INSERT TO admin 
      WITH CHECK (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- UPDATE policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_update ON public.%I 
      FOR UPDATE TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin')
      WITH CHECK (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);

    -- DELETE policy
    EXECUTE format($f$
      CREATE POLICY allow_admin_delete ON public.%I 
      FOR DELETE TO admin 
      USING (((SELECT auth.jwt())->>'role') = 'admin');
    $f$, tbl);
  END LOOP;
END;
$$;
--===== telecom_network_db/13_rls_policies/6_role_grants.sql =====
-- Grant full access to admin
GRANT ALL ON public.lookup_types TO admin;
GRANT ALL ON public.maintenance_areas TO admin;
GRANT ALL ON public.rings TO admin;
GRANT ALL ON public.employee_designations TO admin;
GRANT ALL ON public.employees TO admin;
GRANT ALL ON public.nodes TO admin;
GRANT ALL ON public.ofc_cables TO admin;
GRANT ALL ON public.systems TO admin;
GRANT ALL ON public.maan_systems TO admin;
GRANT ALL ON public.sdh_systems TO admin;
GRANT ALL ON public.vmux_systems TO admin;
GRANT ALL ON public.ofc_connections TO admin;
GRANT ALL ON public.system_connections TO admin;
GRANT ALL ON public.cpan_systems TO admin;
GRANT ALL ON public.cpan_connections TO admin;
GRANT ALL ON public.maan_connections TO admin;
GRANT ALL ON public.sdh_connections TO admin;
GRANT ALL ON public.vmux_connections TO admin;
GRANT ALL ON public.management_ports TO admin;
GRANT ALL ON public.sdh_node_associations TO admin;
-- Grant read-only (SELECT) access to viewer on all tables
GRANT SELECT ON public.lookup_types TO viewer;
GRANT SELECT ON public.maintenance_areas TO viewer;
GRANT SELECT ON public.rings TO viewer;
GRANT SELECT ON public.employee_designations TO viewer;
GRANT SELECT ON public.employees TO viewer;
GRANT SELECT ON public.nodes TO viewer;
GRANT SELECT ON public.ofc_cables TO viewer;
GRANT SELECT ON public.systems TO viewer;
GRANT SELECT ON public.maan_systems TO viewer;
GRANT SELECT ON public.sdh_systems TO viewer;
GRANT SELECT ON public.vmux_systems TO viewer;
GRANT SELECT ON public.ofc_connections TO viewer;
GRANT SELECT ON public.system_connections TO viewer;
GRANT SELECT ON public.cpan_systems TO viewer;
GRANT SELECT ON public.cpan_connections TO viewer;
GRANT SELECT ON public.maan_connections TO viewer;
GRANT SELECT ON public.sdh_connections TO viewer;
GRANT SELECT ON public.vmux_connections TO viewer;
GRANT SELECT ON public.management_ports TO viewer;
GRANT SELECT ON public.sdh_node_associations TO viewer;
--===== telecom_network_db/1_user_management/3_functions/3_trigger_functions/2_sync_user_role_to_auth.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/3_trigger_functions/3_create_public_profile_for_new_user.sql =====
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
                ), 'User'
            ), 
            COALESCE(
                NEW.raw_user_meta_data->>'last_name', 
                SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 2), 
                ''
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
--===== telecom_network_db/1_user_management/3_functions/3_trigger_functions/1_update_user_profile_timestamp.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/1_admin_functions/3_admin_update_user_profile.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/1_admin_functions/1_admin_get_all_users.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/1_admin_functions/5_admin_bulk_update_role.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/1_admin_functions/6_admin_bulk_delete_users.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/1_admin_functions/2_admin_get_user_by_id.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/1_admin_functions/4_admin_bulk_update_status.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/2_utility_functions/3_get_my_user_details.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/2_utility_functions/2_get_my_role.sql =====
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
--===== telecom_network_db/1_user_management/3_functions/2_utility_functions/1_is_super_admin.sql =====
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
--===== telecom_network_db/1_user_management/5_rls_policies/1_user_profiles_policies.sql =====
-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- Drop existing policies
DROP POLICY IF EXISTS "allow_own_profile_access_or_superadmin_access" ON public.user_profiles;
-- Simplified policies - most admin operations go through functions
CREATE POLICY "allow_own_profile_access_or_superadmin_access" ON public.user_profiles FOR ALL TO authenticated USING (
    (
        select auth.uid()
    ) = id
    OR public.is_super_admin()
) WITH CHECK (
    (
        select auth.uid()
    ) = id
    OR public.is_super_admin()
);
--===== telecom_network_db/1_user_management/2_views/1_v_user_profiles_extended.sql =====
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
--===== telecom_network_db/1_user_management/2_views/2_admin_get_all_users_extended.sql =====
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
    total_count bigint
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
        total_records
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
--===== telecom_network_db/1_user_management/6_grants/1_user_management_grants.sql =====
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

-- Table grants
GRANT ALL ON public.user_profiles TO admin;
GRANT SELECT ON public.user_profiles TO viewer;
--===== telecom_network_db/1_user_management/4_triggers/3_sync_user_role_trigger.sql =====
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
--===== telecom_network_db/1_user_management/4_triggers/4_sync_user_role_insert_trigger.sql =====
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
--===== telecom_network_db/1_user_management/4_triggers/2_update_user_profile_updated_at.sql =====
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
--===== telecom_network_db/1_user_management/4_triggers/1_on_auth_user_created.sql =====
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
--===== telecom_network_db/1_user_management/1_tables/1_user_profiles.sql =====
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
--===== telecom_network_db/3_core_infrastructure/7_management_ports.sql =====
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
--===== telecom_network_db/3_core_infrastructure/4_systems.sql =====
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
--===== telecom_network_db/3_core_infrastructure/2_nodes.sql =====
-- Unified Node List (Physical Locations/Sites)
create table nodes (
  id UUID primary key default gen_random_uuid(),
  name TEXT not null,
  node_type_id UUID references lookup_types (id),
  ip_address INET,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  vlan TEXT,
  site_id TEXT,
  builtup TEXT,
  maintenance_terminal_id UUID references maintenance_areas (id),
  ring_id UUID references rings (id),
  order_in_ring INTEGER,
  ring_status TEXT default 'ACTIVE',
  east_port TEXT,
  west_port TEXT,
  remark TEXT,
  status BOOLEAN default true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);
--===== telecom_network_db/3_core_infrastructure/5_ofc_connections.sql =====
-- OFC Connection Details (Fiber connections between nodes)
create table ofc_connections (
  id UUID primary key default gen_random_uuid(),
  ofc_id UUID references ofc_cables (id) not null,
  fiber_no_sn INTEGER NOT NULL, -- Physical fiber number in the cable
  fiber_no_en INTEGER,
  -- Technical measurements
  otdr_distance_sn_km DECIMAL(10, 3),
  sn_dom DATE,
  sn_power_dbm DECIMAL(10, 3),
  system_sn_id UUID references systems (id),
  -- Technical measurements
  otdr_distance_en_km DECIMAL(10, 3),
  en_dom DATE,
  en_power_dbm DECIMAL(10, 3),
  system_en_id UUID references systems (id),
  route_loss_db DECIMAL(10, 3),
  -- Logical path information
  logical_path_id UUID, -- Groups fibers that form a single logical connection
  path_segment_order INTEGER DEFAULT 1, -- Order in multi-segment paths
  -- Connection endpoints (can be nodes or systems)
  source_id UUID references nodes (id),
  source_port TEXT,
  destination_id UUID references nodes (id),
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
--===== telecom_network_db/3_core_infrastructure/1_rings.sql =====
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
--===== telecom_network_db/3_core_infrastructure/6_system_connections.sql =====
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
--===== telecom_network_db/3_core_infrastructure/3_ofc_cables.sql =====
-- Unified OFC (Optical Fiber Cable) Table
create table ofc_cables (
  id UUID primary key default gen_random_uuid(),
  route_name TEXT not null,
  sn_id UUID references nodes (id) not null,
  en_id UUID references nodes (id) not null,
  ofc_type_id UUID references lookup_types (id) not null,
  capacity INTEGER not null,
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
--===== telecom_network_db/11_fts_indexes/1_full_text_search_indexes.sql =====
-- Add GIN indexes for full-text search on remark fields
create index idx_employees_remark_fts on employees using gin(to_tsvector('english', remark));
create index idx_nodes_remark_fts on nodes using gin(to_tsvector('english', remark));
create index idx_ofc_cables_remark_fts on ofc_cables using gin(to_tsvector('english', remark));
create index idx_systems_remark_fts on systems using gin(to_tsvector('english', remark));
create index idx_ofc_connections_remark_fts on ofc_connections using gin(to_tsvector('english', remark));
create index idx_system_connections_remark_fts on system_connections using gin(to_tsvector('english', remark));
create index idx_management_ports_remark_fts on management_ports using gin(to_tsvector('english', remark));
--===== telecom_network_db/7_utility_functions/1_query_execution/1_execute_sql.sql =====
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
--===== telecom_network_db/7_utility_functions/1_query_execution/2_get_unique_values.sql =====
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
--===== telecom_network_db/7_utility_functions/3_aggregation/1_aggregate_query.sql =====
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
--===== telecom_network_db/7_utility_functions/4_pagination/5_paged_v_systems_connections.sql =====
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
--===== telecom_network_db/7_utility_functions/4_pagination/2_paged_ofc_cables_complete.sql =====
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
--===== telecom_network_db/7_utility_functions/4_pagination/4_paged_ofc_connections_complete.sql =====
-- Function: get_paged_ofc_connections_complete
DROP FUNCTION IF EXISTS public.get_paged_ofc_connections_complete;
CREATE OR REPLACE FUNCTION public.get_paged_ofc_connections_complete(
    p_limit integer,
    p_offset integer,
    p_order_by text DEFAULT 'ofc_route_name', -- Changed default to a valid column
    p_order_dir text DEFAULT 'asc',
    p_filters jsonb DEFAULT '{}'::jsonb
) 
RETURNS TABLE(
    -- Replaced with columns from v_ofc_connections_complete
    id text,
    ofc_id text,
    ofc_route_name text,
    ofc_type_name text,
    sn_id text,
    sn_name text,
    sn_dom text,
    fiber_no_sn integer,
    system_sn_name text,
    otdr_distance_sn_km numeric,
    en_id text,
    en_name text,
    en_dom text,
    fiber_no_en integer,
    system_en_name text,
    otdr_distance_en_km numeric,
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
      -- Replaced with columns from v_ofc_connections_complete
      v.id::text,
      v.ofc_id::text,
      v.ofc_route_name::text,
      v.ofc_type_name::text,
      v.sn_id::text,
      v.sn_name::text,
      v.sn_dom::text,
      v.fiber_no_sn,
      v.system_sn_name::text,
      v.otdr_distance_sn_km,
      v.en_id::text,
      v.en_name::text,
      v.en_dom::text,
      v.fiber_no_en,
      v.system_en_name::text,
      v.otdr_distance_en_km,
      v.status,
      v.remark::text,
      v.created_at::text,
      v.updated_at::text,
      count(*) OVER() AS total_count,
      sum(CASE WHEN v.status THEN 1 ELSE 0 END) OVER() AS active_count,
      sum(CASE WHEN NOT v.status THEN 1 ELSE 0 END) OVER() AS inactive_count
    FROM public.v_ofc_connections_complete v -- Corrected the view name
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
GRANT EXECUTE ON FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb) TO authenticated;
ALTER FUNCTION public.get_paged_ofc_connections_complete(integer, integer, text, text, jsonb)
SET search_path = public, auth, pg_temp;
--===== telecom_network_db/7_utility_functions/4_pagination/1_paged_v_systems_complete.sql =====
-- Function: get_paged_v_systems_complete
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
    maan_area text,
    maan_ring_no text,
    maintenance_area_name text,
    node_ip inet,
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
    total_count bigint
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
        where_clause := where_clause || format(
          ' AND %I::text ILIKE %L',
          filter_key,
          '%' || trim(filter_value::text, '"') || '%'
        );
      END IF;
    END LOOP;
  END IF;

  sql_query := format(
    $query$
    SELECT 
      v.commissioned_on::text,
      v.created_at::text,
      v.id::text,
      v.ip_address,
      v.latitude::numeric,
      v.longitude::numeric,
      v.maan_area,
      v.maan_ring_no,
      v.maintenance_area_name,
      v.node_ip,
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
      count(*) OVER() AS total_count
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
--===== telecom_network_db/7_utility_functions/4_pagination/3_paged_nodes_complete.sql =====
-- Function: get_paged_nodes_complete
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
    builtup text,
    created_at text,
    east_port text,
    ip_address inet,
    latitude numeric,
    longitude numeric,
    maintenance_area_code text,
    maintenance_area_name text,
    maintenance_area_type_name text,
    maintenance_terminal_id text,
    node_type_code text,
    node_type_id text,
    node_type_name text,
    order_in_ring numeric,
    remark text,
    ring_id text,
    ring_name text,
    ring_status text,
    ring_type_code text,
    ring_type_id text,
    ring_type_name text,
    site_id text,
    status boolean,
    updated_at text,
    vlan text,
    west_port text,
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
      v.builtup::text,
      v.created_at::text,
      v.east_port::text,
      v.ip_address,
      v.latitude::numeric,
      v.longitude::numeric,
      v.maintenance_area_code::text,
      v.maintenance_area_name::text,
      v.maintenance_area_type_name::text,
      v.maintenance_terminal_id::text,
      v.node_type_code::text,
      v.node_type_id::text,
      v.node_type_name::text,
      v.order_in_ring::numeric,
      v.remark::text,
      v.ring_id::text,
      v.ring_name::text,
      v.ring_status::text,
      v.ring_type_code::text,
      v.ring_type_id::text,
      v.ring_type_name::text,
      v.site_id::text,
      v.status,
      v.updated_at::text,
      v.vlan::text,
      v.west_port::text,
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
--===== telecom_network_db/7_utility_functions/2_data_operations/1_bulk_update.sql =====
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
