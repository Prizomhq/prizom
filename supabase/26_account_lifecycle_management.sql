-- ========================================================
-- PRIZOM ACCOUNT LIFECYCLE MANAGEMENT MIGRATION
-- ========================================================

-- 1. Add deactivation and deletion columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deactivation_feedback TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pending_deletion BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL;

-- 2. Create partial indexes for active filtering performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_deactivated 
  ON public.profiles(id) 
  WHERE is_deactivated = true;

CREATE INDEX IF NOT EXISTS idx_profiles_pending_deletion 
  ON public.profiles(id) 
  WHERE pending_deletion = true;

-- 3. Create helper function to check if a creator is inactive (suspended, banned, deactivated, or pending deletion)
CREATE OR REPLACE FUNCTION public.is_inactive(creator_id UUID)
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
    WHERE id = creator_id AND (
      role IN ('suspended', 'banned', 'permanently_banned')
      OR is_deactivated = true
      OR pending_deletion = true
    )
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.is_inactive(UUID) TO anon, authenticated, service_role;

-- 4. Update profiles row-level security (RLS) select policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles 
  FOR SELECT 
  USING (
    -- Admins/moderators see all profiles
    public.is_admin(auth.uid())
    OR (
      -- Owners see their own profile
      auth.uid() = id
    )
    OR (
      -- Public sees only active, non-suspended, non-deactivated, non-pending-deletion profiles
      role NOT IN ('suspended', 'banned', 'permanently_banned')
      AND is_deactivated = false
      AND pending_deletion = false
      AND NOT public.are_users_blocked(auth.uid(), id)
    )
  );

-- 5. Update prompts row-level security (RLS) select policy
DROP POLICY IF EXISTS "Prompts are viewable by everyone." ON public.prompts;
CREATE POLICY "Prompts are viewable by everyone." ON public.prompts 
  FOR SELECT 
  USING (
    -- Admins/moderators see all prompts
    public.is_admin(auth.uid())
    OR (
      -- Owners see their own prompts
      auth.uid() = user_id
    )
    OR (
      -- Public sees only active prompts from active/valid creators
      moderation_status = 'active'
      AND NOT is_hidden
      AND NOT public.is_inactive(user_id)
      AND NOT public.are_users_blocked(auth.uid(), user_id)
    )
  );
