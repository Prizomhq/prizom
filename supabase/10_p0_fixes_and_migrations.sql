-- ========================================================
-- PRIZOM P0 PRODUCTION FIXES & SECURITY HARDENING
-- ========================================================

-- 0a. Create is_admin helper bypassing RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('super_admin', 'admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO anon, authenticated, service_role;

-- 0b. Create is_suspended helper bypassing RLS interaction constraints
CREATE OR REPLACE FUNCTION public.is_suspended(creator_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF creator_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = creator_id AND role IN ('suspended', 'banned', 'permanently_banned')
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.is_suspended(UUID) TO anon, authenticated, service_role;

-- 0c. Create are_users_blocked helper bypassing RLS lookup restrictions
CREATE OR REPLACE FUNCTION public.are_users_blocked(user_id_1 UUID, user_id_2 UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_id_1 IS NULL OR user_id_2 IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = user_id_1 AND blocked_id = user_id_2)
       OR (blocker_id = user_id_2 AND blocked_id = user_id_1)
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.are_users_blocked(UUID, UUID) TO anon, authenticated, service_role;

-- 1. Create admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings, public can read public settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Admins can manage settings" ON public.admin_settings 
  FOR ALL USING (
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Public can view settings" ON public.admin_settings;
CREATE POLICY "Public can view settings" ON public.admin_settings 
  FOR SELECT USING (true);

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  "order" INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  show_on_explore BOOLEAN DEFAULT TRUE,
  approved BOOLEAN DEFAULT TRUE,
  suggested_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can read categories, admins can manage them
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories 
  FOR ALL USING (
    public.is_admin(auth.uid())
  );

-- 3. Create ai_tools table
CREATE TABLE IF NOT EXISTS public.ai_tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  website TEXT,
  approved BOOLEAN DEFAULT TRUE,
  suggested_by TEXT,
  show_on_explore BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on ai_tools
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

-- Public can read AI tools, admins can manage them
DROP POLICY IF EXISTS "AI tools are viewable by everyone" ON public.ai_tools;
CREATE POLICY "AI tools are viewable by everyone" ON public.ai_tools 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage AI tools" ON public.ai_tools;
CREATE POLICY "Admins can manage AI tools" ON public.ai_tools 
  FOR ALL USING (
    public.is_admin(auth.uid())
  );

-- 4. Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  replies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Public can submit messages, owner or admin can view
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners and admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Owners and admins can view contact messages" ON public.contact_messages 
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages 
  FOR UPDATE USING (
    public.is_admin(auth.uid())
  );

-- 5. Create whitelist_users table
CREATE TABLE IF NOT EXISTS public.whitelist_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on whitelist_users
ALTER TABLE public.whitelist_users ENABLE ROW LEVEL SECURITY;

-- Only admins can manage and view whitelist
DROP POLICY IF EXISTS "Admins can view whitelist_users" ON public.whitelist_users;
CREATE POLICY "Admins can view whitelist_users" ON public.whitelist_users 
  FOR SELECT USING (
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage whitelist_users" ON public.whitelist_users;
CREATE POLICY "Admins can manage whitelist_users" ON public.whitelist_users 
  FOR ALL USING (
    public.is_admin(auth.uid())
  );

-- ========================================================
-- RLS HARDENING FOR MAIN TABLES (ISSUE 2)
-- ========================================================

-- A. PROMPTS SELECT POLICY
DROP POLICY IF EXISTS "Prompts are viewable by everyone." ON public.prompts;
CREATE POLICY "Prompts are viewable by everyone." ON public.prompts 
  FOR SELECT 
  USING (
    -- 1. Admins/Moderators see everything
    public.is_admin(auth.uid())
    OR (
      -- 2. Creator sees their own prompts (even if hidden or creator is suspended)
      auth.uid() = user_id
    )
    OR (
      -- 3. Guests / Standard users see only active, non-hidden prompts of active creators
      moderation_status = 'active'
      AND NOT is_hidden
      AND NOT public.is_suspended(user_id)
      AND NOT public.are_users_blocked(auth.uid(), user_id)
    )
  );

-- B. PROFILES SELECT POLICY
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles 
  FOR SELECT 
  USING (
    -- 1. Admins/Moderators see all profiles (non-recursive check)
    public.is_admin(auth.uid())
    OR (
      -- 2. Owner sees their own profile
      auth.uid() = id
    )
    OR (
      -- 3. Non-suspended/non-banned profiles are visible to users who aren't in a block relationship with them
      role NOT IN ('suspended', 'banned', 'permanently_banned')
      AND NOT public.are_users_blocked(auth.uid(), id)
    )
  );

-- C. COLLECTIONS SELECT POLICY
DROP POLICY IF EXISTS "Users can view own collections." ON public.collections;
CREATE POLICY "Users can view own collections." ON public.collections 
  FOR SELECT 
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

-- D. SAVED PROMPTS SELECT POLICY
DROP POLICY IF EXISTS "Users can view own saved_prompts." ON public.saved_prompts;
CREATE POLICY "Users can view own saved_prompts." ON public.saved_prompts 
  FOR SELECT 
  USING (
    (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.prompts p
        WHERE p.id = prompt_id
      )
    )
    OR public.is_admin(auth.uid())
  );

-- E. REPORTS SELECT POLICIES
DROP POLICY IF EXISTS "Users can view own submitted user reports." ON public.user_reports;
DROP POLICY IF EXISTS "Admins can view all user reports." ON public.user_reports;
DROP POLICY IF EXISTS "User reports view policy" ON public.user_reports;
CREATE POLICY "User reports view policy" ON public.user_reports 
  FOR SELECT 
  USING (
    auth.uid() = reporter_id
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can view own submitted prompt reports." ON public.prompt_reports;
DROP POLICY IF EXISTS "Admins can view all prompt reports." ON public.prompt_reports;
DROP POLICY IF EXISTS "Prompt reports view policy" ON public.prompt_reports;
CREATE POLICY "Prompt reports view policy" ON public.prompt_reports 
  FOR SELECT 
  USING (
    auth.uid() = reporter_id
    OR public.is_admin(auth.uid())
  );

-- F. PROMPT APPEALS SELECT POLICY
DROP POLICY IF EXISTS "Users can view own prompt appeals." ON public.prompt_appeals;
DROP POLICY IF EXISTS "Prompt appeals view policy" ON public.prompt_appeals;
CREATE POLICY "Prompt appeals view policy" ON public.prompt_appeals 
  FOR SELECT 
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

-- G. ARCHIVED PROMPTS SELECT POLICY
DROP POLICY IF EXISTS "Admins can view archived prompts" ON public.archived_prompts;
DROP POLICY IF EXISTS "Archived prompts view policy" ON public.archived_prompts;
CREATE POLICY "Archived prompts view policy" ON public.archived_prompts 
  FOR SELECT 
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

-- Grant privileges so anonymous and authenticated client users can call REST actions under RLS
GRANT ALL ON public.admin_settings TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.categories TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.ai_tools TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.contact_messages TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.whitelist_users TO anon, authenticated, service_role, postgres;
