"use client";

import React from "react";
import { ExpiryTimeline } from "../../components/ExpiryTimeline";
import { Calendar, AlertTriangle, ShieldCheck, RefreshCw, Layers } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E1D5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-400/50 shadow-xs">
              ROLL CYCLES
            </span>
            <span className="text-xs text-slate-500 font-medium">Bi-Monthly Futures Expiries</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            MCX Gold Expiry Calendar & Roll Tracker
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Monitor upcoming expiry deadlines, tender notice danger zones (T-5), and open interest liquidity migration across
            active contracts.
          </p>
        </div>
      </div>

      {/* Main Timeline Component */}
      <ExpiryTimeline />

      {/* Institutional Guide to Roll Dynamics */}
      <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-4 text-xs shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-600" />
          Institutional Roll Dynamics & Liquidity Cascades
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed text-slate-600">
          <div className="p-3.5 rounded-lg bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
            <span className="font-bold text-amber-800 block mb-1">1. The 10-Day Roll Window</span>
            <p className="text-slate-600">
              Institutional hedgers and bullion dealers migrate open interest from the expiring front month into the next
              active contract approximately 10 to 14 days before expiry. During this window, calendar spread liquidity peaks.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
            <span className="font-bold text-amber-800 block mb-1">2. Tender Period Margin Surges</span>
            <p className="text-slate-600">
              Starting 5 trading days prior to expiry, MCX imposes stepped tender delivery margins (increasing 5% daily up to
              25%+). Non-delivery traders who fail to square off risk compulsory vault delivery assignment.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/40 border border-[#E8E1D5] shadow-2xs">
            <span className="font-bold text-amber-800 block mb-1">3. Roll Yield Capture</span>
            <p className="text-slate-600">
              In normal contango markets, rolling a long position incurs a roll cost, while rolling a short position captures the
              implied carry return. AuricLens quantifies this annualized roll yield in real time against the RBI repo rate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
