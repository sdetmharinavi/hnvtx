-- path: data/migrations/07_diary/01_table_diary_notes.sql
-- Description: Creates the table for the daily diary/notes module.

CREATE TABLE IF NOT EXISTS public.diary_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_note_per_user_per_day UNIQUE (user_id, note_date)
);

COMMENT ON TABLE public.diary_notes IS 'Stores daily notes or journal entries for users.';
COMMENT ON COLUMN public.diary_notes.note_date IS 'The specific date the note is for.';
COMMENT ON COLUMN public.diary_notes.tags IS 'Optional tags for categorizing notes.';