"use client";

import React from "react";
import { MCXContract } from "../types";
import { MCX_GOLD_SPECS } from "../lib/quant/specs";
import { GoldNormalizer } from "../lib/quant/normalizer";
import { Scale, CheckCircle, Shield, Award } from "lucide-react";

export const ContractComparisonTable: React.FC = () => {
  const contracts = Object.values(MCX_GOLD_SPECS);

  return (
    <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E3E62]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Official MCX Gold Contract Specifications Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Quotation units, purity fineness, lot multipliers, and delivery parameters across all contracts
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-amber-400/10 px-3 py-1.5 border border-amber-400/20 text-xs text-amber-300">
          <Award className="h-4 w-4 text-amber-400" />
          <span>Standardized Benchmark: ₹ per 10g @ 995 Purity</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1E3E62] text-slate-400 font-semibold bg-[#071328]/80">
              <th className="py-3 px-4">Contract Symbol</th>
              <th className="py-3 px-4">Trading Unit</th>
              <th className="py-3 px-4">Quotation Unit</th>
              <th className="py-3 px-4">Purity Fineness</th>
              <th className="py-3 px-4">Lot Multiplier</th>
              <th className="py-3 px-4">Tick Size</th>
              <th className="py-3 px-4">Tender Window</th>
              <th className="py-3 px-4">Delivery Form</th>
              <th className="py-3 px-4">Norm. Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E3E62]/40">
            {contracts.map((c) => {
              const normFactor = GoldNormalizer.getNormalizationFactor(c.symbol);
              return (
                <tr key={c.symbol} className="hover:bg-[#0F2647]/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-amber-400">{c.symbol}</span>
                      <span className="text-[11px] text-slate-400 font-normal">({c.name})</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">{c.trading_unit_desc}</td>
                  <td className="py-3.5 px-4 font-mono text-amber-300 font-semibold">{c.quotation_unit_desc}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        c.purity_fineness === 999
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {c.purity_fineness} ({c.purity_karat.slice(0, 5)})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-200">
                    {c.lot_multiplier}x{" "}
                    <span className="text-[10px] text-slate-400">(₹{c.lot_multiplier}/point)</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">₹{c.tick_size.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-amber-400 font-semibold">{c.tender_period_days} Days</td>
                  <td className="py-3.5 px-4 text-slate-300">{c.delivery_unit}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {normFactor.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-400 bg-[#071328]/60 p-3 rounded-lg border border-[#1E3E62]/60 flex items-center justify-between">
        <span>
          Note: <strong>GOLDPETAL</strong> is 999 fineness. Its price is normalized down to 995 benchmark via factor{" "}
          <code className="text-amber-300">10 × (995 / 999) = 9.95996</code>.
        </span>
        <span className="text-slate-300 font-semibold">Delivery Center: Ahmedabad / Mumbai Basis</span>
      </div>
    </div>
  );
};
