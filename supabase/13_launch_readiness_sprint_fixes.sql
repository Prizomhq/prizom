-- ========================================================
-- PRIZOM LAUNCH READINESS SPRINT FIXES MIGRATION
-- ========================================================

-- 1. Create optimization indexes if they do not exist
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_ai_tool ON public.prompts(ai_tool);
CREATE INDEX IF NOT EXISTS idx_prompts_remix_of ON public.prompts(remix_of);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_appeal_status ON public.profiles(appeal_status);

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_prompt_reports_status ON public.prompt_reports(status);
CREATE INDEX IF NOT EXISTS idx_prompt_appeals_status ON public.prompt_appeals(status);

-- 2. Harden WRITE policies on high-write tables to verify is_suspended(auth.uid()) is FALSE

-- A. Prompts
DROP POLICY IF EXISTS "Authenticated users can create prompts." ON public.prompts;
CREATE POLICY "Authenticated users can create prompts." ON public.prompts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own prompts." ON public.prompts;
CREATE POLICY "Users can update own prompts." ON public.prompts 
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own prompts." ON public.prompts;
CREATE POLICY "Users can delete own prompts." ON public.prompts 
  FOR DELETE USING (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- B. Likes
DROP POLICY IF EXISTS "Users can insert own likes." ON public.likes;
CREATE POLICY "Users can insert own likes." ON public.likes 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own likes." ON public.likes;
CREATE POLICY "Users can delete own likes." ON public.likes 
  FOR DELETE USING (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- C. Collections
DROP POLICY IF EXISTS "Users can insert own collections." ON public.collections;
CREATE POLICY "Users can insert own collections." ON public.collections 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own collections." ON public.collections;
CREATE POLICY "Users can delete own collections." ON public.collections 
  FOR DELETE USING (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- D. Saved Prompts
DROP POLICY IF EXISTS "Users can insert own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can insert own saved_prompts." ON public.saved_prompts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can delete own saved_prompts." ON public.saved_prompts 
  FOR DELETE USING (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- E. Comments
DROP POLICY IF EXISTS "Authenticated users can create comments." ON public.comments;
CREATE POLICY "Authenticated users can create comments." ON public.comments 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own comments." ON public.comments;
CREATE POLICY "Users can delete own comments." ON public.comments 
  FOR DELETE USING (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- F. Followers
DROP POLICY IF EXISTS "Users can follow others." ON public.followers;
CREATE POLICY "Users can follow others." ON public.followers 
  FOR INSERT WITH CHECK (
    auth.uid() = follower_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can unfollow others." ON public.followers;
CREATE POLICY "Users can unfollow others." ON public.followers 
  FOR DELETE USING (
    auth.uid() = follower_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- G. Blocked Users
DROP POLICY IF EXISTS "Users can block others." ON public.blocked_users;
CREATE POLICY "Users can block others." ON public.blocked_users 
  FOR INSERT WITH CHECK (
    auth.uid() = blocker_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own blocks." ON public.blocked_users;
CREATE POLICY "Users can delete own blocks." ON public.blocked_users 
  FOR DELETE USING (
    auth.uid() = blocker_id 
    AND NOT public.is_suspended(auth.uid())
  );

-- H. Reports Submission
DROP POLICY IF EXISTS "Authenticated users can submit user reports." ON public.user_reports;
CREATE POLICY "Authenticated users can submit user reports." ON public.user_reports 
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id 
    AND NOT public.is_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can submit prompt reports." ON public.prompt_reports;
CREATE POLICY "Authenticated users can submit prompt reports." ON public.prompt_reports 
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_id 
    AND NOT public.is_suspended(auth.uid())
  );


-- 3. Block self-engagement farming by refactoring likes and saves triggers

-- Likes Trigger Refactor
CREATE OR REPLACE FUNCTION public.handle_likes_count_change()
RETURNS TRIGGER AS $$
DECLARE
  prompt_owner_id UUID;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT user_id INTO prompt_owner_id FROM public.prompts WHERE id = NEW.prompt_id;
    IF (NEW.user_id <> prompt_owner_id) THEN
      UPDATE public.prompts SET likes_count = likes_count + 1 WHERE id = NEW.prompt_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT user_id INTO prompt_owner_id FROM public.prompts WHERE id = OLD.prompt_id;
    IF (OLD.user_id <> prompt_owner_id) THEN
      UPDATE public.prompts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.prompt_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Saves Trigger Refactor
CREATE OR REPLACE FUNCTION public.handle_saves_count_change()
RETURNS TRIGGER AS $$
DECLARE
  prompt_owner_id UUID;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT user_id INTO prompt_owner_id FROM public.prompts WHERE id = NEW.prompt_id;
    IF (NEW.user_id <> prompt_owner_id) THEN
      UPDATE public.prompts SET saves_count = saves_count + 1 WHERE id = NEW.prompt_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT user_id INTO prompt_owner_id FROM public.prompts WHERE id = OLD.prompt_id;
    IF (OLD.user_id <> prompt_owner_id) THEN
      UPDATE public.prompts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.prompt_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Pruning mechanism for rate limits and analytics tables
CREATE OR REPLACE FUNCTION public.prune_expired_analytics_data()
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- A. Prune rate limits older than 24 hours
  DELETE FROM public.rate_limits
  WHERE reset_at < NOW() - INTERVAL '24 hours';

  -- B. Prune guest events older than 30 days
  DELETE FROM public.guest_events
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- C. Prune prompt views older than 30 days
  DELETE FROM public.prompt_views
  WHERE viewed_at < NOW() - INTERVAL '30 days';

  -- D. Prune prompt copy logs older than 30 days
  DELETE FROM public.prompt_copy_logs
  WHERE copied_at < NOW() - INTERVAL '30 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.prune_expired_analytics_data() TO anon, authenticated, service_role;
