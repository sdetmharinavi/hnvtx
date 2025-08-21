-- 4. Logical paths table (end-to-end connectivity)
CREATE TABLE logical_fiber_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_name VARCHAR(100),
  
  -- End-to-end connectivity
  source_system_id UUID REFERENCES systems (id),
  source_port VARCHAR(50),
  destination_system_id UUID REFERENCES systems (id),
  destination_port VARCHAR(50),
  
  -- Path characteristics
  total_distance_km DECIMAL(10, 3),
  total_loss_db DECIMAL(10, 3),
  path_type VARCHAR(20) DEFAULT 'Point-to-Point' CHECK (path_type IN ('lookup_types')),
  
  -- Service information
  service_type VARCHAR(50),
  bandwidth_gbps INTEGER,
  wavelength_nm INTEGER,
  
  -- Status and metadata
  operational_status VARCHAR(20) DEFAULT 'planned' CHECK (operational_status IN ('planned', 'active', 'maintenance', 'fault', 'decommissioned')),
  commissioned_date DATE,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);