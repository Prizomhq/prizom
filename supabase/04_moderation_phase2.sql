-- ====================================================
-- PRIZOM MODERATION SYSTEM REFACTOR (PHASE 2)
-- ====================================================

-- 1. Add warning_sent column to prompts table
ALTER TABLE public.prompts 
  ADD COLUMN IF NOT EXISTS warning_sent BOOLEAN DEFAULT FALSE;

-- 2. Add reviewed_by and reviewed_at columns to prompt_appeals
ALTER TABLE public.prompt_appeals 
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- 3. Create archived_prompts table if not exists (to survive account deletion)
CREATE TABLE IF NOT EXISTS public.archived_prompts (
  id UUID PRIMARY KEY,
  user_id UUID, -- Keep UUID of creator (survives account deletion because no FK references public.profiles(id) ON DELETE CASCADE)
  creator_username TEXT,
  creator_email TEXT,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  ai_tool TEXT NOT NULL,
  category TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  copies_count INTEGER DEFAULT 0,
  remix_count INTEGER DEFAULT 0,
  moderation_reason TEXT,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderated_by UUID,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on archived_prompts
ALTER TABLE public.archived_prompts ENABLE ROW LEVEL SECURITY;

-- Admins can view archived prompts
DROP POLICY IF EXISTS "Admins can view archived prompts" ON public.archived_prompts;
CREATE POLICY "Admins can view archived prompts" ON public.archived_prompts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Grant privileges
GRANT ALL ON public.archived_prompts TO anon, authenticated, service_role;
