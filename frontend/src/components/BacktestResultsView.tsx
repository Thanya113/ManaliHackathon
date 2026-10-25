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
    <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-6 shadow-sm">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E1D5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{report.strategy_name}</h3>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-800 border border-amber-400/50 shadow-xs">
              {report.pair_key}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Backtest Range: <span className="text-slate-700 font-medium">{report.start_date}</span> to{" "}
            <span className="text-slate-700 font-medium">{report.end_date}</span> | Zero Look-Ahead Bias Verified
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSaveToSupabase && (
            <button
              onClick={onSaveToSupabase}
              disabled={isSaving}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-xs disabled:opacity-50"
            >
              {isSaving ? "Saving to Supabase..." : "Save Report to Supabase"}
            </button>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 border border-[#E8E1D5] hover:bg-amber-50/70 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-amber-600" />
            <span>Export Trades</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Net Strategy Return</span>
          <span
            className={`text-lg font-bold font-mono mt-0.5 block ${
              report.net_return_pct >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {report.net_return_pct >= 0 ? "+" : ""}
            {report.net_return_pct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {report.net_profit_inr >= 0 ? "+₹" : "-₹"}
            {Math.abs(report.net_profit_inr).toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Buy & Hold Baseline</span>
          <span
            className={`text-lg font-bold font-mono mt-0.5 block ${
              report.baseline_return_pct >= 0 ? "text-slate-900" : "text-rose-700"
            }`}
          >
            {report.baseline_return_pct >= 0 ? "+" : ""}
            {report.baseline_return_pct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500">Front Roll Benchmark</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Sharpe Ratio (Rf 6.5%)</span>
          <span className="text-lg font-bold font-mono text-amber-800 mt-0.5 block">
            {report.sharpe_ratio.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Sortino: {report.sortino_ratio.toFixed(2)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Max Drawdown</span>
          <span className="text-lg font-bold font-mono text-rose-700 mt-0.5 block">
            -{report.max_drawdown_pct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono">-₹{report.max_drawdown_inr.toLocaleString()}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Win Rate</span>
          <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">
            {report.win_rate_pct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500">
            {report.winning_trades}W / {report.losing_trades}L ({report.total_trades} trades)
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Friction Paid (Fees)</span>
          <span className="text-lg font-bold font-mono text-slate-800 mt-0.5 block">
            ₹{report.total_friction_paid_inr.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">PF: {report.profit_factor.toFixed(2)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E8E1D5] flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("chart")}
          className={`pb-2.5 transition-colors ${
            activeTab === "chart" ? "border-b-2 border-amber-600 text-amber-800" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Equity Curve & Baseline
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={`pb-2.5 transition-colors ${
            activeTab === "trades" ? "border-b-2 border-amber-600 text-amber-800" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Executed Trades Log ({report.trade_logs.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-2.5 transition-colors ${
            activeTab === "audit" ? "border-b-2 border-amber-600 text-amber-800" : "text-slate-500 hover:text-slate-800"
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
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-700 font-medium">Net Strategy Equity (After Costs)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-700 font-medium">Gross Strategy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-700 font-medium">Buy & Hold Front Contract</span>
              </div>
            </div>

            {hoveredPoint && (
              <div className="font-mono text-slate-700">
                {hoveredPoint.date}: <span className="text-emerald-700 font-bold">₹{hoveredPoint.strategy_equity.toLocaleString()}</span>{" "}
                <span className="text-slate-400">|</span> DD: <span className="text-rose-700 font-semibold">-{hoveredPoint.drawdown_pct}%</span>
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
                      stroke="#E2E8F0"
                      strokeDasharray="3 3"
                      strokeOpacity="0.9"
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
              <path d={pathBaseline} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Gross Equity (Amber) */}
              <path d={pathGross} fill="none" stroke="#D97706" strokeWidth="1.5" strokeOpacity="0.6" />

              {/* Net Strategy Equity (Emerald) */}
              <path d={pathNet} fill="none" stroke="#059669" strokeWidth="2.5" />

              {/* Hover vertical rule */}
              {hoverIdx !== null && (
                <g>
                  <line
                    x1={getX(hoverIdx)}
                    y1={padTop}
                    x2={getX(hoverIdx)}
                    y2={svgHeight - padBottom}
                    stroke="#059669"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={getX(hoverIdx)}
                    cy={getY(eq[hoverIdx].strategy_equity)}
                    r="5"
                    fill="#059669"
                    stroke="#FFFFFF"
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
                      fill="#64748B"
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
            <div className="p-8 text-center text-slate-500 text-xs">
              No trades met the statistical entry and cost hurdle filters during this period.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E8E1D5] text-slate-600 font-semibold bg-amber-50/70">
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
              <tbody className="divide-y divide-[#E8E1D5] font-mono">
                {report.trade_logs.map((t: TradeLogEntry) => (
                  <tr key={t.trade_id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500">{t.trade_id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          t.direction === "LONG_SPREAD"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            : "bg-rose-50 text-rose-700 border border-rose-300"
                        }`}
                      >
                        {t.direction.replace("_SPREAD", "")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-sans">{t.entry_date}</td>
                    <td className="py-2.5 px-3 text-slate-900">₹{t.entry_spread.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-sans">{t.exit_date}</td>
                    <td className="py-2.5 px-3 text-slate-900">₹{t.exit_spread.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans">{t.holding_days}d</td>
                    <td className="py-2.5 px-3 text-slate-600">₹{t.friction_paid_inr}</td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        t.net_pnl_inr >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {t.net_pnl_inr >= 0 ? "+" : ""}₹{t.net_pnl_inr.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 border border-slate-200">
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
        <div className="rounded-xl border border-[#E8E1D5] bg-amber-50/40 p-5 space-y-4 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Walk-Forward Backtesting Bias Integrity Report</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Strict Zero Look-Ahead Bias</span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Rolling Z-Score parameter estimations (mean and standard deviation) are strictly calculated using
                    historical bars up to bar <code className="text-amber-800 font-semibold bg-amber-100/70 px-1 py-0.5 rounded">t - 1</code>. No forward data leakage exists.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Tender Period Enforcement</span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    All spread entries are blocked within 5 trading days of front month expiry. Open positions are
                    forced to roll or close before the physical delivery notice window.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Realistic Institutional Frictions</span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    MCX turnover charges (0.0021%), CTT (0.01% on sell), GST (18%), stamp duty (0.002%), brokerage, and
                    bid-ask slippage are subtracted on every execution leg.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">Data Continuity Audit</span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
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
