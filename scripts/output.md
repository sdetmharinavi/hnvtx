<!-- path: data/migrations/05_auditing/03_triggers_attach_all.sql -->
```sql
-- Path: migrations/05_auditing/03_triggers_attach_all.sql
-- Description: Dynamically attaches the log_data_changes trigger to all relevant tables.
-- This script is idempotent and can be re-run safely.

DO $$
DECLARE
    table_rec RECORD;
    trigger_name TEXT;
BEGIN
    -- Loop through all user tables in the 'public' schema
    FOR table_rec IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          -- Exclude the log table itself to prevent infinite loops
          AND t.table_name <> 'user_activity_logs'
          -- Only attach to tables that have an 'id' column, which is our standard for auditable records
          AND EXISTS (
              SELECT 1
              FROM information_schema.columns c
              WHERE c.table_schema = t.table_schema
                AND c.table_name = t.table_name
                AND c.column_name = 'id'
          )
    LOOP
        trigger_name := table_rec.table_name || '_log_trigger';

        -- Drop the trigger if it already exists to ensure it's up-to-date
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', trigger_name, table_rec.table_name);

        -- Create the new trigger
        EXECUTE format('CREATE TRIGGER %I ' ||
                       'AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
                       'FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();',
                       trigger_name,
                       table_rec.table_name);

        RAISE NOTICE 'Created/Refreshed audit trigger on table: public.%', table_rec.table_name;
    END LOOP;
END;
$$;
```

<!-- path: data/migrations/05_auditing/01_table_user_activity_logs.sql -->
```sql
-- Path: migrations/05_auditing/01_table_user_activity_logs.sql
-- Description: Defines the table for storing all user activity and data change logs.

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT,
    action_type TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance on the logs table
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON public.user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_table_name ON public.user_activity_logs(table_name);
```

<!-- path: data/migrations/05_auditing/02_functions.sql -->
```sql
-- Path: migrations/05_auditing/02_functions.sql
-- Description: Core functions for the auditing system.

-- Function 1: log_user_activity()
-- This is the generic logging function that inserts a record into the audit table.
-- It can be called directly for custom actions or by the trigger function for data changes.
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


-- Function 2: log_data_changes()
-- This is the TRIGGER function that will be attached to tables.
-- It captures INSERT, UPDATE, DELETE events and calls log_user_activity() with the correct data.
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
    -- This line is unreachable in an AFTER trigger but is good practice.
    RETURN NULL;
END;
$$;
```

<!-- path: data/migrations/05_auditing/04_rls_and_grants.sql -->
```sql
-- Path: migrations/05_auditing/04_rls_and_grants.sql
-- Description: Secures the user_activity_logs table, allowing access only to admins.

-- Enable Row Level Security on the log table
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions to the 'admin' role
GRANT ALL ON public.user_activity_logs TO admin;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Allow full access to admins" ON public.user_activity_logs;

-- Create a single policy granting full access (SELECT, INSERT, UPDATE, DELETE)
-- only to users who are super_admins or have the 'admin' role.
CREATE POLICY "Allow full access to admins"
ON public.user_activity_logs
FOR ALL
TO admin
USING (is_super_admin() OR get_my_role() = 'admin')
WITH CHECK (is_super_admin() OR get_my_role() = 'admin');
```

<!-- path: data/migrations/03_network_systems/02_views.sql -->
```sql
-- path: data/migrations/03_network_systems/02_views.sql
-- Description: Defines denormalized views for the Network Systems module. [PERFORMANCE OPTIMIZED]

-- View for a complete picture of a system and its specific details.
CREATE OR REPLACE VIEW public.v_systems_complete WITH (security_invoker = true) AS
SELECT
  s.*,
  n.name AS node_name,
  lt_node_type.name AS node_type_name,
  n.latitude,
  n.longitude,
  lt_system.name AS system_type_name,
  lt_system.code AS system_type_code,
  lt_system.category AS system_category,
  ma.name AS system_maintenance_terminal_name,
  rbs.ring_id,
  ring_area.name AS ring_logical_area_name,
  ss.gne AS sdh_gne,
  vs.vm_id AS vmux_vm_id
FROM public.systems s
  JOIN public.nodes n ON s.node_id = n.id
  JOIN public.lookup_types lt_system ON s.system_type_id = lt_system.id
  LEFT JOIN public.lookup_types lt_node_type ON n.node_type_id = lt_node_type.id
  LEFT JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id
  LEFT JOIN public.ring_based_systems rbs ON s.id = rbs.system_id
  LEFT JOIN public.maintenance_areas ring_area ON rbs.maintenance_area_id = ring_area.id
  LEFT JOIN public.sdh_systems ss ON s.id = ss.system_id
  LEFT JOIN public.vmux_systems vs ON s.id = vs.system_id;


-- View for a complete picture of a system connection and its specific details.
CREATE OR REPLACE VIEW public.v_system_connections_complete WITH (security_invoker = true) AS
SELECT
  sc.id, sc.system_id, s.system_name, lt_system.name AS system_type_name,
  s_sn.system_name AS sn_name, na.name AS sn_node_name, sc.sn_ip, sc.sn_interface,
  s_en.system_name AS en_name, nb.name AS en_node_name, sc.en_ip, sc.en_interface,
  lt_media.name AS media_type_name, sc.bandwidth_mbps, cs.system_name AS connected_system_name,
  lt_cs_type.name AS connected_system_type_name, sc.vlan, sc.commissioned_on,
  sc.remark, sc.status, sc.created_at, sc.updated_at,
  -- SFP-based details
  sfpc.sfp_port, lt_sfp.name as sfp_type_name, sfpc.sfp_capacity,
  sfpc.sfp_serial_no, sfpc.fiber_in, sfpc.fiber_out, sfpc.customer_name, sfpc.bandwidth_allocated_mbps,
  -- SDH details
  scs.stm_no AS sdh_stm_no, scs.carrier AS sdh_carrier, scs.a_slot AS sdh_a_slot,
  scs.a_customer AS sdh_a_customer, scs.b_slot AS sdh_b_slot, scs.b_customer AS sdh_b_customer,
  -- VMUX details
  vcs.subscriber AS vmux_subscriber, vcs.c_code AS vmux_c_code, vcs.channel AS vmux_channel, vcs.tk AS vmux_tk
FROM public.system_connections sc
  JOIN public.systems s ON sc.system_id = s.id
  JOIN public.lookup_types lt_system ON s.system_type_id = lt_system.id
  LEFT JOIN public.systems s_sn ON sc.sn_id = s_sn.id
  LEFT JOIN public.nodes na ON s_sn.node_id = na.id
  LEFT JOIN public.systems s_en ON sc.en_id = s_en.id
  LEFT JOIN public.nodes nb ON s_en.node_id = nb.id
  LEFT JOIN public.systems cs ON sc.connected_system_id = cs.id
  LEFT JOIN public.lookup_types lt_cs_type ON cs.system_type_id = lt_cs_type.id
  LEFT JOIN public.lookup_types lt_media ON sc.media_type_id = lt_media.id
  LEFT JOIN public.sfp_based_connections sfpc ON sc.id = sfpc.system_connection_id
  LEFT JOIN public.lookup_types lt_sfp ON sfpc.sfp_type_id = lt_sfp.id
  LEFT JOIN public.sdh_connections scs ON sc.id = scs.system_connection_id
  LEFT JOIN public.vmux_connections vcs ON sc.id = vcs.system_connection_id;


-- View for OFC Connections, now including system details from this module.
CREATE OR REPLACE VIEW public.v_ofc_connections_complete WITH (security_invoker = true) AS
SELECT
  oc.id::uuid,
  oc.ofc_id::uuid,
  oc.fiber_no_sn::integer,
  oc.fiber_no_en::integer,
  oc.updated_fiber_no_sn::integer,
  oc.updated_fiber_no_en::integer,
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
  ofc.route_name AS ofc_route_name,
  ma.name AS maintenance_area_name,
  ofc.sn_id::uuid,
  ofc.en_id::uuid,
  ofc_type.name AS ofc_type_name,
  na.name AS sn_name,
  s.system_name AS system_name,
  nb.name AS en_name
FROM public.ofc_connections oc
  JOIN public.ofc_cables ofc ON oc.ofc_id = ofc.id
  JOIN public.lookup_types ofc_type ON ofc.ofc_type_id = ofc_type.id
  LEFT JOIN public.nodes na ON ofc.sn_id = na.id
  LEFT JOIN public.nodes nb ON ofc.en_id = nb.id
  LEFT JOIN public.systems s ON oc.system_id = s.id
  LEFT JOIN public.maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id;


-- View for Ring Map Node Data
CREATE OR REPLACE VIEW public.v_ring_nodes WITH (security_invoker = true) AS
SELECT
    n.id,
    r.id as ring_id,
    r.name as ring_name,
    n.name,
    n.latitude as lat,
    n.longitude as long,
    ROW_NUMBER() OVER(PARTITION BY r.id ORDER BY n.name) as order_in_ring,
    lt.name as type,
    -- [THE FIX] Expose both the ring's status and the system's status for accurate representation.
    r.status AS ring_status,
    s.status AS system_status,
    s.ip_address::text as ip,
    n.remark
FROM
    public.rings r
JOIN
    public.ring_based_systems rbs ON r.id = rbs.ring_id
JOIN
    public.systems s ON rbs.system_id = s.id
JOIN
    public.nodes n ON s.node_id = n.id
LEFT JOIN
    public.lookup_types lt ON n.node_type_id = lt.id;

-- View for rings with joined data
CREATE OR REPLACE VIEW public.v_rings WITH (security_invoker = true) AS
SELECT
  r.id,
  r.name,
  r.description,
  r.ring_type_id,
  r.maintenance_terminal_id,
  r.status,
  r.created_at,
  r.updated_at,
  (SELECT COUNT(s.node_id) FROM public.ring_based_systems rbs JOIN public.systems s ON rbs.system_id = s.id WHERE rbs.ring_id = r.id) as total_nodes,
  lt_ring.name AS ring_type_name,
  lt_ring.code AS ring_type_code,
  ma.name AS maintenance_area_name
FROM public.rings r
LEFT JOIN public.lookup_types lt_ring ON r.ring_type_id = lt_ring.id
LEFT JOIN public.maintenance_areas ma ON r.maintenance_terminal_id = ma.id;
```

<!-- path: data/migrations/03_network_systems/03_indexes.sql -->
```sql
-- Path: migrations/03_network_systems/03_indexes.sql
-- Description: Creates B-tree and GIN (FTS) indexes for the Network Systems module.

-- =================================================================
-- Section 1: Standard B-Tree Indexes
-- =================================================================

-- Indexes for the generic systems table
CREATE INDEX IF NOT EXISTS idx_systems_node_id ON public.systems (node_id);

-- Indexes for the new consolidated tables
CREATE INDEX IF NOT EXISTS idx_ring_based_systems_ring_area ON public.ring_based_systems (ring_id, maintenance_area_id);
CREATE INDEX IF NOT EXISTS idx_sfp_based_connections_customer ON public.sfp_based_connections (customer_name);

-- Indexes for other system-specific tables
CREATE INDEX IF NOT EXISTS idx_systems_make ON public.systems (make);

-- =================================================================
-- Section 2: Full-Text Search (FTS) GIN Indexes
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_systems_remark_fts ON public.systems USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_system_connections_remark_fts ON public.system_connections USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_management_ports_remark_fts ON public.management_ports USING gin(to_tsvector('english', remark));
```

<!-- path: data/migrations/03_network_systems/01_tables_systems.sql -->
```sql
-- Path: migrations/03_network_systems/01_tables_systems.sql
-- Description: Defines tables for generic and specific network systems.

-- 1. Generic Systems Table (e.g., CPAN, MAAN, SDH, VMUX)
CREATE TABLE IF NOT EXISTS public.systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_type_id UUID REFERENCES public.lookup_types (id) NOT NULL,
  node_id UUID REFERENCES public.nodes (id) NOT NULL,
  system_name TEXT,
  ip_address INET,
  maintenance_terminal_id UUID REFERENCES public.maintenance_areas (id),
  commissioned_on DATE,
  s_no TEXT,
  make TEXT, -- ADDED: 'make' is a common property, moved to the main table.
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 2. Generic System Connections Table
CREATE TABLE IF NOT EXISTS public.system_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES public.systems (id) NOT NULL,
  sn_id UUID REFERENCES public.systems (id),
  en_id UUID REFERENCES public.systems (id),
  connected_system_id UUID REFERENCES public.systems (id),
  sn_ip INET,
  sn_interface TEXT,
  en_ip INET,
  en_interface TEXT,
  media_type_id UUID REFERENCES public.lookup_types (id),
  bandwidth_mbps INTEGER,
  vlan TEXT,
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Management Network Ports Table
CREATE TABLE IF NOT EXISTS public.management_ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  port_no TEXT NOT NULL,
  name TEXT,
  node_id UUID REFERENCES public.nodes (id),
  system_id UUID REFERENCES public.systems (id),
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Consolidated Table for Ring-Based System Details (replaces cpan_systems, maan_systems)
CREATE TABLE IF NOT EXISTS public.ring_based_systems (
  system_id UUID PRIMARY KEY REFERENCES public.systems (id) ON DELETE CASCADE,
  ring_id UUID REFERENCES public.rings (id),
  maintenance_area_id UUID REFERENCES public.maintenance_areas (id)
);

-- 5. Consolidated Table for SFP-Based Connection Details (replaces cpan_connections, maan_connections)
CREATE TABLE IF NOT EXISTS public.sfp_based_connections (
  system_connection_id UUID PRIMARY KEY REFERENCES public.system_connections (id) ON DELETE CASCADE,
  sfp_port TEXT,
  sfp_type_id UUID REFERENCES public.lookup_types (id),
  sfp_capacity TEXT,
  sfp_serial_no TEXT,
  fiber_in INTEGER,
  fiber_out INTEGER,
  customer_name TEXT,
  bandwidth_allocated_mbps INTEGER
);

-- 6. Dedicated Table for SDH System Specific Details
CREATE TABLE IF NOT EXISTS public.sdh_systems (
  system_id UUID PRIMARY KEY REFERENCES public.systems (id) ON DELETE CASCADE,
  gne TEXT
);

-- 7. Dedicated Table for SDH Connection Specific Details
CREATE TABLE IF NOT EXISTS public.sdh_connections (
  system_connection_id UUID PRIMARY KEY REFERENCES public.system_connections (id) ON DELETE CASCADE,
  stm_no TEXT,
  carrier TEXT,
  a_slot TEXT,
  a_customer TEXT,
  b_slot TEXT,
  b_customer TEXT
);

-- 8. SDH Node Associations Table
CREATE TABLE IF NOT EXISTS public.sdh_node_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sdh_system_id UUID REFERENCES public.sdh_systems (system_id) NOT NULL,
  node_id UUID REFERENCES public.nodes (id) NOT NULL,
  node_position CHAR(1) CHECK (node_position IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  node_ip INET,
  CONSTRAINT uq_sdh_system_position UNIQUE (sdh_system_id, node_position)
);

-- 9. Dedicated Table for VMUX System Specific Details
CREATE TABLE IF NOT EXISTS public.vmux_systems (
  system_id UUID PRIMARY KEY REFERENCES public.systems (id) ON DELETE CASCADE,
 vm_id TEXT
);

-- 10. Dedicated Table for VMUX Connection Specific Details
CREATE TABLE IF NOT EXISTS public.vmux_connections (
  system_connection_id UUID PRIMARY KEY REFERENCES public.system_connections (id) ON DELETE CASCADE,
  subscriber TEXT,
  c_code TEXT,
  channel TEXT,
  tk TEXT
);
```

