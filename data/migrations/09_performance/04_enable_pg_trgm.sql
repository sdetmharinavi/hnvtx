-- path: data/migrations/09_performance/04_enable_pg_trgm.sql
-- Description: Enables pg_trgm extension and adds GIN indexes for high-performance text search.

-- 1. Enable the extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add Trigram Indexes to heavily searched text columns
-- Using GIN indexes with gin_trgm_ops allows for fast ILIKE '%term%' queries.

-- Systems
CREATE INDEX IF NOT EXISTS idx_systems_name_trgm ON public.systems USING gin (system_name gin_trgm_ops);
-- THE FIX: Wrapped the expression (ip_address::text) in parentheses
CREATE INDEX IF NOT EXISTS idx_systems_ip_trgm ON public.systems USING gin ((ip_address::text) gin_trgm_ops);

-- Nodes
CREATE INDEX IF NOT EXISTS idx_nodes_name_trgm ON public.nodes USING gin (name gin_trgm_ops);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_name_trgm ON public.employees USING gin (employee_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_employees_pers_no_trgm ON public.employees USING gin (employee_pers_no gin_trgm_ops);

-- OFC Cables
CREATE INDEX IF NOT EXISTS idx_ofc_cables_name_trgm ON public.ofc_cables USING gin (route_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ofc_cables_asset_trgm ON public.ofc_cables USING gin (asset_no gin_trgm_ops);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_items_name_trgm ON public.inventory_items USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_items_asset_trgm ON public.inventory_items USING gin (asset_no gin_trgm_ops);

-- Services
CREATE INDEX IF NOT EXISTS idx_services_name_trgm ON public.services USING gin (name gin_trgm_ops);

-- Rings
CREATE INDEX IF NOT EXISTS idx_rings_name_trgm ON public.rings USING gin (name gin_trgm_ops);

-- Analyze to update query planner statistics
ANALYZE public.systems;
ANALYZE public.nodes;
ANALYZE public.employees;
ANALYZE public.ofc_cables;
ANALYZE public.inventory_items;
ANALYZE public.services;
ANALYZE public.rings;