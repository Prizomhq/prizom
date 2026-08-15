-- ========================================================
-- PRIZOM AI STUDIO EARLY ACCESS & PUBLIC LAUNCH MIGRATION
-- ========================================================

-- 1. Create Early Access Application Table
CREATE TABLE IF NOT EXISTS public.ai_studio_early_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Enable RLS
ALTER TABLE public.ai_studio_early_access ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view own early access status" ON public.ai_studio_early_access;
DROP POLICY IF EXISTS "Users can submit own early access application" ON public.ai_studio_early_access;
DROP POLICY IF EXISTS "Admins can manage all early access applications" ON public.ai_studio_early_access;

-- User Policies
CREATE POLICY "Users can view own early access status"
  ON public.ai_studio_early_access
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit own early access application"
  ON public.ai_studio_early_access
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin Policy
CREATE POLICY "Admins can manage all early access applications"
  ON public.ai_studio_early_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_early_access_user_id ON public.ai_studio_early_access(user_id);
CREATE INDEX IF NOT EXISTS idx_early_access_status ON public.ai_studio_early_access(status);
CREATE INDEX IF NOT EXISTS idx_early_access_created_at ON public.ai_studio_early_access(created_at DESC);

-- Grants
GRANT ALL ON TABLE public.ai_studio_early_access TO postgres;
GRANT ALL ON TABLE public.ai_studio_early_access TO service_role;
GRANT ALL ON TABLE public.ai_studio_early_access TO authenticated;
GRANT ALL ON TABLE public.ai_studio_early_access TO anon;

-- 3. Update handle_new_user() trigger to automatically set is_approved = true for public launch
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, is_approved)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url',
    TRUE -- Set to true by default for all public launch registrations
  )
  ON CONFLICT (id) DO UPDATE
  SET is_approved = TRUE;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure all existing profiles are approved for core Prizom platform
UPDATE public.profiles SET is_approved = TRUE WHERE is_approved = FALSE OR is_approved IS NULL;
