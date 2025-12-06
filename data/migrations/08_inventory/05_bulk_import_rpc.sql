-- path: data/migrations/data/migrations/08_inventory/05_bulk_import_rpc.sql
-- Description: Smart Bulk Import that handles ADD, ISSUE, and SET operations.

CREATE OR REPLACE FUNCTION public.bulk_import_inventory_smart(
    p_items JSONB -- Array of objects including 'transaction_type', 'issued_to', etc.
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record JSONB;
    v_category_id UUID;
    v_status_id UUID;
    v_location_id UUID;
    v_func_loc_id UUID;
    v_item_id UUID;
    
    v_qty INT;
    v_cost NUMERIC;
    v_trans_type TEXT;
    v_current_qty INT;
    v_delta INT;
    
    v_success_count INT := 0;
    v_error_count INT := 0;
    v_errors JSONB := '[]'::JSONB;
    v_user_id UUID := auth.uid();
BEGIN
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        BEGIN
            -- 1. Parse Inputs
            v_qty := (COALESCE(item_record->>'quantity', '0'))::INT;
            v_cost := (COALESCE(item_record->>'cost', '0'))::NUMERIC;
            v_trans_type := UPPER(COALESCE(item_record->>'transaction_type', 'ADD')); -- Default to ADD

            -- 2. Resolve Lookups
            SELECT id INTO v_category_id FROM public.lookup_types 
            WHERE category = 'INVENTORY_CATEGORY' AND name ILIKE (item_record->>'category') LIMIT 1;
            
            SELECT id INTO v_status_id FROM public.lookup_types 
            WHERE category = 'INVENTORY_STATUS' AND name ILIKE (item_record->>'status') LIMIT 1;
            
            SELECT id INTO v_location_id FROM public.nodes 
            WHERE name ILIKE (item_record->>'location') LIMIT 1;
            
            SELECT id INTO v_func_loc_id FROM public.maintenance_areas 
            WHERE name ILIKE (item_record->>'functional_location') LIMIT 1;

            -- 3. Upsert Item (Create or Get ID)
            INSERT INTO public.inventory_items (
                asset_no, name, description, category_id, status_id, 
                location_id, functional_location_id, 
                quantity, -- Initial qty if new
                vendor, cost, purchase_date
            ) VALUES (
                NULLIF(item_record->>'asset_no', ''),
                item_record->>'name',
                item_record->>'description',
                v_category_id,
                v_status_id,
                v_location_id,
                v_func_loc_id,
                CASE WHEN v_trans_type = 'SET' THEN v_qty ELSE 0 END, -- If SET, init with val, else 0
                item_record->>'vendor',
                v_cost,
                (NULLIF(item_record->>'purchase_date', ''))::DATE
            )
            ON CONFLICT (asset_no) 
            DO UPDATE SET
                updated_at = NOW() -- We update quantity explicitly below
            RETURNING id, quantity INTO v_item_id, v_current_qty;

            -- 4. Handle Transaction Logic
            IF v_trans_type = 'ISSUE' THEN
                -- Check stock
                IF v_current_qty < v_qty THEN
                    RAISE EXCEPTION 'Insufficient stock for asset %. Curr: %, Req: %', (item_record->>'asset_no'), v_current_qty, v_qty;
                END IF;
                
                -- Update Master Table
                UPDATE public.inventory_items SET quantity = quantity - v_qty WHERE id = v_item_id;
                
                -- Log Transaction
                INSERT INTO public.inventory_transactions (
                    inventory_item_id, transaction_type, quantity, 
                    unit_cost_at_time, total_cost_calculated, 
                    issued_to, issue_reason, performed_by_user_id, issued_date
                ) VALUES (
                    v_item_id, 'ISSUE', v_qty, 
                    v_cost, (v_qty * v_cost), 
                    item_record->>'issued_to', 
                    COALESCE(item_record->>'issue_reason', 'Bulk Issue'), 
                    v_user_id,
                    COALESCE((NULLIF(item_record->>'transaction_date', ''))::DATE, CURRENT_DATE)
                );

            ELSIF v_trans_type = 'SET' THEN
                -- Calculate Adjustment
                v_delta := v_qty - v_current_qty;
                
                IF v_delta != 0 THEN
                    -- Update Master Table
                    UPDATE public.inventory_items SET quantity = v_qty WHERE id = v_item_id;
                    
                    -- Log Adjustment
                    INSERT INTO public.inventory_transactions (
                        inventory_item_id, transaction_type, quantity, 
                        unit_cost_at_time, total_cost_calculated, 
                        issue_reason, performed_by_user_id
                    ) VALUES (
                        v_item_id, 'ADJUSTMENT', ABS(v_delta), 
                        v_cost, (ABS(v_delta) * v_cost), 
                        'Stock Correction (Bulk Set)', 
                        v_user_id
                    );
                END IF;

            ELSE -- 'ADD' / 'RESTOCK'
                -- Update Master Table
                UPDATE public.inventory_items SET quantity = quantity + v_qty WHERE id = v_item_id;

                -- Log Transaction
                INSERT INTO public.inventory_transactions (
                    inventory_item_id, transaction_type, quantity, 
                    unit_cost_at_time, total_cost_calculated, 
                    issue_reason, performed_by_user_id, issued_date
                ) VALUES (
                    v_item_id, 'RESTOCK', v_qty, 
                    v_cost, (v_qty * v_cost), 
                    COALESCE(item_record->>'issue_reason', 'Bulk Restock'), 
                    v_user_id,
                    COALESCE((NULLIF(item_record->>'transaction_date', ''))::DATE, CURRENT_DATE)
                );
            END IF;

            v_success_count := v_success_count + 1;

        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_errors := v_errors || jsonb_build_object(
                'asset', item_record->>'asset_no',
                'error', SQLERRM
            );
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success_count', v_success_count,
        'error_count', v_error_count,
        'errors', v_errors
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_import_inventory_smart(JSONB) TO authenticated;