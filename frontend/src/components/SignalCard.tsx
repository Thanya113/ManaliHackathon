"use client";

import React, { useState } from "react";
import {
  CalendarSpreadResult,
  MCXSymbol,
  SignalAuditTrail,
} from "../types";
import { TinyFishEvidenceAgent } from "../lib/quant/tinyfish";
import { MCX_GOLD_SPECS } from "../lib/quant/specs";
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
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Calculator,
  Search,
  BookOpen,
} from "lucide-react";

interface SignalCardProps {
  spread: CalendarSpreadResult;
  onSelectPair?: (pairKey: string) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ spread, onSelectPair }) => {
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [showThesis, setShowThesis] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceTab, setEvidenceTab] = useState<"FACTS" | "FORMULAS" | "HYPOTHESES" | "HURDLES">("FACTS");

  const isNoTrade = spread.action === "NO_TRADE";
  const isLong = spread.action === "LONG_SPREAD";
  const isShort = spread.action === "SHORT_SPREAD";

  // Build audit trail dynamically if not already persisted
  const auditTrail: SignalAuditTrail =
    spread.audit_trail ||
    TinyFishEvidenceAgent.buildAuditTrail(
      spread,
      MCX_GOLD_SPECS[spread.leg1_symbol],
      MCX_GOLD_SPECS[spread.leg2_symbol]
    );

  const getActionBadge = () => {
    if (isLong) {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300 shadow-2xs">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          TRADE CANDIDATE: LONG SPREAD
        </span>
      );
    }
    if (isShort) {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-300 shadow-2xs">
          <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
          TRADE CANDIDATE: SHORT SPREAD
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-300 shadow-2xs">
        <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
        NO TRADE
      </span>
    );
  };

  const getStatusBadge = () => {
    switch (spread.status) {
      case "ACTIONABLE":
        return <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Alpha Verified</span>;
      case "REJECTED_RISK":
        return <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Delivery Risk Guardrail</span>;
      case "REJECTED_LIQUIDITY":
        return <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Liquidity Guardrail</span>;
      case "REJECTED_FRICTION":
        return <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Cost Friction Filter</span>;
      default:
        return <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><XCircle className="h-3 w-3" /> Statistical Equilibrium</span>;
    }
  };

  return (
    <div
      className={`card-gradient rounded-xl border transition-all ${
        isNoTrade
          ? "border-[#E8E1D5] opacity-95 shadow-xs"
          : isLong
          ? "border-emerald-300 shadow-md shadow-emerald-500/5"
          : "border-rose-300 shadow-md shadow-rose-500/5"
      }`}
    >
      {/* Header */}
      <div className="p-5 border-b border-[#E8E1D5]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{spread.pair_key}</h3>
              <span className="text-xs text-slate-500 font-medium">({spread.expiry_diff_days}d cycle)</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-600 font-medium">Leg 1: {spread.leg1_symbol} ({spread.leg1_expiry})</span>
              <span className="text-slate-400">→</span>
              <span className="text-xs text-slate-600 font-medium">Leg 2: {spread.leg2_symbol} ({spread.leg2_expiry})</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {getActionBadge()}
            {getStatusBadge()}
          </div>
        </div>

        {/* Rejection Alert Box (if NO_TRADE) */}
        {isNoTrade && (
          <div className="mt-3.5 rounded-lg border border-amber-300 bg-amber-50/80 p-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-900 block">{spread.primary_reason}</span>
                {spread.rejection_detail && (
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    {spread.rejection_detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Direction Thesis (if ACTIONABLE) */}
        {!isNoTrade && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-bold">{spread.primary_reason}</span>
              <span className="font-mono text-emerald-800 font-extrabold">Confidence: {spread.confidence_score}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric Grid */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-[#FAF8F5]/80 border-b border-[#E8E1D5]">
        <div>
          <span className="text-slate-500 font-semibold block">Actual Spread</span>
          <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">
            ₹{spread.spread_norm_abs.toFixed(2)}
            <span className="text-[10px] text-slate-500 font-normal"> /10g</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">{spread.spread_pct.toFixed(2)}% roll premium</span>
        </div>

        <div>
          <span className="text-slate-500 font-semibold block">Fair Value Carry</span>
          <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">
            ₹{spread.fair_spread_cost_of_carry.toFixed(2)}
            <span className="text-[10px] text-slate-500 font-normal"> /10g</span>
          </span>
          <span className="text-[10px] text-amber-700 font-bold">
            Dislocation: {spread.dislocation_abs >= 0 ? "+" : ""}₹{spread.dislocation_abs.toFixed(2)}
          </span>
        </div>

        <div>
          <span className="text-slate-500 font-semibold block">Implied Carry Yield</span>
          <span className="text-base font-extrabold text-amber-700 font-mono mt-0.5 block">
            {spread.implied_carry_rate_pct.toFixed(2)}%
            <span className="text-[10px] text-slate-500 font-normal"> p.a.</span>
          </span>
          <span className="text-[10px] text-slate-600 font-mono font-medium">Z: {spread.z_score >= 0 ? "+" : ""}{spread.z_score.toFixed(2)}σ</span>
        </div>

        <div>
          <span className="text-slate-500 font-semibold block">Net Expected Edge</span>
          <span
            className={`text-base font-extrabold font-mono mt-0.5 block ${
              spread.net_expected_edge > 0 ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {spread.net_expected_edge > 0 ? `+₹${spread.net_expected_edge.toFixed(2)}` : "₹0.00"}
            <span className="text-[10px] text-slate-500 font-normal"> /10g</span>
          </span>
          <span className="text-[10px] text-slate-500">Fees: ₹{spread.friction_per_10g.toFixed(2)}/10g</span>
        </div>
      </div>

      {/* Accordion Triggers */}
      <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowThesis(!showThesis)}
            className="flex items-center gap-1 text-slate-700 hover:text-amber-800 font-semibold transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
            <span>Why this signal?</span>
            {showThesis ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => setShowCostDetails(!showCostDetails)}
            className="flex items-center gap-1 text-slate-700 hover:text-amber-800 font-semibold transition-colors"
          >
            <Receipt className="h-3.5 w-3.5 text-amber-600" />
            <span>Friction Breakdown</span>
            {showCostDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className={`flex items-center gap-1 font-bold transition-colors px-2.5 py-1 rounded-lg ${
              showEvidence
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : "text-amber-800 border border-amber-300/60 bg-amber-50 hover:bg-amber-100/70"
            }`}
          >
            <FileCheck className="h-3.5 w-3.5 text-amber-700" />
            <span>TinyFish Evidence & Citations</span>
            <span className="ml-1 rounded-full bg-amber-200 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-900">
              {auditTrail.verified_source_facts.length}
            </span>
            {showEvidence ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {onSelectPair && (
          <button
            onClick={() => onSelectPair(spread.pair_key)}
            className="rounded-lg bg-amber-50 px-3 py-1 text-amber-800 hover:bg-amber-100 border border-amber-300 font-semibold transition-colors shadow-2xs"
          >
            Inspect Charts →
          </button>
        )}
      </div>

      {/* Accordion 1: Explainable Quantitative Thesis */}
      {showThesis && (
        <div className="px-5 py-4 border-t border-[#E8E1D5] bg-[#FDFBF7] text-xs space-y-2">
          <div className="font-bold text-slate-800">Quantitative Rationale:</div>
          <p className="text-slate-700 leading-relaxed">{spread.thesis || "No thesis available for this pair."}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-slate-500">
            <div>
              Leg 1 Tender Window: <span className="font-bold text-slate-800">{spread.days_to_leg1_expiry} days</span>
            </div>
            <div>
              Deferred Leg Open Interest: <span className="font-bold text-slate-800">{spread.leg2_oi} lots</span>
            </div>
            <div>
              Market Regime: <span className="font-bold text-amber-800">{spread.market_regime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Accordion 2: Itemized Friction Breakdown */}
      {showCostDetails && spread.costs && (
        <div className="px-5 py-4 border-t border-[#E8E1D5] bg-[#FDFBF7] text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-amber-700" />
              MCX Institutional 4-Leg Transaction Cost Model ({spread.costs.lot_symbol} Lot)
            </span>
            <span className="text-amber-800 font-mono font-extrabold">
              Total: ₹{spread.costs.total_friction_inr} / lot (₹{spread.costs.friction_per_10g}/10g)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white border border-[#E8E1D5] shadow-xs">
              <span className="text-slate-500 block">MCX Exchange Fee (0.0021%)</span>
              <span className="font-mono text-slate-900 font-bold">₹{spread.costs.exchange_fee_inr}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E8E1D5] shadow-xs">
              <span className="text-slate-500 block">Commodity Tax CTT (0.01%)</span>
              <span className="font-mono text-slate-900 font-bold">₹{spread.costs.ctt_inr}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E8E1D5] shadow-xs">
              <span className="text-slate-500 block">Brokerage (4 orders @ ₹20)</span>
              <span className="font-mono text-slate-900 font-bold">₹{spread.costs.brokerage_inr}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-[#E8E1D5] shadow-xs">
              <span className="text-slate-500 block">GST (18%) + Stamp Duty</span>
              <span className="font-mono text-slate-900 font-bold">
                ₹{(spread.costs.gst_inr + spread.costs.stamp_duty_inr).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            *Execution assumption: 1 tick (₹1/10g) bid-ask slippage per execution = ₹{spread.costs.slippage_inr}/lot.
          </div>
        </div>
      )}

      {/* Accordion 3: TinyFish Evidence Agent Audit Trail */}
      {showEvidence && (
        <div className="px-5 py-4 border-t border-[#E8E1D5] bg-[#FAF8F5] text-xs space-y-4">
          {/* Provenance Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-[#E8E1D5] shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-slate-800">Evidence Provenance Audit Trail</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                Agent: {auditTrail.provenance_summary.evidence_engine}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
                Data: {auditTrail.provenance_summary.market_data_source}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-semibold">
                Math: 100% Deterministic
              </span>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-[#E8E1D5] pb-2">
            {[
              { id: "FACTS", label: `Verified Facts (${auditTrail.verified_source_facts.length})`, icon: FileCheck },
              { id: "FORMULAS", label: `Calculations (${auditTrail.calculated_results.length})`, icon: Calculator },
              { id: "HYPOTHESES", label: `Model Hypotheses (${auditTrail.hypotheses_and_assumptions.length})`, icon: BookOpen },
              {
                id: "HURDLES",
                label: `Hurdle Matrix (${auditTrail.rejection_or_candidate_audit.hurdle_passed ? "PASS" : "FAIL"})`,
                icon: ShieldAlert,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setEvidenceTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    evidenceTab === tab.id
                      ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-amber-50/70 border border-[#E8E1D5]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Verified Source Facts */}
          {evidenceTab === "FACTS" && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-500 font-medium">
                Facts extracted from public MCX specifications, clearing circulars, and official regulatory sources:
              </div>
              <div className="space-y-2">
                {auditTrail.verified_source_facts.map((fact, idx) => (
                  <div
                    key={fact.id || idx}
                    className="p-3 rounded-lg bg-white border border-[#E8E1D5] shadow-xs space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {fact.category}
                        </span>
                        <span className="font-bold text-slate-900">{fact.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> VERIFIED SOURCE FACT
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 leading-relaxed">{fact.extracted_fact}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E8E1D5] text-[10px] text-slate-500">
                      <span>Source: {fact.source_name}</span>
                      <a
                        href={fact.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-amber-700 hover:text-amber-800 underline font-bold"
                      >
                        <span>Official Source Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Deterministic Calculations */}
          {evidenceTab === "FORMULAS" && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-500 font-medium">
                Every calculation is fully deterministic with zero look-ahead bias and verifiable mathematics:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {auditTrail.calculated_results.map((calc, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white border border-[#E8E1D5] shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">{calc.name}</span>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">100% Deterministic</span>
                    </div>
                    <div className="text-sm font-extrabold text-amber-700 font-mono">{calc.value}</div>
                    <div className="p-1.5 rounded bg-[#FAF8F5] font-mono text-[10px] text-slate-600 border border-[#E8E1D5]">
                      {calc.formula}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Model Hypotheses & Sensitivity */}
          {evidenceTab === "HYPOTHESES" && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-500 font-medium">
                Explicit separation of empirical data from economic hypotheses and sensitivity constraints:
              </div>
              <div className="space-y-2">
                {auditTrail.hypotheses_and_assumptions.map((hyp, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white border border-[#E8E1D5] shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{hyp.parameter}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        HYPOTHESIS: {hyp.assumed_value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700">{hyp.source_rationale}</p>
                    <div className="text-[10px] text-amber-800 font-medium italic">
                      Sensitivity Impact: {hyp.sensitivity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Hurdle Checklist Matrix */}
          {evidenceTab === "HURDLES" && (
            <div className="space-y-2.5">
              <div className="text-[11px] text-slate-500 font-medium">
                Institutional risk hurdles evaluated before any trade candidate is authorized:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    name: "Tender Period Delivery Guardrail",
                    desc: "Blocks trades within 5 days of expiry to avoid compulsory delivery.",
                    status: auditTrail.rejection_or_candidate_audit.risk_checks.tender_window_check,
                  },
                  {
                    name: "Deferred Leg Open Interest Threshold",
                    desc: "Requires deferred leg OI ≥ 1,000 lots to guarantee liquidity.",
                    status: auditTrail.rejection_or_candidate_audit.risk_checks.liquidity_oi_check,
                  },
                  {
                    name: "Transaction Cost Friction Hurdle",
                    desc: "Expected edge must exceed 4-leg institutional costs & slippage.",
                    status: auditTrail.rejection_or_candidate_audit.risk_checks.friction_hurdle_check,
                  },
                  {
                    name: "Statistical Z-Score Significance",
                    desc: "Requires |Z| ≥ 1.80 standard deviations from 20-day mean.",
                    status: auditTrail.rejection_or_candidate_audit.risk_checks.statistical_significance_check,
                  },
                ].map((hurdle, idx) => {
                  const passed = hurdle.status === "PASS";
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border shadow-xs ${
                        passed
                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                          : "bg-rose-50/70 border-rose-300 text-rose-950"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{hurdle.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            passed
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {hurdle.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{hurdle.desc}</p>
                    </div>
                  );
                })}
              </div>

              {auditTrail.rejection_or_candidate_audit.failing_hurdle && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs shadow-xs">
                  <span className="font-bold block">Failing Hurdle Detail:</span>
                  <p className="mt-0.5 text-[11px] text-slate-700">
                    {auditTrail.rejection_or_candidate_audit.failing_hurdle}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
