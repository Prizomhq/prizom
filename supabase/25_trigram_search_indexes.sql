-- ========================================================
-- PRIZOM PERFORMANCE PATCH: TRIGRAM SEARCH INDEXES
-- ========================================================

-- Enable the pg_trgm extension if not already present
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes on prompt search fields
CREATE INDEX IF NOT EXISTS idx_prompts_title_trgm ON public.prompts USING gin (title public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_description_trgm ON public.prompts USING gin (description public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_ai_tool_trgm ON public.prompts USING gin (ai_tool public.gin_trgm_ops);
