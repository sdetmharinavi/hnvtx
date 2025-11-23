-- Path: migrations/03_network_systems/01_tables_systems.sql
-- Description: Defines tables for generic and specific network systems.

-- 1. Generic Systems Table (e.g., CPAN, MAAN, SDH etc.)
CREATE TABLE IF NOT EXISTS public.systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_type_id UUID REFERENCES public.lookup_types (id) NOT NULL,
  maan_node_id TEXT, 
  node_id UUID REFERENCES public.nodes (id) NOT NULL,
  system_name TEXT,
  system_capacity_id UUID REFERENCES public.lookup_types (id),
  is_hub BOOLEAN DEFAULT false,
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

-- 2. Consolidated Table for Ring-Based System Details
-- THE FIX: Changed the primary key from just system_id to a composite key of (system_id, ring_id).
-- This correctly models the many-to-many relationship, allowing a system to exist in multiple rings.
CREATE TABLE IF NOT EXISTS public.ring_based_systems (
  system_id UUID NOT NULL REFERENCES public.systems (id) ON DELETE CASCADE,
  ring_id UUID NOT NULL REFERENCES public.rings (id) ON DELETE CASCADE,
  order_in_ring NUMERIC,
  maintenance_area_id UUID REFERENCES public.maintenance_areas (id),
  CONSTRAINT ring_based_systems_pkey PRIMARY KEY (system_id, ring_id)
);

-- 3. Consolidated Table for SFP-Based Connection Details (replaces cpan_connections, maan_connections)
CREATE TABLE IF NOT EXISTS public.ports_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES public.systems (id) ON DELETE CASCADE,
  port TEXT,
  port_type_id UUID REFERENCES public.lookup_types (id),
  port_capacity TEXT,
  sfp_serial_no TEXT,
  CONSTRAINT uq_system_port UNIQUE (system_id, port)
);

-- 4. Generic System Connections Table
CREATE TABLE IF NOT EXISTS public.system_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID REFERENCES public.systems (id) NOT NULL,
  system_working_interface TEXT,
  system_protection_interface TEXT,
  sn_id UUID REFERENCES public.systems (id),
  sn_ip INET,
  sn_interface TEXT,
  en_id UUID REFERENCES public.systems (id),
  en_ip INET,
  en_interface TEXT,
  connected_link_type_id UUID REFERENCES public.lookup_types (id),
  media_type_id UUID REFERENCES public.lookup_types (id),
  bandwidth TEXT,
  vlan TEXT,
  -- UPDATED: These now store arrays of fiber IDs
  working_fiber_in_ids UUID[],
  working_fiber_out_ids UUID[],
  protection_fiber_in_ids UUID[],
  protection_fiber_out_ids UUID[],
  customer_name TEXT,
  bandwidth_allocated TEXT,
  commissioned_on DATE,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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