import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";

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
    <html lang="en" className="dark">
      <body className="bg-[#071328] text-slate-100 min-h-screen flex flex-col antialiased">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
