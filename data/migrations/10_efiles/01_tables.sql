-- path: migrations/10_efiles/01_tables.sql
-- Description: Defines the core tables for the E-File tracking system.

-- 1. Create E-Files Master Table
CREATE TABLE IF NOT EXISTS public.e_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_number TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, 
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'immediate')),
    
    -- The Employee who physically started/owns the file
    initiator_employee_id UUID NOT NULL REFERENCES public.employees(id),
    
    -- The Employee currently holding the physical file
    current_holder_employee_id UUID NOT NULL REFERENCES public.employees(id),
    
    -- The App User who performed the data entry
    recorded_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Movements History Table
CREATE TABLE IF NOT EXISTS public.file_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.e_files(id) ON DELETE CASCADE,
    
    -- Movement: From Employee -> To Employee
    from_employee_id UUID REFERENCES public.employees(id), -- Can be NULL for initiation
    to_employee_id UUID NOT NULL REFERENCES public.employees(id),
    
    -- The App User who recorded the action
    performed_by_user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    
    action_type TEXT NOT NULL CHECK (action_type IN ('initiated', 'forwarded', 'returned', 'closed')),
    action_date TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_e_files_holder ON public.e_files(current_holder_employee_id);
CREATE INDEX IF NOT EXISTS idx_e_files_file_number ON public.e_files(file_number);
CREATE INDEX IF NOT EXISTS idx_file_movements_file_id ON public.file_movements(file_id);
