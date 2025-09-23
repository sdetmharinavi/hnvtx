-- Path: supabase/cleanup/00_reverse_finalization.sql
-- Description: Removes cross-module foreign key constraints first.

ALTER TABLE public.ofc_connections DROP CONSTRAINT IF EXISTS fk_ofc_connections_system;
ALTER TABLE public.ofc_connections DROP CONSTRAINT IF EXISTS fk_ofc_connections_logical_path;
ALTER TABLE public.logical_fiber_paths DROP CONSTRAINT IF EXISTS fk_lfp_source_system;
ALTER TABLE public.logical_fiber_paths DROP CONSTRAINT IF EXISTS fk_lfp_destination_system;