<!-- path: data/migrations/03_network_systems/04_rls_and_grants.sql -->
```sql
-- path: data/migrations/03_network_systems/05_rls_and_grants.sql
-- Description: Defines all RLS policies and Grants for the Network Systems module. [UPDATED VIEW NAMES]

-- =================================================================
-- PART 1: GENERIC GRANTS AND RLS SETUP FOR ALL SYSTEM TABLES
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO admin;', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO viewer;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO cpan_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO maan_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO sdh_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO vmux_admin;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO mng_admin;', tbl);
  END LOOP;
END;
$$;


-- =================================================================
-- PART 2: COMPLEX POLICIES FOR GENERIC TABLES (systems, system_connections)
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
  -- Admin/Super-Admin can do anything
  CREATE POLICY "Allow admin full access" ON public.systems FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin') WITH CHECK (is_super_admin() OR get_my_role() = 'admin');

  -- **THE FIX: Decouple RLS from hardcoded names.**
  -- This policy now maps the user's role (e.g., 'cpan_admin') to the system type name ('CPAN')
  -- and then joins on the ID, making it resilient to name changes.
  CREATE POLICY "Allow full access based on system type" ON public.systems
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
  USING (
    systems.system_type_id IN (
      SELECT lt.id
      FROM public.lookup_types lt
      WHERE lt.category = 'SYSTEM' AND (
        (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
        (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
        (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
        (public.get_my_role() = 'vmux_admin' AND lt.name = 'VMUX') OR
        (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  )
  WITH CHECK (
    systems.system_type_id IN (
      SELECT lt.id
      FROM public.lookup_types lt
      WHERE lt.category = 'SYSTEM' AND (
        (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
        (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
        (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
        (public.get_my_role() = 'vmux_admin' AND lt.name = 'VMUX') OR
        (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
      )
    )
  );
END;
$$;


-- Policies for the 'system_connections' table
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow full access based on parent system type" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow viewer read-access" ON public.system_connections;
  DROP POLICY IF EXISTS "Allow admin full access" ON public.system_connections;

  CREATE POLICY "Allow viewer read-access" ON public.system_connections FOR SELECT TO viewer USING (true);
  CREATE POLICY "Allow admin full access" ON public.system_connections FOR ALL TO admin USING (is_super_admin() OR get_my_role() = 'admin') WITH CHECK (is_super_admin() OR get_my_role() = 'admin');

  -- **THE FIX: Apply the same robust pattern here.**
  CREATE POLICY "Allow full access based on parent system type" ON public.system_connections
  FOR ALL TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
  USING (
    EXISTS (
      SELECT 1 FROM public.systems s
      WHERE s.id = system_connections.system_id
      AND s.system_type_id IN (
        SELECT lt.id
        FROM public.lookup_types lt
        WHERE lt.category = 'SYSTEM' AND (
          (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
          (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
          (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
          (public.get_my_role() = 'vmux_admin' AND lt.name = 'VMUX') OR
          (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.systems s
      WHERE s.id = system_connections.system_id
      AND s.system_type_id IN (
        SELECT lt.id
        FROM public.lookup_types lt
        WHERE lt.category = 'SYSTEM' AND (
          (public.get_my_role() = 'cpan_admin' AND lt.name = 'CPAN') OR
          (public.get_my_role() = 'maan_admin' AND lt.name = 'MAAN') OR
          (public.get_my_role() = 'sdh_admin' AND lt.name = 'SDH') OR
          (public.get_my_role() = 'vmux_admin' AND lt.name = 'VMUX') OR
          (public.get_my_role() = 'mng_admin' AND lt.name = 'MNGPAN')
        )
      )
    )
  );
END;
$$;


-- =================================================================
-- PART 3: AUTOMATED POLICIES FOR SYSTEM-SPECIFIC SUB-TABLES
-- =================================================================
DO $$
DECLARE
    -- Maps tables to their specific admin roles
    mappings TEXT[][] := ARRAY[
        ['ring_based_systems', 'cpan_admin'], ['ring_based_systems', 'maan_admin'],
        ['sfp_based_connections', 'cpan_admin'], ['sfp_based_connections', 'maan_admin'],
        ['sdh_systems', 'sdh_admin'], ['sdh_connections', 'sdh_admin'],
        ['sdh_node_associations', 'sdh_admin'], ['vmux_systems', 'vmux_admin'],
        ['vmux_connections', 'vmux_admin']
    ];
    tbl TEXT;
    specific_role TEXT;
    i INT;
BEGIN
    FOR i IN 1..array_length(mappings, 1) LOOP
        tbl := mappings[i][1];
        specific_role := mappings[i][2];

        -- Clean up old policies for idempotency
        EXECUTE format('DROP POLICY IF EXISTS "Allow viewer read-access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow admin full access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow %s full access" ON public.%I;', specific_role, tbl);

        -- Viewer can read
        EXECUTE format('CREATE POLICY "Allow viewer read-access" ON public.%I FOR SELECT TO viewer USING (true);', tbl);
        -- Admin/Super-Admin can do everything
        EXECUTE format('CREATE POLICY "Allow admin full access" ON public.%I FOR ALL TO admin USING (is_super_admin() OR get_my_role() = ''admin'') WITH CHECK (is_super_admin() OR get_my_role() = ''admin'');', tbl);
        -- The specific system admin can do everything
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

-- =================================================================
-- Section 4: View-Level Grants [UPDATED VIEW NAMES]
-- =================================================================
DO $$
BEGIN
  GRANT SELECT ON public.v_systems_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_system_connections_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_ring_nodes TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_rings TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_ofc_connections_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;

  RAISE NOTICE 'Applied SELECT grants on network system views.';
END;
$$;
```

<!-- path: data/migrations/03_network_systems/05_functions.sql -->
```sql
-- Path: data/migrations/03_network_systems/06_functions.sql
-- Description: Contains functions for the Network Systems module.

-- The function logic is now restructured to handle all system subtypes correctly.
CREATE OR REPLACE FUNCTION public.upsert_system_with_details(
    p_system_name TEXT,
    p_system_type_id UUID,
    p_node_id UUID,
    p_status BOOLEAN,
    p_ip_address INET DEFAULT NULL,
    p_maintenance_terminal_id UUID DEFAULT NULL,
    p_commissioned_on DATE DEFAULT NULL,
    p_s_no TEXT DEFAULT NULL,
    p_remark TEXT DEFAULT NULL,
    p_id UUID DEFAULT NULL,
    p_ring_id UUID DEFAULT NULL,
    p_gne TEXT DEFAULT NULL,
    p_make TEXT DEFAULT NULL,
    p_vm_id TEXT DEFAULT NULL
)
RETURNS SETOF public.systems
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_system_id UUID;
    v_system_type_name TEXT;
BEGIN
    -- Get the name of the system type to determine which subtype table to use
    SELECT name INTO v_system_type_name FROM public.lookup_types WHERE id = p_system_type_id;

    -- Step 1: Upsert the main system record (CORRECTED: Added 'make' column)
    INSERT INTO public.systems (
        id, system_name, system_type_id, node_id, ip_address,
        maintenance_terminal_id, commissioned_on, s_no, remark, status, make
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_system_name, p_system_type_id, p_node_id, p_ip_address,
        p_maintenance_terminal_id, p_commissioned_on, p_s_no, p_remark, p_status, p_make
    )
    ON CONFLICT (id) DO UPDATE SET
        system_name = EXCLUDED.system_name,
        system_type_id = EXCLUDED.system_type_id,
        node_id = EXCLUDED.node_id,
        ip_address = EXCLUDED.ip_address,
        maintenance_terminal_id = EXCLUDED.maintenance_terminal_id,
        commissioned_on = EXCLUDED.commissioned_on,
        s_no = EXCLUDED.s_no,
        remark = EXCLUDED.remark,
        status = EXCLUDED.status,
        make = EXCLUDED.make, -- CORRECTED: Added 'make' to the update set
        updated_at = NOW()
    RETURNING id INTO v_system_id;

    -- Step 2: Handle subtype tables based on the system type name.
    -- This logic is now separate and allows for multiple conditions to be met.

    -- Handle Ring-Based Systems (CPAN, MAAN, and SDH variants)
    IF v_system_type_name IN (
      'Next Gen Optical Transport Network', 'Converged Packet Aggregation Node', 'Multi-Access Aggregation Node', 
      'Multiprotocol Label Switching', 'Next Generation SDH', 'Optical Transport Network', 
      'Packet Transport Network', 'Plesiochronous Digital Hierarchy', 'Synchronous Digital Hierarchy'
    ) THEN
        INSERT INTO public.ring_based_systems (system_id, ring_id)
        VALUES (v_system_id, p_ring_id)
        ON CONFLICT (system_id) DO UPDATE SET ring_id = EXCLUDED.ring_id;
    END IF;

    -- Handle SDH-Specific Systems (CORRECTED: Removed 'make' from this part)
    IF v_system_type_name IN ('Synchronous Digital Hierarchy', 'Next Generation SDH') THEN
        INSERT INTO public.sdh_systems (system_id, gne)
        VALUES (v_system_id, p_gne)
        ON CONFLICT (system_id) DO UPDATE SET gne = EXCLUDED.gne;
    END IF;
    
    -- Handle VMUX-Specific Systems
    IF v_system_type_name = 'VMUX' THEN
        INSERT INTO public.vmux_systems (system_id, vm_id)
        VALUES (v_system_id, p_vm_id)
        ON CONFLICT (system_id) DO UPDATE SET vm_id = EXCLUDED.vm_id;
    END IF;

    -- Return the main system record
    RETURN QUERY SELECT * FROM public.systems WHERE id = v_system_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_system_with_details(TEXT, UUID, UUID, BOOLEAN, INET, UUID, DATE, TEXT, TEXT, UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- NEW FUNCTION: To manage system associations for a ring
CREATE OR REPLACE FUNCTION public.update_ring_system_associations(
    p_ring_id UUID,
    p_system_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Use definer to ensure permissions are handled correctly within the function
AS $$
BEGIN
    -- First, delete all existing associations for this ring that are NOT in the provided list.
    DELETE FROM public.ring_based_systems rbs
    WHERE rbs.ring_id = p_ring_id
      AND NOT (rbs.system_id = ANY(p_system_ids));

    -- Second, insert all the new associations.
    -- The ON CONFLICT clause gracefully handles any systems that are already associated,
    -- preventing errors and ensuring the state is consistent.
    INSERT INTO public.ring_based_systems (ring_id, system_id)
    SELECT p_ring_id, unnest(p_system_ids)
    ON CONFLICT (system_id) DO UPDATE
    SET ring_id = EXCLUDED.ring_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_ring_system_associations(UUID, UUID[]) TO authenticated;
```

