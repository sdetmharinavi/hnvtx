-- path: data/migrations/06_utilities/09_upsert_ring_associations.sql
-- Description: A powerful function to upsert ring associations from a JSONB payload.

CREATE OR REPLACE FUNCTION public.upsert_ring_associations_from_json(
    p_ring_id UUID,
    p_associations JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    assoc_item JSONB;
    v_system_id UUID;
BEGIN
    -- First, remove all existing associations for this ring
    DELETE FROM public.ring_based_systems WHERE ring_id = p_ring_id;

    -- Loop through the provided JSON array of associations
    FOR assoc_item IN SELECT * FROM jsonb_array_elements(p_associations)
    LOOP
        -- Find the system_id based on the provided system name
        SELECT id INTO v_system_id FROM public.systems WHERE system_name = (assoc_item->>'system');

        IF v_system_id IS NOT NULL THEN
            -- Insert the new association into the junction table
            INSERT INTO public.ring_based_systems (ring_id, system_id, order_in_ring)
            VALUES (
                p_ring_id,
                v_system_id,
                (assoc_item->>'order')::NUMERIC
            );

            -- Update the is_hub status on the systems table itself
            UPDATE public.systems
            SET is_hub = (assoc_item->>'is_hub')::BOOLEAN
            WHERE id = v_system_id;
        END IF;
    END LOOP;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.upsert_ring_associations_from_json(UUID, JSONB) TO authenticated;