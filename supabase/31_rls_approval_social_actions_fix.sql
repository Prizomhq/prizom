-- ========================================================
-- PRIZOM SECURITY PATCH: RLS WRITE APPROVAL CHECK FOR SOCIAL ACTIONS
-- ========================================================

-- A. Likes
DROP POLICY IF EXISTS "Users can insert own likes." ON public.likes;
CREATE POLICY "Users can insert own likes." ON public.likes 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- B. Collections
DROP POLICY IF EXISTS "Users can insert own collections." ON public.collections;
CREATE POLICY "Users can insert own collections." ON public.collections 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- C. Saved Prompts
DROP POLICY IF EXISTS "Users can insert own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can insert own saved_prompts." ON public.saved_prompts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
    -- Hardened ownership check:
    AND EXISTS (
      SELECT 1 FROM public.collections 
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

-- D. Comments
DROP POLICY IF EXISTS "Authenticated users can create comments." ON public.comments;
CREATE POLICY "Authenticated users can create comments." ON public.comments 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- E. Followers
DROP POLICY IF EXISTS "Users can follow others." ON public.followers;
CREATE POLICY "Users can follow others." ON public.followers 
  FOR INSERT WITH CHECK (
    auth.uid() = follower_id 
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- F. Blocked Users
DROP POLICY IF EXISTS "Users can block others." ON public.blocked_users;
CREATE POLICY "Users can block others." ON public.blocked_users 
  FOR INSERT WITH CHECK (
    auth.uid() = blocker_id 
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- G. User Reports
DROP POLICY IF EXISTS "Authenticated users can submit user reports." ON public.user_reports;
CREATE POLICY "Authenticated users can submit user reports." ON public.user_reports 
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id 
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );

-- H. Prompt Reports
DROP POLICY IF EXISTS "Authenticated users can submit prompt reports." ON public.prompt_reports;
CREATE POLICY "Authenticated users can submit prompt reports." ON public.prompt_reports 
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id 
    AND NOT public.is_suspended(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_approved = true
    )
  );