<!-- path: data/migrations/06_utilities/01_generic_functions.sql -->
```sql
-- path: data/migrations/06_utilities/01_generic_functions.sql
-- Description: A collection of generic, reusable utility functions. [CORRECTED DEPENDENCIES]

-- =================================================================
-- Section 1: Helper Functions (Dependencies)
-- =================================================================

-- Helper function to check if a column exists in a given table/view
CREATE OR REPLACE FUNCTION public.column_exists(p_schema_name TEXT, p_table_name TEXT, p_column_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = p_schema_name
          AND table_name = p_table_name
          AND column_name = p_column_name
    );
END;
$$;

-- **THE FIX: Moved build_where_clause here from 02_paged_functions.sql to resolve dependency issue.**
-- Helper function to build the WHERE clause dynamically
CREATE OR REPLACE FUNCTION public.build_where_clause(p_filters JSONB, p_view_name TEXT, p_alias TEXT DEFAULT 'v')
RETURNS TEXT LANGUAGE plpgsql STABLE AS $$
DECLARE
  where_clause TEXT := '';
  filter_key TEXT;
  filter_value JSONB;
  or_conditions TEXT[];
  or_key TEXT;
  or_value TEXT;
  alias_prefix TEXT;
BEGIN
    alias_prefix := CASE WHEN p_alias IS NOT NULL AND p_alias != '' THEN format('%I.', p_alias) ELSE '' END;

    IF p_filters IS NULL OR jsonb_typeof(p_filters) != 'object' THEN
        RETURN '';
    END IF;

    FOR filter_key, filter_value IN SELECT key, value FROM jsonb_each(p_filters) LOOP
        IF filter_value IS NULL OR filter_value = '""'::jsonb THEN CONTINUE; END IF;

        IF filter_key = 'or' AND jsonb_typeof(filter_value) = 'object' THEN
            or_conditions := ARRAY[]::TEXT[];
            FOR or_key, or_value IN SELECT key, value FROM jsonb_each_text(filter_value) LOOP
                IF public.column_exists('public', p_view_name, or_key) THEN
                    or_conditions := array_append(or_conditions, format('%s%I::text ILIKE %L', alias_prefix, or_key, '%' || or_value || '%'));
                END IF;
            END LOOP;

            IF array_length(or_conditions, 1) > 0 THEN
                where_clause := where_clause || ' AND (' || array_to_string(or_conditions, ' OR ') || ')';
            END IF;
        ELSE
            IF public.column_exists('public', p_view_name, filter_key) THEN
                IF jsonb_typeof(filter_value) = 'object' AND filter_value ? 'operator' THEN
                    -- Handle complex filters like { "operator": "in", "value": [...] }
                ELSIF jsonb_typeof(filter_value) = 'array' THEN
                    where_clause := where_clause || format(' AND %s%I IN (SELECT value::text FROM jsonb_array_elements_text(%L))', alias_prefix, filter_key, filter_value);
                ELSE
                    where_clause := where_clause || format(' AND %s%I::text = %L', alias_prefix, filter_key, filter_value->>0);
                END IF;
            END IF;
        END IF;
    END LOOP;

    RETURN where_clause;
END;
$$;

-- =================================================================
-- Section 2: Generic Query & Data Operation Functions
-- =================================================================

-- Function: execute_sql
-- Executes a read-only SQL query and returns the result as JSON.
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
  cleaned_query := lower(regexp_replace(sql_query, '^\s+', ''));
  
  IF cleaned_query !~ '^(select|with|call)\s' THEN
    RAISE EXCEPTION 'Only read-only statements (SELECT, WITH, CALL) are allowed.';
  END IF;

  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result_json;
  RETURN json_build_object('result', COALESCE(result_json, '[]'::json));
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.execute_sql(TEXT) TO authenticated;


-- Function: aggregate_query
-- Performs dynamic aggregations (COUNT, SUM, AVG, etc.) on a table.
CREATE OR REPLACE FUNCTION public.aggregate_query(
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
  IF (aggregation_options->>'count')::boolean THEN agg_parts := array_append(agg_parts, 'COUNT(*) as count');
  ELSIF aggregation_options->'count' IS NOT NULL THEN agg_parts := array_append(agg_parts, format('COUNT(%I) as count', aggregation_options->>'count')); END IF;
  IF aggregation_options->'sum' IS NOT NULL THEN SELECT array_cat(agg_parts, array_agg(format('SUM(%I) as sum_%s', value, value))) INTO agg_parts FROM jsonb_array_elements_text(aggregation_options->'sum') AS value; END IF;
  IF aggregation_options->'avg' IS NOT NULL THEN SELECT array_cat(agg_parts, array_agg(format('AVG(%I) as avg_%s', value, value))) INTO agg_parts FROM jsonb_array_elements_text(aggregation_options->'avg') AS value; END IF;
  IF aggregation_options->'min' IS NOT NULL THEN SELECT array_cat(agg_parts, array_agg(format('MIN(%I) as min_%s', value, value))) INTO agg_parts FROM jsonb_array_elements_text(aggregation_options->'min') AS value; END IF;
  IF aggregation_options->'max' IS NOT NULL THEN SELECT array_cat(agg_parts, array_agg(format('MAX(%I) as max_%s', value, value))) INTO agg_parts FROM jsonb_array_elements_text(aggregation_options->'max') AS value; END IF;

  IF aggregation_options->'groupBy' IS NOT NULL THEN
    SELECT string_agg(format('%I', value), ', ') INTO group_clause FROM jsonb_array_elements_text(aggregation_options->'groupBy') AS value;
    SELECT string_agg(format('%I', value), ', ') INTO select_clause FROM jsonb_array_elements_text(aggregation_options->'groupBy') AS value;
    group_clause := 'GROUP BY ' || group_clause;
  END IF;

  IF select_clause != '' AND array_length(agg_parts, 1) > 0 THEN select_clause := select_clause || ', ' || array_to_string(agg_parts, ', ');
  ELSIF array_length(agg_parts, 1) > 0 THEN select_clause := array_to_string(agg_parts, ', ');
  ELSE select_clause := '*'; END IF;

  where_clause := public.build_where_clause(filters, '');
  
  IF where_clause != '' THEN
    where_clause := 'WHERE ' || substr(where_clause, 6);
  END IF;

  IF jsonb_typeof(order_by) = 'array' AND jsonb_array_length(order_by) > 0 THEN
    SELECT string_agg(format('%I %s', item->>'column', CASE WHEN (item->>'ascending')::boolean THEN 'ASC' ELSE 'DESC' END), ', ') INTO order_clause FROM jsonb_array_elements(order_by) AS item;
    IF order_clause IS NOT NULL THEN order_clause := 'ORDER BY ' || order_clause; END IF;
  END IF;

  query_text := format('SELECT %s FROM %I %s %s %s', select_clause, table_name, where_clause, group_clause, order_clause);
  RETURN QUERY EXECUTE format('SELECT row_to_json(t)::jsonb FROM (%s) t', query_text);
END;
$$;
GRANT EXECUTE ON FUNCTION public.aggregate_query(TEXT, JSONB, JSONB, JSONB) TO authenticated;

-- ... (rest of the functions from the original file) ...

-- Function: get_unique_values
CREATE OR REPLACE FUNCTION public.get_unique_values(p_table_name TEXT, p_column_name TEXT, p_filters JSONB DEFAULT '{}'::jsonb, p_order_by JSONB DEFAULT '[]'::jsonb, p_limit_count INTEGER DEFAULT NULL)
RETURNS TABLE(value JSONB) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  query_text TEXT; where_clause TEXT := ''; order_clause TEXT := ''; limit_clause TEXT := '';
BEGIN
    IF jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        SELECT string_agg(format('%I = %L', key, p_filters->>key), ' AND ') INTO where_clause FROM jsonb_object_keys(p_filters) key;
        IF where_clause IS NOT NULL THEN where_clause := 'WHERE ' || where_clause; END IF;
    END IF;
    IF jsonb_typeof(p_order_by) = 'array' AND jsonb_array_length(p_order_by) > 0 THEN
        SELECT string_agg(format('%I %s', item->>'column', CASE WHEN (item->>'ascending')::boolean THEN 'ASC' ELSE 'DESC' END), ', ') INTO order_clause FROM jsonb_array_elements(p_order_by) AS item;
        IF order_clause IS NOT NULL THEN order_clause := 'ORDER BY ' || order_clause; END IF;
    END IF;
    IF p_limit_count IS NOT NULL THEN limit_clause := format('LIMIT %s', p_limit_count); END IF;
    query_text := format('SELECT DISTINCT %I as value FROM %I %s %s %s', p_column_name, p_table_name, where_clause, order_clause, limit_clause);
    RETURN QUERY EXECUTE format('SELECT to_jsonb(t.value) FROM (%s) t', query_text);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_unique_values(TEXT, TEXT, JSONB, JSONB, INTEGER) TO authenticated;

-- Function: bulk_update
CREATE OR REPLACE FUNCTION public.bulk_update(p_table_name TEXT, p_updates JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  update_item JSONB; set_clause TEXT; query_text TEXT; updated_count INTEGER := 0; current_updated_count INTEGER;
BEGIN
  FOR update_item IN SELECT * FROM jsonb_array_elements(p_updates) LOOP
    SELECT string_agg(format('%I = %L', key, value), ', ') INTO set_clause FROM jsonb_each_text(update_item->'data');
    IF set_clause IS NOT NULL THEN
      query_text := format('UPDATE public.%I SET %s, updated_at = NOW() WHERE id = %L', p_table_name, set_clause, update_item->>'id');
      EXECUTE query_text;
      GET DIAGNOSTICS current_updated_count = ROW_COUNT;
      updated_count := updated_count + current_updated_count;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('updated_count', updated_count);
END;
$$;
GRANT EXECUTE ON FUNCTION public.bulk_update(TEXT, JSONB) TO authenticated;

-- Lookup and Enumeration Functions
CREATE OR REPLACE FUNCTION public.get_lookup_type_id(p_category TEXT, p_name TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type_id UUID;
BEGIN
  SELECT id INTO v_type_id FROM public.lookup_types WHERE category = p_category AND name = p_name AND status = true;
  IF v_type_id IS NULL THEN RAISE EXCEPTION 'Lookup type not found for category=% and name=%', p_category, p_name; END IF;
  RETURN v_type_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_lookup_type_id(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_lookup_type(p_category TEXT, p_name TEXT, p_code TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL, p_sort_order INTEGER DEFAULT 0)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type_id UUID;
BEGIN
  INSERT INTO public.lookup_types (category, name, code, description, sort_order) VALUES (p_category, p_name, p_code, p_description, p_sort_order) RETURNING id INTO v_type_id;
  RETURN v_type_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_lookup_type(TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_lookup_types_by_category(p_category TEXT)
RETURNS TABLE (id UUID, name TEXT, code TEXT, description TEXT, sort_order INTEGER) LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT lt.id, lt.name, lt.code, lt.description, lt.sort_order FROM public.lookup_types lt WHERE lt.category = p_category AND lt.status = true ORDER BY lt.sort_order, lt.name;
$$;
GRANT EXECUTE ON FUNCTION public.get_lookup_types_by_category(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_entity_counts(p_entity_name TEXT, p_filters JSONB DEFAULT '{}')
RETURNS TABLE (total_count BIGINT, active_count BIGINT, inactive_count BIGINT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    sql_query TEXT; sql_where TEXT := 'WHERE 1=1'; filter_key TEXT; filter_value JSONB;
BEGIN
    IF p_filters IS NOT NULL AND jsonb_typeof(p_filters) = 'object' AND p_filters != '{}'::jsonb THEN
        FOR filter_key, filter_value IN SELECT * FROM jsonb_each(p_filters) LOOP
            sql_where := sql_where || format(' AND %I = %L', filter_key, trim(both '"' from filter_value::text));
        END LOOP;
    END IF;
    sql_query := format('SELECT count(*), count(*) FILTER (WHERE status = true), count(*) FILTER (WHERE status = false) FROM %I %s', p_entity_name, sql_where);
    RETURN QUERY EXECUTE sql_query;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_entity_counts(TEXT, JSONB) TO authenticated;
```

<!-- path: data/migrations/06_utilities/06_bsnl_dashboard_data.sql -->
```sql
-- path: data/migrations/06_utilities/08_bsnl_dashboard_data.sql
-- Description: Creates a centralized RPC function to fetch filtered data for the BSNL dashboard.

CREATE OR REPLACE FUNCTION public.get_bsnl_dashboard_data(
    p_query TEXT DEFAULT NULL,
    p_status BOOLEAN DEFAULT NULL,
    p_system_types TEXT[] DEFAULT NULL,
    p_cable_types TEXT[] DEFAULT NULL,
    p_regions TEXT[] DEFAULT NULL,
    p_node_types TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_nodes JSONB;
    v_ofc_cables JSONB;
    v_systems JSONB;
    search_query TEXT := '%' || p_query || '%';
BEGIN
    -- 1. Fetch Nodes
    SELECT COALESCE(jsonb_agg(n), '[]'::jsonb)
    INTO v_nodes
    FROM public.v_nodes_complete n
    WHERE
        (p_query IS NULL OR (
            n.name ILIKE search_query OR
            n.remark ILIKE search_query OR
            n.maintenance_area_name ILIKE search_query
        )) AND
        (p_status IS NULL OR n.status = p_status) AND
        (p_regions IS NULL OR n.maintenance_area_name = ANY(p_regions)) AND
        (p_node_types IS NULL OR n.node_type_name = ANY(p_node_types));

    -- 2. Fetch OFC Cables
    SELECT COALESCE(jsonb_agg(c), '[]'::jsonb)
    INTO v_ofc_cables
    FROM public.v_ofc_cables_complete c
    WHERE
        (p_query IS NULL OR (
            c.route_name ILIKE search_query OR
            c.asset_no ILIKE search_query OR
            c.sn_name ILIKE search_query OR
            c.en_name ILIKE search_query
        )) AND
        (p_status IS NULL OR c.status = p_status) AND
        (p_regions IS NULL OR c.maintenance_area_name = ANY(p_regions)) AND
        (p_cable_types IS NULL OR c.ofc_type_name = ANY(p_cable_types));

    -- 3. Fetch Systems
    SELECT COALESCE(jsonb_agg(s), '[]'::jsonb)
    INTO v_systems
    FROM public.v_systems_complete s
    WHERE
        (p_query IS NULL OR (
            s.system_name ILIKE search_query OR
            s.node_name ILIKE search_query OR
            s.ip_address::TEXT ILIKE search_query
        )) AND
        (p_status IS NULL OR s.status = p_status) AND
        (p_regions IS NULL OR s.system_maintenance_terminal_name = ANY(p_regions)) AND
        (p_system_types IS NULL OR s.system_type_name = ANY(p_system_types));

    -- 4. Construct and return the final JSON object
    RETURN jsonb_build_object(
        'nodes', v_nodes,
        'ofcCables', v_ofc_cables,
        'systems', v_systems
    );
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_bsnl_dashboard_data(TEXT, BOOLEAN, TEXT[], TEXT[], TEXT[], TEXT[]) TO authenticated;
```

<!-- path: data/migrations/06_utilities/07_attach_updated_at_triggers.sql -->
```sql
-- path: data/migrations/06_utilities/07_attach_updated_at_triggers.sql
-- Description: Dynamically attaches the 'update_updated_at_column' trigger to all tables that have an 'updated_at' column.

DO $$
DECLARE
    table_rec RECORD;
    trigger_name TEXT;
BEGIN
    -- Loop through all tables in the 'public' schema
    FOR table_rec IN
        SELECT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          -- **Key Condition: Only act on tables that actually have an 'updated_at' column.**
          AND EXISTS (
              SELECT 1
              FROM information_schema.columns c
              WHERE c.table_schema = t.table_schema
                AND c.table_name = t.table_name
                AND c.column_name = 'updated_at'
          )
    LOOP
        -- Create a standardized trigger name
        trigger_name := 'trigger_' || table_rec.table_name || '_updated_at';

        -- Drop the trigger if it already exists to ensure it's up-to-date
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I;', trigger_name, table_rec.table_name);

        -- Create the new trigger
        EXECUTE format('CREATE TRIGGER %I ' ||
                       'BEFORE UPDATE ON public.%I ' ||
                       'FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
                       trigger_name,
                       table_rec.table_name);

        RAISE NOTICE 'Attached/Refreshed updated_at trigger on table: public.%', table_rec.table_name;
    END LOOP;
END;
$$;
```

