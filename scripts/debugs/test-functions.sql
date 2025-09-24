-- Test Cable Segmentation Functions
-- Run this in Supabase SQL Editor after deploying functions

-- 1. Check if function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'create_cable_segments_on_jc_add';

-- 2. Test the function with your actual data
-- Replace these IDs with your real junction closure and cable IDs
SELECT * FROM create_cable_segments_on_jc_add(
  '4b57a02e-ec99-4fab-a0fa-8c80f6c6670f',  -- Your JC ID
  '117c7353-99a9-4220-8cfd-0669d93b4f4b'   -- Your cable ID
);

-- 3. Check if segments were created
SELECT * FROM cable_segments
WHERE original_cable_id = '117c7353-99a9-4220-8cfd-0669d93b4f4b';

-- 4. Check function permissions
SELECT grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'create_cable_segments_on_jc_add';

-- 5. Test fiber connections creation
SELECT create_initial_fiber_connections(
  (SELECT id FROM cable_segments WHERE original_cable_id = '117c7353-99a9-4220-8cfd-0669d93b4f4b' LIMIT 1)
);

-- 6. Verify OFC connections were created
SELECT * FROM ofc_connections
WHERE ofc_id = '117c7353-99a9-4220-8cfd-0669d93b4f4b';
