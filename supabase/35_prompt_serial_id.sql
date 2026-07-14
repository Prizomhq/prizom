-- PRIZOM PROMPT SERIAL ID & SHARE CARD ANALYTICS MIGRATION
-- 1. Create a sequence for prompt serial IDs starting at 1000
CREATE SEQUENCE IF NOT EXISTS public.prompts_serial_id_seq START WITH 1000;

-- 2. Add the serial_id column using the sequence
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS serial_id INTEGER DEFAULT nextval('public.prompts_serial_id_seq');

-- 3. Add UNIQUE constraint to serial_id
ALTER TABLE public.prompts ADD CONSTRAINT prompts_serial_id_key UNIQUE (serial_id);

-- 4. Create share_card_generation_logs table for analytics tracking
CREATE TABLE IF NOT EXISTS public.share_card_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on share_card_generation_logs
ALTER TABLE public.share_card_generation_logs ENABLE ROW LEVEL SECURITY;

-- 6. Set RLS Policies for share_card_generation_logs
DROP POLICY IF EXISTS "Admins can view share card logs" ON public.share_card_generation_logs;
CREATE POLICY "Admins can view share card logs" ON public.share_card_generation_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert share card logs" ON public.share_card_generation_logs;
CREATE POLICY "Anyone can insert share card logs" ON public.share_card_generation_logs
  FOR INSERT WITH CHECK (true);

-- 7. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_share_card_logs_prompt_id ON public.share_card_generation_logs(prompt_id);
CREATE INDEX IF NOT EXISTS idx_share_card_logs_creator_id ON public.share_card_generation_logs(creator_id);

-- 8. Grant privileges explicitly for anon, authenticated, and service_role
GRANT ALL ON TABLE public.share_card_generation_logs TO postgres;
GRANT ALL ON TABLE public.share_card_generation_logs TO service_role;
GRANT INSERT ON TABLE public.share_card_generation_logs TO anon;
GRANT INSERT ON TABLE public.share_card_generation_logs TO authenticated;
GRANT SELECT ON TABLE public.share_card_generation_logs TO authenticated;
