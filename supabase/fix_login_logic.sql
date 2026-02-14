-- ============================================================
-- FIX LOGIN ISSUES (Username Lookup & Role Fetching)
-- ============================================================

-- 1. Create a secure function to lookup email/role by username
-- This bypasses RLS safely and is accessible by the API
CREATE OR REPLACE FUNCTION get_user_by_username(p_username TEXT)
RETURNS TABLE (email TEXT, role user_role, is_active BOOLEAN) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT u.email, u.role, u.is_active 
  FROM public.users u 
  WHERE u.username = p_username;
END;
$$ LANGUAGE plpgsql;

-- 2. Ensure public access to this function (via ANON key)
GRANT EXECUTE ON FUNCTION get_user_by_username(TEXT) TO anon, authenticated;

-- 3. Ensure the 'users' table has the correct policy for authenticated users
-- to view their own profile (which the login API needs after signing in)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 4. Ensure RLS is active
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
