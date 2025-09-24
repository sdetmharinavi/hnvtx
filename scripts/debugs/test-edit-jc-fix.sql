#!/bin/bash
# Test the edit JC fix

echo "=== Testing Edit JC Fix ==="
echo ""

echo "Fixed edit JC functionality by:"
echo "1. Separated create vs update logic in JcFormModal"
echo "2. Edit mode now uses UPDATE query instead of RPC function"
echo "3. Create mode still uses add_junction_closure RPC function"
echo ""

echo "=== SQL COMMANDS TO TEST ==="
echo ""

echo "-- Test 1: Check current JCs on a cable"
echo "SELECT id, name, node_id, ofc_cable_id, position_km"
echo "FROM junction_closures"
echo "WHERE ofc_cable_id = 'your-cable-id-here'"
echo "ORDER BY position_km;"
echo ""

echo "-- Test 2: Test update operation directly"
echo "SELECT id FROM junction_closures LIMIT 1;"
echo "-- Copy an ID from above and run:"
echo "-- UPDATE junction_closures SET position_km = 10.5 WHERE id = 'your-jc-id-here';"
echo ""

echo "-- Test 3: Verify no duplicates after update"
echo "SELECT COUNT(*) as jc_count, ofc_cable_id"
echo "FROM junction_closures"
echo "GROUP BY ofc_cable_id"
echo "HAVING COUNT(*) > 1;"
echo ""

echo "=== WHAT SHOULD HAPPEN ==="
echo ""
echo "✅ Edit JC updates existing JC instead of creating duplicate"
echo "✅ No more duplicate JCs when editing"
echo "✅ Position and node_id updates work correctly"
echo "✅ Cable segments are properly recreated after edit"
echo ""

echo "=== DEBUGGING ==="
echo ""
echo "If edit still creates duplicates:"
echo "1. Check browser console for 'Updating existing JC' vs 'Creating new JC' logs"
echo "2. Verify the editingJc prop is passed correctly to the modal"
echo "3. Check if the JC ID is available in the editingJc object"
echo "4. Look at Supabase logs for UPDATE vs INSERT operations"
