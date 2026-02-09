-- path: data/migrations/04_advanced_ofc/09_cable_links.sql
-- Description: Adds Many-to-Many relationship for OFC Cables and updates the complete view.

-- 1. Create Junction Table for Linking Cables
CREATE TABLE IF NOT EXISTS public.ofc_cable_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cable_id_1 UUID NOT NULL REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    cable_id_2 UUID NOT NULL REFERENCES public.ofc_cables(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Prevent self-linking
    CONSTRAINT check_not_self_link CHECK (cable_id_1 <> cable_id_2),
    -- Ensure unique pair (order independent uniqueness requires unique index on least/greatest, handled via application logic or complex index, simpler here to just allow unique id)
    CONSTRAINT uq_cable_link_pair UNIQUE (cable_id_1, cable_id_2)
);

-- Enable RLS
ALTER TABLE public.ofc_cable_links ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.ofc_cable_links TO admin, admin_pro, ofc_admin;
GRANT SELECT ON public.ofc_cable_links TO authenticated;

-- Policies
CREATE POLICY "policy_admin_all_ofc_cable_links" ON public.ofc_cable_links
FOR ALL TO admin, admin_pro, ofc_admin
USING (true) WITH CHECK (true);

CREATE POLICY "policy_authenticated_select_ofc_cable_links" ON public.ofc_cable_links
FOR SELECT TO authenticated
USING (true);
