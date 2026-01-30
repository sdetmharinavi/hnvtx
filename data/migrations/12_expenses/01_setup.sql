-- path: data/migrations/12_expenses/01_setup.sql

-- 1. Advances Table (The "Parent" record, e.g., the 16000rs advance)
CREATE TABLE IF NOT EXISTS public.advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    req_no TEXT NOT NULL UNIQUE, -- e.g., T00001277390
    employee_id UUID REFERENCES public.employees(id), -- To whom the advance was issued
    amount DECIMAL(10, 2) NOT NULL,
    advance_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'settled', 'pending')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Expenses Table (The transactions against the advance)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_id UUID REFERENCES public.advances(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    spent_by_employee_id UUID REFERENCES public.employees(id),
    category TEXT, -- e.g., PT-PT, RENTAL, FUEL
    vendor TEXT, -- e.g., OLA, INDRIVE
    invoice_no TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    terminal_location TEXT, -- e.g., HNV TM
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. Grants
GRANT ALL ON public.advances TO admin, admin_pro;
GRANT SELECT ON public.advances TO authenticated;
GRANT ALL ON public.expenses TO admin, admin_pro;
GRANT SELECT ON public.expenses TO authenticated;

-- 5. Policies (Standard Open for Authenticated for simplicity, refine as needed)
CREATE POLICY "Allow full access to authenticated users on advances" ON public.advances FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to authenticated users on expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Trigger for updated_at
CREATE TRIGGER trigger_advances_updated_at BEFORE UPDATE ON public.advances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Triggers for Audit Log
CREATE TRIGGER advances_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.advances FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();
CREATE TRIGGER expenses_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.log_data_changes();

-- 8. Views

-- View: Expenses with Advance Context
CREATE OR REPLACE VIEW public.v_expenses_complete WITH (security_invoker = true) AS
SELECT
    e.id,
    e.advance_id,
    e.expense_date,
    e.category,
    e.vendor,
    e.invoice_no,
    e.amount,
    e.terminal_location,
    e.description,
    e.created_at,
    e.updated_at,
    e.spent_by_employee_id,
    a.req_no as advance_req_no,
    holder.employee_name as advance_holder_name,
    
    -- LOGIC: If 'spent_by' is set, show that name. Otherwise, fallback to the advance holder's name.
    COALESCE(spender.employee_name, holder.employee_name) as used_by
FROM public.expenses e
LEFT JOIN public.advances a ON e.advance_id = a.id
LEFT JOIN public.employees holder ON a.employee_id = holder.id
LEFT JOIN public.employees spender ON e.spent_by_employee_id = spender.id;

-- Re-grant permissions to be safe
GRANT SELECT ON public.v_expenses_complete TO authenticated;
GRANT SELECT ON public.v_expenses_complete TO admin, admin_pro, viewer;

-- View: Advances with Calculated Totals
CREATE OR REPLACE VIEW public.v_advances_complete WITH (security_invoker = true) AS
SELECT
    a.id,
    a.req_no,
    a.amount as total_amount,
    a.advance_date,
    a.status,
    a.description,
    a.employee_id,
    emp.employee_name,
    emp.employee_pers_no,
    COALESCE(SUM(e.amount), 0) as spent_amount,
    (a.amount - COALESCE(SUM(e.amount), 0)) as remaining_balance,
    a.created_at,
    a.updated_at
FROM public.advances a
LEFT JOIN public.employees emp ON a.employee_id = emp.id
LEFT JOIN public.expenses e ON a.id = e.advance_id
GROUP BY a.id, emp.id;

-- Grants for Views
GRANT SELECT ON public.v_advances_complete TO authenticated;
GRANT SELECT ON public.v_advances_complete TO admin, admin_pro, viewer;

-- 9. RPC Upsert for Expenses (to handle Excel upload logic efficiently)
CREATE OR REPLACE FUNCTION public.upsert_expense_record(
    p_advance_req_no TEXT,
    p_expense_date DATE,
    p_category TEXT,
    p_vendor TEXT,
    p_invoice_no TEXT,
    p_amount DECIMAL,
    p_terminal TEXT,
    p_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_spent_by_employee_id UUID DEFAULT NULL -- New Parameter
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_advance_id UUID;
    v_expense_id UUID;
BEGIN
    -- Find Advance ID
    SELECT id INTO v_advance_id FROM public.advances WHERE req_no = p_advance_req_no;

    IF v_advance_id IS NULL THEN
        RAISE EXCEPTION 'Advance Request No % not found', p_advance_req_no;
    END IF;

    INSERT INTO public.expenses (
        id, advance_id, expense_date, category, vendor, invoice_no, amount, terminal_location, description, spent_by_employee_id, updated_at
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()),
        v_advance_id,
        p_expense_date,
        p_category,
        p_vendor,
        p_invoice_no,
        p_amount,
        p_terminal,
        p_description,
        p_spent_by_employee_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        advance_id = EXCLUDED.advance_id,
        expense_date = EXCLUDED.expense_date,
        category = EXCLUDED.category,
        vendor = EXCLUDED.vendor,
        invoice_no = EXCLUDED.invoice_no,
        amount = EXCLUDED.amount,
        terminal_location = EXCLUDED.terminal_location,
        description = EXCLUDED.description,
        spent_by_employee_id = EXCLUDED.spent_by_employee_id,
        updated_at = NOW()
    RETURNING id INTO v_expense_id;

    RETURN v_expense_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.upsert_expense_record(TEXT, DATE, TEXT, TEXT, TEXT, DECIMAL, TEXT, UUID, TEXT, UUID) TO authenticated;