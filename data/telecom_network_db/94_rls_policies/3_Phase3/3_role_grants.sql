-- Grant full access to admin
GRANT ALL ON public.fiber_joints TO admin;
GRANT ALL ON public.logical_fiber_paths TO admin;
GRANT ALL ON public.fiber_joint_connections TO admin;

-- Grant read-only (SELECT) access to viewer on all tables
GRANT SELECT ON public.fiber_joints TO viewer;
GRANT SELECT ON public.logical_fiber_paths TO viewer;
GRANT SELECT ON public.fiber_joint_connections TO viewer;