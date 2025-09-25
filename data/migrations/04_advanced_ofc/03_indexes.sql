-- Path: migrations/04_advanced_ofc/03_indexes.sql
-- Description: Creates indexes for the Advanced OFC module tables.

CREATE INDEX IF NOT EXISTS idx_logical_fiber_paths_source_system_id ON public.logical_fiber_paths (source_system_id);
CREATE INDEX IF NOT EXISTS idx_logical_path_segments_path_id ON public.logical_path_segments(logical_path_id);