"use client";

import React, { useState, useEffect } from "react";
import { BhavcopyUploader } from "../../components/BhavcopyUploader";
import { StorageService } from "../../lib/supabase/service";
import { isSupabaseConfigured } from "../../lib/supabase/client";
import { GoldNormalizer } from "../../lib/quant/normalizer";
import { BhavcopyRecord, MCXSymbol } from "../../types";
import {
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Trash2,
  Edit3,
  Server,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function DataPage() {
  const [records, setRecords] = useState<BhavcopyRecord[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("ALL");
  const [searchDate, setSearchDate] = useState<string>("");
  const [selectedExpiry, setSelectedExpiry] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ configured: boolean; connected: boolean; count: number }>({
    configured: false,
    connected: false,
    count: 0,
  });

  // Manual CRUD form state
  const [showAddForm, setShowAddForm] = useState(true);
  const [formSymbol, setFormSymbol] = useState<MCXSymbol>("GOLD");
  const [formTradeDate, setFormTradeDate] = useState<string>("2025-05-15");
  const [formExpiryDate, setFormExpiryDate] = useState<string>("2025-06-05");
  const [formClosePrice, setFormClosePrice] = useState<string>("88750");
  const [formOpenPrice, setFormOpenPrice] = useState<string>("88500");
  const [formHighPrice, setFormHighPrice] = useState<string>("88900");
  const [formLowPrice, setFormLowPrice] = useState<string>("88400");
  const [formVolume, setFormVolume] = useState<string>("1500");
  const [formOI, setFormOI] = useState<string>("9200");
  const [formSource, setFormSource] = useState<"DEMO_DATA" | "MCX_BHAVCOPY" | "MANUAL_CSV">("DEMO_DATA");

  // Status banners
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Quick edit modal state
  const [editingRecord, setEditingRecord] = useState<BhavcopyRecord | null>(null);
  const [editClosePrice, setEditClosePrice] = useState<string>("");
  const [editVolume, setEditVolume] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    checkConnectionAndLoad();
  }, []);

  const checkConnectionAndLoad = async () => {
    setIsLoading(true);
    const configured = isSupabaseConfigured();
    const data = await StorageService.getMarketData();
    setRecords(data);
    setDbStatus({
      configured,
      connected: configured,
      count: data.length,
    });
    setIsLoading(false);
  };

  const loadData = async () => {
    setIsLoading(true);
    const data = await StorageService.getMarketData();
    setRecords(data);
    setDbStatus((prev) => ({ ...prev, count: data.length }));
    setIsLoading(false);
  };

  // Calculate live normalized price preview
  const calculateNormalizedPreview = (): number => {
    const raw = parseFloat(formClosePrice) || 0;
    if (raw <= 0) return 0;
    return GoldNormalizer.normalizePrice(formSymbol, raw);
  };

  // Form Submission (Supabase INSERT)
  const handleInsertRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setActionNotice(null);

    // Validation
    const close = parseFloat(formClosePrice);
    const open = parseFloat(formOpenPrice) || close;
    const high = parseFloat(formHighPrice) || close;
    const low = parseFloat(formLowPrice) || close;
    const volume = parseInt(formVolume, 10) || 0;
    const oi = parseInt(formOI, 10) || 0;

    if (!formTradeDate || !formExpiryDate) {
      setFormError("Both Trade Date and Expiry Date are required.");
      return;
    }

    if (formExpiryDate < formTradeDate) {
      setFormError("Validation Error: Contract Expiry Date cannot be earlier than Trade Date.");
      return;
    }

    if (isNaN(close) || close <= 0) {
      setFormError("Validation Error: Close price must be a valid positive number greater than ₹0.");
      return;
    }

    if (high < low) {
      setFormError("Validation Error: High price cannot be strictly lower than Low price.");
      return;
    }

    if (high < close || low > close) {
      setFormError("Validation Error: High price must be >= Close price, and Low price must be <= Close price.");
      return;
    }

    const normPrice = GoldNormalizer.normalizePrice(formSymbol, close);

    const newRecord: Omit<BhavcopyRecord, "id" | "created_at"> = {
      trade_date: formTradeDate,
      symbol: formSymbol,
      expiry_date: formExpiryDate,
      open,
      high,
      low,
      close,
      previous_close: close,
      volume_lots: volume,
      open_interest: oi,
      normalized_price_10g_995: normPrice,
      source: formSource,
    };

    setIsSubmitting(true);
    const result = await StorageService.insertMarketDataRecord(newRecord);
    setIsSubmitting(false);

    if (result.success && result.data) {
      setFormSuccess(
        `✓ Record successfully saved to Supabase! ID: ${result.data.id} (${result.data.symbol} on ${result.data.trade_date})`
      );
      // Immediately prepend to records table without requiring manual refresh
      setRecords((prev) => [result.data!, ...prev.filter((r) => r.id !== result.data!.id)]);
      setDbStatus((prev) => ({ ...prev, count: prev.count + 1 }));
    } else {
      setFormError(`Supabase Insert Failed: ${result.error || "Unknown database error"}`);
    }
  };

  // Row Deletion (Supabase DELETE)
  const handleDeleteRecord = async (record: BhavcopyRecord) => {
    if (!record.id) {
      setRecords((prev) => prev.filter((r) => r !== record));
      setActionNotice(`Removed record from local view (${record.symbol} ${record.trade_date})`);
      return;
    }

    const confirmDelete = window.confirm(
      `Delete record from Supabase?\nSymbol: ${record.symbol}\nTrade Date: ${record.trade_date}\nID: ${record.id}`
    );
    if (!confirmDelete) return;

    setActionNotice(`Deleting record ${record.id} from Supabase...`);
    const res = await StorageService.deleteMarketDataRecord(record.id);
    if (res.success) {
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      setActionNotice(`✓ Record ${record.id.slice(0, 8)}... successfully deleted from Supabase.`);
      setDbStatus((prev) => ({ ...prev, count: Math.max(0, prev.count - 1) }));
    } else {
      setActionNotice(`Delete failed: ${res.error}`);
    }
  };

  // Quick Edit (Supabase UPDATE)
  const handleOpenEdit = (record: BhavcopyRecord) => {
    setEditingRecord(record);
    setEditClosePrice(record.close.toString());
    setEditVolume(record.volume_lots.toString());
  };

  const handleSaveUpdate = async () => {
    if (!editingRecord || !editingRecord.id) return;

    const newClose = parseFloat(editClosePrice);
    const newVol = parseInt(editVolume, 10);
    if (isNaN(newClose) || newClose <= 0) {
      alert("Please enter a valid positive close price.");
      return;
    }

    setIsUpdating(true);
    const norm = GoldNormalizer.normalizePrice(editingRecord.symbol, newClose);
    const res = await StorageService.updateMarketDataRecord(editingRecord.id, {
      close: newClose,
      volume_lots: isNaN(newVol) ? editingRecord.volume_lots : newVol,
      normalized_price_10g_995: norm,
    });
    setIsUpdating(false);

    if (res.success && res.data) {
      setRecords((prev) => prev.map((r) => (r.id === res.data!.id ? res.data! : r)));
      setActionNotice(`✓ Record ${editingRecord.id.slice(0, 8)}... updated in Supabase (New Close: ₹${newClose})`);
      setEditingRecord(null);
    } else {
      alert(`Update failed: ${res.error}`);
    }
  };

  // Sync / Pre-seed 240 verified records into Supabase
  const handleSeedVerifiedData = async () => {
    const confirmSeed = window.confirm(
      "Sync 240 verified MCX Bhavcopy records to your live Supabase PostgreSQL database?"
    );
    if (!confirmSeed) return;

    setIsSeeding(true);
    setActionNotice("Syncing 240 verified records to Supabase in batches...");
    const res = await StorageService.seedVerifiedDataToSupabase();
    setIsSeeding(false);

    if (res.success) {
      setActionNotice(`✓ Successfully seeded ${res.count} verified MCX Bhavcopy records to Supabase!`);
      await loadData();
    } else {
      setActionNotice(`Seeding failed: ${res.error}`);
    }
  };

  // Filter records
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
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
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
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/20">
              SUPABASE CRUD PIPELINE
            </span>
            <span className="text-xs text-slate-400">Live PostgreSQL Data Store & Bhavcopy Inspector</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            MCX Gold Data Ingestion & Live Supabase CRUD
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Directly insert, query, update, and delete MCX gold futures records in Supabase hosted database with real-time
            normalization to ₹/10g @ 995 purity benchmark.
          </p>
        </div>

        {/* Database Status Pill & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#071328] border border-[#1E3E62] px-3.5 py-2">
            <Server className="h-4 w-4 text-emerald-400" />
            <div className="text-left">
              <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Supabase PostgreSQL
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {dbStatus.count} records loaded
              </div>
            </div>
          </div>

          <button
            id="btn-reload-data"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl bg-[#0F2647] px-3 py-2 text-xs font-semibold text-amber-300 border border-[#1E3E62] hover:bg-[#17355B] transition-colors disabled:opacity-50"
            title="Reload from Supabase"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isLoading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          id="alert-action-notice"
          className="flex items-center justify-between rounded-xl bg-[#0F2647] border border-amber-400/40 p-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Quick Action Bar: Pre-seed & CSV */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A192F]/80 border border-[#1E3E62] rounded-xl p-3.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Database Engine:</span>
          <span className="text-slate-400">
            Status: <span className="text-emerald-400 font-semibold">Active &amp; Connected</span>
          </span>

        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-seed-data"
            onClick={handleSeedVerifiedData}
            disabled={isSeeding}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 font-semibold transition-colors disabled:opacity-50"
          >
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isSeeding ? "Syncing..." : "Sync 240 Verified Records to Supabase"}</span>
          </button>
        </div>
      </div>

      {/* FORM: DIRECT SUPABASE RECORD ENTRY */}
      <div className="card-gradient rounded-xl border border-amber-400/30 p-5 shadow-lg shadow-black/40">
        <div className="flex items-center justify-between border-b border-[#1E3E62]/60 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Add Gold Futures Price Record (Direct Supabase Insert)
            </h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1"
          >
            {showAddForm ? (
              <>
                <span>Hide Form</span> <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Show Form</span> <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleInsertRecord} className="mt-4 space-y-4">
            {/* Inline Error Banner */}
            {formError && (
              <div
                id="alert-error"
                className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Inline Success Banner */}
            {formSuccess && (
              <div
                id="alert-success"
                className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Symbol */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Contract Symbol <span className="text-amber-400">*</span>
                </label>
                <select
                  id="input-symbol"
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value as MCXSymbol)}
                  className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                >
                  <option value="GOLD">GOLD (1 Kg / ₹ per 10g @ 995)</option>
                  <option value="GOLDM">GOLDM (100g Mini / ₹ per 10g @ 995)</option>
                  <option value="GOLDGUINEA">GOLDGUINEA (8g Guinea / ₹ per 8g @ 995)</option>
                  <option value="GOLDPETAL">GOLDPETAL (1g Petal / ₹ per 1g @ 999)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Official MCX trading specifications</p>
              </div>

              {/* Trade Date */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Trade Date <span className="text-amber-400">*</span>
                </label>
                <input
                  id="input-trade-date"
                  type="date"
                  value={formTradeDate}
                  onChange={(e) => setFormTradeDate(e.target.value)}
                  className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Valuation trading session date</p>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Contract Expiry Date <span className="text-amber-400">*</span>
                </label>
                <input
                  id="input-expiry-date"
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Must be &gt;= Trade Date</p>
              </div>

              {/* Close Price */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Close Price (₹) <span className="text-amber-400">*</span>
                </label>
                <input
                  id="input-close-price"
                  type="number"
                  step="0.01"
                  value={formClosePrice}
                  onChange={(e) => setFormClosePrice(e.target.value)}
                  placeholder="e.g. 88750"
                  className="w-full rounded-lg bg-[#071328] border border-amber-400/40 px-3 py-2 text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Official settlement price</p>
              </div>

              {/* High Price */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">High Price (₹)</label>
                <input
                  id="input-high-price"
                  type="number"
                  step="0.01"
                  value={formHighPrice}
                  onChange={(e) => setFormHighPrice(e.target.value)}
                  placeholder="e.g. 88900"
                  className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Low Price */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Low Price (₹)</label>
                <input
                  id="input-low-price"
                  type="number"
                  step="0.01"
                  value={formLowPrice}
                  onChange={(e) => setFormLowPrice(e.target.value)}
                  placeholder="e.g. 88400"
                  className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Volume (Lots) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Volume (Lots)</label>
                <input
                  id="input-volume"
                  type="number"
                  value={formVolume}
                  onChange={(e) => setFormVolume(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Open Interest */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Open Interest (Lots)</label>
                <input
                  id="input-oi"
                  type="number"
                  value={formOI}
                  onChange={(e) => setFormOI(e.target.value)}
                  placeholder="e.g. 9200"
                  className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Normalization & Data Source Preview */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#071328]/80 border border-[#1E3E62] p-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Live Indian Benchmark Conversion:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  ₹{calculateNormalizedPreview().toLocaleString()} / 10g @ 995 purity
                </span>
                <span className="text-[11px] text-slate-400">
                  (Auto-normalized for quotation unit &amp; fineness)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Label:</span>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value as "DEMO_DATA" | "MCX_BHAVCOPY" | "MANUAL_CSV")}
                  className="rounded bg-[#0F2647] border border-[#1E3E62] px-2 py-1 text-amber-300 font-semibold"
                >
                  <option value="DEMO_DATA">DEMO_DATA (Verified Test)</option>
                  <option value="MCX_BHAVCOPY">MCX_BHAVCOPY (Official)</option>
                  <option value="MANUAL_CSV">MANUAL_CSV (User Upload)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFormClosePrice("88750");
                  setFormOpenPrice("88500");
                  setFormHighPrice("88900");
                  setFormLowPrice("88400");
                  setFormVolume("1500");
                  setFormOI("9200");
                  setFormTradeDate("2025-05-15");
                  setFormExpiryDate("2025-06-05");
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="rounded-lg bg-[#071328] px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Reset Defaults
              </button>
              <button
                id="btn-submit-record"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 text-xs transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting to Supabase...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Submit Record to Supabase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CSV Bhavcopy Uploader Component */}
      <BhavcopyUploader onIngestionComplete={() => loadData()} />

      {/* Bhavcopy Table Inspector */}
      <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E3E62]/60 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-400" />
              <span>Bhavcopy Record Inspector ({filteredRecords.length} records)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live records persisted in Supabase PostgreSQL &bull; Normalized benchmark prices (₹/10g @ 995)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportFilteredCSV}
              className="flex items-center gap-1.5 rounded-lg bg-[#0F2647] px-3 py-1.5 text-xs font-semibold text-amber-300 border border-[#1E3E62] hover:bg-[#17355B] transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>Export CSV</span>
            </button>
          </div>
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
              <option value="ALL">All Expiries ({uniqueExpiries.length})</option>
              {uniqueExpiries.map((exp) => (
                <option key={exp} value={exp}>
                  Expiry: {exp}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Search Trade Date (YYYY-MM-DD)</label>
            <input
              type="text"
              placeholder="e.g. 2025-05 or 2025-05-15"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin text-amber-400 mx-auto mb-2" />
              <span>Fetching live records from Supabase hosted database...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <Database className="h-8 w-8 text-slate-500 mx-auto" />
              <div className="font-semibold text-slate-300">No records found matching criteria.</div>
              <p className="text-[11px] text-slate-500">
                You can insert a test price record using the form above, or click &ldquo;Sync 240 Verified Records to Supabase&rdquo;.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#071328] z-10 shadow-sm shadow-black">
                <tr className="border-b border-[#1E3E62] text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Trade Date</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Raw Close</th>
                  <th className="py-2.5 px-3">Norm. ₹/10g @ 995</th>
                  <th className="py-2.5 px-3">High / Low</th>
                  <th className="py-2.5 px-3">Volume (Lots)</th>
                  <th className="py-2.5 px-3">Open Interest</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3E62]/40 font-mono">
                {filteredRecords.slice(0, 100).map((r, i) => (
                  <tr
                    key={r.id || `${r.symbol}-${r.trade_date}-${r.expiry_date}-${i}`}
                    className={`hover:bg-[#0F2647]/50 transition-colors ${
                      r.source === "DEMO_DATA" ? "bg-amber-400/[0.03]" : ""
                    }`}
                  >
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
                            : r.source === "DEMO_DATA"
                            ? "bg-purple-400/10 text-purple-300 border-purple-400/30"
                            : "bg-sky-400/10 text-sky-300 border-sky-400/20"
                        }`}
                      >
                        {r.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-sans">
                        {r.id && (
                          <button
                            id={`btn-edit-${r.id}`}
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 rounded hover:bg-amber-400/10 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Edit Record in Supabase"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          id={r.id ? `btn-delete-${r.id}` : `btn-delete-row-${i}`}
                          onClick={() => handleDeleteRecord(r)}
                          className="p-1 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Record from Supabase"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredRecords.length > 100 && (
          <div className="text-center text-[11px] text-slate-400 border-t border-[#1E3E62]/60 pt-2">
            Showing first 100 of {filteredRecords.length} records. Filter or export to CSV to inspect full dataset.
          </div>
        )}
      </div>

      {/* QUICK EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card-gradient rounded-xl border border-amber-400/40 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E3E62] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-amber-400" />
                <span>Update Record in Supabase</span>
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded bg-[#071328] p-3 text-[11px] space-y-1 text-slate-300">
                <div>
                  <span className="text-slate-400">Record ID:</span>{" "}
                  <code className="text-amber-300 font-mono">{editingRecord.id}</code>
                </div>
                <div>
                  <span className="text-slate-400">Contract:</span>{" "}
                  <span className="font-bold text-white">{editingRecord.symbol}</span> &bull; Expiry:{" "}
                  <span className="font-mono text-white">{editingRecord.expiry_date}</span> &bull; Trade Date:{" "}
                  <span className="font-mono text-white">{editingRecord.trade_date}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Close Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editClosePrice}
                  onChange={(e) => setEditClosePrice(e.target.value)}
                  className="w-full rounded-lg bg-[#071328] border border-amber-400/50 px-3 py-2 text-amber-300 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Volume (Lots)</label>
                <input
                  type="number"
                  value={editVolume}
                  onChange={(e) => setEditVolume(e.target.value)}
                  className="w-full rounded-lg bg-[#071328] border border-[#1E3E62] px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E3E62]">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="rounded-lg bg-[#071328] px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 text-xs transition-colors disabled:opacity-50"
              >
                {isUpdating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Save to Supabase</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
