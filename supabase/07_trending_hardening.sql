-- ====================================================
-- PRIZOM TRENDING ALGORITHM HARDENING & LIFE-CYCLE SYNC
-- ====================================================

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
    -- Hardening Task 2: Replace raw save counts with UNIQUE user saves
    SELECT s.prompt_id, COUNT(DISTINCT s.user_id) as count
    FROM public.saved_prompts s
    WHERE s.created_at >= cutoff_timestamp
    GROUP BY s.prompt_id
  ),
  timeframe_remixes AS (
    -- Hardening Task 3: Exclude self-remixes (only credit remixes created by different users)
    SELECT r.remix_of as prompt_id, COUNT(*) as count
    FROM public.prompts r
    JOIN public.prompts parent ON r.remix_of = parent.id
    WHERE r.created_at >= cutoff_timestamp 
      AND r.remix_of IS NOT NULL
      AND r.user_id <> parent.user_id -- Exclude self-remixes
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
    -- Hardening Task 1 & 4: Exclude pending_deletion, archived, and deleted prompts
    AND p.moderation_status = 'active'
  ORDER BY trend_score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant execute permission to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION public.get_trending_prompts(TIMESTAMPTZ) TO anon, authenticated, service_role;
