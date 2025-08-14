-- CREATE TRIGGER for role sync on update
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'sync_user_role_trigger'
    ) THEN 
        CREATE TRIGGER sync_user_role_trigger
        AFTER UPDATE ON public.user_profiles 
        FOR EACH ROW
        WHEN (NEW.role IS DISTINCT FROM OLD.role) 
        EXECUTE FUNCTION sync_user_role_to_auth();
    END IF;
END $$;