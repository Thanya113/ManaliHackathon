import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { AnimatedGoldBackground } from "../components/AnimatedGoldBackground";

export const metadata: Metadata = {
  title: "AuricLens — MCX Gold Futures Relative-Value Intelligence",
  description:
    "Institutional-grade quantitative relative-value intelligence for MCX gold futures. Calendar spreads, cost-of-carry fair value, anomaly detection, explainable signals, and walk-forward backtesting.",
  keywords: [
    "MCX Gold",
    "Gold Futures",
    "Relative Value",
    "Calendar Spread",
    "Cost of Carry",
    "Gold Arbitrage",
    "Quant Trading",
    "Supabase",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FAF8F5] text-slate-800 min-h-screen flex flex-col antialiased relative selection:bg-amber-200 selection:text-amber-900 font-sans">
        {/* Animated Luminous Gold & Bullion Background */}
        <AnimatedGoldBackground />

        {/* Content Hierarchy with Elevated Z-Index */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto space-y-6">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
