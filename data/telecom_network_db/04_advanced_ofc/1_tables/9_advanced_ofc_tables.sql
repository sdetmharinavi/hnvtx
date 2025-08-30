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

-- 2. Logical Fiber Paths Table
CREATE TABLE logical_fiber_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_name TEXT,
  source_system_id UUID REFERENCES systems (id) ON DELETE SET NULL, -- Deferred, see constraints module
  source_port TEXT,
  destination_system_id UUID REFERENCES systems (id) ON DELETE SET NULL, -- Deferred
  destination_port TEXT,
  total_distance_km DECIMAL(10, 3),
  total_loss_db DECIMAL(10, 3),
  path_category TEXT NOT NULL DEFAULT 'OFC_PATH_TYPES',
  path_type TEXT NOT NULL DEFAULT 'Point-to-Point',
  CONSTRAINT fk_path_type FOREIGN KEY (path_category, path_type) REFERENCES lookup_types(category, name),
  service_type TEXT,
  bandwidth_gbps INTEGER,
  wavelength_nm INTEGER,
  operational_status_category TEXT NOT NULL DEFAULT 'OFC_PATH_STATUSES',
  operational_status TEXT NOT NULL DEFAULT 'planned',
  CONSTRAINT fk_operational_status FOREIGN KEY (operational_status_category, operational_status) REFERENCES lookup_types(category, name),
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