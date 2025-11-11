-- path: data/migrations/06_utilities/10_disassociate_system.sql
-- Description: Creates a function to safely disassociate a single system from a ring.

CREATE OR REPLACE FUNCTION public.disassociate_system_from_ring(
    p_ring_id UUID,
    p_system_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete the specific association from the junction table.
    DELETE FROM public.ring_based_systems
    WHERE ring_id = p_ring_id AND system_id = p_system_id;
END;
$$;

-- Grant execution permission to authenticated users.
GRANT EXECUTE ON FUNCTION public.disassociate_system_from_ring(UUID, UUID) TO authenticated;