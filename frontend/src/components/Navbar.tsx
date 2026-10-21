"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  Database,
  Menu,
  X,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { StorageService } from "../lib/supabase/service";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const pathname = usePathname();
  const [dbStatus, setDbStatus] = useState<{
    configured: boolean;
    connected: boolean;
    error: string | null;
  }>({ configured: false, connected: false, error: null });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    StorageService.testDatabaseConnection().then((res) => {
      setDbStatus({
        configured: res.configured,
        connected: res.connected,
        error: res.error,
      });
    });
  }, []);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/spreads", label: "Spread Analyzer" },
    { href: "/signals", label: "Signals & Rejections" },
    { href: "/contracts", label: "Contracts & Purity" },
    { href: "/calendar", label: "Expiry Calendar" },
    { href: "/backtest", label: "Backtest Lab" },
    { href: "/data", label: "Data & Ingestion" },
    { href: "/settings", label: "Supabase Setup" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E3E62] bg-[#071328]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-[#0F2647] hover:text-white md:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Coins className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">Auric</span>
                <span className="text-xl font-bold tracking-tight text-amber-400">Lens</span>
                <span className="ml-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/20">
                  MCX QUANT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Gold Futures Relative-Value Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Live MCX Ticker Ribbon (Desktop / Tablet) */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 rounded-lg bg-[#0B1E38] px-3 py-1.5 border border-[#1E3E62]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">MCX Session:</span>
            <span className="text-slate-200 font-semibold">Active (09:00 - 23:30 IST)</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#0B1E38] px-3 py-1.5 border border-[#1E3E62]">
            <span className="text-slate-400">RBI Repo:</span>
            <span className="text-amber-400 font-bold">6.50%</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Vaulting:</span>
            <span className="text-amber-400 font-bold">0.25% p.a.</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#0B1E38] px-3 py-1.5 border border-[#1E3E62]">
            <span className="text-slate-400">Standard Purity:</span>
            <span className="text-slate-200 font-bold">995 Fineness (₹/10g)</span>
          </div>
        </div>

        {/* Database Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Supabase Status Indicator */}
          <Link
            href="/settings"
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
              dbStatus.connected
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50"
                : "bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50"
            }`}
            title={dbStatus.connected ? "Supabase Cloud Database Connected" : "Local Demo / Cache Active (Click to connect Supabase)"}
          >
            <Database className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {dbStatus.connected ? "Supabase Active" : "Local / Demo Mode"}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                dbStatus.connected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
          </Link>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-[#0F2647] hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1E3E62] bg-[#071328] px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "text-slate-300 hover:bg-[#0F2647] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
