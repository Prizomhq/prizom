-- ========================================================
-- PRIZOM VERIFICATION & REMIX ANTI-FARMING HARDENING MIGRATION
-- ========================================================

-- 1. Exclude self-copies from creator verification calculations
CREATE OR REPLACE FUNCTION public.check_and_update_creator_verification(creator_id UUID)
RETURNS VOID AS $$
DECLARE
  total_copies INT;
  total_prompts INT;
  account_age_days INT;
  profile_complete BOOLEAN;
  clean_standing BOOLEAN;
  is_eligible BOOLEAN;
  current_badges JSONB;
  current_verification_source TEXT;
  has_verified BOOLEAN;
  new_badges JSONB;
BEGIN
  -- A. Get total copies count from prompt_copy_logs (excluding self-copies)
  SELECT COUNT(*) INTO total_copies
  FROM public.prompt_copy_logs pcl
  JOIN public.prompts p ON pcl.prompt_id = p.id
  WHERE p.user_id = creator_id
    AND (pcl.copier_id IS NULL OR pcl.copier_id <> creator_id);

  -- B. Get total prompts count
  SELECT COUNT(*) INTO total_prompts
  FROM public.prompts
  WHERE user_id = creator_id;

  -- C. Fetch basic info including verification_source
  SELECT 
    EXTRACT(EPOCH FROM (NOW() - created_at))/86400,
    (full_name IS NOT NULL AND full_name <> '' AND avatar_url IS NOT NULL AND avatar_url <> '' AND bio IS NOT NULL AND bio <> ''),
    (role NOT IN ('banned', 'suspended', 'permanently_banned')),
    badges,
    verification_source
  INTO account_age_days, profile_complete, clean_standing, current_badges, current_verification_source
  FROM public.profiles
  WHERE id = creator_id;

  -- D. Refined standing check (including pending reports)
  IF clean_standing THEN
    DECLARE
      pending_reports INT;
    BEGIN
      SELECT (
        (SELECT COUNT(*) FROM public.user_reports WHERE reported_id = creator_id AND status = 'pending') +
        (SELECT COUNT(*) FROM public.prompt_reports pr JOIN public.prompts p ON pr.prompt_id = p.id WHERE p.user_id = creator_id AND pr.status = 'pending')
      ) INTO pending_reports;
      
      IF pending_reports > 0 THEN
        clean_standing := FALSE;
      END IF;
    END;
  END IF;

  -- E. Determine overall eligibility against all 5 checklist rules
  is_eligible := (total_copies >= 1000) AND (total_prompts >= 10) AND (account_age_days >= 30) AND profile_complete AND clean_standing;

  -- G. Check if badges holds "verified"
  has_verified := current_badges @> '["verified"]'::jsonb;

  IF is_eligible AND NOT has_verified THEN
    -- Grant badge and set source to auto
    new_badges := current_badges || '["verified"]'::jsonb;
    UPDATE public.profiles SET badges = new_badges, verification_source = 'auto' WHERE id = creator_id;
    
    -- Notification
    INSERT INTO public.notifications (user_id, actor_id, type, text)
    VALUES (creator_id, NULL, 'verification', 'Congratulations! Your profile is now automatically verified with a Prizom Creator Badge! 🎖️ You satisfied all platform verification criteria!');
  ELSIF NOT is_eligible AND has_verified THEN
    -- CRITICAL CHECK: Manual verification must override automatic verification logic!
    IF current_verification_source = 'manual' THEN
      -- SKIP automatic removal. Do not alter badge or status.
      RETURN;
    END IF;

    -- Revoke badge and clear source
    SELECT jsonb_agg(elem) INTO new_badges
    FROM jsonb_array_elements_text(current_badges) AS elem
    WHERE elem <> 'verified';
    
    IF new_badges IS NULL THEN
      new_badges := '[]'::jsonb;
    END IF;
    
    UPDATE public.profiles SET badges = new_badges, verification_source = NULL WHERE id = creator_id;
    
    -- Notification
    INSERT INTO public.notifications (user_id, actor_id, type, text)
    VALUES (creator_id, NULL, 'moderation', 'Your verified creator badge has been revoked because account criteria are no longer met.');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Exclude self-remixes from remix counts
CREATE OR REPLACE FUNCTION public.handle_remix_count_change()
RETURNS TRIGGER AS $$
DECLARE
  parent_owner_id UUID;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.remix_of IS NOT NULL) THEN
    SELECT user_id INTO parent_owner_id FROM public.prompts WHERE id = NEW.remix_of;
    IF (NEW.user_id <> parent_owner_id) THEN
      UPDATE public.prompts SET remix_count = remix_count + 1 WHERE id = NEW.remix_of;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE' AND OLD.remix_of IS NOT NULL) THEN
    SELECT user_id INTO parent_owner_id FROM public.prompts WHERE id = OLD.remix_of;
    IF (OLD.user_id <> parent_owner_id) THEN
      UPDATE public.prompts SET remix_count = GREATEST(0, remix_count - 1) WHERE id = OLD.remix_of;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
