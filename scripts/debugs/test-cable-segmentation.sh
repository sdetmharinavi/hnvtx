#!/bin/bash
# Quick test to verify cable segmentation is working

echo "=== Cable Segmentation Test ==="
echo "Run this after deploying the database functions"
echo ""

echo "1. Install Supabase CLI:"
echo "   npm install -g supabase"
echo ""

echo "2. Deploy functions:"
echo "   cd /home/au/Desktop/gitClones/new_hnvtx/hnvtx"
echo "   supabase db push"
echo ""

echo "3. Test the functions in Supabase SQL Editor:"
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

echo "5. Test in your app:"
echo "   - Go to Route Manager"
echo "   - Add a new Junction Closure"
echo "   - Check browser console for debug logs"
echo "   - Verify cable segments appear"
echo ""

echo "Expected results:"
echo "- Database function returns segment data"
echo "- cable_segments table has new rows"
echo "- Browser console shows successful execution"
echo "- UI shows success message"