<!-- path: data/migrations/06_utilities/03_no_pagination_specialized_function.sql -->
```sql
-- =================================================================
-- Section 3: Specialized Utility Functions (No Pagination)
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_system_path_details(p_path_id UUID)
RETURNS SETOF public.v_system_ring_paths_detailed LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.logical_fiber_paths lfp WHERE lfp.id = p_path_id AND EXISTS (SELECT 1 FROM public.systems s WHERE s.id = lfp.source_system_id)) THEN
        RETURN;
    END IF;
    RETURN QUERY SELECT * FROM public.v_system_ring_paths_detailed WHERE logical_path_id = p_path_id ORDER BY path_order ASC;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_system_path_details(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_continuous_available_fibers(p_path_id UUID)
RETURNS TABLE(fiber_no INT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE path_cable_count INT;
BEGIN
    SELECT COUNT(DISTINCT seg.ofc_cable_id) INTO path_cable_count FROM public.logical_path_segments seg WHERE seg.logical_path_id = p_path_id AND seg.ofc_cable_id IS NOT NULL;
    IF COALESCE(path_cable_count, 0) = 0 THEN RETURN; END IF;
    RETURN QUERY SELECT conn.fiber_no_sn::INT FROM public.ofc_connections conn JOIN public.logical_path_segments seg ON conn.ofc_id = seg.ofc_cable_id
    WHERE seg.logical_path_id = p_path_id AND conn.logical_path_id IS NULL AND conn.status = TRUE
    GROUP BY conn.fiber_no_sn HAVING COUNT(conn.ofc_id) = path_cable_count;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_continuous_available_fibers(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_cable_between_nodes(
    p_node1_id UUID,
    p_node2_id UUID
)
RETURNS TABLE (id UUID, route_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT oc.id, oc.route_name
  FROM public.ofc_cables oc
  WHERE
    (oc.sn_id = p_node1_id AND oc.en_id = p_node2_id) OR
    (oc.sn_id = p_node2_id AND oc.en_id = p_node1_id)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_cable_between_nodes(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_ring_path(p_path_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_segment_count INT;
    v_first_segment RECORD;
    v_last_segment RECORD;
    v_is_continuous BOOLEAN;
    v_is_closed_loop BOOLEAN;
BEGIN
    -- Count segments in the path
    SELECT COUNT(*) INTO v_segment_count FROM logical_path_segments WHERE logical_path_id = p_path_id;

    IF v_segment_count = 0 THEN
        RETURN jsonb_build_object('status', 'empty', 'message', 'Path has no segments.');
    END IF;

    -- Get first and last segments using the detailed view
    SELECT * INTO v_first_segment FROM v_system_ring_paths_detailed WHERE logical_path_id = p_path_id ORDER BY path_order ASC LIMIT 1;
    SELECT * INTO v_last_segment FROM v_system_ring_paths_detailed WHERE logical_path_id = p_path_id ORDER BY path_order DESC LIMIT 1;

    -- Check for continuity (every segment's start node matches the previous segment's end node)
    SELECT NOT EXISTS (
        SELECT 1
        FROM v_system_ring_paths_detailed s1
        LEFT JOIN v_system_ring_paths_detailed s2 ON s1.logical_path_id = s2.logical_path_id AND s2.path_order = s1.path_order + 1
        WHERE s1.logical_path_id = p_path_id AND s2.id IS NOT NULL AND s1.end_node_id <> s2.start_node_id
    ) INTO v_is_continuous;

    IF NOT v_is_continuous THEN
        RETURN jsonb_build_object('status', 'broken', 'message', 'Path is not continuous. A segment connection is mismatched.');
    END IF;

    -- Check if the path forms a closed loop
    v_is_closed_loop := v_first_segment.start_node_id = v_last_segment.end_node_id;

    IF v_is_closed_loop THEN
        RETURN jsonb_build_object('status', 'valid_ring', 'message', 'Path forms a valid closed-loop ring.');
    ELSE
        RETURN jsonb_build_object('status', 'open_path', 'message', 'Path is a valid point-to-point route but not a closed ring.');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_ring_path(UUID) TO authenticated;


CREATE OR REPLACE FUNCTION public.deprovision_logical_path(p_path_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_working_path_id UUID;
    v_protection_path_id UUID;
BEGIN
    -- Find the working path ID, regardless if the input is a working or protection path ID
    SELECT
        CASE
            WHEN path_role = 'working' THEN id
            ELSE working_path_id
        END
    INTO v_working_path_id
    FROM public.logical_fiber_paths
    WHERE id = p_path_id OR working_path_id = p_path_id
    LIMIT 1;

    -- If a valid working path was found, find its associated protection path
    IF v_working_path_id IS NOT NULL THEN
        SELECT id INTO v_protection_path_id
        FROM public.logical_fiber_paths
        WHERE working_path_id = v_working_path_id;
    END IF;

    -- Clear the logical_path_id and fiber_role from all associated connections
    UPDATE public.ofc_connections
    SET
        logical_path_id = NULL,
        fiber_role = NULL
    WHERE logical_path_id = v_working_path_id OR logical_path_id = v_protection_path_id;

    -- Delete the logical_fiber_paths records themselves (cascading delete will handle protection path)
    DELETE FROM public.logical_fiber_paths WHERE id = v_working_path_id;
    
END;
$$;

GRANT EXECUTE ON FUNCTION public.deprovision_logical_path(UUID) TO authenticated;
```

<!-- path: data/migrations/06_utilities/04_dashboard_functions.sql -->
```sql
-- path: migrations/06_utilities/05_dashboard_functions.sql
-- Description: Contains functions for dashboard aggregations.

CREATE OR REPLACE FUNCTION public.get_dashboard_overview()
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
    result jsonb;
    v_user_activity jsonb;
BEGIN
    -- CORRECTED: Check if the user_activity_logs table exists before querying it.
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_activity_logs'
    ) THEN
        SELECT jsonb_agg(jsonb_build_object('date', day::date, 'count', COALESCE(activity_count, 0)) ORDER BY day)
        INTO v_user_activity
        FROM generate_series(CURRENT_DATE - interval '29 days', CURRENT_DATE, '1 day') as s(day) 
        LEFT JOIN (
            SELECT created_at::date as activity_date, COUNT(*) as activity_count 
            FROM public.user_activity_logs 
            WHERE created_at >= CURRENT_DATE - interval '29 days' 
            GROUP BY activity_date
        ) as activity ON s.day = activity.activity_date;
    ELSE
        -- If the table doesn't exist, return an empty array.
        v_user_activity := '[]'::jsonb;
    END IF;

    SELECT jsonb_build_object(
        'system_status_counts', (SELECT jsonb_object_agg(CASE WHEN status THEN 'Active' ELSE 'Inactive' END, count) FROM (SELECT status, COUNT(*) as count FROM public.systems GROUP BY status) as s),
        'node_status_counts', (SELECT jsonb_object_agg(CASE WHEN status THEN 'Active' ELSE 'Inactive' END, count) FROM (SELECT status, COUNT(*) as count FROM public.nodes GROUP BY status) as n),
        'path_operational_status', (SELECT jsonb_object_agg(lt.name, p.count) FROM (SELECT operational_status_id, COUNT(*) as count FROM public.logical_fiber_paths WHERE operational_status_id IS NOT NULL GROUP BY operational_status_id) as p JOIN lookup_types lt ON p.operational_status_id = lt.id),
        'cable_utilization_summary', (SELECT jsonb_build_object('average_utilization_percent', ROUND(AVG(utilization_percent)::numeric, 2), 'high_utilization_count', COUNT(*) FILTER (WHERE utilization_percent > 80), 'total_cables', COUNT(*)) FROM public.v_cable_utilization),
        'user_activity_last_30_days', v_user_activity, -- Use the safely-fetched activity data
        'systems_per_maintenance_area', (SELECT jsonb_object_agg(ma.name, s.system_count) FROM (SELECT maintenance_terminal_id, COUNT(id) as system_count FROM public.systems WHERE maintenance_terminal_id IS NOT NULL GROUP BY maintenance_terminal_id) as s JOIN public.maintenance_areas ma ON s.maintenance_terminal_id = ma.id)
    ) INTO result;

    RETURN result;
END; 
$$;
GRANT EXECUTE ON FUNCTION public.get_dashboard_overview() TO authenticated;
```

<!-- path: data/migrations/06_utilities/05_search_nodes.sql -->
```sql
-- path: migrations/06_utilities/07_search_nodes.sql
-- Description: Creates a function to search nodes for dropdowns with pagination and filtering.

CREATE OR REPLACE FUNCTION public.search_nodes_for_select(
    p_search_term TEXT DEFAULT '',
    p_limit INT DEFAULT 20
)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT n.id, n.name
    FROM public.v_nodes_complete n
    WHERE n.status = true
      AND (
        p_search_term = '' OR
        n.name ILIKE ('%' || p_search_term || '%')
      )
    ORDER BY n.name
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_nodes_for_select(TEXT, INT) TO authenticated;
```

<!-- path: data/migrations/06_utilities/02_paged_functions.sql -->
```sql
-- path: data/migrations/06_utilities/02_paged_functions.sql
-- =================================================================
-- Generic Pagination Functions
-- =================================================================
-- These functions build dynamic SQL. They are constructed to be secure
-- using format() with %I for identifiers and %L for literals.

-- **THE FIX: The helper functions (column_exists, build_where_clause) have been moved to 01_generic_functions.sql to resolve dependency errors.**
-- This file now only contains the get_paged_data function which depends on them.

CREATE OR REPLACE FUNCTION public.get_paged_data(
    p_view_name TEXT, p_limit INT, p_offset INT, p_order_by TEXT DEFAULT 'id',
    p_order_dir TEXT DEFAULT 'asc', p_filters JSONB DEFAULT '{}'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    data_query TEXT; count_query TEXT; where_clause TEXT; order_by_column TEXT;
    result_data JSONB; total_records BIGINT; active_records BIGINT := 0; inactive_records BIGINT := 0;
    status_column_exists BOOLEAN;
BEGIN
    status_column_exists := public.column_exists('public', p_view_name, 'status');
    where_clause := public.build_where_clause(p_filters, p_view_name);
    
    IF public.column_exists('public', p_view_name, p_order_by) THEN
        order_by_column := p_order_by;
    ELSE
        IF public.column_exists('public', p_view_name, 'id') THEN
            order_by_column := 'id';
        ELSE
            SELECT column_name INTO order_by_column FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = p_view_name
            ORDER BY ordinal_position LIMIT 1;
        END IF;
    END IF;
    
    data_query := format(
        'SELECT jsonb_agg(v) FROM (SELECT * FROM public.%I v WHERE 1=1 %s ORDER BY v.%I %s LIMIT %L OFFSET %L) v',
        p_view_name, where_clause, order_by_column, p_order_dir, p_limit, p_offset
    );
    
    IF status_column_exists THEN
        count_query := format(
            'SELECT count(*), count(*) FILTER (WHERE v.status = true), count(*) FILTER (WHERE v.status = false)
             FROM public.%I v WHERE 1=1 %s', p_view_name, where_clause
        );
        EXECUTE count_query INTO total_records, active_records, inactive_records;
    ELSE
        count_query := format('SELECT count(*) FROM public.%I v WHERE 1=1 %s', p_view_name, where_clause);
        EXECUTE count_query INTO total_records;
    END IF;
    
    EXECUTE data_query INTO result_data;
    
    RETURN jsonb_build_object(
        'data', COALESCE(result_data, '[]'::jsonb), 'total_count', COALESCE(total_records, 0),
        'active_count', COALESCE(active_records, 0), 'inactive_count', COALESCE(inactive_records, 0)
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_paged_data(TEXT, INT, INT, TEXT, TEXT, JSONB) TO authenticated;
```

<!-- path: data/migrations/99_finalization/01_cross_module_constraints.sql -->
```sql
-- Path: migrations/99_finalization/01_cross_module_constraints.sql
-- Description: Adds all cross-module foreign key constraints after all tables have been created.
-- This script is essential for maintaining referential integrity between different domains.

-- =================================================================
-- Constraint Set 1: Linking Core Infrastructure to Network Systems
-- =================================================================

-- Add the foreign key from ofc_connections (Module 02) to systems (Module 03).
-- This links a physical fiber connection to the network equipment it terminates on.
ALTER TABLE public.ofc_connections
ADD CONSTRAINT fk_ofc_connections_system
FOREIGN KEY (system_id)
REFERENCES public.systems(id)
ON DELETE SET NULL;


-- =================================================================
-- Constraint Set 2: Linking Core Infrastructure to Advanced OFC
-- =================================================================

-- Add the foreign key from ofc_connections (Module 02) to logical_fiber_paths (Module 04).
-- This assigns a physical fiber to a logical end-to-end path.
ALTER TABLE public.ofc_connections
ADD CONSTRAINT fk_ofc_connections_logical_path
FOREIGN KEY (logical_path_id)
REFERENCES public.logical_fiber_paths(id)
ON DELETE SET NULL;


-- =================================================================
-- Constraint Set 3: Linking Network Systems to Advanced OFC
-- =================================================================

-- Add foreign keys from logical_fiber_paths (Module 04) to systems (Module 03).
-- This defines the start and end systems for a logical path.
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

<!-- path: data/migrations/00_setup/01_roles.sql -->
```sql
-- Path: migrations/00_setup/01_roles.sql
-- Description: Creates all custom database roles. Must be run first.

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

-- Safely grant membership to the 'authenticated' role for all custom roles.
-- This allows any logged-in user to assume one of these roles via JWT claims.
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

<!-- path: data/migrations/00_setup/02_function_stubs.sql -->
```sql
-- Path: migrations/00_setup/02_function_stubs.sql
-- Description: Creates dummy "stub" versions of functions that may be optionally defined later.
-- This prevents dependency errors if certain modules (like Auditing) are not deployed.

-- Stub for the user activity logging function.
-- The real version is in the 05_auditing module.
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
AS $$
BEGIN
    -- This is a stub function. It does nothing.
    -- If the 05_auditing module is deployed, it will replace this function
    -- with the real implementation.
    RETURN;
END;
$$;
```

<!-- path: data/migrations/01_user_management/02_views.sql -->
```sql
-- Path: migrations/01_user_management/02_views.sql
-- Description: Defines views for the User Management module.

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
JOIN public.user_profiles p ON u.id = p.id;
```

<!-- path: data/migrations/01_user_management/06_rls_and_grants.sql -->
```sql
-- Path: migrations/01_user_management/06_rls_and_grants.sql
-- Description: All RLS policies and Grants for the User Management module.

-- =================================================================
-- Section 1: Grants
-- =================================================================

-- Grants for utility functions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_user_details() TO authenticated;

-- Grants for admin functions
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_extended(text, text, text, text, timestamptz, timestamptz, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text, text, text, text, date, jsonb, jsonb, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_status(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_update_role(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_delete_users(uuid[]) TO authenticated;

-- Grant Table Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO admin;
GRANT SELECT ON public.user_profiles TO viewer;


-- =================================================================
-- Section 2: RLS Policies for user_profiles
-- =================================================================

-- Enable RLS on the table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Super admins have full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.user_profiles;

-- Allow super admins full access to all rows
CREATE POLICY "Super admins have full access to user_profiles"
ON public.user_profiles
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING ((select auth.uid()) = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK ((select auth.uid()) = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.user_profiles
FOR DELETE
USING ((select auth.uid()) = id);
```

<!-- path: data/migrations/01_user_management/05_triggers.sql -->
```sql
-- Path: migrations/01_user_management/05_triggers.sql
-- Description: Attaches triggers for the User Management module.

-- CREATE TRIGGER for new auth users to create a public profile
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.create_public_profile_for_new_user();
    END IF;
END $$;

-- CREATE TRIGGER for role sync to auth.users on profile UPDATE
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_user_role_trigger') THEN
        CREATE TRIGGER sync_user_role_trigger
        AFTER UPDATE ON public.user_profiles
        FOR EACH ROW
        WHEN (NEW.role IS DISTINCT FROM OLD.role)
        EXECUTE FUNCTION sync_user_role_to_auth();
    END IF;
END $$;

-- CREATE TRIGGER for role sync to auth.users on profile INSERT
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_user_role_insert_trigger') THEN
        CREATE TRIGGER sync_user_role_insert_trigger
        AFTER INSERT ON public.user_profiles
        FOR EACH ROW EXECUTE FUNCTION sync_user_role_to_auth();
    END IF;
END $$;
```

<!-- path: data/migrations/01_user_management/04_indexes.sql -->
```sql
-- Path: migrations/01_user_management/04_indexes.sql
-- Description: Indexes for user_profiles to improve performance.

-- Index for filtering users by their role
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role);

-- Index for filtering users by their status (e.g., active, inactive)
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles (status);

-- Composite index for efficient searching and sorting by user's full name
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_name_first_name ON public.user_profiles (last_name, first_name);

-- Index on the creation timestamp to speed up date range filters
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles (created_at);
```

<!-- path: data/migrations/01_user_management/01_tables_user_profiles.sql -->
```sql
-- Path: migrations/01_user_management/01_tables_user_profiles.sql
-- Description: Defines the user_profiles table, which extends auth.users.

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

<!-- path: data/migrations/01_user_management/03_functions.sql -->
```sql
-- Path: migrations/01_user_management/03_functions.sql
-- Description: All functions for the User Management module.

-- =================================================================
-- Section 1: Utility Functions
-- =================================================================

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

-- USER DETAILS FUNCTION
CREATE OR REPLACE FUNCTION public.get_my_user_details()
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


-- =================================================================
-- Section 2: Admin RPC Functions
-- =================================================================

