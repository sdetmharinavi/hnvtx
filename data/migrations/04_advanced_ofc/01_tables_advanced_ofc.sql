-- Path: migrations/04_advanced_ofc/01_tables_advanced_ofc.sql
-- Description: Defines tables for advanced OFC path and splice management.

-- Represents a physical junction closure (splice box) along an OFC route.
CREATE TABLE IF NOT EXISTS public.junction_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    ofc_cable_id UUID REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    position_km NUMERIC(10, 3),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.junction_closures IS 'Physical junction closures (splice boxes) along OFC routes.';
COMMENT ON COLUMN public.junction_closures.ofc_cable_id IS 'The primary OFC cable this JC is physically located on.';
COMMENT ON COLUMN public.junction_closures.position_km IS 'The distance in kilometers from the start node of the ofc_cable.';

-- Represents abstract fiber joints not tied to a specific cable's distance.
CREATE TABLE IF NOT EXISTS public.fiber_joints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joint_name TEXT NOT NULL,
  joint_category TEXT NOT NULL DEFAULT 'OFC_JOINT_TYPES',
  joint_type TEXT NOT NULL DEFAULT 'straight',
  CONSTRAINT fk_joint_type FOREIGN KEY (joint_category, joint_type) REFERENCES public.lookup_types(category, name),
  location_description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  node_id UUID REFERENCES public.nodes (id),
  maintenance_area_id UUID REFERENCES public.maintenance_areas (id),
  installed_date DATE,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Represents the logical end-to-end path for a service or connection.
CREATE TABLE IF NOT EXISTS public.logical_fiber_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_name TEXT,
  working_path_id UUID REFERENCES public.logical_fiber_paths(id) ON DELETE SET NULL,
  path_role TEXT NOT NULL DEFAULT 'working' CHECK (path_role IN ('working', 'protection')),
  path_type_id UUID REFERENCES public.lookup_types(id) ON DELETE SET NULL,
  source_system_id UUID, -- NOTE: FK added in 99_finalization
  destination_system_id UUID, -- NOTE: FK added in 99_finalization
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

-- Links a logical path to its physical segments (cables or joints).
CREATE TABLE IF NOT EXISTS public.logical_path_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logical_path_id UUID NOT NULL REFERENCES public.logical_fiber_paths(id) ON DELETE CASCADE,
  ofc_cable_id UUID REFERENCES public.ofc_cables(id),
  fiber_joint_id UUID REFERENCES public.fiber_joints(id),
  path_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((ofc_cable_id IS NOT NULL AND fiber_joint_id IS NULL) OR (ofc_cable_id IS NULL AND fiber_joint_id IS NOT NULL)),
  UNIQUE (logical_path_id, path_order)
);

-- Tracks every single fiber connection (splice) inside a Junction Closure.
CREATE TABLE IF NOT EXISTS public.fiber_splices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jc_id UUID NOT NULL REFERENCES public.junction_closures(id) ON DELETE CASCADE,
    incoming_cable_id UUID NOT NULL REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    incoming_fiber_no INT NOT NULL,
    outgoing_cable_id UUID REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    outgoing_fiber_no INT,
    splice_type TEXT NOT NULL DEFAULT 'pass_through' CHECK (splice_type IN ('pass_through', 'branch', 'termination')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'faulty', 'reserved')),
    logical_path_id UUID REFERENCES public.logical_fiber_paths(id) ON DELETE SET NULL,
    loss_db NUMERIC(5, 2),
    otdr_length_km NUMERIC(10, 3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT unique_incoming_fiber_in_jc UNIQUE (jc_id, incoming_cable_id, incoming_fiber_no),
    CONSTRAINT unique_outgoing_fiber_in_jc UNIQUE (jc_id, outgoing_cable_id, outgoing_fiber_no),
    CONSTRAINT check_no_self_splice CHECK (incoming_cable_id <> outgoing_cable_id OR incoming_fiber_no <> outgoing_fiber_no)
);
COMMENT ON TABLE public.fiber_splices IS 'Tracks individual fiber connections (splices) within a junction closure.';
COMMENT ON COLUMN public.fiber_splices.splice_type IS 'Type of splice: pass_through, branch, or termination (if outgoing is NULL).';
COMMENT ON COLUMN public.fiber_splices.otdr_length_km IS 'The measured OTDR distance in kilometers for the incoming fiber arriving at this splice.';