-- ========================================================
-- PRIZOM SECURITY & FUNCTIONALITY MIGRATION 31
-- NOTIFICATIONS DELETE POLICY AND PERMISSIONS HARDENING
-- ========================================================

-- 1. Enable RLS for DELETE on notifications table for owners
DROP POLICY IF EXISTS "Users can delete own notifications." ON public.notifications;
CREATE POLICY "Users can delete own notifications." ON public.notifications 
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Grant full table privileges to anon, authenticated, and service_role
GRANT ALL ON public.notifications TO anon, authenticated, service_role;
