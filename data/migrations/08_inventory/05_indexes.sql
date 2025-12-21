-- path: migrations/08_inventory/05_indexes.sql
-- Description: Creates indexes for the Inventory module.

CREATE INDEX IF NOT EXISTS idx_inventory_items_name_trgm ON public.inventory_items USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_items_asset_trgm ON public.inventory_items USING gin (asset_no gin_trgm_ops);