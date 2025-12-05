-- path: data/migrations/08_inventory/02_views.sql
-- Description: Creates a denormalized view for inventory items.

CREATE OR REPLACE VIEW public.v_inventory_items WITH (security_invoker = true) AS
WITH latest_issues AS (
    SELECT DISTINCT ON (inventory_item_id)
        inventory_item_id,
        issued_to,
        issued_date,
        issue_reason,
        created_at as transaction_created_at
    FROM public.inventory_transactions
    WHERE transaction_type = 'ISSUE'
    ORDER BY inventory_item_id, created_at DESC
)
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
    i.cost, -- Unit Cost
    -- Derived Total Value
    (i.quantity * COALESCE(i.cost, 0)) as total_value,
    i.created_at,
    i.updated_at,
    -- Latest Issue Details
    li.issued_to as last_issued_to,
    li.issued_date as last_issued_date,
    li.issue_reason as last_issue_reason
FROM
    public.inventory_items i
LEFT JOIN public.lookup_types cat ON i.category_id = cat.id
LEFT JOIN public.lookup_types stat ON i.status_id = stat.id
LEFT JOIN public.nodes loc ON i.location_id = loc.id
LEFT JOIN public.maintenance_areas floc ON i.functional_location_id = floc.id
LEFT JOIN latest_issues li ON i.id = li.inventory_item_id;

GRANT SELECT ON public.v_inventory_items TO authenticated;



