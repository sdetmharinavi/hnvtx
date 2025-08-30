-- =================================================================
-- Add Cross-Module Foreign Key Constraints
-- =================================================================
-- This script adds foreign key constraints that link tables from
-- earlier modules (like core_infrastructure) to tables created
-- within this module. This avoids dependency errors during the
-- initial schema creation.
-- =================================================================

-- Add the foreign key from ofc_connections (module 02) to logical_fiber_paths (module 04)
ALTER TABLE public.ofc_connections
ADD CONSTRAINT fk_ofc_connections_logical_path
FOREIGN KEY (logical_path_id) 
REFERENCES public.logical_fiber_paths(id)
ON DELETE SET NULL; -- Optional: Defines behavior if a logical path is deleted


-- Add FKs from logical_fiber_paths (module 02) to systems (module 03)
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