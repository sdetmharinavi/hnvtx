-- Represents a physical junction closure (splice box) along an OFC route.
CREATE TABLE IF NOT EXISTS public.junction_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    ofc_cable_id UUID REFERENCES public.ofc_cables(id) ON DELETE CASCADE, -- The main cable this JC is physically located on
    position_km NUMERIC(10, 3), -- Distance in KM from the start of the ofc_cable
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

COMMENT ON TABLE public.junction_closures IS 'Physical junction closures (splice boxes) along OFC routes.';
COMMENT ON COLUMN public.junction_closures.ofc_cable_id IS 'The primary OFC cable this JC is physically located on.';
COMMENT ON COLUMN public.junction_closures.position_km IS 'The distance in kilometers from the start node of the ofc_cable.';
