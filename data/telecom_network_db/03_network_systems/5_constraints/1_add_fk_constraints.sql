-- =================================================================
-- Add Cross-Module Foreign Key Constraints for Network Systems
-- =================================================================
-- This script adds foreign key constraints that link tables from
-- earlier modules to tables created within this module.
-- =================================================================

-- Add the foreign key from ofc_connections (module 02) to systems (module 03)
ALTER TABLE public.ofc_connections
ADD CONSTRAINT fk_ofc_connections_system
FOREIGN KEY (system_id) 
REFERENCES public.systems(id)
ON DELETE SET NULL; -- If a system is deleted, set the reference in ofc_connections to NULL