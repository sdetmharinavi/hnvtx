-- This table will store the physical JC boxes. We'll rename your `fiber_joints` table concept to this for clarity.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.junction_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    jc_type_id UUID REFERENCES public.lookup_types(id) ON DELETE SET NULL,
    capacity INT NOT NULL DEFAULT 24, -- Max number of splices
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    ofc_cable_id UUID REFERENCES public.ofc_cables(id) ON DELETE CASCADE, -- The main cable this JC is installed on
    position_km NUMERIC, -- Optional: Distance in KM from the start of the ofc_cable
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT fk_jc_type
        FOREIGN KEY(jc_type_id)
        REFERENCES public.lookup_types(id)
        ON DELETE SET NULL
);
COMMENT ON TABLE public.junction_closures IS 'Physical junction closures (splice boxes) along OFC routes.';
COMMENT ON COLUMN public.junction_closures.ofc_cable_id IS 'The primary OFC cable this JC is physically located on.';
COMMENT ON COLUMN public.junction_closures.position_km IS 'The distance in kilometers from the start node of the ofc_cable.';
