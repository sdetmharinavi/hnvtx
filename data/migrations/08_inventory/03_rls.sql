-- path: data/migrations/08_inventory/03_rls.sql
-- Description: Applies Strict Role-Based Access Control (RBAC) for Inventory using specific roles.

-- 1. Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 2. RESET GRANTS
-- Revoke all to ensure we start clean
REVOKE ALL ON public.inventory_items FROM authenticated;
REVOKE ALL ON public.inventory_transactions FROM authenticated;

-- 3. APPLY TABLE LEVEL GRANTS
-- We grant these to 'authenticated' so the API can attempt the operation.
-- RLS policies below will determine if the operation is actually allowed.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;
GRANT SELECT ON public.inventory_transactions TO authenticated; 
-- Note: No INSERT/UPDATE/DELETE grant on transactions for direct API access. 
-- Those happen via SECURITY DEFINER functions only.


-- 4. DEFINE STRICT RLS POLICIES FOR INVENTORY ITEMS

-- Policy: READ (Viewer, Admins, Super Admin)
-- "Viewer" role specifically allows reading. Admins imply read access.
DROP POLICY IF EXISTS "Inventory Read Access" ON public.inventory_items;
CREATE POLICY "Inventory Read Access"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (
  public.is_super_admin() OR 
  public.get_my_role() IN ('viewer', 'admin', 'asset_admin')
);

-- Policy: WRITE (Admin, Asset Admin, Super Admin)
-- Viewers cannot write.
DROP POLICY IF EXISTS "Inventory Write Access" ON public.inventory_items;
CREATE POLICY "Inventory Write Access"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin() OR 
  public.get_my_role() IN ('admin', 'asset_admin')
);

DROP POLICY IF EXISTS "Inventory Update Access" ON public.inventory_items;
CREATE POLICY "Inventory Update Access"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin() OR 
  public.get_my_role() IN ('admin', 'asset_admin')
)
WITH CHECK (
  public.is_super_admin() OR 
  public.get_my_role() IN ('admin', 'asset_admin')
);

-- Policy: DELETE (Super Admin Only)
DROP POLICY IF EXISTS "Inventory Delete Access" ON public.inventory_items;
CREATE POLICY "Inventory Delete Access"
ON public.inventory_items
FOR DELETE
TO authenticated
USING (public.is_super_admin());


-- 5. DEFINE STRICT RLS POLICIES FOR TRANSACTIONS (LOGS)

-- Policy: READ (Viewer, Admins, Super Admin)
DROP POLICY IF EXISTS "Transactions Read Access" ON public.inventory_transactions;
CREATE POLICY "Transactions Read Access"
ON public.inventory_transactions
FOR SELECT
TO authenticated
USING (
  public.is_super_admin() OR 
  public.get_my_role() IN ('viewer', 'admin', 'asset_admin')
);

-- Policy: WRITE/DELETE
-- No policies created. Direct manipulation of the transaction log via API is forbidden.
-- Inserts must happen via the `issue_inventory_item` RPC function.