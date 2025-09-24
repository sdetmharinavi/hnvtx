#!/bin/bash
# Manual test script for cable segmentation

echo "=== Manual Cable Segmentation Test ==="
echo "This script helps you test the cable segmentation functions manually."
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Please run this script from your Supabase project directory"
    exit 1
fi

echo "✅ Found Supabase project"

echo ""
echo "📋 Manual Testing Steps:"
echo ""

echo "1. Open Supabase Dashboard → SQL Editor"
echo ""

echo "2. Test if the function exists:"
echo "   SELECT * FROM pg_proc WHERE proname = 'create_cable_segments_on_jc_add';"
echo ""

echo "3. Test the function with your actual data:"
echo "   -- Replace these with your actual IDs"
echo "   SELECT * FROM create_cable_segments_on_jc_add("
echo "     '4b57a02e-ec99-4fab-a0fa-8c80f6c6670f',  -- Your JC ID"
echo "     '117c7353-99a9-4220-8cfd-0669d93b4f4b'   -- Your cable ID"
echo "   );"
echo ""

echo "4. Check if segments were created:"
echo "   SELECT * FROM cable_segments"
echo "   WHERE original_cable_id = '117c7353-99a9-4220-8cfd-0669d93b4f4b';"
echo ""

echo "5. If function doesn't exist, deploy it:"
echo "   supabase db push"
echo ""

echo "6. Check function permissions:"
echo "   SELECT * FROM information_schema.role_routine_grants"
echo "   WHERE routine_name = 'create_cable_segments_on_jc_add';"
echo ""

echo "🔍 Expected Results:"
echo "- Function should return a table with created segments"
echo "- cable_segments table should have new rows"
echo "- No errors should be thrown"
echo ""

echo "If you see errors, check:"
echo "- Function exists in database"
echo "- Function has proper permissions"
echo "- JC and cable IDs are valid"
echo "- Cable doesn't already have segments (or function handles recreation)"
