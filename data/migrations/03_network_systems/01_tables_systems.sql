-- Path: migrations/03_network_systems/01_tables_systems.sql
-- Description: Defines tables for generic and specific network systems.

-- 1. Generic Systems Table (e.g., CPAN, MAAN, SDH etc.)
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