#!/bin/bash
# Debug cable segmentation issue

echo "=== Cable Segmentation Debug ==="
echo "JC created but no segments in cable_segments table"
echo ""

# Check if Supabase CLI is available via npx
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm first"
    exit 1
fi

echo "✅ npx found - will use npx supabase"

echo ""
echo "🔍 Let's debug step by step..."
echo ""

echo "1. Check if functions are deployed:"
echo "   - Go to Supabase Dashboard → Database → Functions"
echo "   - Look for 'create_cable_segments_on_jc_add'"
echo ""

echo "2. Test function manually in SQL Editor:"
echo "   -- First, get your actual JC and cable IDs from the database"
echo "   SELECT id, ofc_cable_id FROM junction_closures ORDER BY created_at DESC LIMIT 1;"
echo ""

echo "3. Test with actual IDs:"
echo "   -- Replace these with your real IDs"
echo "   SELECT * FROM create_cable_segments_on_jc_add("
echo "     'your-actual-jc-id',"
echo "     'your-actual-cable-id'"
echo "   );"
echo ""

echo "4. Check if segments were created:"
echo "   SELECT * FROM cable_segments WHERE original_cable_id = 'your-actual-cable-id';"
echo ""

echo "5. Check function logs:"
echo "   -- Look for any error messages in the function output"
echo ""

echo "🔍 Browser Console Check:"
echo "1. Open browser DevTools (F12)"
echo "2. Go to Console tab"
echo "3. Add a JC through Route Manager"
echo "4. Look for these logs:"
echo "   === JC FORM SUBMIT DEBUG ==="
echo "   === CREATE CABLE SEGMENTS DEBUG ==="
echo "5. Check if you see function call results"
echo ""

echo "🎯 If functions don't exist:"
echo "   npx supabase db push"
echo ""

echo "📝 If functions exist but don't work:"
echo "   - Check function permissions"
echo "   - Test with your actual data"
echo "   - Look for error messages"
