"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  FileSpreadsheet,
  Calendar,
  FlaskConical,
  UploadCloud,
  Database,
  Scale,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navigation = [
    { name: "Executive Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Relative-Value Spreads", href: "/spreads", icon: TrendingUp },
    { name: "Explainable Signals", href: "/signals", icon: Target },
    { name: "Contracts & Purity", href: "/contracts", icon: Scale },
    { name: "Expiry & Roll Tracker", href: "/calendar", icon: Calendar },
    { name: "Walk-Forward Backtest", href: "/backtest", icon: FlaskConical },
    { name: "Bhavcopy Ingestion", href: "/data", icon: UploadCloud },
  ];

  const contracts = [
    { symbol: "GOLD", unit: "1 Kg (1000g)", quote: "₹/10g", purity: "995", color: "bg-amber-500" },
    { symbol: "GOLDM", unit: "100 grams", quote: "₹/10g", purity: "995", color: "bg-yellow-500" },
    { symbol: "GOLDGUINEA", unit: "8 grams", quote: "₹/8g", purity: "995", color: "bg-emerald-500" },
    { symbol: "GOLDPETAL", unit: "1 gram", quote: "₹/1g", purity: "999", color: "bg-sky-500" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[#E8E1D5] bg-white/95 backdrop-blur-md shrink-0 shadow-xs">
      <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5 gap-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Intelligence Modules
          </div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 text-amber-950 border border-amber-300 font-bold shadow-xs"
                      : "text-slate-600 hover:bg-amber-50/70 hover:text-amber-950"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? "text-amber-600" : "text-slate-400 group-hover:text-amber-600"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-amber-600" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* MCX Gold Benchmark Specs Quick-Ref */}
        <div className="rounded-xl border border-[#E8E1D5] bg-[#FAF8F5] p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-600" />
              MCX Contract Hierarchy
            </span>
            <span className="text-[10px] text-amber-700 font-bold font-mono">995 Std</span>
          </div>

          <div className="space-y-2 text-xs">
            {contracts.map((c) => (
              <div
                key={c.symbol}
                className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#E8E1D5] shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${c.color}`} />
                  <span className="font-bold text-slate-800">{c.symbol}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {c.unit} <span className="text-slate-300">|</span> {c.purity}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed border-t border-[#E8E1D5] pt-2">
            Normalized Benchmark: <strong className="text-slate-800">₹/10g @ 995 fineness</strong>. Petal adjusted for 999 purity.
          </p>
        </div>

        {/* Guardrail Disclaimer */}
        <div className="mt-auto rounded-xl border border-[#E8E1D5] bg-[#FDFBF7] p-3 shadow-xs">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-800 block">Strict Risk Disclaimers</span>
              Statistical relative-value analytics. No claims of guaranteed profit. Past roll yields do not assure future arbitrage.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
