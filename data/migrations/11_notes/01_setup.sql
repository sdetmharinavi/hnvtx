-- path: data/migrations/11_notes/01_setup.sql

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.technical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create/Replace the View
CREATE OR REPLACE VIEW public.v_technical_notes WITH (security_invoker = true) AS
SELECT
    n.id,
    n.title,
    n.content,
    n.tags,
    n.is_published,
    n.created_at,
    n.updated_at,
    n.author_id,
    p.full_name AS author_name,
    p.avatar_url AS author_avatar,
    p.email AS author_email,
    CASE 
        WHEN n.is_published THEN 'Published' 
        ELSE 'Draft' 
    END as status_label
FROM public.technical_notes n
LEFT JOIN public.v_user_profiles_extended p ON n.author_id = p.id;

-- 3. [CRITICAL FIX] Explicit Permissions (Grants)
-- Unlike Core modules, we MUST allow 'authenticated' to INSERT here so users can create notes.
GRANT ALL ON TABLE public.technical_notes TO service_role;
GRANT ALL ON TABLE public.technical_notes TO postgres;

-- GRANT ALL privileges to authenticated users (Insert, Update, Delete)
-- We rely on RLS (Policies) to restrict *which* rows they can touch, not *if* they can touch the table.
GRANT ALL ON TABLE public.technical_notes TO authenticated; 

-- Grant access to the view
GRANT SELECT ON TABLE public.v_technical_notes TO authenticated;
GRANT SELECT ON TABLE public.v_technical_notes TO service_role;

-- 4. Enable RLS
ALTER TABLE public.technical_notes ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function: Auto-assign Author
-- This forces the author_id to match the logged-in user, preventing ID spoofing
CREATE OR REPLACE FUNCTION public.set_technical_note_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.author_id := auth.uid();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_technical_note_author ON public.technical_notes;
CREATE TRIGGER trg_set_technical_note_author
BEFORE INSERT ON public.technical_notes
FOR EACH ROW
EXECUTE FUNCTION public.set_technical_note_author();

-- 6. Helper Function: Auto-update Timestamp
DROP TRIGGER IF EXISTS trigger_technical_notes_updated_at ON public.technical_notes;
CREATE TRIGGER trigger_technical_notes_updated_at
BEFORE UPDATE ON public.technical_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. RLS Policies

-- A. INSERT Policy
-- Open to all authenticated users. The trigger above ensures auth.uid() == author_id.
DROP POLICY IF EXISTS "Authors can insert notes" ON public.technical_notes;
CREATE POLICY "Authors can insert notes"
ON public.technical_notes FOR INSERT
TO authenticated
WITH CHECK (true); 

-- B. SELECT Policy
-- Viewers see published; Authors see their own; Admins see everything.
DROP POLICY IF EXISTS "Read notes" ON public.technical_notes;
CREATE POLICY "Read notes"
ON public.technical_notes FOR SELECT
TO authenticated
USING (
    is_published = true 
    OR auth.uid() = author_id 
    OR (public.is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'))
);

-- C. UPDATE Policy
-- Authors update their own; Admins update everything.
DROP POLICY IF EXISTS "Update notes" ON public.technical_notes;
CREATE POLICY "Update notes"
ON public.technical_notes FOR UPDATE
TO authenticated
USING (
    auth.uid() = author_id 
    OR (public.is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'))
);

-- D. DELETE Policy
-- Authors delete their own; Admins delete everything.
DROP POLICY IF EXISTS "Delete notes" ON public.technical_notes;
CREATE POLICY "Delete notes"
ON public.technical_notes FOR DELETE
TO authenticated
USING (
    auth.uid() = author_id 
    OR (public.is_super_admin() OR public.get_my_role() IN ('admin', 'admin_pro'))
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_technical_notes_author ON public.technical_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_technical_notes_published ON public.technical_notes(is_published);
CREATE INDEX IF NOT EXISTS idx_technical_notes_title_trgm ON public.technical_notes USING gin (title gin_trgm_ops);