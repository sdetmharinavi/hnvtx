#!/bin/bash
# Actual test script for cable segmentation functions

echo "=== Cable Segmentation Function Test ==="
echo "Testing if database functions are deployed and working..."
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it:"
    echo "npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
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

echo "2. Test function with your data:"
echo "   -- Replace with your actual IDs"
echo "   SELECT * FROM create_cable_segments_on_jc_add("
echo "     '4b57a02e-ec99-4fab-a0fa-8c80f6c6670f',  -- Your JC ID"
echo "     '117c7353-99a9-4220-8cfd-0669d93b4f4b'   -- Your cable ID"
echo "   );"
echo ""

echo "3. Check if segments were created:"
echo "   SELECT * FROM cable_segments"
echo "   WHERE original_cable_id = '117c7353-99a9-4220-8cfd-0669d93b4f4b';"
echo ""

echo "4. Check function permissions:"
echo "   SELECT grantee, privilege_type"
echo "   FROM information_schema.role_routine_grants"
echo "   WHERE routine_name = 'create_cable_segments_on_jc_add';"
echo ""

echo "🔍 Expected Results:"
echo "- Query 1 should return 'create_cable_segments_on_jc_add'"
echo "- Query 3 should show created segments"
echo "- Query 4 should show function permissions"
echo ""

echo "If you see 'function does not exist' errors, the functions need to be deployed:"
echo "   supabase db push"
echo ""

echo "🎯 Next: Test in your app"
echo "1. Go to Route Manager"
echo "2. Add a new Junction Closure"
echo "3. Check browser console for debug logs"
echo "4. Verify cable segments appear in database"
