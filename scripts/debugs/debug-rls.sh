#!/bin/bash
# Debug RLS and database constraints

echo "=== Database RLS and Constraints Debug ==="
echo "Issue identified: Query returns null data and null error"
echo "This typically means RLS policies are blocking the insert"
echo ""

echo "🔍 Check these in Supabase Dashboard:"
echo "1. Go to Database → Tables → junction_closures"
echo "2. Check Row Level Security policies"
echo "3. Look for any triggers on the table"
echo "4. Check foreign key constraints"
echo ""

echo "📋 Manual test queries:"
echo "1. Test basic insert:"
echo "   INSERT INTO junction_closures (node_id, position_km, ofc_cable_id, name)"
echo "   VALUES ('test-jc-id', 1.0, '117c7353-99a9-4220-8cfd-0669d93b4f4b', 'Test JC');"
echo ""

echo "2. Check if insert actually worked:"
echo "   SELECT * FROM junction_closures WHERE node_id = 'test-jc-id';"
echo ""

echo "3. Check RLS policies:"
echo "   SELECT * FROM pg_policies WHERE tablename = 'junction_closures';"
echo ""

echo "4. Check current user permissions:"
echo "   SELECT current_user;"
echo "   SELECT session_user;"
echo ""

echo "🔧 Most likely issues:"
echo "1. RLS policy requires authenticated user"
echo "2. RLS policy blocks based on ofc_cable_id ownership"
echo "3. Foreign key constraint on node_id"
echo "4. Unique constraint violation"
echo ""

echo "🎯 Quick fix test:"
echo "Try inserting with a different node_id or check if the node_id exists:"
echo "   SELECT * FROM nodes WHERE id = '89b1df6b-da29-4bc9-86b0-b60ad3876589';"
echo ""

echo "If the node doesn't exist, that's likely the issue!"
