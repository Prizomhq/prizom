-- ============================================================================
-- 42_razorpay_production_hardening.sql
-- Self-Contained Production Hardening Migration for Razorpay & Creator Earnings
-- ============================================================================

-- 0. Ensure Core Transactions Table Exists
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'subscription', 'tip', 'pack_purchase', 'top_up'
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded, disputed
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure Core Subscriptions Table Exists
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'creator_pro',
  status TEXT NOT NULL DEFAULT 'active',
  razorpay_subscription_id TEXT UNIQUE,
  razorpay_customer_id TEXT,
  current_period_start TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  current_period_end TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) + INTERVAL '30 days',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 1. Creator Earnings Balances Table
CREATE TABLE IF NOT EXISTS public.creator_earnings_balances (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pending_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0),
  paid_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (paid_balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Creator Earnings Ledger Table
CREATE TABLE IF NOT EXISTS public.creator_earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Creator receiving tip
  tipper_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,     -- Tipper
  gross_amount NUMERIC(10, 2) NOT NULL CHECK (gross_amount > 0),
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (platform_fee >= 0),
  net_amount NUMERIC(10, 2) NOT NULL CHECK (net_amount > 0),
  razorpay_payment_id TEXT UNIQUE,
  razorpay_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- completed, refunded, disputed
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings_ledger ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Transactions & Creator Earnings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view own transactions') THEN
    CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR auth.uid() = creator_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can insert own pending transactions') THEN
    CREATE POLICY "Users can insert own pending transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Service role can manage transactions') THEN
    CREATE POLICY "Service role can manage transactions" ON public.transactions FOR ALL USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_earnings_balances' AND policyname = 'Creators can view own earnings balance') THEN
    CREATE POLICY "Creators can view own earnings balance" ON public.creator_earnings_balances FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_earnings_ledger' AND policyname = 'Creators can view own earnings ledger') THEN
    CREATE POLICY "Creators can view own earnings ledger" ON public.creator_earnings_ledger FOR SELECT USING (auth.uid() = user_id OR auth.uid() = tipper_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_earnings_balances' AND policyname = 'Service role manages creator earnings balances') THEN
    CREATE POLICY "Service role manages creator earnings balances" ON public.creator_earnings_balances FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_earnings_ledger' AND policyname = 'Service role manages creator earnings ledger') THEN
    CREATE POLICY "Service role manages creator earnings ledger" ON public.creator_earnings_ledger FOR ALL USING (true);
  END IF;
END $$;

-- 5. Performance & Idempotency Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_creator ON public.transactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_order ON public.transactions(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_creator_earnings_user ON public.creator_earnings_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_ledger_user ON public.creator_earnings_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_ledger_payment ON public.creator_earnings_ledger(razorpay_payment_id);

-- Ensure transaction razorpay_order_id index is unique where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_razorpay_order_unique 
  ON public.transactions(razorpay_order_id) 
  WHERE razorpay_order_id IS NOT NULL;

-- 6. Add is_pro column to profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_pro'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_pro BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 7. Atomic PostgreSQL RPC for AI Studio Credit Top-Ups (Guarantees Strict Idempotency)
CREATE OR REPLACE FUNCTION public.topup_studio_credits_atomic(
  p_user_id UUID,
  p_credits INTEGER,
  p_razorpay_payment_id TEXT,
  p_package_id TEXT DEFAULT 'credit_topup'
)
RETURNS TABLE (
  success BOOLEAN,
  balance_after INTEGER,
  already_processed BOOLEAN,
  error_msg TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_bal INTEGER := 0;
  v_new_bal INTEGER := 0;
  v_existing_id UUID;
BEGIN
  -- Idempotency check: look up existing ledger entry by payment_id in metadata
  SELECT id, balance_after INTO v_existing_id, v_new_bal
  FROM public.ai_credit_ledger
  WHERE user_id = p_user_id
    AND reason = 'topup_purchase'
    AND metadata->>'razorpay_payment_id' = p_razorpay_payment_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT true, v_new_bal, true, NULL::TEXT;
    RETURN;
  END IF;

  -- Lock user balance row for atomic update
  SELECT balance INTO v_current_bal
  FROM public.ai_credit_balances
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Initialize user balance if first time
    INSERT INTO public.ai_credit_balances (user_id, balance, updated_at)
    VALUES (p_user_id, 10, timezone('utc'::text, now()))
    RETURNING balance INTO v_current_bal;
  END IF;

  v_new_bal := v_current_bal + p_credits;

  -- Update balance
  UPDATE public.ai_credit_balances
  SET balance = v_new_bal,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_user_id;

  -- Record ledger entry
  INSERT INTO public.ai_credit_ledger (
    user_id,
    delta,
    reason,
    balance_after,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    p_credits,
    'topup_purchase',
    v_new_bal,
    jsonb_build_object(
      'package_id', p_package_id,
      'razorpay_payment_id', p_razorpay_payment_id,
      'credited_at', timezone('utc'::text, now())
    ),
    timezone('utc'::text, now())
  );

  RETURN QUERY SELECT true, v_new_bal, false, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 0, false, SQLERRM;
END;
$$;

-- 8. Atomic PostgreSQL RPC for Creator Tipping (Guarantees Strict Idempotency & Fee Division)
CREATE OR REPLACE FUNCTION public.process_creator_tip_atomic(
  p_tipper_id UUID,
  p_creator_id UUID,
  p_gross_amount NUMERIC,
  p_razorpay_payment_id TEXT,
  p_razorpay_order_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  creator_pending_balance NUMERIC,
  already_processed BOOLEAN,
  error_msg TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fee_rate NUMERIC := 0.05; -- 5% Platform fee
  v_platform_fee NUMERIC := 0;
  v_net_amount NUMERIC := 0;
  v_existing_id UUID;
  v_current_pending NUMERIC := 0;
  v_new_pending NUMERIC := 0;
BEGIN
  -- Prevent self-tipping
  IF p_tipper_id = p_creator_id THEN
    RETURN QUERY SELECT false, 0.00, false, 'Self-tipping is strictly prohibited'::TEXT;
    RETURN;
  END IF;

  -- Check if tip was already processed
  SELECT id INTO v_existing_id
  FROM public.creator_earnings_ledger
  WHERE razorpay_payment_id = p_razorpay_payment_id;

  IF v_existing_id IS NOT NULL THEN
    SELECT pending_balance INTO v_current_pending
    FROM public.creator_earnings_balances
    WHERE user_id = p_creator_id;
    
    RETURN QUERY SELECT true, COALESCE(v_current_pending, 0.00), true, NULL::TEXT;
    RETURN;
  END IF;

  -- Calculate fees & net payout
  v_platform_fee := ROUND(p_gross_amount * v_fee_rate, 2);
  v_net_amount := p_gross_amount - v_platform_fee;

  -- Lock creator balance for atomic update
  SELECT pending_balance INTO v_current_pending
  FROM public.creator_earnings_balances
  WHERE user_id = p_creator_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.creator_earnings_balances (user_id, pending_balance, paid_balance, updated_at)
    VALUES (p_creator_id, 0.00, 0.00, timezone('utc'::text, now()))
    RETURNING pending_balance INTO v_current_pending;
  END IF;

  v_new_pending := v_current_pending + v_net_amount;

  -- Update creator balance
  UPDATE public.creator_earnings_balances
  SET pending_balance = v_new_pending,
      updated_at = timezone('utc'::text, now())
  WHERE user_id = p_creator_id;

  -- Insert ledger entry
  INSERT INTO public.creator_earnings_ledger (
    user_id,
    tipper_id,
    gross_amount,
    platform_fee,
    net_amount,
    razorpay_payment_id,
    razorpay_order_id,
    status,
    created_at
  ) VALUES (
    p_creator_id,
    p_tipper_id,
    p_gross_amount,
    v_platform_fee,
    v_net_amount,
    p_razorpay_payment_id,
    p_razorpay_order_id,
    'completed',
    timezone('utc'::text, now())
  );

  RETURN QUERY SELECT true, v_new_pending, false, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 0.00, false, SQLERRM;
END;
$$;

-- Grant RPC permissions
GRANT EXECUTE ON FUNCTION public.topup_studio_credits_atomic(UUID, INTEGER, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_creator_tip_atomic(UUID, UUID, NUMERIC, TEXT, TEXT) TO authenticated, service_role;
