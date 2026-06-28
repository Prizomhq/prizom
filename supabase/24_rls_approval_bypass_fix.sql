-- ========================================================
-- PRIZOM SECURITY PATCH: INVITE-KEY BYPASS FIX
-- ========================================================

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Authenticated users can create prompts." ON public.prompts;

-- Create the secure insert policy that verifies is_approved status in profiles
CREATE POLICY "Authenticated users can create prompts." ON public.prompts 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT public.is_suspended(auth.uid())
    AND COALESCE((auth.jwt() ->> 'email_verified')::boolean, false) = true
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_approved = true
      )
    )
  );
