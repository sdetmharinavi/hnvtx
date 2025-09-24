-- Debug Database RLS and Constraints
-- Run this in Supabase SQL Editor to identify the issue

-- Step 1: Check current user
SELECT current_user, session_user;

-- Step 2: Check if the node_id exists
SELECT id, name, node_type
FROM nodes
WHERE id = '89b1df6b-da29-4bc9-86b0-b60ad3876589';

-- Step 3: Check RLS policies on junction_closures
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'junction_closures';

-- Step 4: Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.table_name = 'junction_closures'
    AND tc.constraint_type = 'FOREIGN KEY';

-- Step 5: Test the exact insert that's failing
-- This will show us the exact error
INSERT INTO junction_closures (node_id, position_km, ofc_cable_id, name)
VALUES ('89b1df6b-da29-4bc9-86b0-b60ad3876589', 2.3, '117c7353-99a9-4220-8cfd-0669d93b4f4b', 'Test JC from SQL');

-- Step 6: Check if insert worked
SELECT * FROM junction_closures
WHERE node_id = '89b1df6b-da29-4bc9-86b0-b60ad3876589';

-- Step 7: Clean up test data
DELETE FROM junction_closures WHERE name = 'Test JC from SQL';