-- Enhanced admin function that returns a structured JSONB object
CREATE OR REPLACE FUNCTION public.admin_get_all_users_extended(
    search_query TEXT DEFAULT NULL,
    filter_role TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT NULL,
    filter_activity TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 50
) 
-- CORRECTED: Returns a single JSONB object
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_total_records bigint;
    v_active_count bigint;
    v_inactive_count bigint;
    v_user_data JSONB;
BEGIN
    -- Check if user is super admin
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied. Super admin privileges required.';
    END IF;

    -- Calculate all three counts in a single, efficient query
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE v.status = 'active'),
        COUNT(*) FILTER (WHERE v.status = 'inactive')
    INTO
        v_total_records,
        v_active_count,
        v_inactive_count
    FROM v_user_profiles_extended v
    WHERE
        (search_query IS NULL OR v.full_name ILIKE '%' || search_query || '%' OR v.email ILIKE '%' || search_query || '%')
    AND (filter_role IS NULL OR filter_role = 'all' OR v.role = filter_role)
    AND (filter_status IS NULL OR filter_status = 'all' OR v.status = filter_status)
    AND (filter_activity IS NULL OR filter_activity = 'all' OR v.last_activity_period = filter_activity)
    AND (date_from IS NULL OR v.created_at >= date_from)
    AND (date_to IS NULL OR v.created_at <= date_to);

    -- Fetch the paginated user data into a JSONB array
    SELECT jsonb_agg(t)
    INTO v_user_data
    FROM (
        SELECT
            v.id, v.email, v.last_sign_in_at, v.created_at, v.is_super_admin, v.is_email_verified,
            v.first_name, v.last_name, v.avatar_url, v.phone_number, v.date_of_birth, v.address,
            v.preferences, v.role, v.designation, v.updated_at, v.status, v.full_name,
            v.computed_status, v.account_age_days, v.last_activity_period
        FROM public.v_user_profiles_extended v
        WHERE
            (search_query IS NULL OR v.full_name ILIKE '%' || search_query || '%' OR v.email ILIKE '%' || search_query || '%')
        AND (filter_role IS NULL OR filter_role = 'all' OR v.role = filter_role)
        AND (filter_status IS NULL OR filter_status = 'all' OR v.status = filter_status)
        AND (filter_activity IS NULL OR filter_activity = 'all' OR v.last_activity_period = filter_activity)
        AND (date_from IS NULL OR v.created_at >= date_from)
        AND (date_to IS NULL OR v.created_at <= date_to)
        ORDER BY v.created_at DESC
        OFFSET page_offset
        LIMIT page_limit
    ) t;

    -- CORRECTED: Combine data and counts into a single JSONB object
    RETURN jsonb_build_object(
        'data', COALESCE(v_user_data, '[]'::jsonb),
        'counts', jsonb_build_object(
            'total', COALESCE(v_total_records, 0),
            'active', COALESCE(v_active_count, 0),
            'inactive', COALESCE(v_inactive_count, 0)
        )
    );
END;
$$;


