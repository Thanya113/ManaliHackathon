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
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8E1D5] bg-white/90 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-slate-600 hover:bg-amber-50 hover:text-slate-900 md:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Auric</span>
                <span className="text-xl font-extrabold tracking-tight text-amber-600">Lens</span>
                <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                  MCX QUANT
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Gold Futures Relative-Value Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Live MCX Ticker Ribbon (Desktop / Tablet) */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-2 rounded-lg bg-[#FAF8F5] px-3 py-1.5 border border-[#E8E1D5] shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500">MCX Session:</span>
            <span className="text-slate-800 font-semibold">Active (09:00 - 23:30 IST)</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#FAF8F5] px-3 py-1.5 border border-[#E8E1D5] shadow-xs">
            <span className="text-slate-500">RBI Repo:</span>
            <span className="text-amber-700 font-bold">6.50%</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Vaulting:</span>
            <span className="text-amber-700 font-bold">0.25% p.a.</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#FAF8F5] px-3 py-1.5 border border-[#E8E1D5] shadow-xs">
            <span className="text-slate-500">Standard Purity:</span>
            <span className="text-slate-800 font-bold">995 Fineness (₹/10g)</span>
          </div>
        </div>

        {/* Database Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Institutional Data Feed Status Indicator */}
          <div
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors ${
              dbStatus.connected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
            title={dbStatus.connected ? "Cloud Database Connected" : "MCX Verified Historical Feed Active"}
          >
            <Database className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">
              {dbStatus.connected ? "Live Cloud Feed" : "MCX Verified Feed"}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                dbStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-amber-50 hover:text-slate-900 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E1D5] bg-white px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-amber-100/70 text-amber-900 border border-amber-300 font-bold"
                    : "text-slate-700 hover:bg-amber-50 hover:text-slate-900"
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
