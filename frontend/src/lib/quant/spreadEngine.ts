import { BhavcopyRecord, CalendarSpreadResult, MarketRegime } from "../types";
import { GoldNormalizer } from "./normalizer";
import { DEFAULT_QUANT_CONFIG } from "./specs";

export class SpreadEngine {
  public static calculateSpread(
    leg1: BhavcopyRecord,
    leg2: BhavcopyRecord,
    repoRate: number = DEFAULT_QUANT_CONFIG.rbi_repo_rate,
    storageCost: number = DEFAULT_QUANT_CONFIG.annual_storage_cost,
    convenienceYield: number = DEFAULT_QUANT_CONFIG.convenience_yield,
    valuationDateStr?: string
  ): CalendarSpreadResult {
    const p1Norm = GoldNormalizer.normalizePrice(leg1.symbol, leg1.close);
    const p2Norm = GoldNormalizer.normalizePrice(leg2.symbol, leg2.close);

    const exp1 = new Date(leg1.expiry_date);
    const exp2 = new Date(leg2.expiry_date);
    const valDate = valuationDateStr ? new Date(valuationDateStr) : new Date(leg1.trade_date);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysToExp1 = Math.max(1, Math.round((exp1.getTime() - valDate.getTime()) / msPerDay));
    const daysToExp2 = Math.max(1, Math.round((exp2.getTime() - valDate.getTime()) / msPerDay));
    const deltaDays = Math.max(1, Math.round((exp2.getTime() - exp1.getTime()) / msPerDay));

    const spreadAbs = Math.round((p2Norm - p1Norm) * 100) / 100;
    const spreadPct = Math.round(((p2Norm / p1Norm) - 1.0) * 100000) / 1000;

    // Implied Annualized Carry Rate %
    const impliedCarryRatePct = Math.round(
      (spreadAbs / p1Norm) * (365.0 / deltaDays) * 10000
    ) / 100;

    // Cost of Carry Fair Value: F = P1 * exp((r + c - y) * dt)
    const dtYears = deltaDays / 365.0;
    const carryCostRate = repoRate + storageCost - convenienceYield;
    const fairPriceLeg2 = p1Norm * Math.exp(carryCostRate * dtYears);
    const fairSpread = Math.round((fairPriceLeg2 - p1Norm) * 100) / 100;
    const dislocation = Math.round((spreadAbs - fairSpread) * 100) / 100;
    const dislocationPct = fairSpread !== 0 ? Math.round((dislocation / fairSpread) * 10000) / 100 : 0;

    // Market Regime
    let regime: MarketRegime = "NORMAL_CONTANGO";
    let regimeDesc = "Normal Contango: Spread reflects typical financing & vaulted storage carrying costs.";
    let regimeColor = "amber";

    if (impliedCarryRatePct >= 9.5) {
      regime = "SUPER_CONTANGO";
      regimeDesc = "Super Contango: Implied carry yield significantly exceeds institutional risk-free hurdle.";
      regimeColor = "emerald";
    } else if (impliedCarryRatePct >= 4.0) {
      regime = "NORMAL_CONTANGO";
      regimeDesc = "Healthy Contango: Spread reflects standard Indian money-market carrying costs.";
      regimeColor = "amber";
    } else if (impliedCarryRatePct >= 0.0) {
      regime = "FLAT_CARRY";
      regimeDesc = "Compressed Carry: Minimal premium for holding inventory into deferred expiry.";
      regimeColor = "yellow";
    } else if (impliedCarryRatePct >= -5.0) {
      regime = "MODERATE_BACKWARDATION";
      regimeDesc = "Backwardation: Near month trades at a premium due to prompt physical demand.";
      regimeColor = "orange";
    } else {
      regime = "EXTREME_BACKWARDATION";
      regimeDesc = "Severe Backwardation: Physical delivery squeeze or acute physical gold scarcity.";
      regimeColor = "rose";
    }

    const inTenderPeriod = daysToExp1 <= DEFAULT_QUANT_CONFIG.tender_period_days;

    const pairKey = `${leg1.symbol}_${exp1.toLocaleString("en-US", { month: "short" }).toUpperCase()}${exp1.getFullYear().toString().slice(-2)}-${leg2.symbol}_${exp2.toLocaleString("en-US", { month: "short" }).toUpperCase()}${exp2.getFullYear().toString().slice(-2)}`;

    return {
      pair_key: pairKey,
      valuation_date: valDate.toISOString().slice(0, 10),
      
      leg1_symbol: leg1.symbol,
      leg1_expiry: leg1.expiry_date,
      leg1_raw_price: leg1.close,
      leg1_norm_price: p1Norm,
      leg1_oi: leg1.open_interest,
      leg1_volume: leg1.volume_lots,
      days_to_leg1_expiry: daysToExp1,
      in_tender_period: inTenderPeriod,
      
      leg2_symbol: leg2.symbol,
      leg2_expiry: leg2.expiry_date,
      leg2_raw_price: leg2.close,
      leg2_norm_price: p2Norm,
      leg2_oi: leg2.open_interest,
      leg2_volume: leg2.volume_lots,
      days_to_leg2_expiry: daysToExp2,
      
      expiry_diff_days: deltaDays,
      spread_norm_abs: spreadAbs,
      spread_pct: spreadPct,
      implied_carry_rate_pct: impliedCarryRatePct,
      fair_spread_cost_of_carry: fairSpread,
      dislocation_abs: dislocation,
      dislocation_pct: dislocationPct,
      z_score: 0.0, // calculated from series or signal engine
      market_regime: regime,
      regime_description: regimeDesc,
      regime_color: regimeColor,
      
      action: "NO_TRADE",
      badge: "NO TRADE",
      badge_color: "slate",
      direction: "FLAT",
      status: "EQUILIBRIUM",
      primary_reason: "Awaiting Quantitative Filter",
      rejection_detail: null,
      friction_per_10g: 0,
      gross_expected_edge: 0,
      net_expected_edge: 0,
      thesis: "",
      confidence_score: 0,
    };
  }

  /**
   * Computes historical rolling mean, standard deviation, and Z-score with zero look-ahead bias.
   */
  public static computeRollingZScores(
    spreads: { date: string; spread: number }[],
    window: number = 20
  ): { date: string; spread: number; mean: number; std: number; zScore: number }[] {
    const result: { date: string; spread: number; mean: number; std: number; zScore: number }[] = [];

    for (let i = 0; i < spreads.length; i++) {
      // Zero look-ahead bias: calculate statistics using prior history up to current bar (or past window)
      const startIdx = Math.max(0, i - window + 1);
      const slice = spreads.slice(startIdx, i + 1).map((s) => s.spread);

      const mean = slice.reduce((acc, val) => acc + val, 0) / slice.length;
      const variance =
        slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (slice.length > 1 ? slice.length - 1 : 1);
      const std = Math.sqrt(variance) || 1.0;

      const currentSpread = spreads[i].spread;
      const zScore = Math.round(((currentSpread - mean) / std) * 100) / 100;

      result.push({
        date: spreads[i].date,
        spread: currentSpread,
        mean: Math.round(mean * 100) / 100,
        std: Math.round(std * 100) / 100,
        zScore,
      });
    }

    return result;
  }
}
