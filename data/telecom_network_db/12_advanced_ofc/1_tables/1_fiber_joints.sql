-- 3. New joints table for splice points and T-connections
CREATE TABLE fiber_joints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joint_name TEXT NOT NULL,
  -- ✅ Enforce category + name
  joint_category TEXT NOT NULL DEFAULT 'OFC_JOINT_TYPES',
  joint_type TEXT NOT NULL DEFAULT 'straight',
  CONSTRAINT fk_joint_type FOREIGN KEY (joint_category, joint_type)
    REFERENCES lookup_types(category, name),
  location_description TEXT,
  
  -- Geographic information
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Physical location reference
  node_id UUID REFERENCES nodes (id), -- If joint is at a node location
  maintenance_area_id UUID REFERENCES maintenance_areas (id),
  
  installed_date DATE,
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);