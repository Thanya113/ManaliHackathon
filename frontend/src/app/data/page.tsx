"use client";

import React, { useState, useEffect } from "react";
import { BhavcopyUploader } from "../../components/BhavcopyUploader";
import { StorageService } from "../../lib/supabase/service";
import { BhavcopyRecord, MCXSymbol } from "../../types";
import {
  Database,
  Filter,
  Download,
  Search,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function DataPage() {
  const [records, setRecords] = useState<BhavcopyRecord[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
  const [searchDate, setSearchDate] = useState<string>("");
  const [selectedExpiry, setSelectedExpiry] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await StorageService.getMarketData();
    setRecords(data);
    setIsLoading(false);
  };

  const filteredRecords = records.filter((r) => {
    if (selectedSymbol !== "ALL" && r.symbol !== selectedSymbol) return false;
    if (searchDate && !r.trade_date.includes(searchDate)) return false;
    if (selectedExpiry !== "ALL" && r.expiry_date !== selectedExpiry) return false;
    return true;
  });

  const uniqueExpiries = Array.from(new Set(records.map((r) => r.expiry_date))).sort();

  const exportFilteredCSV = () => {
    const headers = [
      "TRADE_DATE",
      "SYMBOL",
      "EXPIRY_DATE",
      "OPEN",
      "HIGH",
      "LOW",
      "CLOSE",
      "VOLUME_LOTS",
      "OPEN_INTEREST",
      "NORM_PRICE_10G_995",
      "SOURCE",
    ];
    const rows = filteredRecords.map((r) => [
      r.trade_date,
      r.symbol,
      r.expiry_date,
      r.open,
      r.high,
      r.low,
      r.close,
      r.volume_lots,
      r.open_interest,
      r.normalized_price_10g_995,
      r.source,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mcx_bhavcopy_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/20">
              DATA PIPELINE
            </span>
            <span className="text-xs text-slate-400">Public MCX Bhavcopy & Historical Store</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Data Ingestion & Bhavcopy Inspector
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Ingest official MCX Bhavcopy files, validate contract specifications, inspect normalized benchmark prices, and
            export filtered datasets.
          </p>
        </div>
      </div>

      {/* Bhavcopy Uploader Component */}
      <BhavcopyUploader onIngestionComplete={() => loadData()} />

      {/* Filter and Table Inspector */}
      <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-400" />
              <span>Bhavcopy Record Inspector ({filteredRecords.length} records)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Normalized benchmark prices (₹/10g @ 995) verified with zero look-ahead bias
            </p>
          </div>

          <button
            onClick={exportFilteredCSV}
            className="flex items-center gap-1.5 rounded-lg bg-[#0F2647] px-3 py-1.5 text-xs font-semibold text-amber-300 border border-[#1E3E62] hover:bg-[#17355B] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Filter by Contract Symbol</label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">All Gold Contracts (All)</option>
              <option value="GOLD">GOLD (1 Kg / ₹ per 10g)</option>
              <option value="GOLDM">GOLDM (100g Mini)</option>
              <option value="GOLDGUINEA">GOLDGUINEA (8g Guinea)</option>
              <option value="GOLDPETAL">GOLDPETAL (1g Petal)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Filter by Contract Expiry</label>
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">All Expiries</option>
              {uniqueExpiries.map((exp) => (
                <option key={exp} value={exp}>
                  Expiry: {exp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Search Trade Date (YYYY-MM)</label>
            <input
              type="text"
              placeholder="e.g. 2025-02"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading market data...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No records matched the filter criteria.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#071328] z-10">
                <tr className="border-b border-[#1E3E62] text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Trade Date</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Raw Close</th>
                  <th className="py-2.5 px-3">Norm. ₹/10g @ 995</th>
                  <th className="py-2.5 px-3">High / Low</th>
                  <th className="py-2.5 px-3">Volume (Lots)</th>
                  <th className="py-2.5 px-3">Open Interest</th>
                  <th className="py-2.5 px-3">Data Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3E62]/40 font-mono">
                {filteredRecords.slice(0, 100).map((r, i) => (
                  <tr key={i} className="hover:bg-[#0F2647]/50 transition-colors">
                    <td className="py-2.5 px-3 font-sans text-slate-300">{r.trade_date}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-400 font-sans">{r.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">{r.expiry_date}</td>
                    <td className="py-2.5 px-3 text-slate-200">₹{r.close.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      ₹{r.normalized_price_10g_995.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      ₹{r.high.toLocaleString()} / ₹{r.low.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{r.volume_lots.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-300">{r.open_interest.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                          r.source === "MCX_BHAVCOPY"
                            ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
                            : "bg-sky-400/10 text-sky-300 border-sky-400/20"
                        }`}
                      >
                        {r.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredRecords.length > 100 && (
          <div className="text-center text-[11px] text-slate-400 border-t border-[#1E3E62]/60 pt-2">
            Showing first 100 of {filteredRecords.length} records. Use filters or export to CSV to view full dataset.
          </div>
        )}
      </div>
    </div>
  );
}
