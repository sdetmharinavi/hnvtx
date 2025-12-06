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

CREATE OR REPLACE VIEW public.v_inventory_transactions_extended WITH (security_invoker = true) AS
SELECT
    t.id,
    t.inventory_item_id,
    t.transaction_type, -- 'ISSUE', 'RESTOCK', 'ADJUSTMENT'
    t.quantity,
    t.unit_cost_at_time,
    t.total_cost_calculated,
    t.issued_to,
    t.issue_reason,
    t.issued_date,
    t.created_at,
    t.performed_by_user_id,
    p.full_name as performed_by_name,
    p.email as performed_by_email,
    i.name as item_name,
    i.asset_no
FROM
    public.inventory_transactions t
LEFT JOIN public.v_user_profiles_extended p ON t.performed_by_user_id = p.id
LEFT JOIN public.inventory_items i ON t.inventory_item_id = i.id;

GRANT SELECT ON public.v_inventory_transactions_extended TO authenticated;



