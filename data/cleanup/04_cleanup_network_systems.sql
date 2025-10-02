-- path: data/cleanup/04_cleanup_network_systems.sql
-- Description: Drops all objects related to the Network Systems module. [UPDATED]

-- Drop Functions first
DROP FUNCTION IF EXISTS public.upsert_system_with_details(TEXT, UUID, UUID, BOOLEAN, INET, UUID, DATE, TEXT, TEXT, UUID, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_ring_system_associations(UUID, UUID[]);

-- Drop Views first as they depend on the tables.
DROP VIEW IF EXISTS public.v_systems_complete;
DROP VIEW IF EXISTS public.v_system_connections_complete;
DROP VIEW IF EXISTS public.v_ring_nodes;
DROP VIEW IF EXISTS public.v_rings;
-- v_ofc_connections_complete is dropped in the core module cleanup.

-- Drop Tables (in reverse order of dependency)
-- The satellite tables depend on the main 'systems' and 'system_connections' tables.
DROP TABLE IF EXISTS public.sfp_based_connections CASCADE;
DROP TABLE IF EXISTS public.sdh_connections CASCADE;
DROP TABLE IF EXISTS public.vmux_connections CASCADE;
DROP TABLE IF EXISTS public.ring_based_systems CASCADE;

DROP TABLE IF EXISTS public.sdh_node_associations CASCADE;
DROP TABLE IF EXISTS public.sdh_systems CASCADE;
DROP TABLE IF EXISTS public.vmux_systems CASCADE;

DROP TABLE IF EXISTS public.management_ports CASCADE;
DROP TABLE IF EXISTS public.system_connections CASCADE;
DROP TABLE IF EXISTS public.systems CASCADE;