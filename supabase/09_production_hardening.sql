-- ========================================================
-- PRIZOM PRODUCTION HARDENING MIGRATIONS (PHASE 1 - REV)
-- ========================================================

-- 1. Create Cron Runs Table
CREATE TABLE IF NOT EXISTS public.cron_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failure')),
  records_processed INTEGER DEFAULT 0,
  error_message TEXT
);

-- Enable RLS on cron_runs
ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;

-- Admins can view cron_runs
DROP POLICY IF EXISTS "Admins can view cron_runs" ON public.cron_runs;
CREATE POLICY "Admins can view cron_runs" ON public.cron_runs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Grant privileges so service_role (Admin API client) can manage it
GRANT ALL ON public.cron_runs TO anon, authenticated, service_role, postgres;


-- 2. Create Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  provider TEXT NOT NULL,
  error TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  subject TEXT,
  html_content TEXT
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view email_logs
DROP POLICY IF EXISTS "Admins can view email_logs" ON public.email_logs;
CREATE POLICY "Admins can view email_logs" ON public.email_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Grant privileges
GRANT ALL ON public.email_logs TO anon, authenticated, service_role, postgres;


-- 3. Create Guest Events Table
CREATE TABLE IF NOT EXISTS public.guest_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_hash TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'prompt_view', 'copy', 'search', 'signup_click', 'signup')),
  page_path TEXT,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
  search_query TEXT,
  user_id UUID, -- Does not strictly enforce foreign key to allow anonymous visitor conversions before profile is created, but references profiles.id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on guest_events
ALTER TABLE public.guest_events ENABLE ROW LEVEL SECURITY;

-- Public can insert guest_events
DROP POLICY IF EXISTS "Public can insert guest_events" ON public.guest_events;
CREATE POLICY "Public can insert guest_events" ON public.guest_events FOR INSERT WITH CHECK (true);

-- Admins can view guest_events
DROP POLICY IF EXISTS "Admins can view guest_events" ON public.guest_events;
CREATE POLICY "Admins can view guest_events" ON public.guest_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Grant privileges
GRANT ALL ON public.guest_events TO anon, authenticated, service_role, postgres;


-- 4. Create Rate Limits Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  hits INTEGER DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Admins can view rate_limits
DROP POLICY IF EXISTS "Admins can view rate_limits" ON public.rate_limits;
CREATE POLICY "Admins can view rate_limits" ON public.rate_limits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Grant privileges
GRANT ALL ON public.rate_limits TO anon, authenticated, service_role, postgres;


-- ========================================================
-- GUEST ANALYTICS VIEWS
-- ========================================================

-- 5. Create Guest Entry Pages View
CREATE OR REPLACE VIEW public.guest_entry_pages AS
WITH first_events AS (
  SELECT DISTINCT ON (ip_hash) page_path
  FROM public.guest_events
  WHERE event_type = 'page_view' AND page_path IS NOT NULL
  ORDER BY ip_hash, created_at ASC
)
SELECT page_path, COUNT(*) as entry_count
FROM first_events
GROUP BY page_path;

-- 6. Create Guest Funnel Stats View
CREATE OR REPLACE VIEW public.guest_funnel_stats AS
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

-- 7. Create Guest Retention Stats View
CREATE OR REPLACE VIEW public.guest_retention_stats AS
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

-- Grant permissions for views
GRANT SELECT ON public.guest_entry_pages TO anon, authenticated, service_role, postgres;
GRANT SELECT ON public.guest_funnel_stats TO anon, authenticated, service_role, postgres;
GRANT SELECT ON public.guest_retention_stats TO anon, authenticated, service_role, postgres;
