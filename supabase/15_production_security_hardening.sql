-- ========================================================
-- PRIZOM PRODUCTION SECURITY HARDENING MIGRATION
-- ========================================================

-- 1. Hardening analytics write access: only service_role can insert views and copy logs.
-- This blocks direct client-side insertion bypassing rate-limiters.
DROP POLICY IF EXISTS "Anyone can insert views." ON public.prompt_views;
DROP POLICY IF EXISTS "Only service role can insert views" ON public.prompt_views;
CREATE POLICY "Only service role can insert views" ON public.prompt_views 
  FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert copy logs." ON public.prompt_copy_logs;
DROP POLICY IF EXISTS "Only service role can insert copy logs" ON public.prompt_copy_logs;
CREATE POLICY "Only service role can insert copy logs" ON public.prompt_copy_logs 
  FOR INSERT TO service_role WITH CHECK (true);

-- 2. Fixing Analytics Read Access: allow creators to see logs for their own prompts.
-- Restricting to admins broke the analytics screen for standard creators.
DROP POLICY IF EXISTS "Admins can view all views." ON public.prompt_views;
DROP POLICY IF EXISTS "Creators and admins can view prompt views" ON public.prompt_views;
CREATE POLICY "Creators and admins can view prompt views" ON public.prompt_views
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = prompt_views.prompt_id
        AND prompts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all copy logs." ON public.prompt_copy_logs;
DROP POLICY IF EXISTS "Creators and admins can view copy logs" ON public.prompt_copy_logs;
CREATE POLICY "Creators and admins can view copy logs" ON public.prompt_copy_logs
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.prompts
      WHERE prompts.id = prompt_copy_logs.prompt_id
        AND prompts.user_id = auth.uid()
    )
  );

-- 3. Hardening prompt creation: Enforce email verification (JWT email_verified check)
DROP POLICY IF EXISTS "Authenticated users can create prompts." ON public.prompts;
CREATE POLICY "Authenticated users can create prompts." ON public.prompts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
    AND COALESCE((auth.jwt() ->> 'email_verified')::boolean, false) = true
  );
