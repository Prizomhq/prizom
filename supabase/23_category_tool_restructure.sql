-- ========================================================
-- PRIZOM CATEGORY & TOOL RESTRUCTURE MIGRATION
-- ========================================================

-- 1. Wipe out existing categories and tools
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.ai_tools CASCADE;

-- 2. Insert new 15 visual categories
INSERT INTO public.categories (name, slug, description, "order", is_featured, show_on_explore, approved) VALUES
  ('Anime', 'anime', 'Cel-shaded, manga, and anime illustration styles.', 1, true, true, true),
  ('Cinematic', 'cinematic', 'Dramatic lighting, depth of field, and movie scenes.', 2, true, true, true),
  ('Realistic', 'realistic', 'Photorealistic, natural lighting, and lifelike textures.', 3, true, true, true),
  ('Fantasy', 'fantasy', 'Mythical creatures, magic visual effects, and dreamscapes.', 4, true, true, true),
  ('Portrait', 'portrait', 'Close-ups, expressive lighting, and detailed faces.', 5, true, true, true),
  ('Character Design', 'character-design', 'Full-body character references, outfits, and concept model sheets.', 6, false, true, true),
  ('Fashion', 'fashion', 'Avant-garde styling, editorial spreads, and apparel mockups.', 7, false, true, true),
  ('Product Photography', 'product-photography', 'Commercial lighting, clean backgrounds, and packaging aesthetics.', 8, false, true, true),
  ('Architecture', 'architecture', 'Interior designs, structural elevations, and modern buildings.', 9, false, true, true),
  ('Landscape', 'landscape', 'Panoramic vistas, environmental elements, and weather lighting.', 10, false, true, true),
  ('Sci-Fi', 'sci-fi', 'Futuristic machinery, spaceships, and deep space panoramas.', 11, false, true, true),
  ('Cyberpunk', 'cyberpunk', 'Neon lighting, rain-slicked streets, and bio-mechanical tech.', 12, false, true, true),
  ('Concept Art', 'concept-art', 'Illustrations, environmental paintings, and mood boards.', 13, false, true, true),
  ('Logo Design', 'logo-design', 'Vector icons, branding marks, and minimalistic layouts.', 14, false, true, true),
  ('3D Render', '3d-render', 'Octane render, Raytracing, and Unreal Engine visual aesthetics.', 15, true, true, true);

-- 3. Insert new 10 AI Image/Video generator tools
INSERT INTO public.ai_tools (name, slug, website, approved, show_on_explore, "order") VALUES
  ('ChatGPT', 'chatgpt', 'https://chat.openai.com', true, true, 1),
  ('Gemini', 'gemini', 'https://gemini.google.com', true, true, 2),
  ('Claude', 'claude', 'https://claude.ai', true, true, 3),
  ('Midjourney', 'midjourney', 'https://midjourney.com', true, true, 4),
  ('Flux', 'flux', 'https://blackforestlabs.ai', true, true, 5),
  ('Veo', 'veo', 'https://deepmind.google/technologies/veo', true, true, 6),
  ('Runway', 'runway', 'https://runwayml.com', true, true, 7),
  ('Leonardo AI', 'leonardo-ai', 'https://leonardo.ai', true, true, 8),
  ('Ideogram', 'ideogram', 'https://ideogram.ai', true, true, 9),
  ('Recraft', 'recraft', 'https://recraft.ai', true, true, 10);

-- 4. Clean up prompt records to align with restructured metadata
-- Map old categories
UPDATE public.prompts SET category = 'Realistic' WHERE category ILIKE 'sports';
UPDATE public.prompts SET category = 'Concept Art' WHERE category ILIKE 'web-design' OR category ILIKE 'web design';
UPDATE public.prompts SET category = 'Realistic' WHERE category ILIKE 'photography';
UPDATE public.prompts SET category = 'Concept Art' WHERE category ILIKE 'darshan';

-- Ensure all prompt categories are capitalized to match the seeded Category names exactly
UPDATE public.prompts 
SET category = 
  CASE 
    WHEN category ILIKE 'anime' THEN 'Anime'
    WHEN category ILIKE 'cinematic' THEN 'Cinematic'
    WHEN category ILIKE 'realistic' THEN 'Realistic'
    WHEN category ILIKE 'fantasy' THEN 'Fantasy'
    WHEN category ILIKE 'portrait' THEN 'Portrait'
    WHEN category ILIKE 'character-design' OR category ILIKE 'character design' THEN 'Character Design'
    WHEN category ILIKE 'fashion' THEN 'Fashion'
    WHEN category ILIKE 'product-photography' OR category ILIKE 'product photography' THEN 'Product Photography'
    WHEN category ILIKE 'architecture' THEN 'Architecture'
    WHEN category ILIKE 'landscape' THEN 'Landscape'
    WHEN category ILIKE 'sci-fi' OR category ILIKE 'sci fi' THEN 'Sci-Fi'
    WHEN category ILIKE 'cyberpunk' THEN 'Cyberpunk'
    WHEN category ILIKE 'concept-art' OR category ILIKE 'concept art' THEN 'Concept Art'
    WHEN category ILIKE 'logo-design' OR category ILIKE 'logo design' THEN 'Logo Design'
    WHEN category ILIKE '3d-render' OR category ILIKE '3d render' THEN '3D Render'
    ELSE 'Cinematic' -- Default fallback for anything unmapped
  END;

-- Map old tools
UPDATE public.prompts SET ai_tool = 'Midjourney' WHERE ai_tool ILIKE 'midjourney%' OR ai_tool ILIKE 'dall-e%';
UPDATE public.prompts SET ai_tool = 'ChatGPT' WHERE ai_tool ILIKE 'chatgpt%';
UPDATE public.prompts SET ai_tool = 'Flux' WHERE ai_tool ILIKE 'stable-diffusion' OR ai_tool ILIKE 'stable diffusion';

-- Standardize prompt tools
UPDATE public.prompts 
SET ai_tool = 
  CASE 
    WHEN ai_tool ILIKE 'chatgpt' THEN 'ChatGPT'
    WHEN ai_tool ILIKE 'gemini' THEN 'Gemini'
    WHEN ai_tool ILIKE 'claude' THEN 'Claude'
    WHEN ai_tool ILIKE 'midjourney' THEN 'Midjourney'
    WHEN ai_tool ILIKE 'flux' THEN 'Flux'
    WHEN ai_tool ILIKE 'veo' THEN 'Veo'
    WHEN ai_tool ILIKE 'runway' THEN 'Runway'
    WHEN ai_tool ILIKE 'leonardo-ai' OR ai_tool ILIKE 'leonardo ai' THEN 'Leonardo AI'
    WHEN ai_tool ILIKE 'ideogram' THEN 'Ideogram'
    WHEN ai_tool ILIKE 'recraft' THEN 'Recraft'
    ELSE 'Midjourney' -- Default fallback
  END;
