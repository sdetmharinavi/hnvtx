-- Path: migrations/03_network_systems/03_indexes.sql
-- Description: Creates B-tree and GIN (FTS) indexes for the Network Systems module.

-- =================================================================
-- Section 1: Standard B-Tree Indexes
-- =================================================================

-- Indexes for the generic systems table
CREATE INDEX IF NOT EXISTS idx_systems_node_id ON public.systems (node_id);

-- Indexes for the new consolidated tables
CREATE INDEX IF NOT EXISTS idx_ring_based_systems_ring_area ON public.ring_based_systems (ring_id, maintenance_area_id);

-- Indexes for other system-specific tables
CREATE INDEX IF NOT EXISTS idx_systems_make ON public.systems (make);

-- =================================================================
-- Section 2: Full-Text Search (FTS) GIN Indexes
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_systems_remark_fts ON public.systems USING gin(to_tsvector('english', remark));

-- Indexes for the generic systems table (improves v_systems_complete)
CREATE INDEX IF NOT EXISTS idx_systems_system_type_id ON public.systems (system_type_id);
CREATE INDEX IF NOT EXISTS idx_systems_maintenance_terminal_id ON public.systems (maintenance_terminal_id);

-- Indexes for system_connections (improves v_system_connections_complete)
CREATE INDEX IF NOT EXISTS idx_system_connections_system_id ON public.system_connections (system_id);
CREATE INDEX IF NOT EXISTS idx_system_connections_service_id ON public.system_connections (service_id);
CREATE INDEX IF NOT EXISTS idx_system_connections_sn_id ON public.system_connections (sn_id);
CREATE INDEX IF NOT EXISTS idx_system_connections_en_id ON public.system_connections (en_id);

-- =================================================================
-- Section 3: Trigram GIN Indexes (for fast ILIKE searches)
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_systems_name_trgm ON public.systems USING gin (system_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_systems_ip_trgm ON public.systems USING gin ((ip_address::text) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_name_trgm ON public.services USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_system_connections_remark_trgm ON public.system_connections USING gin (remark gin_trgm_ops);