"use client";

import React from "react";
import { Calendar, AlertTriangle, Clock, ArrowRight, ShieldCheck, MapPin } from "lucide-react";

export const ExpiryTimeline: React.FC = () => {
  const currentSimDate = new Date("2025-03-20");

  const cycles = [
    {
      symbol: "GOLD_APR25",
      commodity: "Gold Standard (1 Kg)",
      expiry: "2025-04-05",
      tenderStart: "2025-03-31",
      daysToExpiry: 16,
      daysToTender: 11,
      oiLots: 14200,
      oiChangePct: -12.4, // OI rolling out of front month
      volumeLots: 3450,
      status: "FRONT_MONTH",
      inTender: false,
    },
    {
      symbol: "GOLD_JUN25",
      commodity: "Gold Standard (1 Kg)",
      expiry: "2025-06-05",
      tenderStart: "2025-05-30",
      daysToExpiry: 77,
      daysToTender: 71,
      oiLots: 11800,
      oiChangePct: +24.8, // OI rolling into next month
      volumeLots: 2150,
      status: "NEXT_MONTH",
      inTender: false,
    },
    {
      symbol: "GOLD_AUG25",
      commodity: "Gold Standard (1 Kg)",
      expiry: "2025-08-05",
      tenderStart: "2025-07-30",
      daysToExpiry: 138,
      daysToTender: 132,
      oiLots: 5600,
      oiChangePct: +5.2,
      volumeLots: 620,
      status: "FAR_MONTH",
      inTender: false,
    },
    {
      symbol: "GOLD_OCT25",
      commodity: "Gold Standard (1 Kg)",
      expiry: "2025-10-05",
      tenderStart: "2025-09-30",
      daysToExpiry: 199,
      daysToTender: 194,
      oiLots: 2200,
      oiChangePct: +1.1,
      volumeLots: 180,
      status: "FAR_MONTH",
      inTender: false,
    },
  ];

  return (
    <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E1D5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">MCX Gold Expiry Calendar & Roll Tracker</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bi-monthly contract schedule, 5-day delivery tender windows, and Open Interest migration
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 border border-amber-200 text-xs shadow-2xs">
          <MapPin className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-slate-600">Delivery Center:</span>
          <span className="text-slate-900 font-semibold">Ahmedabad / Mumbai Basis</span>
        </div>
      </div>

      {/* Tender Period Regulatory Warning Box */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-amber-900 block">MCX Compulsory Physical Delivery Notice</span>
            <p className="text-slate-700 leading-relaxed">
              Trading members holding positions during the 5 trading days prior to contract expiry enter the{" "}
              <strong>tender notice period</strong>. During this window, incremental delivery margins (up to 25%+) apply,
              and open positions are subject to physical delivery assignment at vaulted MCX centers. AuricLens{" "}
              <strong>strictly enforces automated roll exits at T-5 days</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cycles.map((c) => (
          <div
            key={c.symbol}
            className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
              c.status === "FRONT_MONTH"
                ? "bg-gradient-to-b from-amber-100/70 via-white to-amber-50/50 border-amber-400 shadow-md shadow-amber-500/10"
                : "bg-white border-[#E8E1D5] hover:border-amber-300 shadow-2xs"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-900 font-mono">{c.symbol}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    c.status === "FRONT_MONTH"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {c.status.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-700 mt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contract Expiry:</span>
                  <span className="font-semibold text-slate-900">{c.expiry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tender Period Begins:</span>
                  <span className="font-semibold text-amber-800">{c.tenderStart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Days to Expiry:</span>
                  <span className="font-mono text-slate-900 font-bold">{c.daysToExpiry} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Open Interest:</span>
                  <span className="font-mono text-slate-800">
                    {c.oiLots.toLocaleString()} lots{" "}
                    <span
                      className={`text-[10px] font-semibold ${
                        c.oiChangePct >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      ({c.oiChangePct >= 0 ? "+" : ""}
                      {c.oiChangePct}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8E1D5] flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Daily Turnover:</span>
              <span className="text-slate-800 font-mono font-semibold">{c.volumeLots.toLocaleString()} lots</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
