-- PRIZOM AI LAUNCHER SYSTEM METADATA MIGRATION
-- 1. Extend the prompts table to support launcher metadata
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS primary_ai_platform TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS supported_models TEXT[] DEFAULT '{}';
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS launch_url TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS prompt_type TEXT DEFAULT 'text';

-- 2. Create prompt_launch_logs table for analytics tracking
CREATE TABLE IF NOT EXISTS public.prompt_launch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'launch_clicked', 'launch_success', 'clipboard_failure', 'popup_blocked', 'guide_displayed', 'guide_completed', 'guide_skipped'
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on prompt_launch_logs
ALTER TABLE public.prompt_launch_logs ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies for prompt_launch_logs
DROP POLICY IF EXISTS "Anyone can insert launch logs" ON public.prompt_launch_logs;
CREATE POLICY "Anyone can insert launch logs" ON public.prompt_launch_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view launch logs" ON public.prompt_launch_logs;
CREATE POLICY "Admins can view launch logs" ON public.prompt_launch_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_prompt_launch_logs_prompt_id ON public.prompt_launch_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_launch_logs_created_at ON public.prompt_launch_logs(created_at);

-- 6. Grant privileges explicitly for anon, authenticated, and service_role
GRANT ALL ON TABLE public.prompt_launch_logs TO postgres;
GRANT ALL ON TABLE public.prompt_launch_logs TO service_role;
GRANT INSERT ON TABLE public.prompt_launch_logs TO anon;
GRANT INSERT ON TABLE public.prompt_launch_logs TO authenticated;
GRANT SELECT ON TABLE public.prompt_launch_logs TO authenticated;

