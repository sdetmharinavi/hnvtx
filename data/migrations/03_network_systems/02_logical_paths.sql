
CREATE TABLE IF NOT EXISTS public.logical_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ring_id UUID REFERENCES public.rings(id) ON DELETE CASCADE,
    start_node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
    end_node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'unprovisioned', -- e.g., unprovisioned, partially, provisioned
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_ring_path UNIQUE (ring_id, start_node_id, end_node_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logical_paths_ring_id ON public.logical_paths(ring_id);
CREATE INDEX IF NOT EXISTS idx_logical_paths_status ON public.logical_paths(status);