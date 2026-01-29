-- path: data/migrations/12_expenses/02_fix_grants.sql
-- Description: Explicitly grant write permissions to authenticated users for the expenses module.

-- Grant full CRUD permissions to the authenticated role
GRANT ALL ON TABLE public.advances TO authenticated;
GRANT ALL ON TABLE public.expenses TO authenticated;

-- Ensure sequences are accessible for ID generation if not using UUIDs (safety check)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;