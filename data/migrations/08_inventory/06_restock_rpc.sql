-- path: data/migrations/08_inventory/06_restock_rpc.sql
-- Description: Smart RPC Function: Restock Item. Atomically adds stock, updates cost, and logs the transaction.

CREATE OR REPLACE FUNCTION public.restock_inventory_item(
    p_item_id UUID,
    p_quantity INT,
    p_source TEXT,
    p_reason TEXT,
    p_date DATE DEFAULT CURRENT_DATE,
    p_unit_cost NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_qty INT;
    v_current_cost NUMERIC(10, 2);
    v_total_cost NUMERIC(10, 2);
    v_item_name TEXT;
    v_final_cost NUMERIC(10, 2);
BEGIN
    -- 1. Lock the item row and get current details
    SELECT quantity, cost, name 
    INTO v_current_qty, v_current_cost, v_item_name
    FROM public.inventory_items 
    WHERE id = p_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    -- 2. Determine Cost to apply
    -- If a new unit cost is provided, we update the master cost (latest replacement cost).
    IF p_unit_cost IS NOT NULL THEN
        v_final_cost := p_unit_cost;
    ELSE
        v_final_cost := COALESCE(v_current_cost, 0);
    END IF;

    v_total_cost := v_final_cost * p_quantity;

    -- 3. Add Stock to Main Table
    UPDATE public.inventory_items
    SET 
        quantity = quantity + p_quantity,
        cost = v_final_cost,
        updated_at = NOW()
    WHERE id = p_item_id;

    -- 4. Create Transaction Log
    INSERT INTO public.inventory_transactions (
        inventory_item_id,
        transaction_type,
        quantity,
        unit_cost_at_time,
        total_cost_calculated,
        issued_to, -- Used generically for "Party" (Source/Destination)
        issue_reason,
        issued_date,
        performed_by_user_id
    ) VALUES (
        p_item_id,
        'RESTOCK',
        p_quantity,
        v_final_cost,
        v_total_cost,
        p_source,
        p_reason,
        p_date,
        auth.uid()
    );

    -- 5. Return success data
    RETURN jsonb_build_object(
        'success', true,
        'item_name', v_item_name,
        'new_quantity', v_current_qty + p_quantity,
        'total_cost_added', v_total_cost
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.restock_inventory_item(UUID, INT, TEXT, TEXT, DATE, NUMERIC) TO authenticated;