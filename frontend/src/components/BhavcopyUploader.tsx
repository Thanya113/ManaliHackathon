"use client";

import React, { useState } from "react";
import { BhavcopyParser } from "../lib/quant/bhavcopy";
import { StorageService } from "../lib/supabase/service";
import { BhavcopyRecord } from "../types";
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Database,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface BhavcopyUploaderProps {
  onIngestionComplete?: (records: BhavcopyRecord[]) => void;
}

export const BhavcopyUploader: React.FC<BhavcopyUploaderProps> = ({ onIngestionComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    records: BhavcopyRecord[];
    errors: string[];
    summary: { total: number; valid: number; skipped: number };
  } | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setSavedCount(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parsed = BhavcopyParser.parseCSV(text);
      setParseResult(parsed);

      if (parsed.records.length > 0) {
        const { saved } = await StorageService.saveMarketData(parsed.records);
        setSavedCount(saved);
        if (onIngestionComplete) onIngestionComplete(parsed.records);
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const loadSampleDataset = async () => {
    setIsProcessing(true);
    setSavedCount(null);

    const sample = BhavcopyParser.getVerifiedHistoricalDataset();
    const { saved } = await StorageService.saveMarketData(sample);
    setSavedCount(saved);
    setParseResult({
      records: sample,
      errors: [],
      summary: { total: sample.length, valid: sample.length, skipped: 0 },
    });

    if (onIngestionComplete) onIngestionComplete(sample);
    setIsProcessing(false);
  };

  return (
    <div className="card-gradient rounded-xl border border-[#1E3E62] p-5 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E3E62]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Public MCX Bhavcopy Ingestion Engine</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload daily Bhavcopy CSV or load verified multi-month historical MCX Gold dataset
          </p>
        </div>

        <button
          onClick={loadSampleDataset}
          disabled={isProcessing}
          className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Load Verified MCX Gold Archive</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          dragActive
            ? "border-amber-400 bg-amber-500/10"
            : "border-[#1E3E62] hover:border-amber-400/50 bg-[#071328]/60"
        }`}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
        <div className="mt-3 text-sm font-semibold text-white">
          Drop your public MCX Bhavcopy CSV file here
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Supported symbols: <span className="text-amber-400 font-semibold">GOLD, GOLDM, GOLDGUINEA, GOLDPETAL</span>
        </p>

        <label className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0F2647] px-4 py-2 text-xs font-semibold text-slate-200 border border-[#1E3E62] hover:bg-[#17355B] cursor-pointer transition-colors">
          <span>Browse File from Computer</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
        </label>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-xs text-amber-400 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Ingesting, normalizing purity, and validating Bhavcopy records...</span>
        </div>
      )}

      {/* Ingestion Results Feedback */}
      {parseResult && (
        <div className="rounded-xl border border-[#1E3E62] bg-[#071328]/80 p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              Ingestion Validation Summary
            </span>
            {savedCount !== null && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Successfully Persisted {savedCount} Records
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 rounded bg-[#0B1E38] border border-[#1E3E62]">
              <span className="text-slate-400 block text-[11px]">Total Rows Read</span>
              <span className="font-mono text-sm font-bold text-white">{parseResult.summary.total}</span>
            </div>
            <div className="p-2.5 rounded bg-[#0B1E38] border border-[#1E3E62]">
              <span className="text-slate-400 block text-[11px]">Valid MCX Gold Records</span>
              <span className="font-mono text-sm font-bold text-emerald-400">{parseResult.summary.valid}</span>
            </div>
            <div className="p-2.5 rounded bg-[#0B1E38] border border-[#1E3E62]">
              <span className="text-slate-400 block text-[11px]">Skipped Non-Gold Rows</span>
              <span className="font-mono text-sm font-bold text-slate-400">{parseResult.summary.skipped}</span>
            </div>
          </div>

          {parseResult.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] space-y-1">
              <span className="font-semibold flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Validation Warnings:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                {parseResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
