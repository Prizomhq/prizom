-- ====================================================
-- PRIZOM REPORTING & MODERATION SYSTEM REFACTOR
-- ====================================================

-- 1. Create filtered unique indexes to block duplicate active reports
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_prompt_report 
  ON public.prompt_reports (reporter_id, prompt_id) 
  WHERE (status IN ('pending', 'under_review'));

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_report 
  ON public.user_reports (reporter_id, reported_id) 
  WHERE (status IN ('pending', 'under_review'));

-- 2. Add self-reporting check constraint to user_reports
ALTER TABLE public.user_reports 
  DROP CONSTRAINT IF EXISTS no_self_report,
  ADD CONSTRAINT no_self_report CHECK (reporter_id <> reported_id);

-- 3. Add prompt snapshot column to prompt_reports
ALTER TABLE public.prompt_reports
  ADD COLUMN IF NOT EXISTS prompt_snapshot JSONB DEFAULT NULL;
