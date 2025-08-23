-- CREATE TRIGGER for role sync on insert
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'sync_user_role_insert_trigger'
    ) THEN 
        CREATE TRIGGER sync_user_role_insert_trigger
        AFTER INSERT ON public.user_profiles 
        FOR EACH ROW 
        EXECUTE FUNCTION sync_user_role_to_auth();
    END IF;
END $$;