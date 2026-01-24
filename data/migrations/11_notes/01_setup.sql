-- path: data/migrations/11_notes/01_setup.sql

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.technical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT, -- Rich HTML content
    tags TEXT[], -- Array of strings
    is_published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the View (Joins author details)
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
    -- Computed Snippet for list view (strip HTML is hard in pure SQL without regex, sending full content but UI handles truncation)
    CASE 
        WHEN n.is_published THEN 'Published' 
        ELSE 'Draft' 
    END as status_label
FROM public.technical_notes n
LEFT JOIN public.v_user_profiles_extended p ON n.author_id = p.id;

-- 3. Enable RLS
ALTER TABLE public.technical_notes ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Viewers can read PUBLISHED notes.
CREATE POLICY "Viewers can read published notes"
ON public.technical_notes FOR SELECT
USING (is_published = true);

-- Authors can read ALL their own notes (Drafts included).
CREATE POLICY "Authors can read own notes"
ON public.technical_notes FOR SELECT
USING (auth.uid() = author_id);

-- Admins can read ALL notes.
CREATE POLICY "Admins can read all notes"
ON public.technical_notes FOR SELECT
USING (is_super_admin() OR get_my_role() IN ('admin_pro'));

-- Authors can insert their own notes.
CREATE POLICY "Authors can insert notes"
ON public.technical_notes FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Authors can update their own notes.
CREATE POLICY "Authors can update own notes"
ON public.technical_notes FOR UPDATE
USING (auth.uid() = author_id);

-- Authors can delete their own notes.
CREATE POLICY "Authors can delete own notes"
ON public.technical_notes FOR DELETE
USING (auth.uid() = author_id);

-- Admins can Manage All
CREATE POLICY "Admins can manage all notes"
ON public.technical_notes FOR ALL
USING (is_super_admin() OR get_my_role() IN ('admin_pro'));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_technical_notes_author ON public.technical_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_technical_notes_published ON public.technical_notes(is_published);
CREATE INDEX IF NOT EXISTS idx_technical_notes_title_trgm ON public.technical_notes USING gin (title gin_trgm_ops);

-- 6. Trigger for Updated At
DROP TRIGGER IF EXISTS trigger_technical_notes_updated_at ON public.technical_notes;
CREATE TRIGGER trigger_technical_notes_updated_at
BEFORE UPDATE ON public.technical_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Grant Permissions
GRANT SELECT ON public.v_technical_notes TO authenticated;
GRANT ALL ON public.technical_notes TO authenticated; -- RLS restricts actual access