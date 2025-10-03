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