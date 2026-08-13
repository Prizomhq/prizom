-- Migration 39: Add metadata column to ai_credit_ledger and index for payment topups
ALTER TABLE public.ai_credit_ledger 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index for payment top-up idempotency lookup
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reason ON public.ai_credit_ledger(reason);
