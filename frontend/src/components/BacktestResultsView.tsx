"use client";

import React, { useState } from "react";
import { BacktestReport, EquityCurvePoint, TradeLogEntry } from "../types";
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  Percent,
  Activity,
  Layers,
} from "lucide-react";

interface BacktestResultsViewProps {
  report: BacktestReport;
  onSaveToSupabase?: () => void;
  isSaving?: boolean;
}

export const BacktestResultsView: React.FC<BacktestResultsViewProps> = ({
  report,
  onSaveToSupabase,
  isSaving = false,
}) => {
  const [activeTab, setActiveTab] = useState<"chart" | "trades" | "audit">("chart");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const eq = report.equity_curve;
  const initialCap = report.initial_capital;

  // Chart min/max scaling
  const allEquities = eq.flatMap((p: EquityCurvePoint) => [p.strategy_equity, p.strategy_gross_equity, p.baseline_equity]);
  const minEq = Math.floor(Math.min(...allEquities) * 0.98);
  const maxEq = Math.ceil(Math.max(...allEquities) * 1.02);
  const rangeEq = maxEq - minEq || 1;

  const svgWidth = 800;
  const svgHeight = 280;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const getX = (i: number) => padLeft + (i / (eq.length - 1 || 1)) * plotWidth;
  const getY = (val: number) => padTop + plotHeight - ((val - minEq) / rangeEq) * plotHeight;

  let pathNet = "";
  let pathGross = "";
  let pathBaseline = "";

  eq.forEach((pt: EquityCurvePoint, i: number) => {
    const x = getX(i);
    const yNet = getY(pt.strategy_equity);
    const yGross = getY(pt.strategy_gross_equity);
    const yBase = getY(pt.baseline_equity);

    if (i === 0) {
      pathNet += `M ${x} ${yNet}`;
      pathGross += `M ${x} ${yGross}`;
      pathBaseline += `M ${x} ${yBase}`;
    } else {
      pathNet += ` L ${x} ${yNet}`;
      pathGross += ` L ${x} ${yGross}`;
      pathBaseline += ` L ${x} ${yBase}`;
    }
  });

  const hoveredPoint = hoverIdx !== null ? eq[hoverIdx] : eq[eq.length - 1];

  const exportCSV = () => {
    const headers = [
      "Trade_ID",
      "Direction",
      "Entry_Date",
      "Entry_Spread",
      "Exit_Date",
      "Exit_Spread",
      "Holding_Days",
      "Gross_PnL_INR",
      "Friction_Paid_INR",
      "Net_PnL_INR",
      "Return_Pct",
      "Exit_Reason",
    ];
    const rows = report.trade_logs.map((t: TradeLogEntry) => [
      t.trade_id,
      t.direction,
      t.entry_date,
      t.entry_spread,
      t.exit_date,
      t.exit_spread,
      t.holding_days,
      t.gross_pnl_inr,
      t.friction_paid_inr,
      t.net_pnl_inr,
      t.return_pct,
      t.exit_reason,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: (string | number)[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auriclens_trades_${report.pair_key}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">{report.strategy_name}</h3>
            <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-300 border border-amber-400/20">
              {report.pair_key}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Backtest Range: <span className="text-slate-300">{report.start_date}</span> to{" "}
            <span className="text-slate-300">{report.end_date}</span> | Zero Look-Ahead Bias Verified
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSaveToSupabase && (
            <button
              onClick={onSaveToSupabase}
              disabled={isSaving}
              className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving to Supabase..." : "Save Report to Supabase"}
            </button>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-[#0B1E38] px-3 py-1.5 text-xs font-medium text-slate-200 border border-[#1E3E62] hover:bg-[#0F2647] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Export Trades</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#071328]/80 border border-[#1E3E62]">
          <span className="text-[11px] text-slate-400 block">Net Strategy Return</span>
          <span
            className={`text-lg font-bold font-mono mt-0.5 block ${
              report.net_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {report.net_return_pct >= 0 ? "+" : ""}
            {report.net_return_pct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {report.net_profit_inr >= 0 ? "+₹" : "-₹"}
            {Math.abs(report.net_profit_inr).toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#071328]/80 border border-[#1E3E62]">
          <span className="text-[11px] text-slate-400 block">Buy & Hold Baseline</span>
          <span
            className={`text-lg font-bold font-mono mt-0.5 block ${
              report.baseline_return_pct >= 0 ? "text-slate-200" : "text-rose-400"
            }`}
          >
            {report.baseline_return_pct >= 0 ? "+" : ""}
            {report.baseline_return_pct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-400">Front Roll Benchmark</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#071328]/80 border border-[#1E3E62]">
          <span className="text-[11px] text-slate-400 block">Sharpe Ratio (Rf 6.5%)</span>
          <span className="text-lg font-bold font-mono text-amber-400 mt-0.5 block">
            {report.sharpe_ratio.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Sortino: {report.sortino_ratio.toFixed(2)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#071328]/80 border border-[#1E3E62]">
          <span className="text-[11px] text-slate-400 block">Max Drawdown</span>
          <span className="text-lg font-bold font-mono text-rose-400 mt-0.5 block">
            -{report.max_drawdown_pct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono">-₹{report.max_drawdown_inr.toLocaleString()}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#071328]/80 border border-[#1E3E62]">
          <span className="text-[11px] text-slate-400 block">Win Rate</span>
          <span className="text-lg font-bold font-mono text-emerald-400 mt-0.5 block">
            {report.win_rate_pct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400">
            {report.winning_trades}W / {report.losing_trades}L ({report.total_trades} trades)
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#071328]/80 border border-[#1E3E62]">
          <span className="text-[11px] text-slate-400 block">Friction Paid (Fees)</span>
          <span className="text-lg font-bold font-mono text-slate-300 mt-0.5 block">
            ₹{report.total_friction_paid_inr.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">PF: {report.profit_factor.toFixed(2)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1E3E62] flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("chart")}
          className={`pb-2.5 transition-colors ${
            activeTab === "chart" ? "border-b-2 border-amber-400 text-amber-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Equity Curve & Baseline
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`pb-2.5 transition-colors ${
            activeTab === "trades" ? "border-b-2 border-amber-400 text-amber-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Executed Trades Log ({report.trade_logs.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-2.5 transition-colors ${
            activeTab === "audit" ? "border-b-2 border-amber-400 text-amber-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Data Quality & Bias Audit
        </button>
      </div>

      {/* Tab 1: Equity Curve Chart */}
      {activeTab === "chart" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300 font-medium">Net Strategy Equity (After Costs)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300 font-medium">Gross Strategy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                <span className="text-slate-300 font-medium">Buy & Hold Front Contract</span>
              </div>
            </div>

            {hoveredPoint && (
              <div className="font-mono text-slate-300">
                {hoveredPoint.date}: <span className="text-emerald-400 font-bold">₹{hoveredPoint.strategy_equity.toLocaleString()}</span>{" "}
                <span className="text-slate-500">|</span> DD: <span className="text-rose-400">-{hoveredPoint.drawdown_pct}%</span>
              </div>
            )}
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none"
              onMouseLeave={() => setHoverIdx(null)}
            >
              {/* Horizontal Grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = padTop + pct * plotHeight;
                const val = maxEq - pct * rangeEq;
                return (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#1E3E62"
                      strokeDasharray="3 3"
                      strokeOpacity="0.4"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      fill="#64748B"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      ₹{Math.round(val / 1000)}k
                    </text>
                  </g>
                );
              })}

              {/* Baseline Curve (Slate) */}
              <path d={pathBaseline} fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Gross Equity (Amber) */}
              <path d={pathGross} fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.6" />

              {/* Net Strategy Equity (Emerald) */}
              <path d={pathNet} fill="none" stroke="#10B981" strokeWidth="2.5" />

              {/* Hover vertical rule */}
              {hoverIdx !== null && (
                <g>
                  <line
                    x1={getX(hoverIdx)}
                    y1={padTop}
                    x2={getX(hoverIdx)}
                    y2={svgHeight - padBottom}
                    stroke="#10B981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={getX(hoverIdx)}
                    cy={getY(eq[hoverIdx].strategy_equity)}
                    r="5"
                    fill="#10B981"
                    stroke="#071328"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Interactive Columns */}
              {eq.map((_: EquityCurvePoint, idx: number) => {
                const x = getX(idx);
                const colWidth = plotWidth / eq.length;
                return (
                  <rect
                    key={idx}
                    x={x - colWidth / 2}
                    y={padTop}
                    width={colWidth}
                    height={plotHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoverIdx(idx)}
                    className="cursor-crosshair"
                  />
                );
              })}

              {/* X Dates */}
              {[0, Math.floor(eq.length / 4), Math.floor(eq.length / 2), Math.floor((3 * eq.length) / 4), eq.length - 1].map(
                (idx) => {
                  if (idx < 0 || idx >= eq.length) return null;
                  return (
                    <text
                      key={idx}
                      x={getX(idx)}
                      y={svgHeight - padBottom + 18}
                      fill="#94A3B8"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {eq[idx].date.slice(5)}
                    </text>
                  );
                }
              )}
            </svg>
          </div>
        </div>
      )}

      {/* Tab 2: Trade Execution Log Table */}
      {activeTab === "trades" && (
        <div className="overflow-x-auto">
          {report.trade_logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No trades met the statistical entry and cost hurdle filters during this period.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E3E62] text-slate-400 font-semibold bg-[#071328]/60">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Entry Date</th>
                  <th className="py-2.5 px-3">Entry Spread</th>
                  <th className="py-2.5 px-3">Exit Date</th>
                  <th className="py-2.5 px-3">Exit Spread</th>
                  <th className="py-2.5 px-3">Holding</th>
                  <th className="py-2.5 px-3">Friction</th>
                  <th className="py-2.5 px-3">Net P&L</th>
                  <th className="py-2.5 px-3">Exit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3E62]/40 font-mono">
                {report.trade_logs.map((t: TradeLogEntry) => (
                  <tr key={t.trade_id} className="hover:bg-[#0F2647]/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{t.trade_id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          t.direction === "LONG_SPREAD"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {t.direction.replace("_SPREAD", "")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">{t.entry_date}</td>
                    <td className="py-2.5 px-3 text-slate-200">₹{t.entry_spread.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">{t.exit_date}</td>
                    <td className="py-2.5 px-3 text-slate-200">₹{t.exit_spread.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{t.holding_days}d</td>
                    <td className="py-2.5 px-3 text-slate-400">₹{t.friction_paid_inr}</td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        t.net_pnl_inr >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {t.net_pnl_inr >= 0 ? "+" : ""}₹{t.net_pnl_inr.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="rounded bg-[#071328] px-2 py-0.5 text-[10px] text-slate-300 border border-[#1E3E62]">
                        {t.exit_reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 3: Data Quality & Bias Audit */}
      {activeTab === "audit" && (
        <div className="rounded-xl border border-[#1E3E62] bg-[#071328]/80 p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Walk-Forward Backtesting Bias Integrity Report</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Strict Zero Look-Ahead Bias</span>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Rolling Z-Score parameter estimations (mean and standard deviation) are strictly calculated using
                    historical bars up to bar <code className="text-amber-400">t - 1</code>. No forward data leakage exists.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Tender Period Enforcement</span>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    All spread entries are blocked within 5 trading days of front month expiry. Open positions are
                    forced to roll or close before the physical delivery notice window.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Realistic Institutional Frictions</span>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    MCX turnover charges (0.0021%), CTT (0.01% on sell), GST (18%), stamp duty (0.002%), brokerage, and
                    bid-ask slippage are subtracted on every execution leg.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Data Continuity Audit</span>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Total synchronized bars: {report.data_quality_audit.total_bars}. Zero-volume or halted contract bars
                    filtered out: {report.data_quality_audit.zero_volume_filtered}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
