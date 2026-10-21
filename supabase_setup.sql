-- ==============================================================================
-- AURICLENS: MCX Gold Futures Relative-Value Intelligence Platform
-- Single Copy-Paste Supabase Database Setup Script (supabase_setup.sql)
-- ==============================================================================
-- INSTRUCTIONS FOR SETUP:
-- 1. Log in to your Supabase project dashboard (https://supabase.com).
-- 2. Navigate to the "SQL Editor" on the left navigation sidebar.
-- 3. Click "New Query", paste the entire contents of this file, and click "RUN".
-- 4. In "Project Settings" > "API", note your Project URL and Publishable Key.
-- 5. Add them to your .env.local file:
--      NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
--      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

--
-- SECURITY & DEMO ACCESS ARCHITECTURE:
-- - Row Level Security (RLS) is strictly ENABLED on all tables.
-- - For this hackathon demo, public demo policies grant read and write access
--   via the anon/publishable key so evaluators can test live CRUD operations
--   (data ingestion, manual test records, real-time calculations) without
--   requiring an auth signup step.
-- - Production multi-tenancy would attach `user_id UUID REFERENCES auth.users(id)`
--   with `auth.uid() = user_id` policies.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. CONTRACTS TABLE: Official MCX Gold Futures Contract Specifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contracts (
    id TEXT PRIMARY KEY,                       -- 'GOLD', 'GOLDM', 'GOLDGUINEA', 'GOLDPETAL'
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    trading_unit_grams NUMERIC(10, 2) NOT NULL,
    trading_unit_desc TEXT NOT NULL,
    quotation_unit_grams NUMERIC(10, 2) NOT NULL,
    quotation_unit_desc TEXT NOT NULL,
    purity_fineness INTEGER NOT NULL,          -- 995 or 999
    purity_karat TEXT NOT NULL,                -- e.g. '23.88K (99.5% pure)', '24K (99.9% pure)'
    tick_size NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    lot_multiplier NUMERIC(10, 2) NOT NULL,    -- ratio of trading_unit to quotation_unit
    initial_margin_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    tender_period_days INTEGER NOT NULL DEFAULT 5,
    delivery_type TEXT NOT NULL DEFAULT 'Compulsory Delivery',
    delivery_unit TEXT NOT NULL,
    max_order_size INTEGER NOT NULL DEFAULT 100,
    liquidity_tier TEXT NOT NULL DEFAULT 'High',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. MARKET_DATA TABLE: Historical MCX Bhavcopy Price & Open Interest Records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_date DATE NOT NULL,
    symbol TEXT NOT NULL REFERENCES public.contracts(symbol) ON DELETE CASCADE,
    expiry_date DATE NOT NULL,
    open NUMERIC(12, 2) NOT NULL,
    high NUMERIC(12, 2) NOT NULL,
    low NUMERIC(12, 2) NOT NULL,
    close NUMERIC(12, 2) NOT NULL,
    previous_close NUMERIC(12, 2),
    volume_lots BIGINT NOT NULL DEFAULT 0,
    value_lakhs NUMERIC(14, 2) DEFAULT 0.00,
    open_interest BIGINT NOT NULL DEFAULT 0,
    change_in_oi BIGINT DEFAULT 0,
    normalized_price_10g_995 NUMERIC(12, 2) NOT NULL,  -- Standardized Indian benchmark ₹/10g @ 995
    source TEXT NOT NULL DEFAULT 'MCX_BHAVCOPY',       -- 'MCX_BHAVCOPY' | 'MANUAL_CSV' | 'DEMO_DATA'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_trade_symbol_expiry UNIQUE (trade_date, symbol, expiry_date)
);

CREATE INDEX IF NOT EXISTS idx_market_data_symbol_date ON public.market_data(symbol, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_expiry ON public.market_data(expiry_date);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON public.market_data(source);

-- ------------------------------------------------------------------------------
-- 3. SPREAD_ANALYSES TABLE: Relative-Value Spread Calculations & Opportunity Signals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.spread_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair_key TEXT NOT NULL,                            -- e.g. 'GOLD_APR25-GOLD_JUN25'
    valuation_date DATE NOT NULL,
    leg1_symbol TEXT NOT NULL,
    leg1_expiry DATE NOT NULL,
    leg1_raw_price NUMERIC(12, 2) NOT NULL,
    leg1_norm_price NUMERIC(12, 2) NOT NULL,
    leg1_oi BIGINT DEFAULT 0,
    leg1_volume BIGINT DEFAULT 0,
    days_to_leg1_expiry INTEGER NOT NULL,
    in_tender_period BOOLEAN NOT NULL DEFAULT FALSE,
    
    leg2_symbol TEXT NOT NULL,
    leg2_expiry DATE NOT NULL,
    leg2_raw_price NUMERIC(12, 2) NOT NULL,
    leg2_norm_price NUMERIC(12, 2) NOT NULL,
    leg2_oi BIGINT DEFAULT 0,
    leg2_volume BIGINT DEFAULT 0,
    days_to_leg2_expiry INTEGER NOT NULL,
    
    expiry_diff_days INTEGER NOT NULL,
    spread_norm_abs NUMERIC(10, 2) NOT NULL,          -- P2_norm - P1_norm
    spread_pct NUMERIC(6, 3) NOT NULL,
    implied_carry_rate_pct NUMERIC(6, 2) NOT NULL,    -- Annualized carry return
    fair_spread_cost_of_carry NUMERIC(10, 2) NOT NULL,
    dislocation_abs NUMERIC(10, 2) NOT NULL,          -- spread_actual - fair_spread
    z_score NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    market_regime TEXT NOT NULL,                      -- 'SUPER_CONTANGO' | 'NORMAL_CONTANGO' | 'BACKWARDATION'
    
    action TEXT NOT NULL,                             -- 'LONG_SPREAD' | 'SHORT_SPREAD' | 'NO_TRADE'
    rejection_reason TEXT,
    rejection_detail TEXT,
    friction_per_10g NUMERIC(8, 2) NOT NULL,
    gross_expected_edge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_expected_edge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    confidence_score INTEGER NOT NULL DEFAULT 0,
    thesis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spread_analyses_pair_date ON public.spread_analyses(pair_key, valuation_date DESC);
CREATE INDEX IF NOT EXISTS idx_spread_analyses_action ON public.spread_analyses(action);

-- ------------------------------------------------------------------------------
-- 4. BACKTEST_REPORTS TABLE: Walk-Forward Backtesting Runs & Audits
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backtest_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_name TEXT NOT NULL DEFAULT 'MCX Gold Walk-Forward Spread Arbitrage',
    pair_key TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital NUMERIC(14, 2) NOT NULL,
    final_equity NUMERIC(14, 2) NOT NULL,
    net_profit_inr NUMERIC(14, 2) NOT NULL,
    net_return_pct NUMERIC(8, 2) NOT NULL,
    cagr_pct NUMERIC(8, 2) NOT NULL,
    max_drawdown_inr NUMERIC(14, 2) NOT NULL,
    max_drawdown_pct NUMERIC(8, 2) NOT NULL,
    sharpe_ratio NUMERIC(6, 2) NOT NULL,
    sortino_ratio NUMERIC(6, 2) NOT NULL,
    win_rate_pct NUMERIC(6, 2) NOT NULL,
    profit_factor NUMERIC(6, 2) NOT NULL,
    total_trades INTEGER NOT NULL,
    winning_trades INTEGER NOT NULL,
    losing_trades INTEGER NOT NULL,
    total_friction_paid_inr NUMERIC(12, 2) NOT NULL,
    baseline_return_pct NUMERIC(8, 2) NOT NULL,       -- Buy and hold front month roll return
    equity_curve JSONB NOT NULL,                      -- Array of {date, equity, baseline, drawdown}
    trade_logs JSONB NOT NULL,                        -- Array of executed trade objects
    parameters JSONB NOT NULL,                        -- Strategy hyperparameters used
    data_quality_audit JSONB NOT NULL,                -- Data verification checklist
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_reports_pair ON public.backtest_reports(pair_key);
CREATE INDEX IF NOT EXISTS idx_backtest_reports_created ON public.backtest_reports(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) & PUBLIC DEMO POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spread_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_reports ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
DROP POLICY IF EXISTS "Allow public read on contracts" ON public.contracts;
CREATE POLICY "Allow public read on contracts" ON public.contracts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on market_data" ON public.market_data;
CREATE POLICY "Allow public read on market_data" ON public.market_data FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on spread_analyses" ON public.spread_analyses;
CREATE POLICY "Allow public read on spread_analyses" ON public.spread_analyses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on backtest_reports" ON public.backtest_reports;
CREATE POLICY "Allow public read on backtest_reports" ON public.backtest_reports FOR SELECT USING (true);

-- Allow anonymous/demo write access (insert/update/delete) for testing and app operations
DROP POLICY IF EXISTS "Allow public insert on contracts" ON public.contracts;
CREATE POLICY "Allow public insert on contracts" ON public.contracts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on contracts" ON public.contracts;
CREATE POLICY "Allow public update on contracts" ON public.contracts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public insert on market_data" ON public.market_data;
CREATE POLICY "Allow public insert on market_data" ON public.market_data FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on market_data" ON public.market_data;
CREATE POLICY "Allow public update on market_data" ON public.market_data FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on market_data" ON public.market_data;
CREATE POLICY "Allow public delete on market_data" ON public.market_data FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public insert on spread_analyses" ON public.spread_analyses;
CREATE POLICY "Allow public insert on spread_analyses" ON public.spread_analyses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on spread_analyses" ON public.spread_analyses;
CREATE POLICY "Allow public delete on spread_analyses" ON public.spread_analyses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public insert on backtest_reports" ON public.backtest_reports;
CREATE POLICY "Allow public insert on backtest_reports" ON public.backtest_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on backtest_reports" ON public.backtest_reports;
CREATE POLICY "Allow public delete on backtest_reports" ON public.backtest_reports FOR DELETE USING (true);

-- ------------------------------------------------------------------------------
-- 6. PRE-SEED OFFICIAL MCX GOLD CONTRACT SPECIFICATIONS
-- ------------------------------------------------------------------------------
INSERT INTO public.contracts (
    id, symbol, name, trading_unit_grams, trading_unit_desc,
    quotation_unit_grams, quotation_unit_desc, purity_fineness, purity_karat,
    tick_size, lot_multiplier, initial_margin_pct, tender_period_days,
    delivery_type, delivery_unit, max_order_size, liquidity_tier
) VALUES
(
    'GOLD', 'GOLD', 'Gold Standard (1 Kg)', 1000.00, '1 Kilogram (1000 grams)',
    10.00, '₹ per 10 grams', 995, '23.88K (99.5% pure)',
    1.00, 100.00, 10.00, 5,
    'Compulsory Delivery', '1 Kg bar with serial no.', 100, 'High'
),
(
    'GOLDM', 'GOLDM', 'Gold Mini (100g)', 100.00, '100 grams',
    10.00, '₹ per 10 grams', 995, '23.88K (99.5% pure)',
    1.00, 10.00, 10.00, 5,
    'Compulsory Delivery', '100 grams bar', 500, 'High'
),
(
    'GOLDGUINEA', 'GOLDGUINEA', 'Gold Guinea (8g)', 8.00, '8 grams (1 Sovereign)',
    8.00, '₹ per 8 grams', 995, '23.88K (99.5% pure)',
    1.00, 1.00, 10.00, 5,
    'Compulsory Delivery', '8 grams coin', 1000, 'Medium'
),
(
    'GOLDPETAL', 'GOLDPETAL', 'Gold Petal (1g)', 1.00, '1 gram',
    1.00, '₹ per 1 gram', 999, '24K Fine Gold (99.9% pure)',
    1.00, 1.00, 10.00, 5,
    'Compulsory Delivery', '1 gram coin in tamper-proof pack', 5000, 'Medium-High'
)
ON CONFLICT (id) DO UPDATE SET
    trading_unit_grams = EXCLUDED.trading_unit_grams,
    quotation_unit_grams = EXCLUDED.quotation_unit_grams,
    purity_fineness = EXCLUDED.purity_fineness,
    lot_multiplier = EXCLUDED.lot_multiplier,
    updated_at = NOW();

-- Setup completed successfully
SELECT 'AuricLens Supabase schema initialized with official MCX gold specifications!' as status;
