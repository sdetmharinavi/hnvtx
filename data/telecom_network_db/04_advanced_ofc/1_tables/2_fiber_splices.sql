-- This is the most critical new table. It tracks every single fiber connection inside a JC.
-- It completely replaces the logic of your old `ofc_connections` table.
-- =================================================================
CREATE TABLE IF NOT EXISTS public.fiber_splices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jc_id UUID NOT NULL REFERENCES public.junction_closures(id) ON DELETE CASCADE,

    -- Incoming Fiber
    incoming_cable_id UUID NOT NULL REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    incoming_fiber_no INT NOT NULL,

    -- Outgoing Fiber (can be null for termination)
    outgoing_cable_id UUID REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    outgoing_fiber_no INT,

    -- Metadata
    splice_type TEXT NOT NULL DEFAULT 'pass_through' CHECK (splice_type IN ('pass_through', 'branch', 'termination')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'faulty', 'reserved')),
    logical_path_id UUID REFERENCES public.logical_fiber_paths(id) ON DELETE SET NULL,
    loss_db NUMERIC(5, 2),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ,

    -- CONSTRAINTS: A fiber can only be used ONCE as an input and ONCE as an output within a single JC.
    CONSTRAINT unique_incoming_fiber_in_jc UNIQUE (jc_id, incoming_cable_id, incoming_fiber_no),
    CONSTRAINT unique_outgoing_fiber_in_jc UNIQUE (jc_id, outgoing_cable_id, outgoing_fiber_no)
);
COMMENT ON TABLE public.fiber_splices IS 'Tracks individual fiber connections (splices) within a junction closure.';
COMMENT ON COLUMN public.fiber_splices.splice_type IS 'Type of splice: pass_through, branch, or termination (if outgoing is NULL).';

-- Enable RLS on the new tables
ALTER TABLE public.junction_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiber_splices ENABLE ROW LEVEL SECURITY;

-- Apply the updated_at trigger to the new tables
CREATE TRIGGER handle_updated_at_junction_closures BEFORE UPDATE ON public.junction_closures
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER handle_updated_at_fiber_splices BEFORE UPDATE ON public.fiber_splices
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
