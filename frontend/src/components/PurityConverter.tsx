"use client";

import React, { useState } from "react";
import { GoldNormalizer } from "../lib/quant/normalizer";
import { Scale, Sparkles, ArrowRightLeft, Info } from "lucide-react";

export const PurityConverter: React.FC = () => {
  const [benchmarkPrice, setBenchmarkPrice] = useState<number>(78500); // ₹ / 10g @ 995
  const [targetGrams, setTargetGrams] = useState<number>(10);
  const [targetPurity, setTargetPurity] = useState<number>(916); // 22K default

  const weightPresets = [
    { label: "1 Gram (Petal)", grams: 1 },
    { label: "8 Grams (Guinea/Sovereign)", grams: 8 },
    { label: "10 Grams (Standard)", grams: 10 },
    { label: "1 Tola (11.66g)", grams: 11.6638 },
    { label: "1 Troy Oz (31.1g)", grams: 31.1035 },
    { label: "100 Grams (Mini)", grams: 100 },
    { label: "1 Kg (Standard Bar)", grams: 1000 },
  ];

  const purityPresets = [
    { label: "24K Fine Gold (999)", purity: 999 },
    { label: "MCX Benchmark (995)", purity: 995 },
    { label: "22K Jewellery Hallmark (916)", purity: 916 },
    { label: "18K Jewellery (750)", purity: 750 },
    { label: "14K Jewellery (585)", purity: 585 },
  ];

  const converted = GoldNormalizer.convertCustom(benchmarkPrice, targetGrams, targetPurity);

  return (
    <div className="card-gradient rounded-xl border border-[#E8E1D5] bg-white/95 p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-2 bg-amber-50 text-amber-600 border border-amber-300">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Purity & Quotation Unit Normalizer</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Convert between MCX 995 benchmark and any custom weight, sovereign, tola, or karat purity
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              MCX Benchmark Price (₹ per 10g @ 995 Purity)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-semibold">₹</span>
              <input
                type="number"
                value={benchmarkPrice}
                onChange={(e) => setBenchmarkPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg bg-white border border-[#E8E1D5] pl-8 pr-4 py-2 text-sm text-slate-900 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Target Weight Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Target Weight (Grams)</label>
              <span className="text-xs text-amber-800 font-mono font-semibold">{targetGrams} g</span>
            </div>
            <input
              type="number"
              step="any"
              value={targetGrams}
              onChange={(e) => setTargetGrams(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg bg-white border border-[#E8E1D5] px-3 py-2 text-sm text-slate-900 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {weightPresets.map((wp) => (
                <button
                  key={wp.label}
                  onClick={() => setTargetGrams(wp.grams)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-colors ${
                    Math.abs(targetGrams - wp.grams) < 0.001
                      ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                      : "bg-white text-slate-700 border-[#E8E1D5] hover:bg-amber-50/70 hover:text-slate-900 shadow-2xs"
                  }`}
                >
                  {wp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Purity Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700">Target Purity Fineness (parts per 1000)</label>
              <span className="text-xs text-amber-800 font-mono font-semibold">
                {targetPurity} ({converted.karat_estimate}K)
              </span>
            </div>
            <input
              type="number"
              min="1"
              max="1000"
              value={targetPurity}
              onChange={(e) => setTargetPurity(parseInt(e.target.value, 10) || 995)}
              className="w-full rounded-lg bg-white border border-[#E8E1D5] px-3 py-2 text-sm text-slate-900 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {purityPresets.map((pp) => (
                <button
                  key={pp.label}
                  onClick={() => setTargetPurity(pp.purity)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-colors ${
                    targetPurity === pp.purity
                      ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                      : "bg-white text-slate-700 border-[#E8E1D5] hover:bg-amber-50/70 hover:text-slate-900 shadow-2xs"
                  }`}
                >
                  {pp.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Computed Values */}
        <div className="rounded-xl border border-[#E8E1D5] bg-amber-50/40 p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Computed Fair Valuation
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
                {converted.karat_estimate} Karat Equivalent
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-100/90 to-amber-50 border border-amber-300/80 shadow-xs">
              <span className="text-xs text-slate-600 font-medium block">Total Notional Value</span>
              <div className="text-3xl font-extrabold text-amber-900 font-mono mt-1">
                ₹{converted.total_value_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-mono">
                For {targetGrams}g @ {targetPurity}/1000 fineness
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white border border-[#E8E1D5] shadow-2xs">
                <span className="text-slate-500 block">Price Per Gram ({targetPurity})</span>
                <span className="font-mono text-slate-900 text-sm font-bold mt-0.5 block">
                  ₹{converted.target_price_per_gram.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#E8E1D5] shadow-2xs">
                <span className="text-slate-500 block">Pure 24K Gram Price</span>
                <span className="font-mono text-slate-900 text-sm font-bold mt-0.5 block">
                  ₹{(converted.target_price_per_gram * (1000 / targetPurity)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 flex items-start gap-1.5 border-t border-[#E8E1D5] pt-3">
            <Info className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              MCX quotation conversion formula: <code className="text-slate-900 font-mono bg-white px-1 py-0.5 rounded border border-[#E8E1D5]">P_norm = P_raw × (10/Unit) × (995/Purity)</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
