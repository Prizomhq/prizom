-- ========================================================
-- PRIZOM SECURITY PATCH: NOTIFICATIONS DIRECT INSERT LOOPHOLE FIX
-- ========================================================

-- Drop all insert policies on the notifications table to disable direct client-side writes
DROP POLICY IF EXISTS "Users can insert own notifications." ON public.notifications;
DROP POLICY IF EXISTS "System/Users can insert notifications for others." ON public.notifications;
