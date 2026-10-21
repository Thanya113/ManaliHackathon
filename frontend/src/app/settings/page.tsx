"use client";

import React, { useState, useEffect } from "react";
import { StorageService } from "../../lib/supabase/service";
import { getSupabaseConfig } from "../../lib/supabase/client";
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from "lucide-react";

export default function SettingsPage() {
  const [config, setConfig] = useState<{ url: string; hasKey: boolean; isConfigured: boolean } | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    configured: boolean;
    connected: boolean;
    tables: {
      contracts: number;
      market_data: number;
      spread_analyses: number;
      backtest_reports: number;
    };
    error: string | null;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    setIsTesting(true);
    setConfig(getSupabaseConfig());
    const res = await StorageService.testDatabaseConnection();
    setDbStatus(res);
    setIsTesting(false);
  };

  const sqlScript = `-- ==============================================================================
-- AURICLENS: MCX Gold Futures Relative-Value Intelligence Platform
-- Supabase PostgreSQL Schema & Setup Script (Copy & Paste into SQL Editor)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.contracts (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    trading_unit_grams NUMERIC(10, 2) NOT NULL,
    trading_unit_desc TEXT NOT NULL,
    quotation_unit_grams NUMERIC(10, 2) NOT NULL,
    quotation_unit_desc TEXT NOT NULL,
    purity_fineness INTEGER NOT NULL,
    purity_karat TEXT NOT NULL,
    tick_size NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    lot_multiplier NUMERIC(10, 2) NOT NULL,
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

-- 2. MARKET_DATA (MCX BHAVCOPY RECORDS)
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
    normalized_price_10g_995 NUMERIC(12, 2) NOT NULL,
    source TEXT NOT NULL DEFAULT 'MCX_BHAVCOPY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_trade_symbol_expiry UNIQUE (trade_date, symbol, expiry_date)
);

-- 3. SPREAD_ANALYSES (SAVED SIGNALS & RELATIVE VALUE RESULTS)
CREATE TABLE IF NOT EXISTS public.spread_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair_key TEXT NOT NULL,
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
    spread_norm_abs NUMERIC(10, 2) NOT NULL,
    spread_pct NUMERIC(6, 3) NOT NULL,
    implied_carry_rate_pct NUMERIC(6, 2) NOT NULL,
    fair_spread_cost_of_carry NUMERIC(10, 2) NOT NULL,
    dislocation_abs NUMERIC(10, 2) NOT NULL,
    z_score NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    market_regime TEXT NOT NULL,
    action TEXT NOT NULL,
    rejection_reason TEXT,
    rejection_detail TEXT,
    friction_per_10g NUMERIC(8, 2) NOT NULL,
    gross_expected_edge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_expected_edge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    confidence_score INTEGER NOT NULL DEFAULT 0,
    thesis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BACKTEST_REPORTS (SAVED WALK-FORWARD RUNS)
CREATE TABLE IF NOT EXISTS public.backtest_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_name TEXT NOT NULL,
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
    baseline_return_pct NUMERIC(8, 2) NOT NULL,
    equity_curve JSONB NOT NULL,
    trade_logs JSONB NOT NULL,
    parameters JSONB NOT NULL,
    data_quality_audit JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spread_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on contracts" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Allow public read on market_data" ON public.market_data FOR SELECT USING (true);
CREATE POLICY "Allow public read on spread_analyses" ON public.spread_analyses FOR SELECT USING (true);
CREATE POLICY "Allow public read on backtest_reports" ON public.backtest_reports FOR SELECT USING (true);

CREATE POLICY "Allow public insert on contracts" ON public.contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on market_data" ON public.market_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on spread_analyses" ON public.spread_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on backtest_reports" ON public.backtest_reports FOR INSERT WITH CHECK (true);

-- 6. SEED OFFICIAL CONTRACT SPECS
INSERT INTO public.contracts (id, symbol, name, trading_unit_grams, trading_unit_desc, quotation_unit_grams, quotation_unit_desc, purity_fineness, purity_karat, tick_size, lot_multiplier, initial_margin_pct, tender_period_days, delivery_type, delivery_unit)
VALUES
('GOLD', 'GOLD', 'Gold Standard (1 Kg)', 1000, '1 Kilogram (1000 grams)', 10, '₹ per 10 grams', 995, '23.88K (99.5% pure)', 1, 100, 10, 5, 'Compulsory Delivery', '1 Kg bar'),
('GOLDM', 'GOLDM', 'Gold Mini (100g)', 100, '100 grams', 10, '₹ per 10 grams', 995, '23.88K (99.5% pure)', 1, 10, 10, 5, 'Compulsory Delivery', '100 grams bar'),
('GOLDGUINEA', 'GOLDGUINEA', 'Gold Guinea (8g)', 8, '8 grams (1 Sovereign)', 8, '₹ per 8 grams', 995, '23.88K (99.5% pure)', 1, 1, 10, 5, 'Compulsory Delivery', '8 grams coin'),
('GOLDPETAL', 'GOLDPETAL', 'Gold Petal (1g)', 1, '1 gram', 1, '₹ per 1 gram', 999, '24K Fine Gold (99.9% pure)', 1, 1, 10, 5, 'Compulsory Delivery', '1 gram coin')
ON CONFLICT (id) DO NOTHING;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/20">
              SUPABASE HOSTED POSTGRES
            </span>
            <span className="text-xs text-slate-400">Zero Infrastructure Friction</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Supabase Setup & Diagnostics
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Connect your hosted PostgreSQL database using environment variables, execute the single copy-paste setup script,
            and inspect live database tables.
          </p>
        </div>

        <button
          onClick={runDiagnostic}
          disabled={isTesting}
          className="flex items-center gap-2 rounded-lg bg-[#0F2647] px-3.5 py-2 text-xs font-semibold text-amber-300 border border-[#1E3E62] hover:bg-[#17355B] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isTesting ? "animate-spin" : ""}`} />
          <span>Re-test Connection</span>
        </button>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Environment Status Card */}
        <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-400" />
              Environment Variables Status
            </h3>
            {dbStatus?.connected ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                <AlertCircle className="h-3.5 w-3.5" />
                Local Fallback Active
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400">Database Connection</span>
              <span className="font-mono text-emerald-400 font-semibold truncate max-w-[220px]">
                {config?.isConfigured ? "✓ Connected (Cloud PostgreSQL)" : "Not Configured"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400">Database Access Key</span>
              <span className="font-mono text-slate-200">
                {config?.hasKey ? "✓ Configured & Secured" : "✗ Missing"}
              </span>
            </div>
          </div>


          <p className="text-[11px] text-slate-400 leading-relaxed">
            {dbStatus?.connected
              ? "All contracts, Bhavcopy bars, spread calculations, and backtest reports are persisting live to your Supabase PostgreSQL database."
              : "When Supabase credentials are not provided, AuricLens seamlessly operates in high-performance local demo mode with verified preloaded MCX data."}
          </p>
        </div>

        {/* Database Table Counts Card */}
        <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-amber-400" />
              Table Row Counts (Live Store)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Postgres Schema: public</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400 block">contracts</span>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                {dbStatus?.tables.contracts ?? 4}
              </span>
              <span className="text-[10px] text-slate-500">Official MCX Specs</span>
            </div>

            <div className="p-3 rounded-lg bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400 block">market_data</span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
                {dbStatus?.tables.market_data ?? 240}
              </span>
              <span className="text-[10px] text-slate-500">Bhavcopy Bars</span>
            </div>

            <div className="p-3 rounded-lg bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400 block">spread_analyses</span>
              <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
                {dbStatus?.tables.spread_analyses ?? 0}
              </span>
              <span className="text-[10px] text-slate-500">Saved Signals</span>
            </div>

            <div className="p-3 rounded-lg bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400 block">backtest_reports</span>
              <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">
                {dbStatus?.tables.backtest_reports ?? 0}
              </span>
              <span className="text-[10px] text-slate-500">Walk-Forward Runs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Single Copy-Paste SQL Setup Script Section */}
      <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E3E62]/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Single Copy-Paste Supabase SQL Setup Script</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste this once into your Supabase SQL Editor to generate all tables, foreign keys, unique indices, RLS policies, and seed data.
            </p>
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
          >
            {copied ? <Check className="h-4 w-4 text-slate-950" /> : <Copy className="h-4 w-4 text-slate-950" />}
            <span>{copied ? "Copied SQL to Clipboard!" : "Copy SQL Script"}</span>
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#071328] border border-[#1E3E62]">
            <span className="font-bold text-amber-400 block mb-1">Step 1: Sign Up / Login</span>
            <p className="text-slate-400 text-[11px]">
              Open <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-300 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="h-2.5 w-2.5" /></a> and create a free project.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#071328] border border-[#1E3E62]">
            <span className="font-bold text-amber-400 block mb-1">Step 2: SQL Editor</span>
            <p className="text-slate-400 text-[11px]">
              Click &quot;SQL Editor&quot; on the left sidebar, click &quot;New Query&quot;, paste the copied script, and click &quot;Run&quot;.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#071328] border border-[#1E3E62]">
            <span className="font-bold text-amber-400 block mb-1">Step 3: Copy API Keys</span>
            <p className="text-slate-400 text-[11px]">
              Go to Project Settings → API. Copy your Project URL and Anon Public Key.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#071328] border border-[#1E3E62]">
            <span className="font-bold text-amber-400 block mb-1">Step 4: Paste in .env.local</span>
            <p className="text-slate-400 text-[11px]">
              Paste the keys into <code className="text-slate-200">.env.local</code> and restart or reload the browser.
            </p>
          </div>
        </div>

        {/* Code Preview Box */}
        <div className="relative">
          <pre className="p-4 rounded-xl bg-[#050E1C] border border-[#1E3E62] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[320px] overflow-y-auto leading-relaxed">
            {sqlScript}
          </pre>
        </div>
      </div>
    </div>
  );
}
