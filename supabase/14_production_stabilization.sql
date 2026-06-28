-- ========================================================
-- PRIZOM PRODUCTION STABILIZATION MIGRATION
-- ========================================================

-- 1. Create missing optimization indexes
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_created_at ON public.saved_prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_views_viewed_at ON public.prompt_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_prompt_copy_logs_copied_at ON public.prompt_copy_logs(copied_at);
CREATE INDEX IF NOT EXISTS idx_prompts_remix_of ON public.prompts(remix_of);

-- 2. Create atomic rate limiting function to resolve race conditions
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  rate_limit_key TEXT,
  max_hits INT,
  window_ms INT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_hits INT,
  reset_timestamp TIMESTAMPTZ
) AS $$
DECLARE
  now_time TIMESTAMPTZ := NOW();
  record_hits INT;
  record_reset TIMESTAMPTZ;
BEGIN
  -- Insert or update rate limit record atomically
  INSERT INTO public.rate_limits (key, hits, reset_at)
  VALUES (rate_limit_key, 1, now_time + (window_ms || ' milliseconds')::INTERVAL)
  ON CONFLICT (key) DO UPDATE
  SET
    hits = CASE 
      WHEN public.rate_limits.reset_at < now_time THEN 1
      ELSE public.rate_limits.hits + 1
    END,
    reset_at = CASE 
      WHEN public.rate_limits.reset_at < now_time THEN now_time + (window_ms || ' milliseconds')::INTERVAL
      ELSE public.rate_limits.reset_at
    END
  RETURNING public.rate_limits.hits, public.rate_limits.reset_at INTO record_hits, record_reset;

  allowed := (record_hits <= max_hits);
  current_hits := record_hits;
  reset_timestamp := record_reset;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_rate_limit(TEXT, INT, INT) TO anon, authenticated, service_role;

-- 3. Create precomputed trending prompts cache table
CREATE TABLE IF NOT EXISTS public.trending_prompts_cache (
  timeframe TEXT NOT NULL, -- 'Today', 'This Week', 'This Month', 'All Time'
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT,
  ai_tool TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  username TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  badges JSONB,
  likes_count_total INT NOT NULL,
  copies_count_total INT NOT NULL,
  remix_count_total INT NOT NULL,
  remix_of UUID,
  trend_score NUMERIC NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (timeframe, prompt_id)
);

-- Enable RLS on cache table
ALTER TABLE public.trending_prompts_cache ENABLE ROW LEVEL SECURITY;

-- Read policy for everyone
DROP POLICY IF EXISTS "Anyone can read trending cache" ON public.trending_prompts_cache;
CREATE POLICY "Anyone can read trending cache" ON public.trending_prompts_cache FOR SELECT USING (true);

-- 4. Create function to refresh the precomputed trending prompts cache
CREATE OR REPLACE FUNCTION public.refresh_trending_prompts_cache()
RETURNS VOID AS $$
BEGIN
  -- Clear existing cache
  TRUNCATE TABLE public.trending_prompts_cache;

  -- 1. Cache 'Today'
  INSERT INTO public.trending_prompts_cache (timeframe, prompt_id, title, image_url, ai_tool, category, user_id, created_at, username, full_name, avatar_url, badges, likes_count_total, copies_count_total, remix_count_total, remix_of, trend_score)
  SELECT 'Today', prompt_id, title, image_url, ai_tool, category, user_id, created_at, username, full_name, avatar_url, badges, likes_count_total, copies_count_total, remix_count_total, remix_of, trend_score
  FROM public.get_trending_prompts(NOW() - INTERVAL '24 hours');

  -- 2. Cache 'This Week'
  INSERT INTO public.trending_prompts_cache (timeframe, prompt_id, title, image_url, ai_tool, category, user_id, created_at, username, full_name, avatar_url, badges, likes_count_total, copies_count_total, remix_count_total, remix_of, trend_score)
  SELECT 'This Week', prompt_id, title, image_url, ai_tool, category, user_id, created_at, username, full_name, avatar_url, badges, likes_count_total, copies_count_total, remix_count_total, remix_of, trend_score
  FROM public.get_trending_prompts(NOW() - INTERVAL '7 days');

  -- 3. Cache 'This Month'
  INSERT INTO public.trending_prompts_cache (timeframe, prompt_id, title, image_url, ai_tool, category, user_id, created_at, username, full_name, avatar_url, badges, likes_count_total, copies_count_total, remix_count_total, remix_of, trend_score)
  SELECT 'This Month', prompt_id, title, image_url, ai_tool, category, user_id, created_at, username, full_name, avatar_url, badges, likes_count_total, copies_count_total, remix_count_total, remix_of, trend_score
  FROM public.get_trending_prompts(NOW() - INTERVAL '30 days');

  -- 4. Cache 'All Time'
  INSERT INTO public.trending_prompts_cache (timeframe, prompt_id, title, image_url, ai_tool, category, user_id, created_at, username, full_name, avatar_url, badges, likes_count_total, copies_count_total, remix_count_total, remix_of, trend_score)
  SELECT 'All Time', prompt_id, title, image_url, ai_tool, category, user_id, created_at, username, full_name, avatar_url, badges, likes_count_total, copies_count_total, remix_count_total, remix_of, trend_score
  FROM public.get_trending_prompts(TIMESTAMPTZ '1970-01-01 00:00:00+00');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.refresh_trending_prompts_cache() TO anon, authenticated, service_role;

-- 5. Migrate existing user interests from array format to weight-based records
DO $$
DECLARE
  r RECORD;
  new_interests JSONB;
  cat_arr JSONB;
  tool_arr JSONB;
  cat_obj JSONB;
  tool_obj JSONB;
  elem TEXT;
BEGIN
  FOR r IN SELECT id, interests FROM public.profiles WHERE interests IS NOT NULL LOOP
    cat_arr := r.interests->'categories';
    tool_arr := r.interests->'tools';
    
    cat_obj := '{}'::jsonb;
    tool_obj := '{}'::jsonb;
    
    IF cat_arr IS NOT NULL AND jsonb_typeof(cat_arr) = 'array' THEN
      FOR elem IN SELECT jsonb_array_elements_text(cat_arr) LOOP
        cat_obj := jsonb_set(cat_obj, ARRAY[lower(elem)], '5'::jsonb);
      END LOOP;
    ELSIF cat_arr IS NOT NULL AND jsonb_typeof(cat_arr) = 'object' THEN
      cat_obj := cat_arr;
    END IF;

    IF tool_arr IS NOT NULL AND jsonb_typeof(tool_arr) = 'array' THEN
      FOR elem IN SELECT jsonb_array_elements_text(tool_arr) LOOP
        tool_obj := jsonb_set(tool_obj, ARRAY[lower(elem)], '5'::jsonb);
      END LOOP;
    ELSIF tool_arr IS NOT NULL AND jsonb_typeof(tool_arr) = 'object' THEN
      tool_obj := tool_arr;
    END IF;

    new_interests := jsonb_build_object(
      'categories', cat_obj,
      'tools', tool_obj,
      'aspectRatios', COALESCE(r.interests->'aspectRatios', '{}'::jsonb),
      'tags', COALESCE(r.interests->'tags', '{}'::jsonb),
      'creators', COALESCE(r.interests->'creators', '{}'::jsonb),
      'searches', COALESCE(r.interests->'searches', '[]'::jsonb)
    );

    UPDATE public.profiles SET interests = new_interests WHERE id = r.id;
  END LOOP;
END;
$$;
