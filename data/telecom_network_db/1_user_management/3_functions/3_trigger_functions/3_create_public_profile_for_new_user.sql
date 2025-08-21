-- USER CREATION FUNCTION
CREATE OR REPLACE FUNCTION public.create_public_profile_for_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '' 
AS $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = NEW.id
    ) THEN
        INSERT INTO public.user_profiles (
            id,
            first_name,
            last_name,
            avatar_url,
            phone_number,
            date_of_birth,
            address,
            preferences,
            status
        )
        VALUES (
            NEW.id,
            COALESCE(
                NEW.raw_user_meta_data->>'first_name',
                NEW.raw_user_meta_data->>'name',
                (
                    SELECT initcap(word)
                    FROM regexp_split_to_table(split_part(NEW.email, '@', 1), '[^a-zA-Z]+') AS word
                    WHERE word ~ '^[a-zA-Z]+'
                    LIMIT 1
                ), 'User'
            ), 
            COALESCE(
                NEW.raw_user_meta_data->>'last_name', 
                SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 2), 
                ''
            ), 
            NEW.raw_user_meta_data->>'avatar_url', 
            NEW.raw_user_meta_data->>'phone_number', 
            CASE
                WHEN NEW.raw_user_meta_data->>'date_of_birth' ~ '^\d{4}-\d{2}-\d{2}$' THEN (NEW.raw_user_meta_data->>'date_of_birth')::date
                ELSE NULL
            END,
            COALESCE(NEW.raw_user_meta_data->'address', '{}'::jsonb),
            COALESCE(NEW.raw_user_meta_data->'preferences', '{}'::jsonb),
            'active'
        );
    END IF;
    RETURN NEW;
END;
$$;