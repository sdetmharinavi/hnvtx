-- =================================================================
-- GRANTS FOR NEW AND RELEVANT VIEWS
-- =================================================================
-- This script grants SELECT permissions on specific views required for
-- the OFC Details and Route Manager features.
-- =================================================================

-- Grant permissions for the complete OFC cables view.
-- This is essential for the Route Manager's dropdown and route details.
GRANT SELECT ON public.v_ofc_cables_complete TO viewer;
GRANT SELECT ON public.v_ofc_cables_complete TO admin;

-- Grant permissions for the complete OFC connections view.
-- This is used on the OFC details page.
GRANT SELECT ON public.v_ofc_connections_complete TO viewer;
GRANT SELECT ON public.v_ofc_connections_complete TO admin;

-- Grant permissions for the complete nodes view.
-- This is used as a relation by other views.
GRANT SELECT ON public.v_nodes_complete TO viewer;
GRANT SELECT ON public.v_nodes_complete TO admin;

-- Grant permissions for the detailed path view.
-- This is required for the upcoming fiber tracing feature.
GRANT SELECT ON public.v_system_ring_paths_detailed TO viewer;
GRANT SELECT ON public.v_system_ring_paths_detailed TO admin;

-- Grant permissions for the cable utilization view (used in future dashboards).
GRANT SELECT ON public.v_cable_utilization TO viewer;
GRANT SELECT ON public.v_cable_utilization TO admin;

-- Grant permissions for the end-to-end paths view.
GRANT SELECT ON public.v_end_to_end_paths TO viewer;
GRANT SELECT ON public.v_end_to_end_paths TO admin;

-- Also, ensure the underlying tables have the correct grants for the viewer role.
-- Your existing policies script likely handles this, but we add it here for safety.
GRANT ALL ON public.junction_closures TO admin;
GRANT ALL ON public.fiber_splices TO admin;
GRANT ALL ON public.ofc_cables TO admin;
GRANT ALL ON public.nodes TO admin;
GRANT SELECT ON public.junction_closures TO viewer;
GRANT SELECT ON public.fiber_splices TO viewer;
GRANT SELECT ON public.ofc_cables TO viewer;
GRANT SELECT ON public.nodes TO viewer;
