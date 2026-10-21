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
    { name: "Supabase Setup", href: "/settings", icon: Database },
  ];

  const contracts = [
    { symbol: "GOLD", unit: "1 Kg (1000g)", quote: "₹/10g", purity: "995", color: "bg-amber-400" },
    { symbol: "GOLDM", unit: "100 grams", quote: "₹/10g", purity: "995", color: "bg-yellow-400" },
    { symbol: "GOLDGUINEA", unit: "8 grams", quote: "₹/8g", purity: "995", color: "bg-emerald-400" },
    { symbol: "GOLDPETAL", unit: "1 gram", quote: "₹/1g", purity: "999", color: "bg-cyan-400" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-[#1E3E62] bg-[#071328] shrink-0">
      <div className="flex flex-col flex-1 overflow-y-auto px-4 py-5 gap-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/5"
                      : "text-slate-300 hover:bg-[#0F2647] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-amber-400" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* MCX Gold Benchmark Specs Quick-Ref */}
        <div className="rounded-xl border border-[#1E3E62] bg-[#0B1E38]/80 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              MCX Contract Hierarchy
            </span>
            <span className="text-[10px] text-amber-400/90 font-mono">995 Std</span>
          </div>

          <div className="space-y-2 text-xs">
            {contracts.map((c) => (
              <div
                key={c.symbol}
                className="flex items-center justify-between p-1.5 rounded-lg bg-[#071328]/60 border border-[#1E3E62]/60"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${c.color}`} />
                  <span className="font-semibold text-slate-200">{c.symbol}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {c.unit} <span className="text-slate-600">|</span> {c.purity}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed border-t border-[#1E3E62]/60 pt-2">
            Normalized Benchmark: <strong className="text-slate-200">₹/10g @ 995 fineness</strong>. Petal adjusted for 999 purity.
          </p>
        </div>

        {/* Guardrail Disclaimer */}
        <div className="mt-auto rounded-xl border border-[#1E3E62]/60 bg-[#0B1E38]/40 p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300 block">Strict Risk Disclaimers</span>
              Statistical relative-value analytics. No claims of guaranteed profit. Past roll yields do not assure future arbitrage.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
