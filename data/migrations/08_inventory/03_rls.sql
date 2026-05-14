-- path: data/migrations/08_inventory/03_rls.sql
-- Description: Applies Strict Role-Based Access Control (RBAC) for Inventory. [REVISED FOR ADMIN_PRO & SYNTAX CORRECTION]

-- =================================================================
-- Section 1: Enable RLS & Define Table-Level Grants
-- =================================================================

-- Enable RLS on both tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ---- GRANTS FOR inventory_items ----
-- Full control for roles that manage inventory data.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO admin, admin_pro, asset_admin;
-- Read-only access for the viewer role.
GRANT SELECT ON public.inventory_items TO viewer;

-- ---- GRANTS FOR inventory_transactions ----
-- Read-only access for all roles that can see inventory.
GRANT SELECT ON public.inventory_transactions TO admin, admin_pro, asset_admin, viewer;


-- =================================================================
-- Section 2: RLS Policies for inventory_items
-- =================================================================

-- Drop old policies for idempotency
DROP POLICY IF EXISTS "policy_read_inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "policy_update_inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "policy_insert_inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "policy_delete_inventory_items" ON public.inventory_items;

-- Policy 1: Read Access
CREATE POLICY "policy_read_inventory_items"
ON public.inventory_items
FOR SELECT
USING (
  is_super_admin() OR
  get_my_role() IN ('viewer', 'admin', 'admin_pro', 'asset_admin')
);

-- [CORRECTED] Policy 2: Update Access
-- Allows updating items by roles with management privileges.
CREATE POLICY "policy_update_inventory_items"
ON public.inventory_items
FOR UPDATE
USING (
  is_super_admin() OR
  get_my_role() IN ('admin', 'admin_pro', 'asset_admin')
)
WITH CHECK (
  is_super_admin() OR
  get_my_role() IN ('admin', 'admin_pro', 'asset_admin')
);

-- [CORRECTED] Policy 3: Insert Access
-- Allows creating items by roles with management privileges.
CREATE POLICY "policy_insert_inventory_items"
ON public.inventory_items
FOR INSERT
WITH CHECK (
  is_super_admin() OR
  get_my_role() IN ('admin', 'admin_pro', 'asset_admin')
);

-- Policy 4: Delete Access
CREATE POLICY "policy_delete_inventory_items"
ON public.inventory_items
FOR DELETE
USING (
  is_super_admin() OR
  get_my_role() IN ('admin_pro', 'asset_admin')
);

-- =================================================================
-- Section 3: RLS Policies for inventory_transactions (Logs)
-- =================================================================

DROP POLICY IF EXISTS "policy_read_inventory_transactions" ON public.inventory_transactions;

-- Policy 1: Read Access
CREATE POLICY "policy_read_inventory_transactions"
ON public.inventory_transactions
FOR SELECT
USING (
  is_super_admin() OR
  get_my_role() IN ('viewer', 'admin', 'admin_pro', 'asset_admin')
);

-- =================================================================
-- Section 4: Grants for Views
-- =================================================================
GRANT SELECT ON public.v_inventory_items TO authenticated;
GRANT SELECT ON public.v_inventory_transactions_extended TO authenticated;