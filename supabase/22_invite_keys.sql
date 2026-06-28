-- ========================================================
-- PRIZOM INVITE-KEY SYSTEM MIGRATION
-- ========================================================

-- 1. Create invite_keys table
CREATE TABLE IF NOT EXISTS public.invite_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 1 NOT NULL,
  uses INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on invite_keys
ALTER TABLE public.invite_keys ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Admins can view and manage invite keys" ON public.invite_keys;

-- Admins can view/edit everything, service_role can do anything
CREATE POLICY "Admins can view and manage invite keys" 
ON public.invite_keys 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'admin', 'moderator')
  )
);

-- 3. Add column is_approved to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- 4. Update trigger function to check invite key and increment uses atomically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  invite_key_val TEXT;
  key_exists BOOLEAN := false;
BEGIN
  invite_key_val := new.raw_user_meta_data->>'invite_key';
  
  IF invite_key_val IS NOT NULL THEN
    -- Check if the key exists, is active, and has remaining uses
    SELECT EXISTS (
      SELECT 1 FROM public.invite_keys 
      WHERE key = invite_key_val AND is_active = true AND uses < max_uses
    ) INTO key_exists;
    
    IF key_exists THEN
      -- Increment uses atomically
      UPDATE public.invite_keys 
      SET uses = uses + 1 
      WHERE key = invite_key_val;
    END IF;
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

-- 5. Approve all existing users (including admins)
UPDATE public.profiles SET is_approved = true;

-- 6. Seed default invite key prizom-beta-8x4f
INSERT INTO public.invite_keys (key, max_uses, uses, is_active)
VALUES ('prizom-beta-8x4f', 100, 0, true)
ON CONFLICT (key) DO NOTHING;

-- 7. Lock down handle_new_user() search_path for safety
ALTER FUNCTION public.handle_new_user() SET search_path = public;
