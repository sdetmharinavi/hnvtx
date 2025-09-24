#!/bin/bash
# Test database functions directly

echo "=== Database Functions Test ==="
echo "This script tests if the cable segmentation functions are deployed to Supabase."
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from your Supabase project directory"
    exit 1
fi

echo "✅ Found Supabase project"

echo ""
echo "🔍 Testing database functions..."

# Test if the functions exist by checking the database
echo ""
echo "📋 Please run these commands in your Supabase SQL Editor:"
echo ""

echo "1. Check if function exists:"
echo "   SELECT routine_name"
echo "   FROM information_schema.routines"
echo "   WHERE routine_name = 'create_cable_segments_on_jc_add';"
echo ""

echo "2. Check function definition:"
echo "   SELECT pg_get_function_identity_arguments(oid) as arguments"
echo "   FROM pg_proc"
echo "   WHERE proname = 'create_cable_segments_on_jc_add';"
echo ""

echo "3. Test function with your data:"
echo "   -- Replace with your actual IDs"
echo "   SELECT * FROM create_cable_segments_on_jc_add("
echo "     '4b57a02e-ec99-4fab-a0fa-8c80f6c6670f',  -- Your JC ID"
echo "     '117c7353-99a9-4220-8cfd-0669d93b4f4b'   -- Your cable ID"
echo "   );"
echo ""

echo "4. Check if segments were created:"
echo "   SELECT * FROM cable_segments"
echo "   WHERE original_cable_id = '117c7353-99a9-4220-8cfd-0669d93b4f4b';"
echo ""

echo "5. Check function permissions:"
echo "   SELECT grantee, privilege_type"
echo "   FROM information_schema.role_routine_grants"
echo "   WHERE routine_name = 'create_cable_segments_on_jc_add';"
echo ""

echo "6. If function doesn't exist, deploy it:"
echo "   supabase db push"
echo ""

echo "🔍 Expected Results:"
echo "- Query 1 should return 'create_cable_segments_on_jc_add'"
echo "- Query 2 should show function arguments"
echo "- Query 3 should return segment data (or empty if no segments created)"
echo "- Query 4 should show any created segments"
echo "- Query 5 should show function permissions"
echo ""

echo "If you see 'function does not exist' errors, the functions need to be deployed:"
echo "   supabase db push"