-- Function to get a single user by ID (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_user_by_id ( user_id uuid )
RETURNS TABLE (
    id uuid, email text, first_name text, last_name text, avatar_url text, phone_number text, date_of_birth date, address jsonb,
    preferences jsonb, role text, designation text, status text, is_email_verified boolean, last_sign_in_at timestamptz,
    created_at timestamptz, updated_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT (public.is_super_admin() OR auth.uid() = user_id) THEN
        RAISE EXCEPTION 'Access denied. Insufficient privileges.';
    END IF;
    RETURN QUERY
    SELECT p.id, CAST(u.email AS text) as email, p.first_name, p.last_name, p.avatar_url, p.phone_number, p.date_of_birth, p.address,
           p.preferences, p.role, p.designation, p.status, (u.email_confirmed_at IS NOT NULL) as is_email_verified, u.last_sign_in_at,
           p.created_at, p.updated_at
    FROM public.user_profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE p.id = user_id;
END;
$$;

-- Function to update user profile (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_profile (
    user_id uuid, update_first_name text DEFAULT NULL, update_last_name text DEFAULT NULL, update_avatar_url text DEFAULT NULL,
    update_phone_number text DEFAULT NULL, update_date_of_birth date DEFAULT NULL, update_address jsonb DEFAULT NULL,
    update_preferences jsonb DEFAULT NULL, update_role text DEFAULT NULL, update_designation text DEFAULT NULL, update_status text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT (public.is_super_admin() OR auth.uid() = user_id) THEN
        RAISE EXCEPTION 'Access denied. Insufficient privileges.';
    END IF;
    UPDATE public.user_profiles
    SET first_name = COALESCE(update_first_name, first_name),
        last_name = COALESCE(update_last_name, last_name),
        avatar_url = CASE WHEN update_avatar_url = '' THEN NULL ELSE COALESCE(update_avatar_url, avatar_url) END,
        phone_number = CASE WHEN update_phone_number = '' THEN NULL ELSE COALESCE(update_phone_number, phone_number) END,
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

-- Function to bulk update user status (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_status ( user_ids uuid[], new_status text )
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Access denied. Super admin privileges required.'; END IF;
    IF new_status NOT IN ('active', 'inactive', 'suspended') THEN RAISE EXCEPTION 'Invalid status. Must be active, inactive, or suspended.'; END IF;
    UPDATE public.user_profiles SET status = new_status, updated_at = NOW() WHERE id = ANY(user_ids);
    PERFORM public.log_user_activity('BULK_UPDATE_STATUS', 'user_profiles', NULL, jsonb_build_object('user_ids', user_ids), jsonb_build_object('new_status', new_status), 'Bulk status update performed by admin');
    RETURN FOUND;
END;
$$;

-- Function to bulk update user role (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_update_role ( user_ids uuid[], new_role text )
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Access denied. Super admin privileges required.'; END IF;
    IF new_role NOT IN ('admin', 'viewer', 'cpan_admin', 'maan_admin', 'sdh_admin', 'vmux_admin', 'mng_admin') THEN RAISE EXCEPTION 'Invalid role.'; END IF;
    UPDATE public.user_profiles SET role = new_role, updated_at = NOW() WHERE id = ANY(user_ids);
    PERFORM public.log_user_activity('BULK_UPDATE_ROLE', 'user_profiles', NULL, jsonb_build_object('user_ids', user_ids), jsonb_build_object('new_role', new_role), 'Bulk role update performed by admin');
    RETURN FOUND;
END;
$$;

-- Function to bulk delete users (admin only)
CREATE OR REPLACE FUNCTION public.admin_bulk_delete_users ( user_ids uuid[] )
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Access denied. Super admin privileges required.'; END IF;
    PERFORM public.log_user_activity('BULK_DELETE', 'user_profiles', NULL, jsonb_build_object('user_ids', user_ids), NULL, 'Bulk user deletion performed by admin');
    DELETE FROM public.user_profiles WHERE id = ANY(user_ids);
    RETURN FOUND;
END;
$$;


-- =================================================================
-- Section 3: Trigger Functions
-- =================================================================

-- TRIGGER FUNCTION for updating timestamps
CREATE OR REPLACE FUNCTION public.update_user_profile_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function that will sync the role to auth.users
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role)) AND NEW.role IS NOT NULL THEN
        UPDATE auth.users SET role = NEW.role WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

-- USER CREATION FUNCTION (UPDATED)
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
        INSERT INTO public.user_profiles (id, first_name, last_name, avatar_url, phone_number, date_of_birth, address, preferences, status)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', (SELECT initcap(word) FROM regexp_split_to_table(split_part(NEW.email, '@', 1), '[^a-zA-Z]+') AS word WHERE word ~ '^[a-zA-Z]+' LIMIT 1), 'Placeholder'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 2), 'User'),
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'phone_number',
            CASE WHEN NEW.raw_user_meta_data->>'date_of_birth' ~ '^\d{4}-\d{2}-\d{2}$' THEN (NEW.raw_user_meta_data->>'date_of_birth')::date ELSE NULL END,
            COALESCE(NEW.raw_user_meta_data->'address', '{}'::jsonb),
            -- **THE FIX: Add the needsOnboarding flag to preferences**
            COALESCE(NEW.raw_user_meta_data->'preferences', '{}'::jsonb) || '{"needsOnboarding": true}',
            'active'
        );
    END IF;
    RETURN NEW;
END;
$$;
```

<!-- path: data/migrations/02_core_infrastructure/03_views.sql -->
```sql
-- path: data/migrations/02_core_infrastructure/03_views.sql
-- Description: Defines denormalized views for the Core Infrastructure module. [PERFORMANCE OPTIMIZED]

-- View for lookup_types
CREATE OR REPLACE VIEW public.v_lookup_types WITH (security_invoker = true) AS
SELECT
  lt.*
FROM public.lookup_types lt;

-- View for maintenance_areas with joined data
CREATE OR REPLACE VIEW public.v_maintenance_areas WITH (security_invoker = true) AS
SELECT
  ma.*,
  lt_ma.name AS maintenance_area_type_name,
  lt_ma.code AS maintenance_area_type_code
FROM public.maintenance_areas ma
LEFT JOIN public.lookup_types lt_ma ON ma.area_type_id = lt_ma.id;

-- View for employee_designations
CREATE OR REPLACE VIEW public.v_employee_designations WITH (security_invoker = true) AS
SELECT
  ed.*
FROM public.employee_designations ed;

-- View for employees with joined data
CREATE OR REPLACE VIEW public.v_employees WITH (security_invoker = true) AS
SELECT
  e.*,
  ed.name AS employee_designation_name
FROM public.employees e
LEFT JOIN public.employee_designations ed ON e.employee_designation_id = ed.id;

-- View for nodes with joined data
CREATE OR REPLACE VIEW public.v_nodes_complete WITH (security_invoker = true) AS
SELECT
  n.*,
  lt_node.name AS node_type_name,
  lt_node.code AS node_type_code,
  ma.name AS maintenance_area_name
FROM public.nodes n
LEFT JOIN public.lookup_types lt_node ON n.node_type_id = lt_node.id
LEFT JOIN public.maintenance_areas ma ON n.maintenance_terminal_id = ma.id;

-- View for ofc_cables with joined data
CREATE OR REPLACE VIEW public.v_ofc_cables_complete WITH (security_invoker = true) AS
SELECT
  ofc.*,
  sn.name AS sn_name,
  en.name AS en_name,
  lt_sn_type.name as sn_node_type_name,
  lt_en_type.name as en_node_type_name,
  lt_ofc.name AS ofc_type_name,
  lt_ofc.code AS ofc_type_code,
  lt_ofc_owner.name AS ofc_owner_name,
  lt_ofc_owner.code AS ofc_owner_code,
  ma.name AS maintenance_area_name,
  ma.code AS maintenance_area_code
FROM public.ofc_cables ofc
LEFT JOIN public.nodes sn ON ofc.sn_id = sn.id
LEFT JOIN public.nodes en ON ofc.en_id = en.id
LEFT JOIN public.lookup_types lt_ofc ON ofc.ofc_type_id = lt_ofc.id
LEFT JOIN public.lookup_types lt_ofc_owner ON ofc.ofc_owner_id = lt_ofc_owner.id
LEFT JOIN public.maintenance_areas ma ON ofc.maintenance_terminal_id = ma.id
LEFT JOIN public.lookup_types lt_sn_type ON sn.node_type_id = lt_sn_type.id
LEFT JOIN public.lookup_types lt_en_type ON en.node_type_id = lt_en_type.id;


```

<!-- path: data/migrations/02_core_infrastructure/02_functions.sql -->
```sql
-- Path: migrations/02_core_infrastructure/02_functions.sql
-- Description: Contains helper and trigger functions for core tables.

-- Generic function to update the 'updated_at' column on any table.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger function to update sn_dom (start node date of measurement) if OTDR distance changes significantly.
CREATE OR REPLACE FUNCTION public.update_sn_dom_on_otdr_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.otdr_distance_sn_km IS DISTINCT FROM OLD.otdr_distance_sn_km THEN
    IF NEW.sn_dom IS NULL OR abs(coalesce(NEW.otdr_distance_sn_km, 0) - coalesce(OLD.otdr_distance_sn_km, 0)) > 0.05 THEN
      NEW.sn_dom := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function to update en_dom (end node date of measurement) if OTDR distance changes significantly.
CREATE OR REPLACE FUNCTION public.update_en_dom_on_otdr_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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

<!-- path: data/migrations/02_core_infrastructure/05_rls_and_grants.sql -->
```sql
-- path: data/migrations/02_core_infrastructure/06_rls_and_grants.sql
-- Description: Applies a baseline set of RLS policies and grants to core tables. [UPDATED VIEW NAMES]

DO $$
DECLARE
  tbl TEXT;
  admin_role TEXT := 'admin';
  viewer_role TEXT := 'viewer';
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'lookup_types', 'maintenance_areas', 'rings',
    'employee_designations', 'employees', 'nodes',
    'ofc_cables', 'ofc_connections',
    'folders', 'files'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO %I;', tbl, admin_role);
    EXECUTE format('GRANT SELECT ON public.%I TO %I;', tbl, viewer_role);

    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "policy_viewer_select_%s" ON public.%I;', tbl, tbl);

    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I
      FOR ALL TO %I
      USING (is_super_admin() OR public.get_my_role() = %L)
      WITH CHECK (is_super_admin() OR public.get_my_role() = %L);
    $p$, tbl, tbl, admin_role, admin_role, admin_role);

    EXECUTE format($p$
      CREATE POLICY "policy_viewer_select_%s" ON public.%I
      FOR SELECT TO %I
      USING (public.get_my_role() = %L);
    $p$, tbl, tbl, viewer_role, viewer_role);

    RAISE NOTICE 'Applied baseline admin/viewer RLS policies to %', tbl;
  END LOOP;
END;
$$;


DO $$
BEGIN
  EXECUTE 'GRANT SELECT ON public.nodes TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.maintenance_areas TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.lookup_types TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.ofc_cables TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  EXECUTE 'GRANT SELECT ON public.ofc_connections TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;';
  RAISE NOTICE 'Granted SELECT on core tables to specific admin roles.';
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['nodes', 'maintenance_areas', 'lookup_types', 'ofc_cables', 'ofc_connections']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "policy_system_admins_select_%s" ON public.%I;', tbl, tbl);
    EXECUTE format($p$
      CREATE POLICY "policy_system_admins_select_%s" ON public.%I
      FOR SELECT TO cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin
      USING (
        get_my_role() IN ('cpan_admin', 'maan_admin', 'sdh_admin', 'vmux_admin', 'mng_admin')
      );
    $p$, tbl, tbl);
    RAISE NOTICE 'Applied system-admin SELECT RLS policy to %', tbl;
  END LOOP;
END;
$$;

-- CORRECTED SECTION: Grants now reference the renamed views.
DO $$
BEGIN
  GRANT SELECT ON public.v_lookup_types TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_maintenance_areas TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_employee_designations TO admin, viewer;
  GRANT SELECT ON public.v_employees TO admin, viewer;
  GRANT SELECT ON public.v_nodes_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_ofc_cables_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;

  RAISE NOTICE 'Applied SELECT grants on core infrastructure views for ALL relevant roles.';
END;
$$;
```

<!-- path: data/migrations/02_core_infrastructure/04_indexes.sql -->
```sql
-- Path: migrations/02_core_infrastructure/04_indexes.sql
-- Description: Creates all B-tree and GIN (FTS) indexes for the Core module.

-- =================================================================
-- Section 1: Standard B-Tree Indexes
-- =================================================================

-- Indexes for lookup_types
CREATE INDEX IF NOT EXISTS idx_lookup_types_category ON public.lookup_types (category);
CREATE INDEX IF NOT EXISTS idx_lookup_types_name ON public.lookup_types (name);

-- Indexes for maintenance_areas
CREATE INDEX IF NOT EXISTS idx_maintenance_areas_parent_id ON public.maintenance_areas (parent_id);

-- Indexes for employee_designations
CREATE INDEX IF NOT EXISTS idx_employee_designations_parent_id ON public.employee_designations (parent_id);

-- Indexes for employees
CREATE INDEX IF NOT EXISTS idx_employees_employee_designation_id ON public.employees (employee_designation_id);
CREATE INDEX IF NOT EXISTS idx_employees_maintenance_terminal_id ON public.employees (maintenance_terminal_id);

-- Indexes for nodes
CREATE INDEX IF NOT EXISTS idx_nodes_type_id ON public.nodes (node_type_id);
CREATE INDEX IF NOT EXISTS idx_nodes_maintenance_area ON public.nodes (maintenance_terminal_id);
CREATE INDEX IF NOT EXISTS idx_nodes_coordinates ON public.nodes (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON public.nodes (status);

-- Indexes for ofc_connections
CREATE INDEX IF NOT EXISTS idx_ofc_connections_ofc_id ON public.ofc_connections (ofc_id);
CREATE INDEX IF NOT EXISTS idx_ofc_connections_system_id ON public.ofc_connections (system_id);
CREATE INDEX IF NOT EXISTS idx_ofc_connections_logical_path_id ON public.ofc_connections (logical_path_id);

-- Indexes for files/folders
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files USING btree (folder_id);

-- =================================================================
-- Section 2: Full-Text Search (FTS) GIN Indexes
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_employees_remark_fts ON public.employees USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_nodes_remark_fts ON public.nodes USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_ofc_cables_remark_fts ON public.ofc_cables USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_ofc_connections_remark_fts ON public.ofc_connections USING gin(to_tsvector('english', remark));
```

<!-- path: data/migrations/02_core_infrastructure/01_tables_core.sql -->
```sql
-- Path: migrations/02_core_infrastructure/01_tables_core.sql
-- Description: Defines all core infrastructure and master data tables.

-- Centralized Lookup Types Table
CREATE TABLE IF NOT EXISTS public.lookup_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_system_default BOOLEAN DEFAULT false,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_lookup_types_category_name UNIQUE (category, name),
  CONSTRAINT uq_lookup_types_category_code UNIQUE (category, code)
);

-- Maintenance Areas/Terminals Master Table
CREATE TABLE IF NOT EXISTS public.maintenance_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  area_type_id UUID REFERENCES public.lookup_types (id),
  parent_id UUID REFERENCES public.maintenance_areas (id),
  contact_person TEXT,
  contact_number TEXT,
  email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Designation Table
CREATE TABLE IF NOT EXISTS public.employee_designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.employee_designations(id) ON DELETE SET NULL,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Master Table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name TEXT NOT NULL,
  employee_pers_no TEXT UNIQUE,
  employee_contact TEXT,
  employee_email TEXT,
  employee_dob DATE,
  employee_doj DATE,
  employee_designation_id UUID REFERENCES public.employee_designations (id),
  employee_addr TEXT,
  maintenance_terminal_id UUID REFERENCES public.maintenance_areas (id),
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ring Master Table
CREATE TABLE IF NOT EXISTS public.rings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ring_type_id UUID REFERENCES public.lookup_types (id),
  description TEXT,
  maintenance_terminal_id UUID REFERENCES public.maintenance_areas (id),
  total_nodes INTEGER DEFAULT 0,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified Node List (Physical Locations/Sites)
CREATE TABLE IF NOT EXISTS public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  node_type_id UUID REFERENCES public.lookup_types (id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  maintenance_terminal_id UUID REFERENCES public.maintenance_areas (id),
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified OFC (Optical Fiber Cable) Table
CREATE TABLE IF NOT EXISTS public.ofc_cables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name TEXT NOT NULL,
  sn_id UUID REFERENCES public.nodes (id) NOT NULL,
  en_id UUID REFERENCES public.nodes (id) NOT NULL,
  ofc_type_id UUID REFERENCES public.lookup_types (id) NOT NULL,
  capacity INTEGER NOT NULL,
  ofc_owner_id UUID REFERENCES public.lookup_types (id) NOT NULL,
  current_rkm DECIMAL(10, 3),
  transnet_id TEXT,
  transnet_rkm DECIMAL(10, 3),
  asset_no TEXT,
  maintenance_terminal_id UUID REFERENCES public.maintenance_areas (id),
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OFC Connection Details (Fiber connections between nodes)
CREATE TABLE IF NOT EXISTS public.ofc_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- **Added ON DELETE CASCADE to this line.**
  ofc_id UUID REFERENCES public.ofc_cables (id) ON DELETE CASCADE NOT NULL,
  fiber_no_sn INTEGER NOT NULL,
  fiber_no_en INTEGER NOT NULL,
  updated_fiber_no_sn INTEGER,
  updated_fiber_no_en INTEGER,
  updated_sn_id UUID REFERENCES public.nodes (id) NOT NULL,
  updated_en_id UUID REFERENCES public.nodes (id) NOT NULL,
  otdr_distance_sn_km DECIMAL(10, 3),
  sn_dom DATE,
  sn_power_dbm DECIMAL(10, 3),
  system_id UUID, -- NOTE: FK constraint to systems table is added in 99_finalization
  otdr_distance_en_km DECIMAL(10, 3),
  en_dom DATE,
  en_power_dbm DECIMAL(10, 3),
  route_loss_db DECIMAL(10, 3),
  logical_path_id UUID, -- NOTE: FK constraint to logical_fiber_paths is added in 99_finalization
  fiber_role TEXT CHECK (fiber_role IN ('working', 'protection')),
  path_segment_order INTEGER DEFAULT 1,
  source_port TEXT,
  destination_port TEXT,
  connection_category TEXT NOT NULL DEFAULT 'OFC_JOINT_TYPES',
  connection_type TEXT NOT NULL DEFAULT 'straight',
  CONSTRAINT fk_connection_type FOREIGN KEY (connection_category, connection_type)
    REFERENCES public.lookup_types(category, name),
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table for file management
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files table for file management
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id),
  folder_id UUID REFERENCES public.folders (id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size TEXT NOT NULL,
  file_route TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

<!-- path: data/migrations/02_core_infrastructure/06_triggers_ofc_connections.sql -->
```sql
-- Path: migrations/02_core_infrastructure/07_triggers_ofc_connections.sql
-- Description: Creates a trigger to automatically populate ofc_connections when a new ofc_cable is inserted.

-- 1. Define the trigger function
CREATE OR REPLACE FUNCTION public.create_initial_connections_for_cable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Use definer to ensure it can write to ofc_connections
SET search_path = public
AS $$
DECLARE
    i INT;
BEGIN
    -- Loop from 1 to the capacity of the newly inserted cable
    FOR i IN 1..NEW.capacity LOOP
        -- Insert a new record into ofc_connections for each fiber
        INSERT INTO public.ofc_connections (
            ofc_id,
            fiber_no_sn,
            fiber_no_en
        )
        VALUES (
            NEW.id,
            i,
            i
        );
    END LOOP;
    RETURN NEW;
END;
$$;

-- 2. Create and attach the trigger to the ofc_cables table
DROP TRIGGER IF EXISTS on_ofc_cable_created ON public.ofc_cables; -- for idempotency
CREATE TRIGGER on_ofc_cable_created
AFTER INSERT ON public.ofc_cables
FOR EACH ROW
EXECUTE FUNCTION public.create_initial_connections_for_cable();

COMMENT ON TRIGGER on_ofc_cable_created ON public.ofc_cables IS 'Automatically creates individual fiber records in ofc_connections upon the creation of a new ofc_cable.';
```

<!-- path: data/migrations/04_advanced_ofc/02_views.sql -->
```sql
-- Path: migrations/04_advanced_ofc/02_views.sql
-- Description: Defines views for analyzing OFC paths and utilization. [UPDATED]

-- View showing complete information for a junction closure.
CREATE OR REPLACE VIEW public.v_junction_closures_complete WITH (security_invoker = true) AS
SELECT
  jc.id,
  jc.node_id,
  jc.ofc_cable_id,
  jc.position_km,
  n.name,
  n.latitude,
  n.longitude
FROM public.junction_closures jc
JOIN public.nodes n ON jc.node_id = n.id;

-- NEW VIEW: This view helps find which cable segments are connected to a specific JC node.
CREATE OR REPLACE VIEW public.v_cable_segments_at_jc WITH (security_invoker = true) AS
SELECT
  cs.id,
  cs.original_cable_id,
  cs.segment_order,
  cs.fiber_count,
  cs.start_node_id,
  cs.end_node_id,
  jcs.node_id as jc_node_id
FROM public.cable_segments cs
JOIN public.junction_closures jcs ON (cs.start_node_type = 'jc' AND cs.start_node_id = jcs.node_id)
                                  OR (cs.end_node_type = 'jc' AND cs.end_node_id = jcs.node_id);


-- View showing end-to-end logical path summaries.
CREATE OR REPLACE VIEW public.v_end_to_end_paths WITH (security_invoker = true) AS
SELECT
  lfp.id AS path_id,
  lfp.path_name,
  lfp.source_system_id,
  lfp.destination_system_id,
  lfp.total_distance_km,
  lfp.total_loss_db,
  lt_status.name AS operational_status,
  COUNT(lps.id) AS segment_count,
  STRING_AGG(DISTINCT oc.route_name, ' -> ' ORDER BY oc.route_name) AS route_names
FROM public.logical_fiber_paths lfp
LEFT JOIN public.lookup_types lt_status ON lfp.operational_status_id = lt_status.id
LEFT JOIN public.logical_path_segments lps ON lfp.id = lps.logical_path_id
LEFT JOIN public.ofc_cables oc ON lps.ofc_cable_id = oc.id
GROUP BY
  lfp.id,
  lt_status.name;


-- View showing detailed segments for a given logical path.
CREATE OR REPLACE VIEW public.v_system_ring_paths_detailed WITH (security_invoker = true) AS
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
FROM public.logical_path_segments srp
JOIN public.logical_fiber_paths lp ON srp.logical_path_id = lp.id
JOIN public.ofc_cables oc ON srp.ofc_cable_id = oc.id
LEFT JOIN public.nodes sn ON oc.sn_id = sn.id
LEFT JOIN public.nodes en ON oc.en_id = en.id
ORDER BY
  srp.logical_path_id,
  srp.path_order;


-- View for calculating fiber utilization per cable.
CREATE OR REPLACE VIEW public.v_cable_utilization WITH (security_invoker = true) AS
SELECT
  oc.id AS cable_id,
  oc.route_name,
  oc.capacity,
  -- [THE FIX] A fiber is used if it's assigned to ANY logical path. Role doesn't matter.
  COUNT(conn.id) FILTER (WHERE conn.logical_path_id IS NOT NULL) AS used_fibers,
  -- This logic remains correct.
  COUNT(conn.id) FILTER (WHERE conn.logical_path_id IS NULL) AS available_fibers,
  -- [THE FIX] The percentage now correctly reflects all used fibers.
  ROUND(
    (COUNT(conn.id) FILTER (WHERE conn.logical_path_id IS NOT NULL)::DECIMAL / NULLIF(oc.capacity, 0)) * 100, 2
  ) AS utilization_percent
FROM public.ofc_cables oc
LEFT JOIN public.ofc_connections conn ON oc.id = conn.ofc_id
GROUP BY
  oc.id, oc.route_name, oc.capacity;
```

<!-- path: data/migrations/04_advanced_ofc/06_rls_and_grants.sql -->
```sql
-- Path: migrations/04_advanced_ofc/06_rls_and_grants.sql
-- Description: RLS policies and Grants for the Advanced OFC (Route Manager) module.

-- =================================================================
-- Step 1: Grant Table-Level Permissions to Roles
-- =================================================================
GRANT ALL ON public.junction_closures TO admin;
GRANT ALL ON public.cable_segments TO admin;
GRANT ALL ON public.fiber_splices TO admin;
GRANT ALL ON public.logical_fiber_paths TO admin;
GRANT ALL ON public.logical_path_segments TO admin; -- Added missing table grant

GRANT SELECT ON public.junction_closures TO viewer;
GRANT SELECT ON public.cable_segments TO viewer;
GRANT SELECT ON public.fiber_splices TO viewer;
GRANT SELECT ON public.logical_fiber_paths TO viewer;
GRANT SELECT ON public.logical_path_segments TO viewer; -- Added missing table grant

-- Grant select on dependent tables from other modules for views to work
GRANT SELECT ON public.ofc_cables TO viewer, authenticated;
GRANT SELECT ON public.nodes TO viewer;
GRANT SELECT ON public.junction_closures TO authenticated;
GRANT SELECT ON public.cable_segments TO authenticated;

-- =================================================================
-- Step 2: Apply RLS Policies to Tables
-- =================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- CORRECTED: Uncommented logical_path_segments
  FOREACH tbl IN ARRAY ARRAY[
    'junction_closures', 'cable_segments', 'fiber_splices',
    'logical_fiber_paths', 'logical_path_segments'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "policy_admin_all_%s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "policy_viewer_select_%s" ON public.%I;', tbl, tbl);

    -- Admin Policy
    EXECUTE format($p$
      CREATE POLICY "policy_admin_all_%s" ON public.%I FOR ALL TO admin
      USING (is_super_admin() OR get_my_role() = 'admin')
      WITH CHECK (is_super_admin() OR get_my_role() = 'admin');
    $p$, tbl, tbl);

    -- Viewer Policy
    EXECUTE format($p$
      CREATE POLICY "policy_viewer_select_%s" ON public.%I FOR SELECT TO viewer
      USING (get_my_role() = 'viewer' OR is_super_admin() OR get_my_role() = 'admin');
    $p$, tbl, tbl);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS policy_authenticated_select_cable_segments ON public.cable_segments;
CREATE POLICY policy_authenticated_select_cable_segments ON public.cable_segments
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS policy_authenticated_select_junction_closures ON public.junction_closures;
CREATE POLICY policy_authenticated_select_junction_closures ON public.junction_closures
FOR SELECT TO authenticated USING (true);

-- =================================================================
-- Step 3: View-Level Grants [CORRECTED]
-- =================================================================
DO $$
BEGIN
  -- CORRECTED: Added grants for specific admin roles to all relevant views in this module.
  GRANT SELECT ON public.v_junction_closures_complete TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_cable_segments_at_jc TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_system_ring_paths_detailed TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_cable_utilization TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  GRANT SELECT ON public.v_end_to_end_paths TO admin, viewer, cpan_admin, maan_admin, sdh_admin, vmux_admin, mng_admin;
  
  RAISE NOTICE 'Applied SELECT grants on advanced OFC views for ALL relevant roles.';
END;
$$;
```

<!-- path: data/migrations/04_advanced_ofc/03_indexes.sql -->
```sql
-- Path: migrations/04_advanced_ofc/03_indexes.sql
-- Description: Creates indexes for the Advanced OFC module tables.

CREATE INDEX IF NOT EXISTS idx_logical_fiber_paths_source_system_id ON public.logical_fiber_paths (source_system_id);
CREATE INDEX IF NOT EXISTS idx_logical_path_segments_path_id ON public.logical_path_segments(logical_path_id);
```

<!-- path: data/migrations/04_advanced_ofc/01_tables_advanced_ofc.sql -->
```sql
-- Path: migrations/04_advanced_ofc/01_tables_advanced_ofc.sql
-- Description: Defines tables for advanced OFC path and splice management. [CORRECTED FOR SEGMENTS]

CREATE TABLE IF NOT EXISTS public.junction_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  ofc_cable_id UUID NOT NULL REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
  position_km NUMERIC(10,3),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cable_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_cable_id UUID NOT NULL REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
  segment_order INTEGER NOT NULL,
  start_node_id UUID NOT NULL,
  end_node_id UUID NOT NULL,
  start_node_type TEXT NOT NULL CHECK (start_node_type IN ('node', 'jc')),
  end_node_type TEXT NOT NULL CHECK (end_node_type IN ('node', 'jc')),
  distance_km DECIMAL(10,3) NOT NULL,
  fiber_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (original_cable_id, segment_order)
);

CREATE TABLE IF NOT EXISTS public.logical_fiber_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_name TEXT,
  working_path_id UUID REFERENCES public.logical_fiber_paths(id) ON DELETE SET NULL,
  path_role TEXT NOT NULL DEFAULT 'working' CHECK (path_role IN ('working', 'protection')),
  path_type_id UUID REFERENCES public.lookup_types(id) ON DELETE SET NULL,
  source_system_id UUID,
  destination_system_id UUID,
  operational_status_id UUID REFERENCES public.lookup_types(id) ON DELETE SET NULL,
  source_port TEXT,
  destination_port TEXT,
  total_distance_km DECIMAL(10, 3),
  total_loss_db DECIMAL(10, 3),
  service_type TEXT,
  bandwidth_gbps INTEGER,
  wavelength_nm INTEGER,
  commissioned_date DATE,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks individual fiber connections (splices) between cable segments within a junction closure.
CREATE TABLE IF NOT EXISTS public.fiber_splices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jc_id UUID NOT NULL REFERENCES public.junction_closures(id) ON DELETE CASCADE,
    incoming_segment_id UUID NOT NULL REFERENCES public.cable_segments(id) ON DELETE CASCADE,
    incoming_fiber_no INT NOT NULL,
    outgoing_segment_id UUID REFERENCES public.cable_segments(id) ON DELETE CASCADE,
    outgoing_fiber_no INT,
    splice_type TEXT NOT NULL DEFAULT 'straight' CHECK (splice_type IN ('straight', 'cross', 't_joint')),
    -- status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'faulty', 'reserved')),
    logical_path_id UUID REFERENCES public.logical_fiber_paths(id) ON DELETE SET NULL,
    loss_db NUMERIC(5, 2),
    -- otdr_length_km NUMERIC(10, 3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT unique_incoming_fiber_in_jc UNIQUE (jc_id, incoming_segment_id, incoming_fiber_no),
    CONSTRAINT unique_outgoing_fiber_in_jc UNIQUE (jc_id, outgoing_segment_id, outgoing_fiber_no)
);

CREATE TABLE IF NOT EXISTS public.logical_path_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logical_path_id UUID NOT NULL REFERENCES public.logical_fiber_paths(id) ON DELETE CASCADE,
  ofc_cable_id UUID REFERENCES public.ofc_cables(id),
  path_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (logical_path_id, path_order)
);

