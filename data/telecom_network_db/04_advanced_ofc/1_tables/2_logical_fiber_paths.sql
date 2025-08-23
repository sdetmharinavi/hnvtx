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