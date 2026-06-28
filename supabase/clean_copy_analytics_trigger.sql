-- ==========================================
-- PRIZOM REMEDIATION: COPY & VIEW TRIGGERS
-- ==========================================

-- 1. Add views_count and verification_source columns to prompts and profiles tables if not exists
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT NULL;

-- 2. Copies Count Trigger
CREATE OR REPLACE FUNCTION public.handle_copies_count_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.prompts SET copies_count = copies_count + 1 WHERE id = NEW.prompt_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.prompts SET copies_count = GREATEST(0, copies_count - 1) WHERE id = OLD.prompt_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_copy_change ON public.prompt_copy_logs;
CREATE TRIGGER on_copy_change
  AFTER INSERT OR DELETE ON public.prompt_copy_logs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_copies_count_change();


-- 3. Views Count Trigger
CREATE OR REPLACE FUNCTION public.handle_views_count_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.prompts SET views_count = views_count + 1 WHERE id = NEW.prompt_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.prompts SET views_count = GREATEST(0, views_count - 1) WHERE id = OLD.prompt_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_view_change ON public.prompt_views;
CREATE TRIGGER on_view_change
  AFTER INSERT OR DELETE ON public.prompt_views
  FOR EACH ROW EXECUTE PROCEDURE public.handle_views_count_change();


-- 4. Central Verification Calculations and Badge Trigger
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
  -- A. Get total copies count from prompt_copy_logs
  SELECT COUNT(*) INTO total_copies
  FROM public.prompt_copy_logs pcl
  JOIN public.prompts p ON pcl.prompt_id = p.id
  WHERE p.user_id = creator_id;

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


-- 5. Trigger functions for Central Verification

-- Copy Log change trigger
CREATE OR REPLACE FUNCTION public.on_copy_log_change_verification()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT user_id INTO creator_id FROM public.prompts WHERE id = NEW.prompt_id;
  ELSE
    SELECT user_id INTO creator_id FROM public.prompts WHERE id = OLD.prompt_id;
  END IF;
  
  IF creator_id IS NOT NULL THEN
    PERFORM public.check_and_update_creator_verification(creator_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_copy_log_change_ver ON public.prompt_copy_logs;
CREATE TRIGGER on_copy_log_change_ver
  AFTER INSERT OR DELETE ON public.prompt_copy_logs
  FOR EACH ROW EXECUTE PROCEDURE public.on_copy_log_change_verification();

-- Prompt change trigger
CREATE OR REPLACE FUNCTION public.on_prompt_change_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.check_and_update_creator_verification(NEW.user_id);
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.check_and_update_creator_verification(OLD.user_id);
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.user_id <> OLD.user_id THEN
      PERFORM public.check_and_update_creator_verification(NEW.user_id);
      PERFORM public.check_and_update_creator_verification(OLD.user_id);
    ELSE
      PERFORM public.check_and_update_creator_verification(NEW.user_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_prompt_change_ver ON public.prompts;
CREATE TRIGGER on_prompt_change_ver
  AFTER INSERT OR DELETE OR UPDATE ON public.prompts
  FOR EACH ROW EXECUTE PROCEDURE public.on_prompt_change_verification();

-- Profile change trigger
CREATE OR REPLACE FUNCTION public.on_profile_change_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.full_name IS DISTINCT FROM NEW.full_name OR
      OLD.avatar_url IS DISTINCT FROM NEW.avatar_url OR
      OLD.bio IS DISTINCT FROM NEW.bio OR
      OLD.role IS DISTINCT FROM NEW.role) THEN
    PERFORM public.check_and_update_creator_verification(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_change_ver ON public.profiles;
CREATE TRIGGER on_profile_change_ver
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.on_profile_change_verification();

-- Moderation Report change trigger
CREATE OR REPLACE FUNCTION public.on_report_change_verification()
RETURNS TRIGGER AS $$
DECLARE
  creator_id UUID;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF TG_TABLE_NAME = 'user_reports' THEN
      creator_id := NEW.reported_id;
    ELSE
      SELECT user_id INTO creator_id FROM public.prompts WHERE id = NEW.prompt_id;
    END IF;
  ELSE
    IF TG_TABLE_NAME = 'user_reports' THEN
      creator_id := OLD.reported_id;
    ELSE
      SELECT user_id INTO creator_id FROM public.prompts WHERE id = OLD.prompt_id;
    END IF;
  END IF;

  IF creator_id IS NOT NULL THEN
    PERFORM public.check_and_update_creator_verification(creator_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_report_ver ON public.user_reports;
CREATE TRIGGER on_user_report_ver
  AFTER INSERT OR DELETE OR UPDATE ON public.user_reports
  FOR EACH ROW EXECUTE PROCEDURE public.on_report_change_verification();

DROP TRIGGER IF EXISTS on_prompt_report_ver ON public.prompt_reports;
CREATE TRIGGER on_prompt_report_ver
  AFTER INSERT OR DELETE OR UPDATE ON public.prompt_reports
  FOR EACH ROW EXECUTE PROCEDURE public.on_report_change_verification();


-- 6. Recalculate existing prompts copies_count and views_count to sync with actual log transactions
UPDATE public.prompts p
SET 
  copies_count = (SELECT COUNT(*) FROM public.prompt_copy_logs WHERE prompt_id = p.id),
  views_count = (SELECT COUNT(*) FROM public.prompt_views WHERE prompt_id = p.id);

-- 7. Recalculate all profiles badges verification eligibility right now
DO $$
DECLARE
  profile_rec RECORD;
BEGIN
  FOR profile_rec IN SELECT id FROM public.profiles LOOP
    PERFORM public.check_and_update_creator_verification(profile_rec.id);
  END LOOP;
END;
$$;


-- ==========================================
-- 8. GRANT EXPLICIT TABLE PRIVILEGES TO API ROLES
-- ==========================================
GRANT ALL ON public.profiles TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.prompts TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.likes TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.saves TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.comments TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.followers TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.prompt_copy_logs TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.prompt_views TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.blocked_users TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.user_reports TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.prompt_reports TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.notifications TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.achievements TO anon, authenticated, service_role, postgres;
GRANT ALL ON public.user_achievements TO anon, authenticated, service_role, postgres;
