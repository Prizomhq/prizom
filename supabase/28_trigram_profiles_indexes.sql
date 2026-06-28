-- ========================================================
-- PRIZOM PERFORMANCE PATCH: TRIGRAM INDEXES FOR PROFILE SEARCH
-- ========================================================

-- Enable the pg_trgm extension if not already present
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram indexes on profile fields matching search.ts query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin (username public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_trgm ON public.profiles USING gin (full_name public.gin_trgm_ops);
