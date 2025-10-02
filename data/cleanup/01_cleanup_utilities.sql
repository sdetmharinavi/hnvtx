-- path: data/cleanup/01_cleanup_utilities.sql
-- Description: Drops all generic utility, dashboard, and pagination functions. [UPDATED]

-- Drop Generic Pagination and Helper Functions
DROP FUNCTION IF EXISTS public.get_paged_data(TEXT, INT, INT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.build_where_clause(JSONB, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.column_exists(TEXT, TEXT, TEXT);

-- Drop Dashboard and Search Functions
DROP FUNCTION IF EXISTS public.get_dashboard_overview();
DROP FUNCTION IF EXISTS public.search_nodes_for_select(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_bsnl_dashboard_data(TEXT, BOOLEAN, TEXT[], TEXT[], TEXT[], TEXT[]);

-- Drop Generic Data Operation Functions
DROP FUNCTION IF EXISTS public.execute_sql(TEXT);
DROP FUNCTION IF EXISTS public.aggregate_query(TEXT, JSONB, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.get_unique_values(TEXT, TEXT, JSONB, JSONB, INTEGER);
DROP FUNCTION IF EXISTS public.bulk_update(TEXT, JSONB);
DROP FUNCTION IF EXISTS public.get_entity_counts(TEXT, JSONB);

-- Drop Lookup Functions
DROP FUNCTION IF EXISTS public.get_lookup_type_id(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.add_lookup_type(TEXT, TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_lookup_types_by_category(TEXT);

-- Drop Specialized OFC and Path Functions
DROP FUNCTION IF EXISTS public.get_system_path_details(UUID);
DROP FUNCTION IF EXISTS public.get_continuous_available_fibers(UUID);
DROP FUNCTION IF EXISTS public.find_cable_between_nodes(UUID, UUID);
DROP FUNCTION IF EXISTS public.validate_ring_path(UUID);
DROP FUNCTION IF EXISTS public.provision_ring_path(TEXT, UUID, INT, INT, UUID);
DROP FUNCTION IF EXISTS public.deprovision_logical_path(UUID);
DROP FUNCTION IF EXISTS public.provision_logical_path(TEXT, UUID, INT, INT, UUID);
DROP FUNCTION IF EXISTS public.auto_splice_straight_segments(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.manage_splice(TEXT, UUID, UUID, UUID, INT, UUID, INT, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS public.get_segments_at_jc(UUID);
DROP FUNCTION IF EXISTS public.get_all_splices();
DROP FUNCTION IF EXISTS public.get_jc_splicing_details(UUID);
DROP FUNCTION IF EXISTS public.trace_fiber_path(UUID, INT);