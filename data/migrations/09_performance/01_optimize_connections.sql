-- Path: data/migrations/09_performance/01_optimize_connections.sql
-- Description: Adds missing indexes to improve performance of complex views like v_ofc_connections_complete.

-- Indexes for foreign keys in ofc_connections that are used in joins
CREATE INDEX IF NOT EXISTS idx_ofc_connections_updated_sn_id ON public.ofc_connections (updated_sn_id);
CREATE INDEX IF NOT EXISTS idx_ofc_connections_updated_en_id ON public.ofc_connections (updated_en_id);
CREATE INDEX IF NOT EXISTS idx_ofc_connections_system_id ON public.ofc_connections (system_id);

-- Ensure foreign keys in ofc_cables are indexed (used in the view)
CREATE INDEX IF NOT EXISTS idx_ofc_cables_sn_id ON public.ofc_cables (sn_id);
CREATE INDEX IF NOT EXISTS idx_ofc_cables_en_id ON public.ofc_cables (en_id);
CREATE INDEX IF NOT EXISTS idx_ofc_cables_ofc_type_id ON public.ofc_cables (ofc_type_id);
CREATE INDEX IF NOT EXISTS idx_ofc_cables_maintenance_terminal_id ON public.ofc_cables (maintenance_terminal_id);

-- Analyze tables to update statistics for the query planner
ANALYZE public.ofc_connections;
ANALYZE public.ofc_cables;