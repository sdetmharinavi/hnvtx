-- OFC Connection Details (Fiber connections between nodes)
create table ofc_connections (
  id UUID primary key default gen_random_uuid(),
  ofc_id UUID references ofc_cables (id) not null,
  fiber_no_sn INTEGER NOT NULL, -- Physical fiber number in the cable
  -- Technical measurements
  otdr_distance_sn_km DECIMAL(10, 3),
  sn_dom DATE,
  sn_power_dbm DECIMAL(10, 3),
  system_sn_id UUID references systems (id),
  fiber_no_en INTEGER,
  -- Technical measurements
  otdr_distance_en_km DECIMAL(10, 3),
  en_dom DATE,
  en_power_dbm DECIMAL(10, 3),
  route_loss_db DECIMAL(10, 3),
  -- Logical path information
  logical_path_id UUID, -- Groups fibers that form a single logical connection
  path_segment_order INTEGER DEFAULT 1, -- Order in multi-segment paths
  -- Connection endpoints (can be nodes or systems)
  source_type TEXT CHECK (source_type IN ('nodes', 'systems')),
  source_id UUID, -- References nodes or systems table
  source_port TEXT,
  destination_type TEXT CHECK (destination_type IN ('nodes', 'systems')),
  destination_id UUID,
  destination_port TEXT,
  -- Metadata
  connection_type TEXT DEFAULT 'straight' CHECK (connection_type IN ('straight', 'splice', 't_joint', 'cross_connect')),
  remark TEXT,
  status BOOLEAN DEFAULT true,
  created_at timestamp with time zone default NOW(),
  updated_at timestamp with time zone default NOW()
);