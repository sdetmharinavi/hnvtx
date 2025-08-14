-- Function that will sync the role to auth.users
CREATE OR REPLACE FUNCTION sync_user_role_to_auth() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '' 
AS $$ 
BEGIN 
    IF (
        TG_OP = 'INSERT'
        OR (
            TG_OP = 'UPDATE'
            AND NEW.role IS DISTINCT FROM OLD.role
        )
    )
    AND NEW.role IS NOT NULL THEN
        UPDATE auth.users
        SET role = NEW.role
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;