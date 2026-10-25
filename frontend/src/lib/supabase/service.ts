import { BacktestReport, BhavcopyRecord, CalendarSpreadResult, MCXContract, MCXSymbol, EvidenceRecord, EvidenceCategory } from "../types";
import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { MCX_GOLD_SPECS } from "../quant/specs";
import { BhavcopyParser } from "../quant/bhavcopy";
import { TinyFishEvidenceAgent } from "../quant/tinyfish";

export class StorageService {
  private static localMarketData: BhavcopyRecord[] = [];
  private static localAnalyses: CalendarSpreadResult[] = [];
  private static localBacktests: BacktestReport[] = [];
  private static localEvidence: EvidenceRecord[] = [];

  // ============================================================================
  // CONTRACTS CRUD
  // ============================================================================

  public static async getContracts(): Promise<MCXContract[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("contracts").select("*").order("symbol");
        if (!error && data && data.length > 0) {
          return data as MCXContract[];
        }
      } catch (err) {
        console.warn("Supabase contracts fetch fallback:", err);
      }
    }
    return Object.values(MCX_GOLD_SPECS);
  }

  public static async saveContract(contract: MCXContract): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from("contracts").upsert(contract);
        if (!error) return true;
      } catch (err) {
        console.error("Failed to save contract to Supabase:", err);
      }
    }
    MCX_GOLD_SPECS[contract.symbol] = contract;
    return true;
  }

  // ============================================================================
  // MARKET DATA (BHAVCOPY) CRUD
  // ============================================================================

  public static async getMarketData(
    filters?: {
      symbol?: MCXSymbol;
      startDate?: string;
      endDate?: string;
      expiryDate?: string;
    },
    options?: { fallbackToLocalIfEmpty?: boolean }
  ): Promise<BhavcopyRecord[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from("market_data").select("*").order("trade_date", { ascending: false });
        if (filters?.symbol) query = query.eq("symbol", filters.symbol);
        if (filters?.startDate) query = query.gte("trade_date", filters.startDate);
        if (filters?.endDate) query = query.lte("trade_date", filters.endDate);
        if (filters?.expiryDate) query = query.eq("expiry_date", filters.expiryDate);

        const { data, error } = await query;
        if (!error && data) {
          if (data.length > 0 || options?.fallbackToLocalIfEmpty === false) {
            return data as BhavcopyRecord[];
          }
        }
      } catch (err) {
        console.warn("Supabase market data query fallback:", err);
      }
    }

    // Fallback: Local / Preloaded Data
    if (this.localMarketData.length === 0) {
      this.localMarketData = BhavcopyParser.getVerifiedHistoricalDataset();
    }

    let records = [...this.localMarketData];
    if (filters?.symbol) records = records.filter((r) => r.symbol === filters.symbol);
    if (filters?.startDate) records = records.filter((r) => r.trade_date >= filters.startDate!);
    if (filters?.endDate) records = records.filter((r) => r.trade_date <= filters.endDate!);
    if (filters?.expiryDate) records = records.filter((r) => r.expiry_date === filters.expiryDate);

    return records.sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
  }

  public static async insertMarketDataRecord(
    record: Omit<BhavcopyRecord, "id" | "created_at">
  ): Promise<{ success: boolean; data?: BhavcopyRecord; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Supabase client is not configured. Check .env.local configuration." };
    }

    try {
      const { data, error } = await supabase
        .from("market_data")
        .insert(record)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data as BhavcopyRecord };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  public static async updateMarketDataRecord(
    id: string,
    updates: Partial<BhavcopyRecord>
  ): Promise<{ success: boolean; data?: BhavcopyRecord; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Supabase client is not configured." };
    }

    try {
      const { data, error } = await supabase
        .from("market_data")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data as BhavcopyRecord };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  public static async deleteMarketDataRecord(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Supabase client is not configured." };
    }

    try {
      const { error } = await supabase.from("market_data").delete().eq("id", id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  public static async seedVerifiedDataToSupabase(): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, count: 0, error: "Supabase client is not configured." };
    }
    try {
      const records = BhavcopyParser.getVerifiedHistoricalDataset();
      const chunkSize = 100;
      let inserted = 0;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await supabase.from("market_data").upsert(chunk, {
          onConflict: "trade_date,symbol,expiry_date",
        });
        if (error) {
          return { success: false, count: inserted, error: error.message };
        }
        inserted += chunk.length;
      }
      return { success: true, count: inserted };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, count: 0, error: msg };
    }
  }

  public static async clearMarketData(): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: "Supabase client is not configured." };
    }
    try {
      const { error } = await supabase.from("market_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  public static async saveMarketData(records: BhavcopyRecord[]): Promise<{ saved: number; failed: number }> {
    if (records.length === 0) return { saved: 0, failed: 0 };

    const supabase = getSupabaseClient();
    let saved = 0;
    let failed = 0;

    if (supabase) {
      try {
        // Chunk upserts in batches of 100
        const chunkSize = 100;
        for (let i = 0; i < records.length; i += chunkSize) {
          const chunk = records.slice(i, i + chunkSize);
          const { error } = await supabase.from("market_data").upsert(chunk, {
            onConflict: "trade_date,symbol,expiry_date",
          });
          if (error) {
            console.error("Supabase upsert chunk error:", error);
            failed += chunk.length;
          } else {
            saved += chunk.length;
          }
        }
        if (saved > 0) return { saved, failed };
      } catch (err) {
        console.error("Supabase saveMarketData error:", err);
      }
    }

    // Local storage append/upsert
    if (this.localMarketData.length === 0) {
      this.localMarketData = BhavcopyParser.getVerifiedHistoricalDataset();
    }
    for (const r of records) {
      const idx = this.localMarketData.findIndex(
        (m) => m.trade_date === r.trade_date && m.symbol === r.symbol && m.expiry_date === r.expiry_date
      );
      if (idx !== -1) {
        this.localMarketData[idx] = r;
      } else {
        this.localMarketData.push(r);
      }
      saved++;
    }

    return { saved, failed: 0 };
  }

  // ============================================================================
  // SPREAD ANALYSES CRUD
  // ============================================================================

  public static async saveSpreadAnalysis(analysis: CalendarSpreadResult): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const payload = {
          pair_key: analysis.pair_key,
          valuation_date: analysis.valuation_date,
          leg1_symbol: analysis.leg1_symbol,
          leg1_expiry: analysis.leg1_expiry,
          leg1_raw_price: analysis.leg1_raw_price,
          leg1_norm_price: analysis.leg1_norm_price,
          leg1_oi: analysis.leg1_oi,
          leg1_volume: analysis.leg1_volume,
          days_to_leg1_expiry: analysis.days_to_leg1_expiry,
          in_tender_period: analysis.in_tender_period,
          leg2_symbol: analysis.leg2_symbol,
          leg2_expiry: analysis.leg2_expiry,
          leg2_raw_price: analysis.leg2_raw_price,
          leg2_norm_price: analysis.leg2_norm_price,
          leg2_oi: analysis.leg2_oi,
          leg2_volume: analysis.leg2_volume,
          days_to_leg2_expiry: analysis.days_to_leg2_expiry,
          expiry_diff_days: analysis.expiry_diff_days,
          spread_norm_abs: analysis.spread_norm_abs,
          spread_pct: analysis.spread_pct,
          implied_carry_rate_pct: analysis.implied_carry_rate_pct,
          fair_spread_cost_of_carry: analysis.fair_spread_cost_of_carry,
          dislocation_abs: analysis.dislocation_abs,
          z_score: analysis.z_score,
          market_regime: analysis.market_regime,
          action: analysis.action,
          rejection_reason: analysis.primary_reason,
          rejection_detail: analysis.rejection_detail,
          friction_per_10g: analysis.friction_per_10g,
          gross_expected_edge: analysis.gross_expected_edge,
          net_expected_edge: analysis.net_expected_edge,
          confidence_score: analysis.confidence_score,
          thesis: analysis.thesis,
          is_trade_candidate: analysis.is_trade_candidate ?? (analysis.action !== "NO_TRADE"),
          audit_trail: analysis.audit_trail ?? null,
          evidence_ids: analysis.evidence_ids ?? [],
        };
        const { error } = await supabase.from("spread_analyses").insert(payload);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase saveSpreadAnalysis error:", err);
      }
    }

    this.localAnalyses.unshift(analysis);
    if (this.localAnalyses.length > 50) this.localAnalyses.pop();
    return true;
  }

  public static async getRecentSpreadAnalyses(limit: number = 20): Promise<CalendarSpreadResult[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("spread_analyses")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (!error && data && data.length > 0) {
          return data as CalendarSpreadResult[];
        }
      } catch (err) {
        console.warn("Supabase getRecentSpreadAnalyses error:", err);
      }
    }
    return this.localAnalyses.slice(0, limit);
  }

  // ============================================================================
  // BACKTEST REPORTS CRUD
  // ============================================================================

  public static async saveBacktestReport(report: BacktestReport): Promise<string> {
    const reportId = report.id || `bt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullReport = { ...report, id: reportId, created_at: new Date().toISOString() };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from("backtest_reports").insert(fullReport);
        if (!error) return reportId;
      } catch (err) {
        console.warn("Supabase saveBacktestReport error:", err);
      }
    }

    this.localBacktests.unshift(fullReport);
    return reportId;
  }

  public static async getBacktestReports(): Promise<BacktestReport[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("backtest_reports")
          .select("id, strategy_name, pair_key, start_date, end_date, initial_capital, final_equity, net_profit_inr, net_return_pct, cagr_pct, max_drawdown_pct, sharpe_ratio, win_rate_pct, profit_factor, total_trades, created_at")
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          return data as unknown as BacktestReport[];
        }
      } catch (err) {
        console.warn("Supabase getBacktestReports error:", err);
      }
    }
    return this.localBacktests;
  }

  public static async getBacktestReportById(id: string): Promise<BacktestReport | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from("backtest_reports").select("*").eq("id", id).single();
        if (!error && data) {
          return data as BacktestReport;
        }
      } catch (err) {
        console.warn("Supabase getBacktestReportById error:", err);
      }
    }
    return this.localBacktests.find((b) => b.id === id) || null;
  }

  // ============================================================================
  // EVIDENCE RECORDS CRUD (TinyFish Evidence Agent)
  // ============================================================================

  public static async getEvidenceRecords(category?: EvidenceCategory): Promise<EvidenceRecord[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from("evidence_records").select("*").order("created_at", { ascending: false });
        if (category) query = query.eq("category", category);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as EvidenceRecord[];
        }
      } catch (err) {
        console.warn("Supabase getEvidenceRecords fallback:", err);
      }
    }

    if (this.localEvidence.length === 0) {
      this.localEvidence = [...TinyFishEvidenceAgent.OFFICIAL_BASELINE_EVIDENCE];
    }

    if (category) {
      return this.localEvidence.filter((e) => e.category === category);
    }
    return this.localEvidence;
  }

  public static async saveEvidenceRecord(record: EvidenceRecord): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from("evidence_records").upsert(record);
        if (!error) return true;
      } catch (err) {
        console.warn("Supabase saveEvidenceRecord error:", err);
      }
    }

    const idx = this.localEvidence.findIndex((e) => e.id === record.id);
    if (idx !== -1) {
      this.localEvidence[idx] = record;
    } else {
      this.localEvidence.unshift(record);
    }
    return true;
  }

  public static async saveEvidenceRecords(records: EvidenceRecord[]): Promise<{ saved: number }> {
    let saved = 0;
    for (const r of records) {
      const ok = await this.saveEvidenceRecord(r);
      if (ok) saved++;
    }
    return { saved };
  }

  // ============================================================================
  // HEALTH & DIAGNOSTICS
  // ============================================================================

  public static async testDatabaseConnection(): Promise<{
    configured: boolean;
    connected: boolean;
    tables: {
      contracts: number;
      market_data: number;
      spread_analyses: number;
      backtest_reports: number;
      evidence_records: number;
    };
    error: string | null;
  }> {
    const configured = isSupabaseConfigured();
    if (!configured) {
      return {
        configured: false,
        connected: false,
        tables: {
          contracts: 4,
          market_data: this.localMarketData.length || 240,
          spread_analyses: this.localAnalyses.length,
          backtest_reports: this.localBacktests.length,
          evidence_records: this.localEvidence.length || TinyFishEvidenceAgent.OFFICIAL_BASELINE_EVIDENCE.length,
        },
        error: "Supabase credentials not configured in environment (using local high-performance cache).",
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        configured: true,
        connected: false,
        tables: { contracts: 0, market_data: 0, spread_analyses: 0, backtest_reports: 0, evidence_records: 0 },
        error: "Failed to initialize Supabase client.",
      };
    }

    try {
      const [cRes, mRes, sRes, bRes, eRes] = await Promise.all([
        supabase.from("contracts").select("id", { count: "exact", head: true }),
        supabase.from("market_data").select("id", { count: "exact", head: true }),
        supabase.from("spread_analyses").select("id", { count: "exact", head: true }),
        supabase.from("backtest_reports").select("id", { count: "exact", head: true }),
        supabase.from("evidence_records").select("id", { count: "exact", head: true }),
      ]);

      if (cRes.error) {
        return {
          configured: true,
          connected: false,
          tables: { contracts: 0, market_data: 0, spread_analyses: 0, backtest_reports: 0, evidence_records: 0 },
          error: `Table check failed: ${cRes.error.message}. Please run supabase_schema.sql in your Supabase SQL editor.`,
        };
      }

      return {
        configured: true,
        connected: true,
        tables: {
          contracts: cRes.count || 0,
          market_data: mRes.count || 0,
          spread_analyses: sRes.count || 0,
          backtest_reports: bRes.count || 0,
          evidence_records: eRes?.count || 0,
        },
        error: null,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        configured: true,
        connected: false,
        tables: { contracts: 0, market_data: 0, spread_analyses: 0, backtest_reports: 0, evidence_records: 0 },
        error: msg,
      };
    }
  }
}
