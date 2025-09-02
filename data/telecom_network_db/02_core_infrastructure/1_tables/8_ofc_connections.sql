-- OFC Connection Details (Fiber connections between nodes)
create table ofc_connections (
  id UUID primary key default gen_random_uuid(),
  ofc_id UUID references ofc_cables (id) not null,
  fiber_no_sn INTEGER NOT NULL, -- Physical fiber number in the cable
  fiber_no_en INTEGER NOT NULL,
  
  -- Technical measurements
  otdr_distance_sn_km DECIMAL(10, 3),
  sn_dom DATE,
  sn_power_dbm DECIMAL(10, 3),
  system_id UUID, -- IMPORTANT: Foreign key to systems table is added in module 03
  
  -- Technical measurements
  otdr_distance_en_km DECIMAL(10, 3),
  en_dom DATE,
  en_power_dbm DECIMAL(10, 3),
  route_loss_db DECIMAL(10, 3),
  
  -- Logical path information
  logical_path_id UUID,
  -- NEW: Define the fiber's role within the logical path
  fiber_role TEXT CHECK (fiber_role IN ('working', 'protection')),
  path_segment_order INTEGER DEFAULT 1, -- Order in multi-segment paths
  source_port TEXT,
  destination_port TEXT,
  
  -- Metadata
  -- ✅ Enforce category + name
  connection_category TEXT NOT NULL DEFAULT 'OFC_JOINT_TYPES',
  connection_type TEXT NOT NULL DEFAULT 'straight',
  CONSTRAINT fk_connection_type FOREIGN KEY (connection_category, connection_type)
    REFERENCES lookup_types(category, name),
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);