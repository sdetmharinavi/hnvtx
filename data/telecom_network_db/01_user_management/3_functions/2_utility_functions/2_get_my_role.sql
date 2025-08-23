-- GET MY ROLE FUNCTION
CREATE OR REPLACE FUNCTION public.get_my_role() 
RETURNS text 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = '' 
AS $$
SELECT role
FROM auth.users
WHERE id = auth.uid();
$$;