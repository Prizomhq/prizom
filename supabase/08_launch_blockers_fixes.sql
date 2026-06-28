-- ========================================================
-- PRIZOM LAUNCH BLOCKERS DATABASE FIXES (PHASE 3)
-- ========================================================

-- 1. Create Guest Usage Limits Table
CREATE TABLE IF NOT EXISTS public.guest_usage_limits (
  ip_hash TEXT PRIMARY KEY,
  copies_today INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on guest_usage_limits
ALTER TABLE public.guest_usage_limits ENABLE ROW LEVEL SECURITY;

-- Admins can manage guest_usage_limits
DROP POLICY IF EXISTS "Admins can manage guest_usage_limits" ON public.guest_usage_limits;
CREATE POLICY "Admins can manage guest_usage_limits" ON public.guest_usage_limits FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- Grant privileges so API and service roles can read/write the table
GRANT ALL ON public.guest_usage_limits TO anon, authenticated, service_role, postgres;

-- Trigger Function to auto-increment guest copies
CREATE OR REPLACE FUNCTION public.handle_guest_copy_increment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.copier_id IS NULL THEN
    INSERT INTO public.guest_usage_limits (ip_hash, copies_today, last_reset)
    VALUES (NEW.ip_hash, 1, NOW())
    ON CONFLICT (ip_hash) DO UPDATE
    SET copies_today = CASE 
          WHEN guest_usage_limits.last_reset < NOW() - INTERVAL '1 day' THEN 1
          ELSE guest_usage_limits.copies_today + 1
        END,
        last_reset = CASE 
          WHEN guest_usage_limits.last_reset < NOW() - INTERVAL '1 day' THEN NOW()
          ELSE guest_usage_limits.last_reset
        END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS on_guest_copy_increment ON public.prompt_copy_logs;
CREATE TRIGGER on_guest_copy_increment
  AFTER INSERT ON public.prompt_copy_logs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_guest_copy_increment();


-- 2. Add Suspension and Appeals Columns to Profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS warning_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS appeal_status TEXT DEFAULT 'none' CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS appeal_reason TEXT,
  ADD COLUMN IF NOT EXISTS appeal_supporting_info TEXT,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT;


-- 3. Update Saves Count Trigger to Only Count Unique Saves (Bulletproof Recalculation Pattern)
CREATE OR REPLACE FUNCTION public.handle_saves_count_change()
RETURNS TRIGGER AS $$
DECLARE
  target_prompt_id UUID;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    target_prompt_id := NEW.prompt_id;
  ELSE
    target_prompt_id := OLD.prompt_id;
  END IF;

  UPDATE public.prompts 
  SET saves_count = (
    SELECT COALESCE(COUNT(DISTINCT user_id), 0) 
    FROM public.saved_prompts 
    WHERE prompt_id = target_prompt_id
  ) 
  WHERE id = target_prompt_id;

  IF (TG_OP = 'INSERT') THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Create RPC for Transactional/Atomic Day 30 Prompt Archival
CREATE OR REPLACE FUNCTION public.archive_prompt_lifecycle(target_prompt_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prompt_record RECORD;
  creator_username TEXT;
  creator_email TEXT;
BEGIN
  -- Get the prompt and creator profile username
  SELECT p.*, pr.username INTO prompt_record
  FROM public.prompts p
  JOIN public.profiles pr ON p.user_id = pr.id
  WHERE p.id = target_prompt_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  creator_username := COALESCE(prompt_record.username, 'creator');
  creator_email := creator_username || '@prizom.com';

  -- 1. Insert into archived_prompts
  INSERT INTO public.archived_prompts (
    id,
    user_id,
    creator_username,
    creator_email,
    title,
    prompt_text,
    negative_prompt,
    ai_tool,
    category,
    likes_count,
    saves_count,
    copies_count,
    remix_count,
    moderation_reason,
    moderated_at,
    moderated_by,
    original_root_id,
    parent_prompt_id
  ) VALUES (
    prompt_record.id,
    prompt_record.user_id,
    creator_username,
    creator_email,
    prompt_record.title,
    prompt_record.prompt_text,
    prompt_record.negative_prompt,
    prompt_record.ai_tool,
    prompt_record.category,
    prompt_record.likes_count,
    prompt_record.saves_count,
    prompt_record.copies_count,
    prompt_record.remix_count,
    prompt_record.moderation_reason,
    prompt_record.moderated_at,
    prompt_record.moderated_by,
    prompt_record.original_root_id,
    prompt_record.parent_prompt_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Delete from prompts
  DELETE FROM public.prompts WHERE id = target_prompt_id;

  -- 3. Log to moderation_logs
  INSERT INTO public.moderation_logs (
    moderator_email,
    action,
    target_id,
    reason
  ) VALUES (
    'system@prizom.com',
    'archive_prompt',
    target_prompt_id,
    'Prompt archived automatically after 30 days without successful appeal.'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