```

<!-- path: data/migrations/04_advanced_ofc/05_triggers.sql -->
```sql
-- path: data/migrations/04_advanced_ofc/05_triggers.sql
-- Description: Attaches 'updated_at' triggers, segmentation, and splice update triggers. [CORRECTED]

-- Drop all old triggers to ensure a clean state
DROP TRIGGER IF EXISTS on_junction_closure_change ON public.junction_closures;
DROP TRIGGER IF EXISTS trigger_after_splice_change ON public.fiber_splices;

-- Attach the single, unified trigger for both INSERT and DELETE events on junction_closures.
CREATE TRIGGER on_junction_closure_change
AFTER INSERT OR DELETE ON public.junction_closures
FOR EACH ROW
EXECUTE FUNCTION public.manage_cable_segments();

-- **The trigger that updates ofc_connections after a splice change.**
CREATE TRIGGER trigger_after_splice_change
AFTER INSERT OR UPDATE OR DELETE ON public.fiber_splices
FOR EACH ROW
EXECUTE FUNCTION public.update_ofc_connections_from_splice();

```

<!-- path: data/migrations/04_advanced_ofc/04_functions.sql -->
```sql
-- path: data/migrations/04_advanced_ofc/04_functions.sql
-- Description: All functions for cable segmentation, splicing, and fiber path management. [CONSOLIDATED & CORRECTED]

-- =================================================================
-- Section 1: Junction Closure and Segmentation Management
-- =================================================================

-- This function is called by the frontend to add a new JC.
CREATE OR REPLACE FUNCTION public.add_junction_closure(
  p_ofc_cable_id UUID,
  p_position_km NUMERIC(10,3),
  p_node_id UUID
)
RETURNS TABLE (
  id UUID,
  node_id UUID,
  ofc_cable_id UUID,
  position_km NUMERIC(10,3),
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jc_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.nodes WHERE nodes.id = p_node_id) THEN
    RAISE EXCEPTION 'Node with ID % does not exist', p_node_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ofc_cables WHERE ofc_cables.id = p_ofc_cable_id) THEN
    RAISE EXCEPTION 'Cable with ID % does not exist', p_ofc_cable_id;
  END IF;

  INSERT INTO public.junction_closures (node_id, ofc_cable_id, position_km)
  VALUES (p_node_id, p_ofc_cable_id, p_position_km)
  RETURNING junction_closures.id INTO v_jc_id;

  RETURN QUERY
  SELECT jc.id, jc.node_id, jc.ofc_cable_id, jc.position_km, jc.created_at
  FROM public.junction_closures jc
  WHERE jc.id = v_jc_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_junction_closure(UUID, NUMERIC, UUID) TO authenticated;

