-- path: data/cleanup/03_cleanup_advanced_ofc.sql
-- Description: Drops all objects related to the Advanced OFC module. [UPDATED]

-- Drop Functions first, using CASCADE for trigger functions to remove dependent triggers.
DROP FUNCTION IF EXISTS public.add_junction_closure(UUID, NUMERIC, UUID);
DROP FUNCTION IF EXISTS public.recalculate_segments_for_cable(UUID);
DROP FUNCTION IF EXISTS public.commit_route_evolution(UUID, JSONB);
DROP FUNCTION IF EXISTS public.delete_path_segment_and_reorder(UUID, UUID);

-- ** Add CASCADE to drop dependent triggers automatically.**
DROP FUNCTION IF EXISTS public.manage_cable_segments() CASCADE;

-- Drop Views
DROP VIEW IF EXISTS public.v_junction_closures_complete;
DROP VIEW IF EXISTS public.v_cable_segments_at_jc;
DROP VIEW IF EXISTS public.v_end_to_end_paths;
DROP VIEW IF EXISTS public.v_system_ring_paths_detailed;
DROP VIEW IF EXISTS public.v_cable_utilization;

-- Drop Tables (in reverse order of dependency)
-- The CASCADE on these table drops will handle their own indexes, policies, and constraints.
DROP TABLE IF EXISTS public.fiber_splices CASCADE;
DROP TABLE IF EXISTS public.logical_path_segments CASCADE;
DROP TABLE IF EXISTS public.logical_fiber_paths CASCADE;
DROP TABLE IF EXISTS public.cable_segments CASCADE;
DROP TABLE IF EXISTS public.junction_closures CASCADE;