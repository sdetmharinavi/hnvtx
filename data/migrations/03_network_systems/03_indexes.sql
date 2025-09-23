-- Path: supabase/migrations/03_network_systems/03_indexes.sql
-- Description: Creates B-tree and GIN (FTS) indexes for the Network Systems module.

-- =================================================================
-- Section 1: Standard B-Tree Indexes
-- =================================================================

-- Indexes for the generic systems table
CREATE INDEX IF NOT EXISTS idx_systems_node_id ON public.systems (node_id);

-- Indexes for the new consolidated tables
CREATE INDEX IF NOT EXISTS idx_ring_based_systems_ring_area ON public.ring_based_systems (ring_id, maintenance_area_id);
CREATE INDEX IF NOT EXISTS idx_sfp_based_connections_customer ON public.sfp_based_connections (customer_name);

-- Indexes for other system-specific tables
CREATE INDEX IF NOT EXISTS idx_sdh_systems_make ON public.sdh_systems (make);

-- =================================================================
-- Section 2: Full-Text Search (FTS) GIN Indexes
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_systems_remark_fts ON public.systems USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_system_connections_remark_fts ON public.system_connections USING gin(to_tsvector('english', remark));
CREATE INDEX IF NOT EXISTS idx_management_ports_remark_fts ON public.management_ports USING gin(to_tsvector('english', remark));