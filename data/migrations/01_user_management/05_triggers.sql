-- Path: migrations/01_user_management/05_triggers.sql
-- Description: Attaches triggers for the User Management module.

-- CREATE TRIGGER for new auth users to create a public profile
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.create_public_profile_for_new_user();
    END IF;
END $$;

-- CREATE TRIGGER for role sync to auth.users on profile UPDATE
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_user_role_trigger') THEN
        CREATE TRIGGER sync_user_role_trigger
        AFTER UPDATE ON public.user_profiles
        FOR EACH ROW
        WHEN (NEW.role IS DISTINCT FROM OLD.role)
        EXECUTE FUNCTION sync_user_role_to_auth();
    END IF;
END $$;

-- CREATE TRIGGER for role sync to auth.users on profile INSERT
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_user_role_insert_trigger') THEN
        CREATE TRIGGER sync_user_role_insert_trigger
        AFTER INSERT ON public.user_profiles
        FOR EACH ROW EXECUTE FUNCTION sync_user_role_to_auth();
    END IF;
END $$;