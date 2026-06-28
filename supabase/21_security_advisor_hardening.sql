-- ========================================================
-- PRIZOM SECURITY ADVISOR HARDENING MIGRATION
-- Resolves linter warnings for SECURITY DEFINER properties
-- ========================================================

-- 1. Redefine Guest Entry Pages View with security_invoker
CREATE OR REPLACE VIEW public.guest_entry_pages 
WITH (security_invoker = true)
AS
WITH first_events AS (
  SELECT DISTINCT ON (ip_hash) page_path
  FROM public.guest_events
  WHERE event_type = 'page_view' AND page_path IS NOT NULL
  ORDER BY ip_hash, created_at ASC
)
SELECT page_path, COUNT(*) as entry_count
FROM first_events
GROUP BY page_path;

-- 2. Redefine Guest Funnel Stats View with security_invoker
CREATE OR REPLACE VIEW public.guest_funnel_stats 
WITH (security_invoker = true)
AS
WITH stats AS (
  SELECT 
    (SELECT COUNT(DISTINCT ip_hash) FROM public.guest_events) as total_visitors,
    (SELECT COUNT(DISTINCT ip_hash) FROM public.guest_events WHERE event_type = 'signup') as total_signups,
    (SELECT COUNT(DISTINCT ip_hash) FROM public.guest_events WHERE event_type = 'copy') as copy_users,
    (
      SELECT COUNT(DISTINCT e1.ip_hash) 
      FROM public.guest_events e1 
      JOIN public.guest_events e2 ON e1.ip_hash = e2.ip_hash 
      WHERE e1.event_type = 'copy' 
        AND e2.event_type = 'signup' 
        AND e1.created_at < e2.created_at
    ) as copy_signups,
    (SELECT COUNT(DISTINCT ip_hash) FROM public.guest_events WHERE event_type = 'search') as search_users,
    (
      SELECT COUNT(DISTINCT e1.ip_hash) 
      FROM public.guest_events e1 
      JOIN public.guest_events e2 ON e1.ip_hash = e2.ip_hash 
      WHERE e1.event_type = 'search' 
        AND e2.event_type = 'signup' 
        AND e1.created_at < e2.created_at
    ) as search_signups
)
SELECT 
  total_visitors,
  total_signups,
  copy_users,
  copy_signups,
  search_users,
  search_signups
FROM stats;

-- 3. Redefine Guest Retention Stats View with security_invoker
CREATE OR REPLACE VIEW public.guest_retention_stats 
WITH (security_invoker = true)
AS
WITH guest_days AS (
  SELECT ip_hash, DATE(created_at) as visit_date
  FROM public.guest_events
  GROUP BY ip_hash, DATE(created_at)
),
guest_visit_counts AS (
  SELECT ip_hash, COUNT(distinct visit_date) as active_days
  FROM guest_days
  GROUP BY ip_hash
)
SELECT 
  COUNT(CASE WHEN active_days > 1 THEN 1 END) as returning_guests,
  COUNT(*) as total_guests
FROM guest_visit_counts;

-- Re-grant select rights
GRANT SELECT ON public.guest_entry_pages TO anon, authenticated, service_role, postgres;
GRANT SELECT ON public.guest_funnel_stats TO anon, authenticated, service_role, postgres;
GRANT SELECT ON public.guest_retention_stats TO anon, authenticated, service_role, postgres;


-- 4. Set search_path on all SECURITY DEFINER functions using a dynamic PL/pgSQL block
-- (This bypasses the lack of ALTER FUNCTION IF EXISTS syntax support in standard PostgreSQL)
DO $$
DECLARE
  target_funcs TEXT[] := ARRAY[
    'handle_saves_count_change',
    'get_trending_prompts',
    'handle_guest_copy_increment',
    'archive_prompt_lifecycle',
    'is_admin',
    'is_suspended',
    'are_users_blocked',
    'handle_likes_count_change',
    'prune_expired_analytics_data',
    'increment_rate_limit',
    'refresh_trending_prompts_cache',
    'check_and_update_creator_verification',
    'handle_remix_count_change',
    'broadcast_notification_bulk',
    'handle_copies_count_change',
    'handle_views_count_change',
    'on_copy_log_change_verification',
    'on_prompt_change_verification',
    'on_profile_change_verification',
    'on_report_change_verification',
    'get_platform_stats',
    'handle_new_user'
  ];
  f TEXT;
  r RECORD;
BEGIN
  FOREACH f IN ARRAY target_funcs LOOP
    FOR r IN 
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = f
    LOOP
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', r.proname, r.args);
    END LOOP;
  END LOOP;
END
$$;
