-- Debug Cable Segmentation Issue
-- Run this in Supabase SQL Editor to test functions

-- Step 1: Check if function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'create_cable_segments_on_jc_add';

-- Step 2: Get your latest JC and its cable ID
SELECT id, ofc_cable_id, position_km, name
FROM junction_closures
ORDER BY created_at DESC
LIMIT 1;

-- Step 3: Get the cable details
SELECT id, route_name, capacity, current_rkm, sn_id, en_id
FROM ofc_cables
WHERE id = 'your-cable-id-from-step-2';

-- Step 4: Test the function with your actual IDs
-- Replace 'your-jc-id' and 'your-cable-id' with actual values from above
SELECT * FROM create_cable_segments_on_jc_add(
  'your-jc-id',
  'your-cable-id'
);

-- Step 5: Check if segments were created
SELECT * FROM cable_segments
WHERE original_cable_id = 'your-cable-id';

-- Step 6: Check function permissions
SELECT grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'create_cable_segments_on_jc_add';

-- Step 7: Check if there are any existing segments for this cable
SELECT COUNT(*) as existing_segments
FROM cable_segments
WHERE original_cable_id = 'your-cable-id';

-- Step 8: Check the junction closures for this cable
SELECT id, position_km, name
FROM junction_closures
WHERE ofc_cable_id = 'your-cable-id'
ORDER BY position_km;
