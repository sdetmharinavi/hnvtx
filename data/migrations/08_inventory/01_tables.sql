-- path: data/migrations/08_inventory/01_tables.sql
-- Description: Creates the table for the inventory management module.

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_no TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.lookup_types(id) ON DELETE SET NULL,
    status_id UUID REFERENCES public.lookup_types(id) ON DELETE SET NULL,
    location_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
    functional_location_id UUID REFERENCES public.maintenance_areas(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    purchase_date DATE,
    vendor TEXT,
    cost NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);