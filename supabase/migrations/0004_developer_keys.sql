-- Table for Developer API Keys
CREATE TABLE IF NOT EXISTS public.developer_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the generated API key
    key_prefix TEXT NOT NULL, -- e.g., 'prz_ent_...', allows users to identify their keys
    tier TEXT NOT NULL DEFAULT 'pro', -- 'pro' or 'enterprise'
    credits_limit INT NOT NULL DEFAULT 1000,
    credits_used INT NOT NULL DEFAULT 0,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index for fast lookup by hash
CREATE INDEX IF NOT EXISTS idx_developer_api_keys_hash ON public.developer_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_developer_api_keys_user_id ON public.developer_api_keys(user_id);
