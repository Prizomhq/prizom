-- ====================================================
-- PRIZOM REMIX LINEAGE PRESERVATION SYSTEM (PHASE 3)
-- ====================================================

-- 1. Add lineage columns to prompts
ALTER TABLE public.prompts 
  ADD COLUMN IF NOT EXISTS original_root_id UUID,
  ADD COLUMN IF NOT EXISTS parent_prompt_id UUID;

-- 2. Add lineage columns to archived_prompts
ALTER TABLE public.archived_prompts
  ADD COLUMN IF NOT EXISTS original_root_id UUID,
  ADD COLUMN IF NOT EXISTS parent_prompt_id UUID;

-- 3. Backfill existing rows
-- In Postgres, arrays are 1-indexed. remix_parent_chain[1] references the first ancestor (the root).
-- If there are no ancestors, the prompt itself is the original root.
UPDATE public.prompts
SET 
  parent_prompt_id = remix_of,
  original_root_id = COALESCE(remix_parent_chain[1], id)
WHERE parent_prompt_id IS NULL AND original_root_id IS NULL;
