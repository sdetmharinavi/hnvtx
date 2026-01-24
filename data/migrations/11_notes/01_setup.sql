-- path: data/migrations/11_notes/01_setup.sql

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.technical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
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
    n.user_id,
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

