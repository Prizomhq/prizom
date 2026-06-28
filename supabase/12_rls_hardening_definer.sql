-- ========================================================
-- PRIZOM RLS SECURITY DEFINER HARDENING PATCH
-- ========================================================

-- 1. Create a helper to check if creator is suspended/banned bypassing RLS
CREATE OR REPLACE FUNCTION public.is_suspended(creator_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF creator_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = creator_id AND role IN ('suspended', 'banned', 'permanently_banned')
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.is_suspended(UUID) TO anon, authenticated, service_role;

-- 2. Create a helper to check if two users blocked each other bypassing RLS
CREATE OR REPLACE FUNCTION public.are_users_blocked(user_id_1 UUID, user_id_2 UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id_1 IS NULL OR user_id_2 IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = user_id_1 AND blocked_id = user_id_2)
       OR (blocker_id = user_id_2 AND blocked_id = user_id_1)
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.are_users_blocked(UUID, UUID) TO anon, authenticated, service_role;

-- 3. Update profiles select policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles 
  FOR SELECT 
  USING (
    -- 1. Admins/Moderators see all profiles (bypasses recursion via SECURITY DEFINER)
    public.is_admin(auth.uid())
    OR (
      -- 2. Owner sees their own profile
      auth.uid() = id
    )
    OR (
      -- 3. Non-suspended/non-banned profiles are visible to users who aren't in a block relationship with them
      role NOT IN ('suspended', 'banned', 'permanently_banned')
      AND NOT public.are_users_blocked(auth.uid(), id)
    )
  );

-- 4. Update prompts select policy
DROP POLICY IF EXISTS "Prompts are viewable by everyone." ON public.prompts;
CREATE POLICY "Prompts are viewable by everyone." ON public.prompts 
  FOR SELECT 
  USING (
    -- 1. Admins/Moderators see everything
    public.is_admin(auth.uid())
    OR (
      -- 2. Creator sees their own prompts (even if hidden or creator is suspended)
      auth.uid() = user_id
    )
    OR (
      -- 3. Guests / Standard users see only active, non-hidden prompts of active creators
      moderation_status = 'active'
      AND NOT is_hidden
      AND NOT public.is_suspended(user_id)
      AND NOT public.are_users_blocked(auth.uid(), user_id)
    )
  );
