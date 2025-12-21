-- Path: migrations/04_advanced_ofc/03_indexes.sql
-- Description: Creates indexes for the Advanced OFC module tables.

CREATE INDEX IF NOT EXISTS idx_logical_fiber_paths_source_system_id ON public.logical_fiber_paths (source_system_id);
CREATE INDEX IF NOT EXISTS idx_logical_path_segments_path_id ON public.logical_path_segments(logical_path_id);
-- Index for ofc_cables (improves v_ofc_cables_complete)
CREATE INDEX IF NOT EXISTS idx_ofc_cables_sn_id ON public.ofc_cables (sn_id);
CREATE INDEX IF NOT EXISTS idx_ofc_cables_en_id ON public.ofc_cables (en_id);
CREATE INDEX IF NOT EXISTS idx_ofc_cables_ofc_type_id ON public.ofc_cables (ofc_type_id);
CREATE INDEX IF NOT EXISTS idx_ofc_cables_ofc_owner_id ON public.ofc_cables (ofc_owner_id);

-- =================================================================
-- Section 2: Trigram GIN Indexes (for fast ILIKE searches)
-- =================================================================


CREATE INDEX IF NOT EXISTS idx_lfp_path_name_trgm ON public.logical_fiber_paths USING gin (path_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lfp_remark_trgm ON public.logical_fiber_paths USING gin (remark gin_trgm_ops);