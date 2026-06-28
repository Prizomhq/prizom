-- ====================================================
-- PRIZOM MODERATION SYSTEM REFACTOR (PHASE 1)
-- ====================================================

-- 1. Add moderation columns to prompts table
ALTER TABLE public.prompts 
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'active' CHECK (moderation_status IN ('active', 'pending_deletion')),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create database moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderator_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'remove_prompt', 'restore_prompt', etc.
  target_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create prompt_appeals table
CREATE TABLE IF NOT EXISTS public.prompt_appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(prompt_id, user_id)
);

-- 4. Enable Row-Level Security
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_appeals ENABLE ROW LEVEL SECURITY;

-- 5. Establish RLS Policies
-- Prompts View Policy: Admins see all, creator sees all, others see only active
DROP POLICY IF EXISTS "Prompts are viewable by everyone." ON public.prompts;
CREATE POLICY "Prompts are viewable by everyone." ON public.prompts FOR SELECT
  USING (
    moderation_status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role IN ('super_admin', 'admin', 'moderator') OR profiles.id = user_id)
    )
  );

-- Moderation Logs: Admins only
CREATE POLICY "Admins can view moderation logs." ON public.moderation_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Prompt Appeals: Creator can view/insert their own, Admins can view/update all
CREATE POLICY "Users can view own prompt appeals." ON public.prompt_appeals FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

CREATE POLICY "Users can insert own prompt appeals." ON public.prompt_appeals FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Admins can update prompt appeals." ON public.prompt_appeals FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- 6. Grant Explicit Privileges to anon, authenticated, and service_role
GRANT ALL ON public.moderation_logs TO anon, authenticated, service_role;
GRANT ALL ON public.prompt_appeals TO anon, authenticated, service_role;
GRANT ALL ON public.prompts TO anon, authenticated, service_role;

-- 7. Update get_trending_prompts to filter out moderated prompts
CREATE OR REPLACE FUNCTION public.get_trending_prompts(cutoff_timestamp TIMESTAMPTZ)
RETURNS TABLE (
  prompt_id UUID,
  title TEXT,
  image_url TEXT,
  ai_tool TEXT,
  category TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  badges JSONB,
  likes_count_total INT,
  copies_count_total INT,
  remix_count_total INT,
  remix_of UUID,
  trend_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH timeframe_likes AS (
    SELECT l.prompt_id, COUNT(*) as count
    FROM public.likes l
    WHERE l.created_at >= cutoff_timestamp
    GROUP BY l.prompt_id
  ),
  timeframe_saves AS (
    SELECT s.prompt_id, COUNT(*) as count
    FROM public.saved_prompts s
    WHERE s.created_at >= cutoff_timestamp
    GROUP BY s.prompt_id
  ),
  timeframe_remixes AS (
    SELECT r.remix_of as prompt_id, COUNT(*) as count
    FROM public.prompts r
    WHERE r.created_at >= cutoff_timestamp AND r.remix_of IS NOT NULL
    GROUP BY r.remix_of
  ),
  timeframe_copies AS (
    SELECT c.prompt_id, COUNT(*) as count
    FROM public.prompt_copy_logs c
    WHERE c.copied_at >= cutoff_timestamp
    GROUP BY c.prompt_id
  ),
  timeframe_views AS (
    SELECT v.prompt_id, COUNT(*) as count
    FROM public.prompt_views v
    WHERE v.viewed_at >= cutoff_timestamp
    GROUP BY v.prompt_id
  )
  SELECT 
    p.id as prompt_id,
    p.title,
    p.image_url,
    p.ai_tool,
    p.category,
    p.user_id,
    p.created_at,
    pr.username,
    pr.full_name,
    pr.avatar_url,
    pr.badges,
    p.likes_count as likes_count_total,
    p.copies_count as copies_count_total,
    p.remix_count as remix_count_total,
    p.remix_of,
    COALESCE(tl.count, 0) * 1.0 +
    COALESCE(ts.count, 0) * 2.0 +
    COALESCE(tr.count, 0) * 3.0 +
    COALESCE(tc.count, 0) * 1.5 +
    COALESCE(tv.count, 0) * 0.1 as trend_score
  FROM public.prompts p
  JOIN public.profiles pr ON p.user_id = pr.id
  LEFT JOIN timeframe_likes tl ON p.id = tl.prompt_id
  LEFT JOIN timeframe_saves ts ON p.id = ts.prompt_id
  LEFT JOIN timeframe_remixes tr ON p.id = tr.prompt_id
  LEFT JOIN timeframe_copies tc ON p.id = tc.prompt_id
  LEFT JOIN timeframe_views tv ON p.id = tv.prompt_id
  WHERE pr.role NOT IN ('banned', 'suspended', 'permanently_banned')
    AND p.moderation_status = 'active'
  ORDER BY trend_score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_trending_prompts(TIMESTAMPTZ) TO anon, authenticated, service_role;

