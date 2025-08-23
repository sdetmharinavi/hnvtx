-- TRIGGER FUNCTION for updating timestamps
CREATE OR REPLACE FUNCTION public.update_user_profile_timestamp() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = '' 
AS $$ 
BEGIN 
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;