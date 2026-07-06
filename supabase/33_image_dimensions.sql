-- Add image_width and image_height columns to the prompts table to support true aspect ratio sizing in the UI.
ALTER TABLE prompts ADD COLUMN image_width INTEGER;
ALTER TABLE prompts ADD COLUMN image_height INTEGER;
