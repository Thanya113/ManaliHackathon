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
    <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-6">
      <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-2 bg-amber-400/10 text-amber-400 border border-amber-400/20">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Purity & Quotation Unit Normalizer</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Convert between MCX 995 benchmark and any custom weight, sovereign, tola, or karat purity
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              MCX Benchmark Price (₹ per 10g @ 995 Purity)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
              <input
                type="number"
                value={benchmarkPrice}
                onChange={(e) => setBenchmarkPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] pl-8 pr-4 py-2 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Target Weight Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Target Weight (Grams)</label>
              <span className="text-xs text-amber-400 font-mono font-semibold">{targetGrams} g</span>
            </div>
            <input
              type="number"
              step="any"
              value={targetGrams}
              onChange={(e) => setTargetGrams(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-sm text-white font-mono focus:border-amber-400 focus:outline-none mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {weightPresets.map((wp) => (
                <button
                  key={wp.label}
                  onClick={() => setTargetGrams(wp.grams)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-colors ${
                    Math.abs(targetGrams - wp.grams) < 0.001
                      ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                      : "bg-[#071328] text-slate-400 border-[#1E3E62] hover:text-white"
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
              <label className="text-xs font-medium text-slate-300">Target Purity Fineness (parts per 1000)</label>
              <span className="text-xs text-amber-400 font-mono font-semibold">
                {targetPurity} ({converted.karat_estimate}K)
              </span>
            </div>
            <input
              type="number"
              min="1"
              max="1000"
              value={targetPurity}
              onChange={(e) => setTargetPurity(parseInt(e.target.value, 10) || 995)}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-sm text-white font-mono focus:border-amber-400 focus:outline-none mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {purityPresets.map((pp) => (
                <button
                  key={pp.label}
                  onClick={() => setTargetPurity(pp.purity)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium border transition-colors ${
                    targetPurity === pp.purity
                      ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                      : "bg-[#071328] text-slate-400 border-[#1E3E62] hover:text-white"
                  }`}
                >
                  {pp.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Computed Values */}
        <div className="rounded-xl border border-[#1E3E62] bg-[#071328]/80 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Computed Fair Valuation
              </span>
              <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-400/20">
                {converted.karat_estimate} Karat Equivalent
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F2647] to-[#0B1E38] border border-amber-500/30">
              <span className="text-xs text-slate-400 block">Total Notional Value</span>
              <div className="text-3xl font-extrabold text-amber-300 font-mono mt-1">
                ₹{converted.total_value_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                For {targetGrams}g @ {targetPurity}/1000 fineness
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0B1E38] border border-[#1E3E62]/60">
                <span className="text-slate-400 block">Price Per Gram ({targetPurity})</span>
                <span className="font-mono text-white text-sm font-bold mt-0.5 block">
                  ₹{converted.target_price_per_gram.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#0B1E38] border border-[#1E3E62]/60">
                <span className="text-slate-400 block">Pure 24K Gram Price</span>
                <span className="font-mono text-white text-sm font-bold mt-0.5 block">
                  ₹{(converted.target_price_per_gram * (1000 / targetPurity)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-start gap-1.5 border-t border-[#1E3E62]/60 pt-3">
            <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              MCX quotation conversion formula: <code className="text-slate-300">P_norm = P_raw × (10/Unit) × (995/Purity)</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
