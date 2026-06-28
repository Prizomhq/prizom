-- ====================================================
-- PRIZOM SELF-HIDE REFRACTORING MIGRATION
-- ====================================================

-- 1. Create user_hidden_prompts table
CREATE TABLE IF NOT EXISTS public.user_hidden_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, prompt_id)
);

-- 2. Enable Row-Level Security
ALTER TABLE public.user_hidden_prompts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can view own hidden prompts." ON public.user_hidden_prompts;
CREATE POLICY "Users can view own hidden prompts." ON public.user_hidden_prompts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can hide prompts." ON public.user_hidden_prompts;
CREATE POLICY "Users can hide prompts." ON public.user_hidden_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unhide prompts." ON public.user_hidden_prompts;
CREATE POLICY "Users can unhide prompts." ON public.user_hidden_prompts
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Grant explicit table privileges to anon, authenticated, and service_role
GRANT ALL ON public.user_hidden_prompts TO anon, authenticated, service_role;

-- 5. Data Migration: Copy existing hidden prompts
-- Selects saved_prompts belonging to collections named 'Hidden Prompts'
INSERT INTO public.user_hidden_prompts (user_id, prompt_id, created_at)
SELECT sp.user_id, sp.prompt_id, sp.created_at
FROM public.saved_prompts sp
JOIN public.collections c ON sp.collection_id = c.id
WHERE c.name = 'Hidden Prompts'
ON CONFLICT (user_id, prompt_id) DO NOTHING;

-- 6. Correct saves_count trigger logic
-- Updates handle_saves_count_change to bypass 'Hidden Prompts' collection rows (just in case any remain)
CREATE OR REPLACE FUNCTION public.handle_saves_count_change()
RETURNS TRIGGER AS $$
DECLARE
  col_name TEXT;
BEGIN
  SELECT name INTO col_name FROM public.collections WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);
  IF col_name = 'Hidden Prompts' THEN
    -- If it's a legacy hidden prompt, do not modify saves_count
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF (TG_OP = 'INSERT') THEN
    UPDATE public.prompts SET saves_count = saves_count + 1 WHERE id = NEW.prompt_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.prompts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.prompt_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Data Cleanup: Delete legacy records
-- Deleting these rows will automatically trigger handle_saves_count_change,
-- decrementing saves_count on prompts back to their correct true values!
DELETE FROM public.saved_prompts sp
USING public.collections c
WHERE sp.collection_id = c.id
AND c.name = 'Hidden Prompts';

-- Finally, delete the empty Hidden Prompts collections
DELETE FROM public.collections WHERE name = 'Hidden Prompts';
