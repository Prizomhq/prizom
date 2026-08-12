-- Migration 38: Add aspect_ratio column to ai_studio_sessions table
ALTER TABLE public.ai_studio_sessions 
ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '1:1';
