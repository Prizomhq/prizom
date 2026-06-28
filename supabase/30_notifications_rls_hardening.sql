-- ========================================================
-- PRIZOM SECURITY PATCH: NOTIFICATIONS DIRECT INSERT LOOPHOLE FIX
-- ========================================================

-- Drop the existing loose insert policy
DROP POLICY IF EXISTS "System/Users can insert notifications for others." ON public.notifications;

-- Create hardened policy checking for blocked relationships before allowing client-side inserts
CREATE POLICY "System/Users can insert notifications for others." ON public.notifications 
  FOR INSERT WITH CHECK (
    (auth.uid() = actor_id OR actor_id IS NULL)
    AND (
      actor_id IS NULL 
      OR NOT EXISTS (
        SELECT 1 FROM public.blocked_users 
        WHERE (blocker_id = user_id AND blocked_id = actor_id)
           OR (blocker_id = actor_id AND blocked_id = user_id)
      )
    )
  );
