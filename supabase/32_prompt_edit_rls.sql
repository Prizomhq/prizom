-- ========================================================
-- PRIZOM STRICT PROMPT EDITING RLS POLICY
-- ========================================================

-- Ensure prompts update policy restricts modifications strictly to prompt creators (owners)
-- Admins/moderators may perform moderation actions on other tables/columns but must not modify prompt content.

DROP POLICY IF EXISTS "Users can update own prompts." ON public.prompts;
CREATE POLICY "Users can update own prompts." ON public.prompts 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
