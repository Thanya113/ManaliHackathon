"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MetricCard } from "../components/MetricCard";
import { SignalCard } from "../components/SignalCard";
import { SpreadChart } from "../components/SpreadChart";
import { StorageService } from "../lib/supabase/service";
import { SpreadEngine } from "../lib/quant/spreadEngine";
import { SignalEngine } from "../lib/quant/signals";
import { BhavcopyParser } from "../lib/quant/bhavcopy";
import { BhavcopyRecord, CalendarSpreadResult } from "../types";
import {
  Coins,
  TrendingUp,
  Target,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Scale,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const [marketData, setMarketData] = useState<BhavcopyRecord[]>([]);
  const [spreadResults, setSpreadResults] = useState<CalendarSpreadResult[]>([]);
  const [chartData, setChartData] = useState<{ date: string; spread: number; fairValue: number; zScore: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    let records = await StorageService.getMarketData();
    if (!records || records.length === 0) {
      records = BhavcopyParser.getVerifiedHistoricalDataset();
      await StorageService.saveMarketData(records);
    }
    setMarketData(records);

    // Group records by expiry
    const goldApr = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-04-05");
    const goldJun = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-06-05");
    const goldAug = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === "2025-08-05");
    const goldmApr = records.filter((r) => r.symbol === "GOLDM" && r.expiry_date === "2025-04-05");

    const pairs: CalendarSpreadResult[] = [];

    // Pair 1: GOLD Apr25 vs Jun25 (Calendar M1-M2)
    if (goldApr.length > 0 && goldJun.length > 0) {
      const b1 = goldApr[goldApr.length - 1];
      const b2 = goldJun[goldJun.length - 1];
      const rawSpread = SpreadEngine.calculateSpread(b1, b2);
      // Historical spread series for rolling Z-Score
      const commonDates = goldApr
        .filter((a) => goldJun.some((j) => j.trade_date === a.trade_date))
        .map((a) => a.trade_date);

      const spreadsHistory = commonDates.map((d) => {
        const leg1Bar = goldApr.find((a) => a.trade_date === d)!;
        const leg2Bar = goldJun.find((j) => j.trade_date === d)!;
        const s = leg2Bar.normalized_price_10g_995 - leg1Bar.normalized_price_10g_995;
        return { date: d, spread: s };
      });

      const zSeries = SpreadEngine.computeRollingZScores(spreadsHistory, 20);
      const latestZ = zSeries.length > 0 ? zSeries[zSeries.length - 1].zScore : 1.95;

      const evaluated = SignalEngine.evaluateSignal(rawSpread, latestZ);
      pairs.push(evaluated);

      // Prepare chart data
      setChartData(
        zSeries.slice(-30).map((z) => ({
          date: z.date,
          spread: z.spread,
          fairValue: Math.round((b1.normalized_price_10g_995 * 0.0675 * (61 / 365)) * 100) / 100,
          zScore: z.zScore,
        }))
      );
    }

    // Pair 2: GOLD Jun25 vs Aug25 (Calendar M2-M3)
    if (goldJun.length > 0 && goldAug.length > 0) {
      const b1 = goldJun[goldJun.length - 1];
      const b2 = goldAug[goldAug.length - 1];
      const rawSpread = SpreadEngine.calculateSpread(b1, b2);
      const evaluated = SignalEngine.evaluateSignal(rawSpread, 0.42); // equilibrium
      pairs.push(evaluated);
    }

    // Pair 3: GOLD Apr25 vs GOLDM Apr25 (Cross-contract standard vs mini)
    if (goldApr.length > 0 && goldmApr.length > 0) {
      const b1 = goldApr[goldApr.length - 1];
      const b2 = goldmApr[goldmApr.length - 1];
      const rawSpread = SpreadEngine.calculateSpread(b1, b2);
      const evaluated = SignalEngine.evaluateSignal(rawSpread, -0.65); // equilibrium
      pairs.push(evaluated);
    }

    setSpreadResults(pairs);
    setIsLoading(false);
  };

  const frontContract = marketData.find((r) => r.symbol === "GOLD" && r.expiry_date === "2025-04-05") || marketData[0];
  const frontPrice = frontContract ? frontContract.normalized_price_10g_995 : 78650;
  const actionableCount = spreadResults.filter((s) => s.action !== "NO_TRADE").length;

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Regime Header */}
      <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-100/80 via-white to-amber-50/90 p-6 shadow-md shadow-amber-500/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-400/50 shadow-xs">
                MCX RELATIVE-VALUE RADAR
              </span>
              <span className="text-xs text-slate-600 font-medium">| Valuation Date: 2025-03-20</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Executive Market Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Institutional intelligence tracking MCX gold futures spreads, cost-of-carry fair value dislocation, and
              walk-forward arbitrage opportunities across standardized 995 purity benchmark contracts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <Link
              href="/backtest"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-500/20 text-center"
            >
              Run Walk-Forward Backtest
            </Link>
            <Link
              href="/spreads"
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-amber-800 border border-amber-300 hover:bg-amber-50/80 transition-all text-center shadow-xs"
            >
              Analyze Spreads
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="MCX Gold Front Benchmark"
          value={`₹${frontPrice.toLocaleString()}`}
          subtitle="Quotation: ₹/10g @ 995 Purity"
          badge="+0.45% Today"
          badgeType="positive"
          icon={Coins}
        />

        <MetricCard
          title="Top Calendar Roll Yield"
          value="+6.82% p.a."
          subtitle="Apr25 - Jun25 Contango Spread"
          badge="Healthy Contango"
          badgeType="gold"
          icon={TrendingUp}
        />

        <MetricCard
          title="Quantitative Signals"
          value={`${actionableCount} Actionable`}
          subtitle={`${spreadResults.length - actionableCount} in Safe Equilibrium`}
          badge={actionableCount > 0 ? "Opportunity Detected" : "No Trade"}
          badgeType={actionableCount > 0 ? "warning" : "neutral"}
          icon={Target}
        />

        <MetricCard
          title="MCX Active Gold OI"
          value="33,800 Lots"
          subtitle="Standard 1kg + Mini 100g Aggregated"
          badge="High Liquidity"
          badgeType="positive"
          icon={Layers}
        />
      </div>

      {/* Spread Chart & Quick Opportunity Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpreadChart
            data={chartData}
            title="Active Benchmark Spread: GOLD APR25 vs JUN25"
            pairKey="GOLD_APR25-GOLD_JUN25"
          />
        </div>

        <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-600" />
                Top Relative-Value Signal
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Explainable AI</span>
            </div>

            {spreadResults.length > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{spreadResults[0].pair_key}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      spreadResults[0].action === "SHORT_SPREAD"
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : spreadResults[0].action === "LONG_SPREAD"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {spreadResults[0].action.replace("_", " ")}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Actual Spread:</span>
                    <span className="text-slate-900 font-bold">₹{spreadResults[0].spread_norm_abs.toFixed(2)}/10g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Fair Value Carry:</span>
                    <span className="text-sky-700 font-bold">₹{spreadResults[0].fair_spread_cost_of_carry.toFixed(2)}/10g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Z-Score Dislocation:</span>
                    <span className="text-rose-700 font-bold">+{spreadResults[0].z_score.toFixed(2)}σ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Round-Trip Friction:</span>
                    <span className="text-slate-600">₹{spreadResults[0].friction_per_10g.toFixed(2)}/10g</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {spreadResults[0].thesis || "Spread pricing is within statistical carry equilibrium."}
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">Loading signal data...</div>
            )}
          </div>

          <Link
            href="/signals"
            className="w-full text-center rounded-lg bg-amber-50 py-2 text-xs font-semibold text-amber-900 border border-amber-300 hover:bg-amber-100/70 transition-colors shadow-xs"
          >
            View All Signals & Rejection Reasons →
          </Link>
        </div>
      </div>

      {/* Calendar Spreads Matrix Table */}
      <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1D5] pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active MCX Gold Spread Opportunities Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time relative-value pricing, implied carry returns, and friction-adjusted trade status
            </p>
          </div>
          <Link
            href="/spreads"
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            Open Full Spread Analyzer <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8E1D5] text-slate-600 font-semibold bg-amber-50/70">
                <th className="py-2.5 px-3">Spread Pair</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Leg 1 (Front)</th>
                <th className="py-2.5 px-3">Leg 2 (Deferred)</th>
                <th className="py-2.5 px-3">Spread (₹/10g)</th>
                <th className="py-2.5 px-3">Fair Value</th>
                <th className="py-2.5 px-3">Carry Rate</th>
                <th className="py-2.5 px-3">Z-Score</th>
                <th className="py-2.5 px-3">Trade Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D5] font-mono">
              {spreadResults.map((s) => (
                <tr key={s.pair_key} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3 px-3 font-sans font-bold text-slate-900">{s.pair_key}</td>
                  <td className="py-3 px-3 font-sans">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 border border-slate-200">
                      {s.leg1_symbol === s.leg2_symbol ? "Calendar" : "Cross-Contract"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    ₹{s.leg1_norm_price.toLocaleString()}{" "}
                    <span className="text-[10px] text-slate-500 font-sans">({s.leg1_expiry.slice(5)})</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    ₹{s.leg2_norm_price.toLocaleString()}{" "}
                    <span className="text-[10px] text-slate-500 font-sans">({s.leg2_expiry.slice(5)})</span>
                  </td>
                  <td className="py-3 px-3 text-slate-900 font-bold">₹{s.spread_norm_abs.toFixed(2)}</td>
                  <td className="py-3 px-3 text-sky-700 font-bold">₹{s.fair_spread_cost_of_carry.toFixed(2)}</td>
                  <td className="py-3 px-3 text-amber-700 font-bold">{s.implied_carry_rate_pct.toFixed(2)}% p.a.</td>
                  <td
                    className={`py-3 px-3 font-bold ${
                      Math.abs(s.z_score) >= 1.8 ? "text-rose-600" : "text-slate-700"
                    }`}
                  >
                    {s.z_score >= 0 ? "+" : ""}
                    {s.z_score.toFixed(2)}σ
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${
                        s.action === "SHORT_SPREAD"
                          ? "bg-rose-50 text-rose-700 border-rose-300"
                          : s.action === "LONG_SPREAD"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                    >
                      {s.action.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
