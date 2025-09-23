-- Path: supabase/cleanup/03_cleanup_advanced_ofc.sql
-- Description: Drops all objects related to the Advanced OFC module.

-- Drop Views
DROP VIEW IF EXISTS public.v_end_to_end_paths;
DROP VIEW IF EXISTS public.v_system_ring_paths_detailed;
DROP VIEW IF EXISTS public.v_cable_utilization;

-- Drop Tables (in reverse order of dependency)
-- fiber_splices depends on junction_closures, logical_fiber_paths, and ofc_cables.
-- logical_path_segments depends on logical_fiber_paths.
-- junction_closures depends on ofc_cables.
-- The CASCADE will handle dependencies within this group.
DROP TABLE IF EXISTS public.fiber_splices CASCADE;
DROP TABLE IF EXISTS public.logical_path_segments CASCADE;
DROP TABLE IF EXISTS public.logical_fiber_paths CASCADE;
DROP TABLE IF EXISTS public.fiber_joints CASCADE;
DROP TABLE IF EXISTS public.junction_closures CASCADE;