-- Migration 36: AI Studio DB schema

-- 1. Studio Sessions
CREATE TABLE IF NOT EXISTS public.ai_studio_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'complete', 'published', 'failed', 'expired'
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  request_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  active_version INTEGER NOT NULL DEFAULT 1,
  credits_deducted INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '24 hours') NOT NULL
);

-- 2. Version Control History
CREATE TABLE IF NOT EXISTS public.ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.ai_studio_sessions(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  generation_settings JSONB DEFAULT '{}'::jsonb,
  ag_router_response JSONB,               -- Raw API response from router
  created_by_ai BOOLEAN DEFAULT true,     -- True if AI written, False if creator edited
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, version_number)
);

-- 3. Human Feedback Delta Log
CREATE TABLE IF NOT EXISTS public.ai_prompt_deltas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.ai_studio_sessions(id) ON DELETE CASCADE NOT NULL,
  original_ai_prompt TEXT NOT NULL,
  user_modified_prompt TEXT NOT NULL,
  levenshtein_distance INTEGER,
  character_added_count INTEGER,
  character_removed_count INTEGER,
  modified_fields TEXT[],                 -- Array of fields user edited (e.g. ['title', 'prompt_text'])
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Credit System Balance
CREATE TABLE IF NOT EXISTS public.ai_credit_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 10 CHECK (balance >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Credit Transaction Ledger
CREATE TABLE IF NOT EXISTS public.ai_credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  delta INTEGER NOT NULL,                  -- Negatives for usage, Positives for top-up
  reason TEXT NOT NULL,                    -- 'monthly_grant', 'generation_debit', 'timeout_refund', 'topup_purchase'
  session_id UUID REFERENCES public.ai_studio_sessions(id) ON DELETE SET NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Observability and Telemetry logs
CREATE TABLE IF NOT EXISTS public.ai_telemetry_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.ai_studio_sessions(id) ON DELETE SET NULL,
  model_used TEXT NOT NULL,
  provider TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  estimated_cost NUMERIC(10, 6) NOT NULL,
  latency_ms INTEGER NOT NULL,
  confidence_score NUMERIC(4, 3),
  quality_score NUMERIC(4, 3),
  retry_count INTEGER DEFAULT 0,
  status TEXT NOT NULL,                    -- 'success', 'failed_safety', 'failed_timeout', 'failed_api'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_studio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_telemetry_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own sessions" ON public.ai_studio_sessions 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own versions" ON public.ai_prompt_versions 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.ai_studio_sessions WHERE id = session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can write own versions" ON public.ai_prompt_versions 
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_studio_sessions WHERE id = session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own deltas" ON public.ai_prompt_deltas 
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.ai_studio_sessions WHERE id = session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can view own credits" ON public.ai_credit_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own ledger logs" ON public.ai_credit_ledger FOR SELECT USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_studio_sessions_userid ON public.ai_studio_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_sessions_status ON public.ai_studio_sessions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_sessionid ON public.ai_prompt_versions(session_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_userid ON public.ai_credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_requestid ON public.ai_telemetry_logs(request_id);

-- Explicit grants to support API, admin, and anon workflows
GRANT ALL ON TABLE public.ai_studio_sessions TO postgres;
GRANT ALL ON TABLE public.ai_studio_sessions TO service_role;
GRANT ALL ON TABLE public.ai_studio_sessions TO authenticated;
GRANT ALL ON TABLE public.ai_studio_sessions TO anon;

GRANT ALL ON TABLE public.ai_prompt_versions TO postgres;
GRANT ALL ON TABLE public.ai_prompt_versions TO service_role;
GRANT ALL ON TABLE public.ai_prompt_versions TO authenticated;
GRANT ALL ON TABLE public.ai_prompt_versions TO anon;

GRANT ALL ON TABLE public.ai_prompt_deltas TO postgres;
GRANT ALL ON TABLE public.ai_prompt_deltas TO service_role;
GRANT ALL ON TABLE public.ai_prompt_deltas TO authenticated;
GRANT ALL ON TABLE public.ai_prompt_deltas TO anon;

GRANT ALL ON TABLE public.ai_credit_balances TO postgres;
GRANT ALL ON TABLE public.ai_credit_balances TO service_role;
GRANT ALL ON TABLE public.ai_credit_balances TO authenticated;
GRANT ALL ON TABLE public.ai_credit_balances TO anon;

GRANT ALL ON TABLE public.ai_credit_ledger TO postgres;
GRANT ALL ON TABLE public.ai_credit_ledger TO service_role;
GRANT ALL ON TABLE public.ai_credit_ledger TO authenticated;
GRANT ALL ON TABLE public.ai_credit_ledger TO anon;

GRANT ALL ON TABLE public.ai_telemetry_logs TO postgres;
GRANT ALL ON TABLE public.ai_telemetry_logs TO service_role;
GRANT ALL ON TABLE public.ai_telemetry_logs TO authenticated;
GRANT ALL ON TABLE public.ai_telemetry_logs TO anon;

