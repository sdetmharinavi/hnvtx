#!/bin/bash
# Debug script to test cable segmentation functions

echo "=== Testing Cable Segmentation Functions ==="
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
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

# Test if the functions exist
echo "Testing create_cable_segments_on_jc_add function..."
supabase db reset --linked

echo ""
echo "📋 Manual debugging steps:"
echo "1. Check if functions are deployed to Supabase:"
echo "   - Go to Supabase Dashboard → Database → Functions"
echo "   - Look for 'create_cable_segments_on_jc_add'"
echo ""
echo "2. Test function manually in Supabase SQL Editor:"
echo "   SELECT * FROM create_cable_segments_on_jc_add('your-jc-id', 'your-cable-id');"
echo ""
echo "3. Check if cable_segments table has data:"
echo "   SELECT * FROM cable_segments WHERE original_cable_id = 'your-cable-id';"
echo ""
echo "4. Check function permissions:"
echo "   SELECT * FROM pg_proc WHERE proname = 'create_cable_segments_on_jc_add';"
echo ""
echo "🔧 If functions are missing, redeploy them:"
echo "supabase db push"
