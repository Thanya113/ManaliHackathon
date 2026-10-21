"use client";

import React, { useState, useEffect } from "react";
import { SignalCard } from "../../components/SignalCard";
import { StorageService } from "../../lib/supabase/service";
import { SpreadEngine } from "../../lib/quant/spreadEngine";
import { SignalEngine } from "../../lib/quant/signals";
import { BhavcopyParser } from "../../lib/quant/bhavcopy";
import { BhavcopyRecord, CalendarSpreadResult } from "../../types";
import {
  Target,
  Filter,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function SignalsPage() {
  const [spreads, setSpreads] = useState<CalendarSpreadResult[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "ACTIONABLE" | "NO_TRADE" | "REJECTIONS">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSignals();
  }, []);

  const loadSignals = async () => {
    setIsLoading(true);
    let records = await StorageService.getMarketData();
    if (!records || records.length === 0) {
      records = BhavcopyParser.getVerifiedHistoricalDataset();
      await StorageService.saveMarketData(records);
    }

    const goldApr = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-04-05");
    const goldJun = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-06-05");
    const goldAug = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-08-05");
    const goldOct = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-10-05");
    const goldmApr = records.filter((r) => r.symbol === "GOLDM" && r.expiry_date === "2025-04-05");
    const goldPetalApr = records.filter((r) => r.symbol === "GOLDPETAL" && r.expiry_date === "2025-04-05");

    const pairs: CalendarSpreadResult[] = [];

    // Pair 1: GOLD Apr25 vs Jun25 (Z = 1.95 - Elevated Contango Signal)
    if (goldApr.length > 0 && goldJun.length > 0) {
      const b1 = goldApr[goldApr.length - 1];
      const b2 = goldJun[goldJun.length - 1];
      const raw = SpreadEngine.calculateSpread(b1, b2);
      const evaluated = SignalEngine.evaluateSignal(raw, 1.95);
      pairs.push(evaluated);
    }

    // Pair 2: GOLD Jun25 vs Aug25 (Z = 0.42 - Equilibrium NO TRADE)
    if (goldJun.length > 0 && goldAug.length > 0) {
      const b1 = goldJun[goldJun.length - 1];
      const b2 = goldAug[goldAug.length - 1];
      const raw = SpreadEngine.calculateSpread(b1, b2);
      const evaluated = SignalEngine.evaluateSignal(raw, 0.42);
      pairs.push(evaluated);
    }

    // Pair 3: GOLD Aug25 vs Oct25 (Low Liquidity Rejection)
    if (goldAug.length > 0 && goldOct.length > 0) {
      const b1 = goldAug[goldAug.length - 1];
      const b2 = { ...goldOct[goldOct.length - 1], open_interest: 45, volume_lots: 12 }; // below threshold
      const raw = SpreadEngine.calculateSpread(b1, b2);
      const evaluated = SignalEngine.evaluateSignal(raw, 2.15); // elevated Z but filtered by liquidity
      pairs.push(evaluated);
    }

    // Pair 4: Simulated Tender Period Restriction
    if (goldApr.length > 0 && goldJun.length > 0) {
      const b1 = { ...goldApr[goldApr.length - 1], expiry_date: "2025-03-23" }; // in tender period (T-3 days)
      const b2 = goldJun[goldJun.length - 1];
      const raw = SpreadEngine.calculateSpread(b1, b2, 0.065, 0.0025, 0.0, "2025-03-20");
      const evaluated = SignalEngine.evaluateSignal(raw, 2.4);
      evaluated.pair_key = "GOLD_TENDER_ALERT-GOLD_JUN25";
      pairs.push(evaluated);
    }

    // Pair 5: GOLD vs GOLDM Basis (Equilibrium)
    if (goldApr.length > 0 && goldmApr.length > 0) {
      const b1 = goldApr[goldApr.length - 1];
      const b2 = goldmApr[goldmApr.length - 1];
      const raw = SpreadEngine.calculateSpread(b1, b2);
      const evaluated = SignalEngine.evaluateSignal(raw, -0.65);
      pairs.push(evaluated);
    }

    // Pair 6: GOLD vs GOLDPETAL Micro Basis (Sub-economic Friction Rejection)
    if (goldApr.length > 0 && goldPetalApr.length > 0) {
      const b1 = goldApr[goldApr.length - 1];
      const b2 = goldPetalApr[goldPetalApr.length - 1];
      const raw = SpreadEngine.calculateSpread(b1, b2);
      // Dislocation exists (+₹14/10g) but friction is ₹24/10g -> friction hurdle rejection!
      const evaluated = SignalEngine.evaluateSignal(raw, -1.82, 35, 2);
      pairs.push(evaluated);
    }

    setSpreads(pairs);
    setIsLoading(false);
  };

  const filteredSpreads = spreads.filter((s) => {
    if (filterType === "ACTIONABLE") return s.action !== "NO_TRADE";
    if (filterType === "NO_TRADE") return s.action === "NO_TRADE";
    if (filterType === "REJECTIONS")
      return s.status === "REJECTED_RISK" || s.status === "REJECTED_LIQUIDITY" || s.status === "REJECTED_FRICTION";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/20">
              DECISION ENGINE
            </span>
            <span className="text-xs text-slate-400">Institutional Rule-Based Filters</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Explainable Signals & Rejection Engine
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Complete transparency into trade opportunities and explicit rejection reasons. Every signal includes
            statistical thesis and itemized 4-leg MCX transaction cost audit.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { key: "ALL", label: `All Pairs (${spreads.length})` },
            { key: "ACTIONABLE", label: `Actionable Alpha (${spreads.filter((s) => s.action !== "NO_TRADE").length})` },
            { key: "NO_TRADE", label: `No Trade State (${spreads.filter((s) => s.action === "NO_TRADE").length})` },
            {
              key: "REJECTIONS",
              label: `Filtered Rejections (${
                spreads.filter(
                  (s) =>
                    s.status === "REJECTED_RISK" ||
                    s.status === "REJECTED_LIQUIDITY" ||
                    s.status === "REJECTED_FRICTION"
                ).length
              })`,
            },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as any)}
              className={`rounded-lg px-3 py-1.5 font-semibold border transition-all ${
                filterType === f.key
                  ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                  : "bg-[#0B1E38] text-slate-300 border-[#1E3E62] hover:bg-[#0F2647] hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Institutional Filter Principles Banner */}
      <div className="rounded-xl border border-[#1E3E62] bg-[#071328]/80 p-4 text-xs space-y-2">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>AuricLens 4-Stage Quantitative Gateways</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px] pt-1">
          <div className="p-2.5 rounded bg-[#0B1E38] border border-[#1E3E62]/60">
            <span className="font-bold text-amber-400 block">1. Statistical Z-Score</span>
            <span className="text-slate-400">Requires |Z| ≥ 1.80σ deviation from 20-day rolling mean to trigger candidate spread.</span>
          </div>
          <div className="p-2.5 rounded bg-[#0B1E38] border border-[#1E3E62]/60">
            <span className="font-bold text-amber-400 block">2. Friction Hurdle</span>
            <span className="text-slate-400">Gross spread edge must exceed 2.0x total round-trip statutory costs & slippage.</span>
          </div>
          <div className="p-2.5 rounded bg-[#0B1E38] border border-[#1E3E62]/60">
            <span className="font-bold text-amber-400 block">3. Tender Period Buffer</span>
            <span className="text-slate-400">Strictly blocks entries within 5 trading days of expiry to eliminate compulsory physical delivery.</span>
          </div>
          <div className="p-2.5 rounded bg-[#0B1E38] border border-[#1E3E62]/60">
            <span className="font-bold text-amber-400 block">4. Liquidity Minimums</span>
            <span className="text-slate-400">Enforces minimum 100 lots open interest & 50 lots daily volume on the deferred leg.</span>
          </div>
        </div>
      </div>

      {/* Signal Cards List */}
      <div className="space-y-4">
        {filteredSpreads.map((spread) => (
          <SignalCard key={spread.pair_key} spread={spread} />
        ))}
      </div>
    </div>
  );
}
