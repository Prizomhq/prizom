-- ========================================================
-- PRIZOM LAUNCH FIX: PUBLIC COLLECTIONS SELECT RLS
-- ========================================================

-- A. Update public.collections SELECT policy
DROP POLICY IF EXISTS "Users can view own collections." ON public.collections;
CREATE POLICY "Users can view own collections." ON public.collections 
  FOR SELECT 
  USING (
    -- 1. Owner can view their own collections
    auth.uid() = user_id
    -- 2. Admins and moderators can view all collections
    OR public.is_admin(auth.uid())
    -- 3. Public can view public collections from active creators (respects safety blocks)
    OR (
      is_private = false
      AND NOT public.is_inactive(user_id)
      AND NOT public.are_users_blocked(auth.uid(), user_id)
    )
  );

-- B. Update public.saved_prompts SELECT policy
DROP POLICY IF EXISTS "Users can view own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can view own saved_prompts." ON public.saved_prompts 
  FOR SELECT 
  USING (
    -- 1. Owner can view their own saved prompts
    auth.uid() = user_id
    -- 2. Admins and moderators can view all saved prompts
    OR public.is_admin(auth.uid())
    -- 3. Public can view prompts in public collections from active creators
    OR EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id
        AND c.is_private = false
        AND NOT public.is_inactive(c.user_id)
        AND NOT public.are_users_blocked(auth.uid(), c.user_id)
    )
  );
