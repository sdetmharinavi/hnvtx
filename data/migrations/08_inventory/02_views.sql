-- path: data/migrations/08_inventory/02_views.sql
-- Description: Creates a denormalized view for inventory items.

CREATE OR REPLACE VIEW public.v_inventory_items WITH (security_invoker = true) AS
SELECT
    i.id,
    i.asset_no,
    i.name,
    i.description,
    i.category_id,
    cat.name as category_name,
    i.status_id,
    stat.name as status_name,
    i.location_id,
    i.functional_location_id,
    loc.name  as store_location,
    floc.name as functional_location,
    i.quantity,
    i.purchase_date,
    i.vendor,
    i.cost,
    i.created_at,
    i.updated_at
FROM
    public.inventory_items i
LEFT JOIN public.lookup_types cat ON i.category_id = cat.id
LEFT JOIN public.lookup_types stat ON i.status_id = stat.id
LEFT JOIN public.maintenance_areas loc ON i.location_id = loc.id
LEFT JOIN public.nodes floc ON i.functional_location_id = floc.id;