-- This function is called by a trigger to non-destructively recalculate segments.
CREATE OR REPLACE FUNCTION public.recalculate_segments_for_cable(p_cable_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cable RECORD;
BEGIN
  SELECT * INTO v_cable FROM public.ofc_cables WHERE id = p_cable_id;
  IF NOT FOUND THEN
    RAISE WARNING 'Cable not found for segmentation: %', p_cable_id;
    RETURN;
  END IF;

  DELETE FROM public.cable_segments WHERE original_cable_id = p_cable_id;

  CREATE TEMP TABLE route_points AS
  SELECT v_cable.sn_id AS point_id, 'node' AS point_type, 0.0 AS position_km
  UNION ALL
  SELECT jc.node_id, 'jc', jc.position_km
  FROM public.junction_closures jc
  WHERE jc.ofc_cable_id = p_cable_id
  UNION ALL
  SELECT v_cable.en_id, 'node', v_cable.current_rkm;

  INSERT INTO public.cable_segments (
    original_cable_id, segment_order,
    start_node_id, start_node_type,
    end_node_id, end_node_type,
    distance_km, fiber_count
  )
  SELECT
    p_cable_id,
    ROW_NUMBER() OVER (ORDER BY p_start.position_km),
    p_start.point_id, p_start.point_type,
    p_end.point_id, p_end.point_type,
    p_end.position_km - p_start.position_km,
    v_cable.capacity
  FROM route_points p_start
  JOIN LATERAL (
    SELECT * FROM route_points p2
    WHERE p2.position_km > p_start.position_km
    ORDER BY p2.position_km ASC
    LIMIT 1
  ) p_end ON true;

  DROP TABLE route_points;
END;
$$;

-- This is the trigger function that orchestrates segmentation.
CREATE OR REPLACE FUNCTION public.manage_cable_segments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.recalculate_segments_for_cable(NEW.ofc_cable_id);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.recalculate_segments_for_cable(OLD.ofc_cable_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- =================================================================
-- Section 2: Fiber Splice and Path Management
-- =================================================================

-- This trigger function updates ofc_connections after a splice change.
CREATE OR REPLACE FUNCTION public.update_ofc_connections_from_splice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_splice RECORD;
    v_start_fiber INT;
    v_end_fiber INT;
BEGIN
    RAISE NOTICE 'Trigger fired: TG_OP=% on fiber_splices id=%', TG_OP, COALESCE(NEW.id::text, OLD.id::text);

    IF (TG_OP = 'DELETE') THEN
        RAISE NOTICE 'DELETE case: resetting connections for splice_id=% incoming_seg=% outgoing_seg=%',
            OLD.id, OLD.incoming_segment_id, OLD.outgoing_segment_id;

        UPDATE public.ofc_connections
        SET updated_fiber_no_sn = fiber_no_sn,
            updated_fiber_no_en = fiber_no_en
        WHERE ofc_id = (SELECT original_cable_id FROM public.cable_segments WHERE id = OLD.incoming_segment_id)
          AND fiber_no_sn = OLD.incoming_fiber_no;

        GET DIAGNOSTICS v_start_fiber = ROW_COUNT;
        RAISE NOTICE 'DELETE: updated % incoming rows', v_start_fiber;

        IF OLD.outgoing_segment_id IS NOT NULL THEN
             UPDATE public.ofc_connections
             SET updated_fiber_no_sn = fiber_no_sn,
                 updated_fiber_no_en = fiber_no_en
             WHERE ofc_id = (SELECT original_cable_id FROM public.cable_segments WHERE id = OLD.outgoing_segment_id)
               AND fiber_no_sn = OLD.outgoing_fiber_no;

             GET DIAGNOSTICS v_start_fiber = ROW_COUNT;
             RAISE NOTICE 'DELETE: updated % outgoing rows', v_start_fiber;
        END IF;

        RETURN OLD;
    END IF;

    -- INSERT or UPDATE
    v_splice := NEW;
    RAISE NOTICE 'INSERT/UPDATE case: splice_id=% incoming_seg=% outgoing_seg=% incoming_fiber_no=% outgoing_fiber_no=%',
        v_splice.id, v_splice.incoming_segment_id, v_splice.outgoing_segment_id,
        v_splice.incoming_fiber_no, v_splice.outgoing_fiber_no;

    -- Trace backwards
    WITH RECURSIVE trace_to_start AS (
        SELECT 1 as step, v_splice.incoming_segment_id as segment_id, v_splice.incoming_fiber_no as fiber_no, ARRAY[v_splice.id] as visited_splices
        UNION ALL
        SELECT
            p.step + 1,
            CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END,
            CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_fiber_no ELSE s.outgoing_fiber_no END,
            p.visited_splices || s.id
        FROM trace_to_start p
        JOIN fiber_splices s
          ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no)
          OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
        -- [THE FIX] Added recursion depth limit
        WHERE NOT (s.id = ANY(p.visited_splices)) AND p.step < 100
    )
    SELECT fiber_no INTO v_start_fiber
    FROM trace_to_start
    ORDER BY step DESC
    LIMIT 1;

    RAISE NOTICE 'Start fiber resolved: %', v_start_fiber;

    -- Trace forwards
    IF v_splice.outgoing_segment_id IS NULL THEN
        v_end_fiber := 0;
        RAISE NOTICE 'No outgoing segment → fiber terminates.';
    ELSE
        WITH RECURSIVE trace_to_end AS (
            SELECT 1 as step, v_splice.outgoing_segment_id as segment_id, v_splice.outgoing_fiber_no as fiber_no, ARRAY[v_splice.id] as visited_splices
            UNION ALL
            SELECT
                p.step + 1,
                CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
                CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
                p.visited_splices || s.id
            FROM trace_to_end p
            JOIN fiber_splices s
              ON (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no)
              OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
            -- [THE FIX] Added recursion depth limit
            WHERE NOT (s.id = ANY(p.visited_splices)) AND p.step < 100
        )
        SELECT fiber_no INTO v_end_fiber
        FROM trace_to_end
        ORDER BY step DESC
        LIMIT 1;

        IF NOT FOUND THEN
            v_end_fiber := 0;
            RAISE NOTICE 'Forward trace ended prematurely. Setting end fiber = 0';
        ELSE
            RAISE NOTICE 'End fiber resolved: %', v_end_fiber;
        END IF;
    END IF;

    -- Update all connections in the logical path
    WITH RECURSIVE full_path AS (
        SELECT 1 as step, v_splice.incoming_segment_id as segment_id, v_splice.incoming_fiber_no as fiber_no, ARRAY[v_splice.id] as visited_splices
        UNION ALL
        SELECT
            p.step + 1,
            CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
            CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
            p.visited_splices || s.id
        FROM full_path p
        JOIN fiber_splices s
          ON ((p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no)
           OR (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no))
        -- [THE FIX] Added recursion depth limit
        WHERE NOT (s.id = ANY(p.visited_splices)) AND p.step < 100
    )
    UPDATE public.ofc_connections
    SET updated_fiber_no_sn = v_start_fiber,
        updated_fiber_no_en = v_end_fiber
    WHERE (ofc_id, fiber_no_sn) IN (
        SELECT cs.original_cable_id, fp.fiber_no
        FROM full_path fp
        JOIN cable_segments cs ON fp.segment_id = cs.id
    );

    GET DIAGNOSTICS v_start_fiber = ROW_COUNT;
    RAISE NOTICE 'Updated % rows in ofc_connections for path.', v_start_fiber;

    RETURN NEW;
END;
$$;


-- Description: RPC function to handle creating, deleting, and updating splices.
CREATE OR REPLACE FUNCTION public.manage_splice(
    p_action TEXT, p_jc_id UUID, p_splice_id UUID DEFAULT NULL, p_incoming_segment_id UUID DEFAULT NULL,
    p_incoming_fiber_no INT DEFAULT NULL, p_outgoing_segment_id UUID DEFAULT NULL, p_outgoing_fiber_no INT DEFAULT NULL,
    p_splice_type TEXT DEFAULT 'pass_through', p_loss_db NUMERIC DEFAULT NULL
)
RETURNS RECORD
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result RECORD;
BEGIN
    IF p_action = 'create' THEN
        INSERT INTO public.fiber_splices (jc_id, incoming_segment_id, incoming_fiber_no, outgoing_segment_id, outgoing_fiber_no, splice_type, loss_db)
        VALUES (p_jc_id, p_incoming_segment_id, p_incoming_fiber_no, p_outgoing_segment_id, p_outgoing_fiber_no, p_splice_type, p_loss_db)
        RETURNING id, 'created' INTO result;
    ELSIF p_action = 'delete' THEN
        DELETE FROM public.fiber_splices WHERE id = p_splice_id AND jc_id = p_jc_id RETURNING id, 'deleted' INTO result;
        IF NOT FOUND THEN RAISE EXCEPTION 'Splice not found.'; END IF;
    ELSIF p_action = 'update_loss' THEN
        UPDATE public.fiber_splices SET loss_db = p_loss_db, updated_at = now()
        WHERE id = p_splice_id AND jc_id = p_jc_id RETURNING id, 'updated' INTO result;
        IF NOT FOUND THEN RAISE EXCEPTION 'Splice not found.'; END IF;
    ELSE
        RAISE EXCEPTION 'Invalid action specified.';
    END IF;
    RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.manage_splice(TEXT, UUID, UUID, UUID, INT, UUID, INT, TEXT, NUMERIC) TO authenticated;

-- Fetches structured JSON for the splice matrix UI, showing all connections at a physical node.
CREATE OR REPLACE FUNCTION public.get_jc_splicing_details(p_jc_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
-- Fetches info about the requested JC
WITH jc_info AS (
  SELECT jc.id, n.name, jc.node_id 
  FROM public.junction_closures jc 
  JOIN public.nodes n ON jc.node_id = n.id 
  WHERE jc.id = p_jc_id
),
-- Finds all JCs at the same node 
all_jcs_at_node AS (
  SELECT id 
  FROM public.junction_closures 
  WHERE node_id = (SELECT node_id FROM jc_info)
), 
-- Finds all segments at the same node 
segments_at_jc AS (
  SELECT 
    cs.id as segment_id, 
    oc.route_name || ' (Seg ' || cs.segment_order || ')' as segment_name, 
    cs.fiber_count
  FROM public.cable_segments cs 
  JOIN public.ofc_cables oc ON cs.original_cable_id = oc.id
  WHERE cs.start_node_id = (SELECT node_id FROM jc_info) 
     OR cs.end_node_id = (SELECT node_id FROM jc_info)
), 
fiber_universe AS (
  SELECT s.segment_id, series.i as fiber_no 
  FROM segments_at_jc s, generate_series(1, s.fiber_count) series(i)
), 
splice_info AS (
  SELECT
    fs.id as splice_id, 
    fs.jc_id, 
    fs.incoming_segment_id, 
    fs.incoming_fiber_no, 
    fs.outgoing_segment_id, 
    fs.outgoing_fiber_no, 
    fs.loss_db,
    (SELECT oc.route_name || ' (Seg ' || cs_out.segment_order || ')' 
     FROM cable_segments cs_out 
     JOIN public.ofc_cables oc ON cs_out.original_cable_id = oc.id 
     WHERE cs_out.id = fs.outgoing_segment_id) as outgoing_segment_name,
    (SELECT oc.route_name || ' (Seg ' || cs_in.segment_order || ')' 
     FROM cable_segments cs_in 
     JOIN public.ofc_cables oc ON cs_in.original_cable_id = oc.id 
     WHERE cs_in.id = fs.incoming_segment_id) as incoming_segment_name
  FROM public.fiber_splices fs 
  WHERE fs.jc_id IN (SELECT id FROM all_jcs_at_node)
)
SELECT jsonb_build_object(
  'junction_closure', (SELECT to_jsonb(j) FROM jc_info j),
  'segments_at_jc', (
    SELECT jsonb_agg(jsonb_build_object(
      'segment_id', seg.segment_id, 
      'segment_name', seg.segment_name, 
      'fiber_count', seg.fiber_count,
      'fibers', (
        SELECT jsonb_agg(jsonb_build_object(
          'fiber_no', fu.fiber_no,
          'status', CASE 
            WHEN s_in.splice_id IS NOT NULL THEN 'used_as_incoming' 
            WHEN s_out.splice_id IS NOT NULL THEN 'used_as_outgoing' 
            ELSE 'available' 
          END,
          'splice_id', COALESCE(s_in.splice_id, s_out.splice_id),
          'connected_to_segment', COALESCE(s_in.outgoing_segment_name, s_out.incoming_segment_name),
          'connected_to_fiber', COALESCE(s_in.outgoing_fiber_no, s_out.incoming_fiber_no),
          'loss_db', COALESCE(s_in.loss_db, s_out.loss_db)
        ) ORDER BY fu.fiber_no)
        FROM fiber_universe fu
        LEFT JOIN splice_info s_in 
          ON fu.segment_id = s_in.incoming_segment_id 
          AND fu.fiber_no = s_in.incoming_fiber_no
        LEFT JOIN splice_info s_out 
          ON fu.segment_id = s_out.outgoing_segment_id 
          AND fu.fiber_no = s_out.outgoing_fiber_no
        WHERE fu.segment_id = seg.segment_id
      )
    ))
    FROM segments_at_jc seg
  )
)
FROM jc_info;
$$;
GRANT EXECUTE ON FUNCTION public.get_jc_splicing_details(UUID) TO authenticated;

-- **THE FIX: Final, correct, robust bi-directional trace function.**
CREATE OR REPLACE FUNCTION public.trace_fiber_path(p_start_segment_id UUID, p_start_fiber_no INT)
RETURNS TABLE (
    step_order BIGINT,
    element_type TEXT,
    element_id UUID,
    element_name TEXT,
    details TEXT,
    fiber_in INT,
    fiber_out INT,
    distance_km NUMERIC,
    loss_db NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE
    trace_forward AS (
        SELECT
            0::bigint as step,
            p_start_segment_id as segment_id,
            p_start_fiber_no as fiber_no,
            ARRAY[]::uuid[] as visited_splices
        UNION ALL
        SELECT
            p.step + 1,
            CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_segment_id ELSE s.incoming_segment_id END,
            CASE WHEN p.segment_id = s.incoming_segment_id THEN s.outgoing_fiber_no ELSE s.incoming_fiber_no END,
            p.visited_splices || s.id
        FROM trace_forward p
        JOIN public.fiber_splices s ON
            (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR
            (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
        WHERE NOT (s.id = ANY(p.visited_splices)) AND p.step < 50
    ),
    trace_backward AS (
        SELECT
            0::bigint as step,
            p_start_segment_id as segment_id,
            p_start_fiber_no as fiber_no,
            ARRAY[]::uuid[] as visited_splices
        UNION ALL
        SELECT
            p.step - 1,
            CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_segment_id ELSE s.outgoing_segment_id END,
            CASE WHEN p.segment_id = s.outgoing_segment_id THEN s.incoming_fiber_no ELSE s.outgoing_fiber_no END,
            p.visited_splices || s.id
        FROM trace_backward p
        JOIN public.fiber_splices s ON
            (p.segment_id = s.incoming_segment_id AND p.fiber_no = s.incoming_fiber_no) OR
            (p.segment_id = s.outgoing_segment_id AND p.fiber_no = s.outgoing_fiber_no)
        WHERE NOT (s.id = ANY(p.visited_splices)) AND p.step > -50
    ),
    full_path AS (
        SELECT step, segment_id, fiber_no FROM trace_forward
        UNION ALL
        SELECT step, segment_id, fiber_no FROM trace_backward WHERE step < 0
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY fp.step) AS step_order,
        'SEGMENT'::TEXT AS element_type,
        cs.id AS element_id,
        oc.route_name AS element_name,
        (sn.name || ' → ' || en.name)::TEXT AS details,
        fp.fiber_no AS fiber_in,
        LEAD(fp.fiber_no) OVER (ORDER BY fp.step) AS fiber_out,
        cs.distance_km,
        NULL::NUMERIC AS loss_db
    FROM
        full_path fp
    JOIN public.cable_segments cs ON fp.segment_id = cs.id
    -- [CORRECTED JOIN]
    JOIN public.ofc_cables oc ON cs.original_cable_id = oc.id
    JOIN public.nodes sn ON cs.start_node_id = sn.id
    JOIN public.nodes en ON cs.end_node_id = en.id
    ORDER BY fp.step;
END;
$$;

-- [CORRECTED GRANT] The name and parameters now match the function definition above.
GRANT EXECUTE ON FUNCTION public.trace_fiber_path(UUID, INT) TO authenticated;

-- Description: Provisions a working and protection fiber pair on a logical path.
CREATE OR REPLACE FUNCTION public.provision_logical_path(
    p_path_name TEXT,
    p_physical_path_id UUID,
    p_working_fiber_no INT,
    p_protection_fiber_no INT,
    p_system_id UUID
)
RETURNS TABLE(working_path_id UUID, protection_path_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_working_path_id UUID;
    v_protection_path_id UUID;
    v_active_status_id UUID;
BEGIN
    -- Get the ID for the 'active' operational status from lookup_types
    SELECT id INTO v_active_status_id FROM public.lookup_types WHERE category = 'OFC_PATH_STATUSES' AND name = 'active' LIMIT 1;
    IF v_active_status_id IS NULL THEN
        RAISE EXCEPTION 'Operational status "active" not found in lookup_types. Please add it to continue.';
    END IF;

    -- Step 1: Create the "working" logical path record
    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, operational_status_id)
    VALUES (p_path_name || ' (Working)', p_system_id, 'working', v_active_status_id) RETURNING id INTO v_working_path_id;

    -- Step 2: Create the "protection" logical path record, linking it to the working path
    INSERT INTO public.logical_fiber_paths (path_name, source_system_id, path_role, working_path_id, operational_status_id)
    VALUES (p_path_name || ' (Protection)', p_system_id, 'protection', v_working_path_id, v_active_status_id) RETURNING id INTO v_protection_path_id;

    -- Step 3: Atomically update all ofc_connections for the working fiber across all segments in the path
    UPDATE public.ofc_connections
    SET
        logical_path_id = v_working_path_id,
        fiber_role = 'working'
    WHERE
        fiber_no_sn = p_working_fiber_no AND
        ofc_id IN (
            SELECT lps.ofc_cable_id FROM public.logical_path_segments lps WHERE lps.logical_path_id = p_physical_path_id
        );

    -- Step 4: Atomically update all ofc_connections for the protection fiber across all segments in the path
    UPDATE public.ofc_connections
    SET
        logical_path_id = v_protection_path_id,
        fiber_role = 'protection'
    WHERE
        fiber_no_sn = p_protection_fiber_no AND
        ofc_id IN (
            SELECT lps.ofc_cable_id FROM public.logical_path_segments lps WHERE lps.logical_path_id = p_physical_path_id
        );

    -- Return the IDs of the newly created paths
    RETURN QUERY SELECT v_working_path_id, v_protection_path_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.provision_logical_path(TEXT, UUID, INT, INT, UUID) TO authenticated;

-- Description: Automatically create 1-to-1 "straight" splices for available fibers between two segments.
CREATE OR REPLACE FUNCTION public.auto_splice_straight_segments(
    p_jc_id UUID, 
    p_segment1_id UUID, 
    p_segment2_id UUID,
    p_loss_db NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    segment1_fibers INT; 
    segment2_fibers INT; 
    i INT; 
    splice_count INT := 0;
    available_fibers_s1 INT[]; 
    available_fibers_s2 INT[];
BEGIN
    -- Get fiber counts for both segments
    SELECT fiber_count INTO segment1_fibers FROM public.cable_segments WHERE id = p_segment1_id;
    SELECT fiber_count INTO segment2_fibers FROM public.cable_segments WHERE id = p_segment2_id;
    
    IF segment1_fibers IS NULL OR segment2_fibers IS NULL THEN 
        RAISE EXCEPTION 'One or both segments not found.'; 
    END IF;

    -- Find available fibers in segment 1
    SELECT array_agg(s.i) INTO available_fibers_s1 
    FROM generate_series(1, segment1_fibers) s(i)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.fiber_splices fs 
        WHERE fs.jc_id = p_jc_id 
        AND (
            (fs.incoming_segment_id = p_segment1_id AND fs.incoming_fiber_no = s.i) 
            OR (fs.outgoing_segment_id = p_segment1_id AND fs.outgoing_fiber_no = s.i)
        )
    );
    
    -- Find available fibers in segment 2
    SELECT array_agg(s.i) INTO available_fibers_s2 
    FROM generate_series(1, segment2_fibers) s(i)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.fiber_splices fs 
        WHERE fs.jc_id = p_jc_id 
        AND (
            (fs.incoming_segment_id = p_segment2_id AND fs.incoming_fiber_no = s.i) 
            OR (fs.outgoing_segment_id = p_segment2_id AND fs.outgoing_fiber_no = s.i)
        )
    );

    -- Create splices for each available fiber pair
    FOR i IN 1..LEAST(cardinality(available_fibers_s1), cardinality(available_fibers_s2)) LOOP
        INSERT INTO public.fiber_splices (
            jc_id, 
            incoming_segment_id, 
            incoming_fiber_no, 
            outgoing_segment_id, 
            outgoing_fiber_no, 
            splice_type,
            loss_db
        )
        VALUES (
            p_jc_id, 
            p_segment1_id, 
            available_fibers_s1[i], 
            p_segment2_id, 
            available_fibers_s2[i], 
            'pass_through',
            p_loss_db
        );
        splice_count := splice_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'status', 'success', 
        'splices_created', splice_count,
        'loss_db_applied', p_loss_db
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.auto_splice_straight_segments(UUID, UUID, UUID, NUMERIC) TO authenticated;

-- Optional: Keep backward compatibility with old function signature
COMMENT ON FUNCTION public.auto_splice_straight_segments(UUID, UUID, UUID, NUMERIC) IS 
'Automatically creates pass-through splices between available fibers on two segments at a junction closure. Applies specified loss_db to all created splices.';

-- Description: Get a list of all cable segments present at a specific Junction Closure.
CREATE OR REPLACE FUNCTION public.get_segments_at_jc(p_jc_id UUID)
RETURNS TABLE (id UUID, original_cable_name TEXT, segment_order INT, fiber_count INT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        cs.id,
        oc.route_name,
        cs.segment_order,
        cs.fiber_count
    FROM public.v_cable_segments_at_jc v_cs
    JOIN public.cable_segments cs ON v_cs.id = cs.id
    JOIN public.ofc_cables oc ON cs.original_cable_id = oc.id
    WHERE v_cs.jc_node_id = (SELECT node_id FROM public.junction_closures WHERE id = p_jc_id);
$$;
GRANT EXECUTE ON FUNCTION public.get_segments_at_jc(UUID) TO authenticated;

-- Description: Get a list of all splices with their full JC and segment details.
CREATE OR REPLACE FUNCTION public.get_all_splices()
RETURNS TABLE (
    splice_id UUID, jc_id UUID, jc_name TEXT, jc_position_km NUMERIC,
    incoming_segment_id UUID, incoming_fiber_no INT, outgoing_segment_id UUID,
    outgoing_fiber_no INT, loss_db NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        s.id, s.jc_id, n.name, jc.position_km,
        s.incoming_segment_id, s.incoming_fiber_no,
        s.outgoing_segment_id, s.outgoing_fiber_no,
        s.loss_db
    FROM public.fiber_splices s
    JOIN public.junction_closures jc ON s.jc_id = jc.id
    JOIN public.nodes n ON jc.node_id = n.id;
$$;
GRANT EXECUTE ON FUNCTION public.get_all_splices() TO authenticated;


```

