-- path: data/migrations/08_inventory/03_rls.sql
-- Description: Applies Row-Level Security for the inventory module.

-- 1. Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- 2. Grant Permissions
-- Admins and asset_admins can do everything.
GRANT ALL ON public.inventory_items TO admin;
GRANT ALL ON public.inventory_items TO asset_admin;
-- Other authenticated users can only view.
GRANT SELECT ON public.inventory_items TO authenticated;
GRANT SELECT ON public.v_inventory_items TO authenticated, admin, asset_admin, viewer;


-- 3. Create Policies
DROP POLICY IF EXISTS "Admin and Asset Admin full access on inventory" ON public.inventory_items;
CREATE POLICY "Admin and Asset Admin full access on inventory"
ON public.inventory_items
FOR ALL
USING (is_super_admin() OR get_my_role() IN ('admin', 'asset_admin'))
WITH CHECK (is_super_admin() OR get_my_role() IN ('admin', 'asset_admin'));

DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.inventory_items;
CREATE POLICY "Authenticated users can view inventory"
ON public.inventory_items
FOR SELECT
USING (auth.role() = 'authenticated');