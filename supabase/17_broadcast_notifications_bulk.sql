-- ========================================================
-- PRIZOM BULK NOTIFICATION BROADCAST MIGRATION
-- ========================================================

CREATE OR REPLACE FUNCTION public.broadcast_notification_bulk(
  notification_type TEXT,
  notification_text TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, text, is_read)
  SELECT id, notification_type, notification_text, false
  FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.broadcast_notification_bulk(TEXT, TEXT) TO service_role;
