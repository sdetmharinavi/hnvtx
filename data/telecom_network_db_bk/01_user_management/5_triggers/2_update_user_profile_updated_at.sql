-- CREATE TRIGGER for profile updates
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_user_profile_updated_at'
    ) THEN 
        CREATE TRIGGER update_user_profile_updated_at 
        BEFORE UPDATE ON public.user_profiles 
        FOR EACH ROW 
        EXECUTE FUNCTION public.update_user_profile_timestamp();
    END IF;
END $$;