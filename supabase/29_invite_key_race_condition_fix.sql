-- ========================================================
-- PRIZOM SECURITY PATCH: INVITE KEY CONCURRENCY RACE FIX
-- ========================================================

-- Update trigger function to check invite key and increment uses atomically in one statement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invite_key_val TEXT;
  key_exists BOOLEAN := false;
BEGIN
  invite_key_val := new.raw_user_meta_data->>'invite_key';
  
  IF invite_key_val IS NOT NULL THEN
    -- Increment uses atomically in a single statement (acquires row-level lock)
    UPDATE public.invite_keys 
    SET uses = uses + 1 
    WHERE key = invite_key_val AND is_active = true AND uses < max_uses;
    
    -- FOUND evaluates to true if the row was successfully matched and updated
    key_exists := FOUND;
  END IF;

  INSERT INTO public.profiles (id, username, avatar_url, is_approved)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(key_exists, false)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_new_user() SET search_path = public;
