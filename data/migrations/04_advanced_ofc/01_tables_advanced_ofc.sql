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
