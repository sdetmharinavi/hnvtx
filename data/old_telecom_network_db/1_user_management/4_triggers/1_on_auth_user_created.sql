-- CREATE TRIGGER for new auth users
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN 
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users 
        FOR EACH ROW 
        EXECUTE FUNCTION public.create_public_profile_for_new_user();
    END IF;
END $$;