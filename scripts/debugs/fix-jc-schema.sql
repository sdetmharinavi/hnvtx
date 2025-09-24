-- Check junction_closures table schema and fix the issue
-- Run this in Supabase SQL Editor

-- 1. Check the actual table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'junction_closures'
ORDER BY ordinal_position;

-- 2. Check if the table has a name column
SELECT COUNT(*) as has_name_column
FROM information_schema.columns
WHERE table_name = 'junction_closures' AND column_name = 'name';

-- 3. If name column doesn't exist, add it
-- Uncomment the line below if needed:
/*
ALTER TABLE junction_closures
ADD COLUMN IF NOT EXISTS name TEXT;
*/

-- 4. Check current junction closures data
SELECT id, node_id, position_km, ofc_cable_id, name
FROM junction_closures
ORDER BY created_at DESC
LIMIT 5;

-- 5. Test the exact insert that's failing
INSERT INTO junction_closures (node_id, position_km, ofc_cable_id, name)
VALUES ('4d2b0dc9-f63a-4a6d-8fdc-ddb7d44875a7', 4.1, '117c7353-99a9-4220-8cfd-0669d93b4f4b', 'Test JC Name');

-- 6. Verify the insert worked
SELECT * FROM junction_closures
WHERE name = 'Test JC Name';

-- 7. Clean up test data
DELETE FROM junction_closures WHERE name = 'Test JC Name';
