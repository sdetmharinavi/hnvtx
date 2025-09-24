-- Check RLS policies and constraints for junction_closures
-- Run this in Supabase SQL Editor

-- 1. Check current user and role
SELECT current_user, session_user;
SELECT current_setting('role');

-- 2. Check RLS policies on junction_closures
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'junction_closures';

-- 3. Check if RLS is enabled on the table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'junction_closures';

-- 4. Check foreign key constraints
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

-- 5. Check triggers on junction_closures
SELECT
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'junction_closures';

-- 6. Test insert with explicit RLS bypass (if you have superuser access)
-- This will tell us if it's an RLS issue
SET ROLE postgres;
INSERT INTO junction_closures (node_id, position_km, ofc_cable_id, name)
VALUES ('3d5c2864-5587-4e8f-a07f-17047e99cf4f', 3.3, '117c7353-99a9-4220-8cfd-0669d93b4f4b', 'Test JC RLS Bypass');
SET ROLE authenticated;

-- 7. Check if insert worked
SELECT * FROM junction_closures
WHERE node_id = '3d5c2864-5587-4e8f-a07f-17047e99cf4f';

-- 8. Clean up
DELETE FROM junction_closures WHERE name = 'Test JC RLS Bypass';
