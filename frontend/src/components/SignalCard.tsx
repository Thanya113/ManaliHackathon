"use client";

import React, { useState } from "react";
import {
  CalendarSpreadResult,
  MCXSymbol,
} from "../types";
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Receipt,
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

interface SignalCardProps {
  spread: CalendarSpreadResult;
  onSelectPair?: (pairKey: string) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ spread, onSelectPair }) => {
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [showThesis, setShowThesis] = useState(false);

  const isNoTrade = spread.action === "NO_TRADE";
  const isLong = spread.action === "LONG_SPREAD";
  const isShort = spread.action === "SHORT_SPREAD";

  const getActionBadge = () => {
    if (isLong) {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
          <TrendingUp className="h-3.5 w-3.5" />
          LONG SPREAD
        </span>
      );
    }
    if (isShort) {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/30">
          <TrendingDown className="h-3.5 w-3.5" />
          SHORT SPREAD
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-slate-500/15 px-3 py-1 text-xs font-bold text-slate-300 border border-slate-500/30">
        <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
        NO TRADE
      </span>
    );
  };

  const getStatusBadge = () => {
    switch (spread.status) {
      case "ACTIONABLE":
        return <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Alpha Verified</span>;
      case "REJECTED_RISK":
        return <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Delivery Risk Guardrail</span>;
      case "REJECTED_LIQUIDITY":
        return <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Liquidity Guardrail</span>;
      case "REJECTED_FRICTION":
        return <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Cost Friction Filter</span>;
      default:
        return <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><XCircle className="h-3 w-3" /> Statistical Equilibrium</span>;
    }
  };

  return (
    <div
      className={`card-gradient rounded-xl border transition-all ${
        isNoTrade
          ? "border-[#1E3E62]/70 opacity-95"
          : isLong
          ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
          : "border-rose-500/40 shadow-lg shadow-rose-500/5"
      }`}
    >
      {/* Header */}
      <div className="p-5 border-b border-[#1E3E62]/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">{spread.pair_key}</h3>
              <span className="text-xs text-slate-400">({spread.expiry_diff_days}d cycle)</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">Leg 1: {spread.leg1_symbol} ({spread.leg1_expiry})</span>
              <span className="text-slate-600">→</span>
              <span className="text-xs text-slate-400">Leg 2: {spread.leg2_symbol} ({spread.leg2_expiry})</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {getActionBadge()}
            {getStatusBadge()}
          </div>
        </div>

        {/* Rejection Alert Box (if NO_TRADE) */}
        {isNoTrade && (
          <div className="mt-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-amber-300 block">{spread.primary_reason}</span>
                {spread.rejection_detail && (
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {spread.rejection_detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Direction Thesis (if ACTIONABLE) */}
        {!isNoTrade && (
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-semibold">{spread.primary_reason}</span>
              <span className="font-mono text-emerald-400 font-bold">Confidence: {spread.confidence_score}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Grid */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-[#071328]/40">
        <div>
          <span className="text-slate-400 block">Actual Spread</span>
          <span className="text-base font-bold text-white font-mono mt-0.5 block">
            ₹{spread.spread_norm_abs.toFixed(2)}
            <span className="text-[10px] text-slate-400 font-normal"> /10g</span>
          </span>
          <span className="text-[10px] text-slate-400">{spread.spread_pct.toFixed(2)}% roll premium</span>
        </div>

        <div>
          <span className="text-slate-400 block">Fair Value Carry</span>
          <span className="text-base font-bold text-slate-200 font-mono mt-0.5 block">
            ₹{spread.fair_spread_cost_of_carry.toFixed(2)}
            <span className="text-[10px] text-slate-400 font-normal"> /10g</span>
          </span>
          <span className="text-[10px] text-amber-400">
            Dislocation: {spread.dislocation_abs >= 0 ? "+" : ""}₹{spread.dislocation_abs.toFixed(2)}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block">Implied Carry Yield</span>
          <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
            {spread.implied_carry_rate_pct.toFixed(2)}%
            <span className="text-[10px] text-slate-400 font-normal"> p.a.</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Z: {spread.z_score >= 0 ? "+" : ""}{spread.z_score.toFixed(2)}σ</span>
        </div>

        <div>
          <span className="text-slate-400 block">Net Expected Edge</span>
          <span
            className={`text-base font-bold font-mono mt-0.5 block ${
              spread.net_expected_edge > 0 ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {spread.net_expected_edge > 0 ? `+₹${spread.net_expected_edge.toFixed(2)}` : "₹0.00"}
            <span className="text-[10px] text-slate-400 font-normal"> /10g</span>
          </span>
          <span className="text-[10px] text-slate-400">Fees: ₹{spread.friction_per_10g.toFixed(2)}/10g</span>
        </div>
      </div>

      {/* Accordion Triggers */}
      <div className="px-5 py-3 border-t border-[#1E3E62]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowThesis(!showThesis)}
            className="flex items-center gap-1 text-slate-300 hover:text-amber-400 font-medium transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Why this signal?</span>
            {showThesis ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => setShowCostDetails(!showCostDetails)}
            className="flex items-center gap-1 text-slate-300 hover:text-amber-400 font-medium transition-colors"
          >
            <Receipt className="h-3.5 w-3.5 text-amber-400" />
            <span>Friction Breakdown</span>
            {showCostDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {onSelectPair && (
          <button
            onClick={() => onSelectPair(spread.pair_key)}
            className="rounded-lg bg-[#0F2647] px-2.5 py-1 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/30 transition-colors"
          >
            Inspect Charts →
          </button>
        )}
      </div>

      {/* Accordion 1: Explainable Quantitative Thesis */}
      {showThesis && (
        <div className="px-5 py-4 border-t border-[#1E3E62]/60 bg-[#071328]/80 text-xs space-y-2">
          <div className="font-semibold text-slate-200">Quantitative Rationale:</div>
          <p className="text-slate-300 leading-relaxed">{spread.thesis || "No thesis available for this pair."}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-400">
            <div>
              Leg 1 Tender Window: <span className="font-semibold text-slate-200">{spread.days_to_leg1_expiry} days</span>
            </div>
            <div>
              Deferred Leg Open Interest: <span className="font-semibold text-slate-200">{spread.leg2_oi} lots</span>
            </div>
            <div>
              Market Regime: <span className="font-semibold text-amber-400">{spread.market_regime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Accordion 2: Itemized Friction Breakdown */}
      {showCostDetails && spread.costs && (
        <div className="px-5 py-4 border-t border-[#1E3E62]/60 bg-[#0B1E38]/90 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-amber-400" />
              MCX Institutional 4-Leg Transaction Cost Model ({spread.costs.lot_symbol} Lot)
            </span>
            <span className="text-amber-400 font-mono font-bold">
              Total: ₹{spread.costs.total_friction_inr} / lot (₹{spread.costs.friction_per_10g}/10g)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div className="p-2 rounded bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400 block">MCX Exchange Fee (0.0021%)</span>
              <span className="font-mono text-slate-200 font-semibold">₹{spread.costs.exchange_fee_inr}</span>
            </div>
            <div className="p-2 rounded bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400 block">Commodity Tax CTT (0.01%)</span>
              <span className="font-mono text-slate-200 font-semibold">₹{spread.costs.ctt_inr}</span>
            </div>
            <div className="p-2 rounded bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400 block">Brokerage (4 orders @ ₹20)</span>
              <span className="font-mono text-slate-200 font-semibold">₹{spread.costs.brokerage_inr}</span>
            </div>
            <div className="p-2 rounded bg-[#071328] border border-[#1E3E62]/60">
              <span className="text-slate-400 block">GST (18%) + Stamp Duty</span>
              <span className="font-mono text-slate-200 font-semibold">
                ₹{(spread.costs.gst_inr + spread.costs.stamp_duty_inr).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            *Execution assumption: 1 tick (₹1/10g) bid-ask slippage per execution = ₹{spread.costs.slippage_inr}/lot.
          </div>
        </div>
      )}
    </div>
  );
};
