-- ==========================================
-- PRIZOM SYSTEM HARDENING MIGRATIONS
-- ==========================================

-- 1. Create prompt_views table
CREATE TABLE IF NOT EXISTS public.prompt_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.prompt_views ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can insert views." ON public.prompt_views;
CREATE POLICY "Anyone can insert views." ON public.prompt_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all views." ON public.prompt_views;
CREATE POLICY "Admins can view all views." ON public.prompt_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Indices for views lookup and optimization
CREATE INDEX IF NOT EXISTS idx_prompt_views_prompt_id ON public.prompt_views(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_views_cutoff ON public.prompt_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_prompt_views_cooldown ON public.prompt_views(prompt_id, ip_hash, viewed_at);


-- 2. Create prompt_copy_logs table
CREATE TABLE IF NOT EXISTS public.prompt_copy_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  copier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash TEXT NOT NULL,
  copied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.prompt_copy_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can insert copy logs." ON public.prompt_copy_logs;
CREATE POLICY "Anyone can insert copy logs." ON public.prompt_copy_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all copy logs." ON public.prompt_copy_logs;
CREATE POLICY "Admins can view all copy logs." ON public.prompt_copy_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Indices for copies lookup and optimization
CREATE INDEX IF NOT EXISTS idx_prompt_copy_logs_prompt_id ON public.prompt_copy_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_copy_logs_cutoff ON public.prompt_copy_logs(copied_at);
CREATE INDEX IF NOT EXISTS idx_prompt_copy_logs_cooldown ON public.prompt_copy_logs(prompt_id, ip_hash, copied_at);


-- 3. Database Triggers for Counter Integrity

-- Likes Count Trigger
CREATE OR REPLACE FUNCTION public.handle_likes_count_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.prompts SET likes_count = likes_count + 1 WHERE id = NEW.prompt_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.prompts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.prompt_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_likes_count_change();

-- Saves Count Trigger
CREATE OR REPLACE FUNCTION public.handle_saves_count_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.prompts SET saves_count = saves_count + 1 WHERE id = NEW.prompt_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.prompts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.prompt_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_save_change ON public.saved_prompts;
CREATE TRIGGER on_save_change
  AFTER INSERT OR DELETE ON public.saved_prompts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_saves_count_change();

-- Remix Count Trigger
CREATE OR REPLACE FUNCTION public.handle_remix_count_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.remix_of IS NOT NULL) THEN
    UPDATE public.prompts SET remix_count = remix_count + 1 WHERE id = NEW.remix_of;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE' AND OLD.remix_of IS NOT NULL) THEN
    UPDATE public.prompts SET remix_count = GREATEST(0, remix_count - 1) WHERE id = OLD.remix_of;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_remix_created ON public.prompts;
DROP TRIGGER IF EXISTS on_remix_change ON public.prompts;
CREATE TRIGGER on_remix_change
  AFTER INSERT OR DELETE ON public.prompts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_remix_count_change();


-- 4. Dynamic Trending Scoring RPC Function
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
  ORDER BY trend_score DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Force-Sync existing count columns in prompts table to match current relations
UPDATE public.prompts p
SET 
  likes_count = (SELECT COUNT(*) FROM public.likes WHERE prompt_id = p.id),
  saves_count = (SELECT COUNT(*) FROM public.saved_prompts WHERE prompt_id = p.id),
  remix_count = (SELECT COUNT(*) FROM public.prompts WHERE remix_of = p.id);


-- 6. Platform Stats Aggregator RPC Function
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (
  total_prompts BIGINT,
  active_creators BIGINT,
  remix_count BIGINT,
  daily_uploads BIGINT,
  total_collections BIGINT,
  total_likes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.prompts) as total_prompts,
    (SELECT COUNT(DISTINCT user_id) FROM public.prompts) as active_creators,
    (SELECT COUNT(*) FROM public.prompts WHERE remix_of IS NOT NULL) as remix_count,
    (SELECT COUNT(*) FROM public.prompts WHERE created_at >= NOW() - INTERVAL '24 hours') as daily_uploads,
    (SELECT COUNT(*) FROM public.collections) as total_collections,
    (SELECT COUNT(*) FROM public.likes) as total_likes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Grant explicit privileges to Supabase roles
GRANT ALL ON public.prompt_views TO anon, authenticated, service_role;
GRANT ALL ON public.prompt_copy_logs TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_trending_prompts(TIMESTAMPTZ) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO anon, authenticated, service_role;


-- 8. Add is_hidden and is_featured columns to prompts
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 9. Secure prompts view policy against hidden prompts and blocks
DROP POLICY IF EXISTS "Prompts are viewable by everyone." ON public.prompts;
CREATE POLICY "Prompts are viewable by everyone." ON public.prompts FOR SELECT 
  USING (
    (NOT is_hidden OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'moderator')))
    AND (
      auth.uid() IS NULL 
      OR NOT EXISTS (
        SELECT 1 FROM public.blocked_users 
        WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
           OR (blocker_id = user_id AND blocked_id = auth.uid())
      )
    )
  );

-- 10. Secure comments view policy against blocks
DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT
  USING (
    auth.uid() IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
         OR (blocker_id = user_id AND blocked_id = auth.uid())
    )
  );

-- 11. Create collections and saved_prompts tables and set policies
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.saved_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(collection_id, prompt_id, user_id)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own collections." ON public.collections;
CREATE POLICY "Users can view own collections." ON public.collections FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own collections." ON public.collections;
CREATE POLICY "Users can insert own collections." ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections." ON public.collections;
CREATE POLICY "Users can delete own collections." ON public.collections FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can view own saved_prompts." ON public.saved_prompts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can insert own saved_prompts." ON public.saved_prompts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can delete own saved_prompts." ON public.saved_prompts FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON public.collections TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.saved_prompts TO anon, authenticated, service_role, postgres;

-- 12. Fix uniqueness conflict on new user registration (handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix_counter INT := 1;
  username_exists BOOLEAN;
BEGIN
  base_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  base_username := regexp_replace(lower(trim(base_username)), '[^a-z0-9_]', '', 'g');
  
  IF length(base_username) < 3 THEN
    base_username := base_username || 'user';
  ELSIF length(base_username) > 15 THEN
    base_username := substring(base_username from 1 for 15);
  END IF;
  
  final_username := base_username;
  
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE username = final_username
    ) INTO username_exists;
    
    IF NOT username_exists THEN
      EXIT;
    END IF;
    
    final_username := substring(base_username from 1 for 15) || suffix_counter::text;
    suffix_counter := suffix_counter + 1;
  END LOOP;

  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    final_username, 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
