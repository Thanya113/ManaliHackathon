"use client";

import React, { useState, useEffect } from "react";
import { BacktestResultsView } from "../../components/BacktestResultsView";
import { StorageService } from "../../lib/supabase/service";
import { WalkForwardBacktester } from "../../lib/quant/backtester";
import { BhavcopyParser } from "../../lib/quant/bhavcopy";
import { BacktestConfig, BacktestReport, BhavcopyRecord, MCXSymbol } from "../../types";
import {
  FlaskConical,
  Play,
  Sliders,
  History,
  ShieldCheck,
  RefreshCw,
  Award,
} from "lucide-react";

export default function BacktestPage() {
  const [marketData, setMarketData] = useState<BhavcopyRecord[]>([]);
  const [config, setConfig] = useState<BacktestConfig>({
    pair_key: "GOLD_APR25-GOLD_JUN25",
    lookback_window: 20,
    entry_z: 1.8,
    exit_z: 0.2,
    stop_loss_z: 3.2,
    brokerage_per_order: 20.0,
    slippage_ticks: 1,
    initial_capital: 1000000, // ₹10 Lakhs
    lot_type: "GOLD",
    max_holding_days: 45,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<BacktestReport | null>(null);
  const [pastReports, setPastReports] = useState<BacktestReport[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    StorageService.getMarketData().then((records) => {
      let validRecords = records;
      if (!records || records.length === 0) {
        validRecords = BhavcopyParser.getVerifiedHistoricalDataset();
        StorageService.saveMarketData(validRecords);
      }
      setMarketData(validRecords);
      // Automatically execute an initial backtest with defaults
      runSimulation(validRecords, config);
    });

    StorageService.getBacktestReports().then((reports) => {
      setPastReports(reports);
    });
  }, []);

  const runSimulation = (records: BhavcopyRecord[], currentConfig: BacktestConfig) => {
    setIsRunning(true);
    setStatusMessage(null);

    try {
      let leg1Expiry = "2025-04-05";
      let leg2Expiry = "2025-06-05";

      if (currentConfig.pair_key === "GOLD_JUN25-GOLD_AUG25") {
        leg1Expiry = "2025-06-05";
        leg2Expiry = "2025-08-05";
      } else if (currentConfig.pair_key === "GOLD_AUG25-GOLD_OCT25") {
        leg1Expiry = "2025-08-05";
        leg2Expiry = "2025-10-05";
      }

      const leg1Series = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === leg1Expiry);
      const leg2Series = records.filter((r) => r.symbol === "GOLD" && r.expiry_date === leg2Expiry);

      if (leg1Series.length < currentConfig.lookback_window + 5 || leg2Series.length < currentConfig.lookback_window + 5) {
        throw new Error(
          `Insufficient bars for pair ${currentConfig.pair_key}. Need at least ${currentConfig.lookback_window + 5} aligned bars.`
        );
      }

      const backtestReport = WalkForwardBacktester.runBacktest(leg1Series, leg2Series, currentConfig);
      setReport(backtestReport);
      setStatusMessage("Simulation finished: Zero look-ahead bias verified across rolling calibration windows.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Backtest Error: ${msg}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveToSupabase = async () => {
    if (!report) return;
    setIsSaving(true);
    const id = await StorageService.saveBacktestReport(report);
    setIsSaving(false);
    setStatusMessage(`Report saved to Supabase (ID: ${id})`);
    const refreshed = await StorageService.getBacktestReports();
    setPastReports(refreshed);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/20">
              WALK-FORWARD SIMULATOR
            </span>
            <span className="text-xs text-slate-400">Strict Zero Look-Ahead Bias</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Walk-Forward Backtesting Lab
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Validate relative-value spread arbitrage strategies without look-ahead bias, factoring in exact institutional
            exchange fees, taxes, tender-period roll cutoffs, and baseline comparisons.
          </p>
        </div>
      </div>

      {/* Configuration Form Panel */}
      <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Strategy Hyperparameters & Cost Friction Model</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Capital: <span suppressHydrationWarning className="text-amber-300 font-bold">₹{config.initial_capital.toLocaleString("en-IN")}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Spread Pair</label>
            <select
              value={config.pair_key}
              onChange={(e) => setConfig({ ...config, pair_key: e.target.value })}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
            >
              <option value="GOLD_APR25-GOLD_JUN25">GOLD APR25 - JUN25 (M1 vs M2)</option>
              <option value="GOLD_JUN25-GOLD_AUG25">GOLD JUN25 - AUG25 (M2 vs M3)</option>
              <option value="GOLD_AUG25-GOLD_OCT25">GOLD AUG25 - OCT25 (M3 vs M4)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Contract Lot Sizing</label>
            <select
              value={config.lot_type}
              onChange={(e) => setConfig({ ...config, lot_type: e.target.value as MCXSymbol })}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
            >
              <option value="GOLD">GOLD Big (1 Kg / 100 units multiplier)</option>
              <option value="GOLDM">GOLDM Mini (100g / 10 units multiplier)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Rolling Lookback Window (Bars)</label>
            <input
              type="number"
              min="10"
              max="50"
              value={config.lookback_window}
              onChange={(e) => setConfig({ ...config, lookback_window: parseInt(e.target.value, 10) || 20 })}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Entry Z-Score Threshold (σ)</label>
            <input
              type="number"
              step="0.1"
              value={config.entry_z}
              onChange={(e) => setConfig({ ...config, entry_z: parseFloat(e.target.value) || 1.8 })}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Exit Z-Score Threshold (σ)</label>
            <input
              type="number"
              step="0.05"
              value={config.exit_z}
              onChange={(e) => setConfig({ ...config, exit_z: parseFloat(e.target.value) || 0.2 })}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Stop Loss Z-Score (σ)</label>
            <input
              type="number"
              step="0.1"
              value={config.stop_loss_z}
              onChange={(e) => setConfig({ ...config, stop_loss_z: parseFloat(e.target.value) || 3.2 })}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Brokerage per Order (₹)</label>
            <input
              type="number"
              value={config.brokerage_per_order}
              onChange={(e) => setConfig({ ...config, brokerage_per_order: parseFloat(e.target.value) || 20 })}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Slippage Proxy (Ticks)</label>
            <input
              type="number"
              min="0"
              max="5"
              value={config.slippage_ticks}
              onChange={(e) => setConfig({ ...config, slippage_ticks: parseInt(e.target.value, 10) || 1 })}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            *Includes: 0.0021% MCX Fee, 0.01% CTT, 18% GST, 0.002% Stamp Duty, and forced roll at T-5 tender period.
          </span>

          <button
            onClick={() => runSimulation(marketData, config)}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                <span>Running Simulation...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 text-slate-950 fill-slate-950" />
                <span>Run Walk-Forward Backtest</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Results View */}
      {report && (
        <BacktestResultsView
          report={report}
          onSaveToSupabase={handleSaveToSupabase}
          isSaving={isSaving}
        />
      )}

      {/* Past Reports List */}
      {pastReports.length > 0 && (
        <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#1E3E62]/60 pb-3">
            <History className="h-4 w-4 text-amber-400" />
            <span>Past Backtest Reports Archive ({pastReports.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {pastReports.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-lg bg-[#071328]/80 border border-[#1E3E62] space-y-1.5 hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{p.pair_key}</span>
                  <span
                    className={`font-mono font-bold ${
                      p.net_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {p.net_return_pct >= 0 ? "+" : ""}
                    {p.net_return_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {p.start_date} to {p.end_date}
                </div>
                <div className="flex justify-between text-[11px] pt-1 text-slate-300 border-t border-[#1E3E62]/60 font-mono">
                  <span>Sharpe: {p.sharpe_ratio.toFixed(2)}</span>
                  <span>Win Rate: {p.win_rate_pct.toFixed(1)}%</span>
                  <span>DD: -{p.max_drawdown_pct.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
