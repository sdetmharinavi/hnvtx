-- path: data/migrations/08_inventory/04_transactions_setup.sql
-- Description: Adds transaction tracking for inventory and an atomic issue function.

-- 1. Create table to track stock movements
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('ISSUE', 'RESTOCK', 'ADJUSTMENT')),
    quantity INT NOT NULL,
    
    -- Financial snapshot at the time of issue
    unit_cost_at_time NUMERIC(10, 2),
    total_cost_calculated NUMERIC(10, 2),
    
    -- Metadata
    issued_to TEXT,           -- Person or Dept Name
    issue_reason TEXT,
    issued_date DATE DEFAULT CURRENT_DATE,
    
    performed_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Grant access
GRANT SELECT, INSERT ON public.inventory_transactions TO authenticated;

-- 4. Policies
CREATE POLICY "Read transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert transactions" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);


-- 5. SMART RPC FUNCTION: Issue Item
-- This function atomically checks stock, deducts it, calculates cost, and logs the transaction.
CREATE OR REPLACE FUNCTION public.issue_inventory_item(
    p_item_id UUID,
    p_quantity INT,
    p_issued_to TEXT,
    p_issue_reason TEXT,
    p_issued_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_qty INT;
    v_unit_cost NUMERIC(10, 2);
    v_total_cost NUMERIC(10, 2);
    v_item_name TEXT;
BEGIN
    -- 1. Lock the item row and get current details
    SELECT quantity, cost, name 
    INTO v_current_qty, v_unit_cost, v_item_name
    FROM public.inventory_items 
    WHERE id = p_item_id
    FOR UPDATE; -- Locks row to prevent race conditions

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    -- 2. Validate Stock
    IF v_current_qty < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_qty, p_quantity;
    END IF;

    -- 3. Calculate Financials
    -- Handle null cost gracefully (treat as 0)
    v_unit_cost := COALESCE(v_unit_cost, 0);
    v_total_cost := v_unit_cost * p_quantity;

    -- 4. Deduct Stock from Main Table
    UPDATE public.inventory_items
    SET 
        quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_item_id;

    -- 5. Create Transaction Log
    INSERT INTO public.inventory_transactions (
        inventory_item_id,
        transaction_type,
        quantity,
        unit_cost_at_time,
        total_cost_calculated,
        issued_to,
        issue_reason,
        issued_date,
        performed_by_user_id
    ) VALUES (
        p_item_id,
        'ISSUE',
        p_quantity,
        v_unit_cost,
        v_total_cost,
        p_issued_to,
        p_issue_reason,
        p_issued_date,
        auth.uid()
    );

    -- 6. Return success data
    RETURN jsonb_build_object(
        'success', true,
        'item_name', v_item_name,
        'new_quantity', v_current_qty - p_quantity,
        'total_cost_deducted', v_total_cost
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_inventory_item(UUID, INT, TEXT, TEXT, DATE) TO authenticated;

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