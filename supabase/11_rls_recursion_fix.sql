-- ========================================================
-- PRIZOM RLS RECURSION FIX (SECURITY DEFINER HELPERS)
-- ========================================================

-- 1. Create a security definer function to check admin status without causing RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('super_admin', 'admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute access to roles
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;

-- 2. Update profiles select policy to use the helper function
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
      AND (
        auth.uid() IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM public.blocked_users bu
          WHERE (bu.blocker_id = auth.uid() AND bu.blocked_id = id)
             OR (bu.blocker_id = id AND bu.blocked_id = auth.uid())
        )
      )
    )
  );

-- 3. Update prompts select policy to use the helper function
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
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles creator_p
        WHERE creator_p.id = user_id
        AND creator_p.role IN ('suspended', 'banned', 'permanently_banned')
      )
      AND (
        -- Enforce blocks: viewer and creator must not have blocked each other
        auth.uid() IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM public.blocked_users bu
          WHERE (bu.blocker_id = auth.uid() AND bu.blocked_id = user_id)
             OR (bu.blocker_id = user_id AND bu.blocked_id = auth.uid())
        )
      )
    )
  );

-- 4. Update collections select policy to use the helper function
DROP POLICY IF EXISTS "Users can view own collections." ON public.collections;
CREATE POLICY "Users can view own collections." ON public.collections 
  FOR SELECT 
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

-- 5. Update saved prompts select policy to use the helper function
DROP POLICY IF EXISTS "Users can view own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can view own saved_prompts." ON public.saved_prompts 
  FOR SELECT 
  USING (
    (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.prompts p
        WHERE p.id = prompt_id
      )
    )
    OR public.is_admin(auth.uid())
  );

-- 6. Update user reports select policy to use the helper function
DROP POLICY IF EXISTS "User reports view policy" ON public.user_reports;
CREATE POLICY "User reports view policy" ON public.user_reports 
  FOR SELECT 
  USING (
    auth.uid() = reporter_id
    OR public.is_admin(auth.uid())
  );

-- 7. Update prompt reports select policy to use the helper function
DROP POLICY IF EXISTS "Prompt reports view policy" ON public.prompt_reports;
CREATE POLICY "Prompt reports view policy" ON public.prompt_reports 
  FOR SELECT 
  USING (
    auth.uid() = reporter_id
    OR public.is_admin(auth.uid())
  );

-- 8. Update prompt appeals select policy to use the helper function
DROP POLICY IF EXISTS "Prompt appeals view policy" ON public.prompt_appeals;
CREATE POLICY "Prompt appeals view policy" ON public.prompt_appeals 
  FOR SELECT 
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

-- 9. Update archived prompts select policy to use the helper function
DROP POLICY IF EXISTS "Archived prompts view policy" ON public.archived_prompts;
CREATE POLICY "Archived prompts view policy" ON public.archived_prompts 
  FOR SELECT 
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

-- 10. Update admin_settings policies to use the helper function
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Admins can manage settings" ON public.admin_settings 
  FOR ALL USING (
    public.is_admin(auth.uid())
  );

-- 11. Update categories policies to use the helper function
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories 
  FOR ALL USING (
    public.is_admin(auth.uid())
  );

-- 12. Update ai_tools policies to use the helper function
DROP POLICY IF EXISTS "Admins can manage AI tools" ON public.ai_tools;
CREATE POLICY "Admins can manage AI tools" ON public.ai_tools 
  FOR ALL USING (
    public.is_admin(auth.uid())
  );

-- 13. Update contact_messages policies to use the helper function
DROP POLICY IF EXISTS "Owners and admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Owners and admins can view contact messages" ON public.contact_messages 
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages 
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  );

-- 14. Update whitelist_users policies to use the helper function
DROP POLICY IF EXISTS "Admins can view whitelist_users" ON public.whitelist_users;
CREATE POLICY "Admins can view whitelist_users" ON public.whitelist_users 
  FOR SELECT USING (
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage whitelist_users" ON public.whitelist_users;
CREATE POLICY "Admins can manage whitelist_users" ON public.whitelist_users 
  FOR ALL USING (
    public.is_admin(auth.uid())
  );
