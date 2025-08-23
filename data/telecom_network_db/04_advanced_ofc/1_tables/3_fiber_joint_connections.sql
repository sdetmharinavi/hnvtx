-- 5. Junction table for complex fiber routing through joints
CREATE TABLE fiber_joint_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joint_id UUID REFERENCES fiber_joints (id) NOT NULL,
  
  -- Input side
  input_ofc_id UUID REFERENCES ofc_cables (id) NOT NULL,
  input_fiber_no INTEGER NOT NULL,
  
  -- Output side
  output_ofc_id UUID REFERENCES ofc_cables (id) NOT NULL,
  output_fiber_no INTEGER NOT NULL,
  
  -- Connection metadata
  splice_loss_db DECIMAL(5, 3),
  logical_path_id UUID REFERENCES logical_fiber_paths (id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique connections per joint
  UNIQUE(joint_id, input_ofc_id, input_fiber_no),
  UNIQUE(joint_id, output_ofc_id, output_fiber_no)
);