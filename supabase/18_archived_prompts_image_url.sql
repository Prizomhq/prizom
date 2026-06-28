-- ========================================================
-- PRIZOM ARCHIVED PROMPTS IMAGE URL MIGRATION
-- ========================================================

-- 1. Add image_url to archived_prompts table if not exists
ALTER TABLE public.archived_prompts ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- 2. Update the archive_prompt_lifecycle function to copy image_url
CREATE OR REPLACE FUNCTION public.archive_prompt_lifecycle(target_prompt_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prompt_record RECORD;
  creator_username TEXT;
  creator_email TEXT;
BEGIN
  -- Get the prompt, creator profile username, and email
  SELECT p.*, pr.username, u.email AS creator_email INTO prompt_record
  FROM public.prompts p
  JOIN public.profiles pr ON p.user_id = pr.id
  LEFT JOIN auth.users u ON pr.id = u.id
  WHERE p.id = target_prompt_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  creator_username := COALESCE(prompt_record.username, 'creator');
  creator_email := COALESCE(prompt_record.creator_email, creator_username || '@prizom.com');

  -- 1. Insert into archived_prompts including image_url
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
    parent_prompt_id,
    image_url
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
    prompt_record.parent_prompt_id,
    prompt_record.image_url
  )
  ON CONFLICT (id) DO UPDATE SET
    image_url = EXCLUDED.image_url;

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
