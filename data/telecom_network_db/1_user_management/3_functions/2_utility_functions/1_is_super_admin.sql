-- SUPER ADMIN CHECK FUNCTION
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = '' 
STABLE 
AS $$
SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND is_super_admin = true
  );
$$;