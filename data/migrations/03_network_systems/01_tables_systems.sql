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
  make TEXT,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Consolidated Table for Ring-Based System Details (replaces cpan_systems, maan_systems)
CREATE TABLE IF NOT EXISTS public.ring_based_systems (
  system_id UUID PRIMARY KEY REFERENCES public.systems (id) ON DELETE CASCADE,
  ring_id UUID REFERENCES public.rings (id),
  order_in_ring INTEGER,
  maintenance_area_id UUID REFERENCES public.maintenance_areas (id)
);

-- 3. Generic System Connections Table
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

-- 4. Consolidated Table for SFP-Based Connection Details (replaces cpan_connections, maan_connections)
CREATE TABLE IF NOT EXISTS public.ports_management (
  system_connection_id UUID PRIMARY KEY REFERENCES public.system_connections (id) ON DELETE CASCADE,
  port TEXT,
  port_type_id UUID REFERENCES public.lookup_types (id),
  port_capacity TEXT,
  sfp_serial_no TEXT,
  fiber_in INTEGER,
  fiber_out INTEGER,
  customer_name TEXT,
  bandwidth_allocated_mbps INTEGER,
  commissioned_on DATE,
  remark TEXT
);

-- 5. Dedicated Table for SDH Connection Specific Details
CREATE TABLE IF NOT EXISTS public.sdh_connections (
  system_connection_id UUID PRIMARY KEY REFERENCES public.system_connections (id) ON DELETE CASCADE,
  stm_no TEXT,
  carrier TEXT,
  a_slot TEXT,
  a_customer TEXT,
  b_slot TEXT,
  b_customer TEXT
);