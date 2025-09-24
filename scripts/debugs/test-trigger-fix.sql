#!/bin/bash
# Test the fixed trigger functions

echo "=== Testing Fixed Trigger Functions ==="
echo ""

echo "The column ambiguity issue has been fixed by:"
echo "1. Using local variables to store NEW/OLD values"
echo "2. Avoiding direct column references that could be ambiguous"
echo ""

echo "=== SQL COMMANDS TO TEST ==="
echo ""

echo "-- Test 1: Check if functions exist without errors"
echo "SELECT proname, pg_get_function_identity_arguments(oid) as args"
echo "FROM pg_proc"
echo "WHERE proname LIKE 'trigger_%'"
echo "ORDER BY proname;"
echo ""

echo "-- Test 2: Test the INSERT trigger function directly"
echo "SELECT trigger_create_cable_segments_on_jc();"
echo ""

echo "-- Test 3: Test the DELETE trigger function directly"
echo "SELECT trigger_recreate_cable_segments_on_jc_delete();"
echo ""

echo "-- Test 4: Check if triggers are properly attached"
echo "SELECT trigger_name, event_manipulation, action_timing, action_statement"
echo "FROM information_schema.triggers"
echo "WHERE event_object_table = 'junction_closures'"
echo "ORDER BY trigger_name;"
echo ""

echo "=== WHAT SHOULD HAPPEN ==="
echo ""
echo "✅ No 'column reference ambiguous' errors"
echo "✅ Functions execute without syntax errors"
echo "✅ Triggers are properly attached to junction_closures table"
echo "✅ Both INSERT and DELETE triggers are active"
echo ""

echo "=== NEXT STEPS ==="
echo ""
echo "1. Deploy the fixes:"
echo "   npx supabase db push"
echo ""
echo "2. Test JC creation in your app"
echo "3. Check database logs for trigger execution messages"
echo ""

echo "=== DEBUGGING ==="
echo ""
echo "If you still get errors:"
echo "1. Check function syntax: SELECT * FROM pg_proc WHERE proname = 'trigger_create_cable_segments_on_jc';"
echo "2. Test function compilation: SELECT trigger_create_cable_segments_on_jc();"
echo "3. Check trigger attachment: SELECT * FROM pg_trigger WHERE tgrelid = 'junction_closures'::regclass;"
echo "4. Look for compilation errors in Supabase dashboard"
