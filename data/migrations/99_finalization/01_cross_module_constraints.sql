-- Path: supabase/migrations/99_finalization/01_cross_module_constraints.sql
-- Description: Adds all cross-module foreign key constraints after all tables have been created.
-- This script is essential for maintaining referential integrity between different domains.

-- =================================================================
-- Constraint Set 1: Linking Core Infrastructure to Network Systems
-- =================================================================

-- Add the foreign key from ofc_connections (Module 02) to systems (Module 03).
-- This links a physical fiber connection to the network equipment it terminates on.
ALTER TABLE public.ofc_connections
ADD CONSTRAINT fk_ofc_connections_system
FOREIGN KEY (system_id)
REFERENCES public.systems(id)
ON DELETE SET NULL;


-- =================================================================
-- Constraint Set 2: Linking Core Infrastructure to Advanced OFC
-- =================================================================

-- Add the foreign key from ofc_connections (Module 02) to logical_fiber_paths (Module 04).
-- This assigns a physical fiber to a logical end-to-end path.
ALTER TABLE public.ofc_connections
ADD CONSTRAINT fk_ofc_connections_logical_path
FOREIGN KEY (logical_path_id)
REFERENCES public.logical_fiber_paths(id)
ON DELETE SET NULL;


-- =================================================================
-- Constraint Set 3: Linking Network Systems to Advanced OFC
-- =================================================================

-- Add foreign keys from logical_fiber_paths (Module 04) to systems (Module 03).
-- This defines the start and end systems for a logical path.
ALTER TABLE public.logical_fiber_paths
ADD CONSTRAINT fk_lfp_source_system
FOREIGN KEY (source_system_id)
REFERENCES public.systems(id)
ON DELETE SET NULL;

ALTER TABLE public.logical_fiber_paths
ADD CONSTRAINT fk_lfp_destination_system
FOREIGN KEY (destination_system_id)
REFERENCES public.systems(id)
ON DELETE SET NULL;