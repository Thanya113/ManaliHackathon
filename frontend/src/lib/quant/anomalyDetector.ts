import { AnomalyAlert, CalendarSpreadResult } from "../types";
import { DEFAULT_QUANT_CONFIG } from "./specs";

export class AnomalyDetector {
  public static detectAnomalies(spreadData: CalendarSpreadResult): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const zScore = spreadData.z_score;
    const spreadAbs = spreadData.spread_norm_abs;
    const carryRate = spreadData.implied_carry_rate_pct;
    const dislocation = spreadData.dislocation_abs;
    const daysToExp1 = spreadData.days_to_leg1_expiry;
    const oiLeg2 = spreadData.leg2_oi;
    const volLeg2 = spreadData.leg2_volume;

    // 1. Extreme Statistical Z-Score
    if (Math.abs(zScore) >= 2.5) {
      alerts.push({
        code: "STATISTICAL_EXTREME_Z",
        severity: "CRITICAL",
        title: `Extreme Statistical Divergence (|Z| = ${Math.abs(zScore).toFixed(2)})`,
        description: `The normalized spread is ${Math.abs(zScore).toFixed(2)} standard deviations from its rolling mean. Significant mean-reversion pressure expected.`,
        metric: `Z-Score: ${zScore >= 0 ? "+" : ""}${zScore.toFixed(2)}`,
      });
    } else if (Math.abs(zScore) >= DEFAULT_QUANT_CONFIG.entry_z_score) {
      alerts.push({
        code: "STATISTICAL_DIVERGENCE",
        severity: "MODERATE",
        title: `Statistical Divergence (|Z| = ${Math.abs(zScore).toFixed(2)})`,
        description: `Normalized spread has breached the statistical entry band threshold (|Z| >= ${DEFAULT_QUANT_CONFIG.entry_z_score}).`,
        metric: `Z-Score: ${zScore >= 0 ? "+" : ""}${zScore.toFixed(2)}`,
      });
    }

    // 2. Physical Backwardation in Gold Futures
    if (spreadAbs < -10.0) {
      alerts.push({
        code: "UNNATURAL_BACKWARDATION",
        severity: "HIGH",
        title: `Physical Backwardation Inversion (₹${spreadAbs.toFixed(2)}/10g)`,
        description:
          "Gold futures are inverted in backwardation (near month trading at a premium). Indicates acute physical spot tightness or refinery supply crunch.",
        metric: `Spread: ₹${spreadAbs}/10g | Carry: ${carryRate}% p.a.`,
      });
    }

    // 3. Super Contango Dislocation
    const hurdleRate = (DEFAULT_QUANT_CONFIG.rbi_repo_rate + DEFAULT_QUANT_CONFIG.annual_storage_cost) * 100 + 1.5;
    if (carryRate > hurdleRate + 2.0) {
      alerts.push({
        code: "SUPER_CONTANGO_CARRY_EDGE",
        severity: "INFO",
        title: `Super Contango Dislocation (${carryRate.toFixed(2)}% p.a.)`,
        description: `Implied annualized carry (${carryRate.toFixed(2)}%) comfortably clears institutional repo financing and storage hurdle (${hurdleRate.toFixed(2)}%). Cash-and-carry roll edge present.`,
        metric: `Dislocation: +₹${dislocation.toFixed(2)}/10g`,
      });
    }

    // 4. Tender Period Delivery Risk
    if (daysToExp1 <= DEFAULT_QUANT_CONFIG.tender_period_days) {
      alerts.push({
        code: "TENDER_PERIOD_PHYSICAL_RISK",
        severity: "CRITICAL",
        title: `Tender Delivery Notice Active (${daysToExp1} days left)`,
        description: `Front month contract is inside the ${DEFAULT_QUANT_CONFIG.tender_period_days}-day physical delivery tender window. Compulsory delivery rules and stepped margin hikes apply.`,
        metric: `Days to Expiry: ${daysToExp1}`,
      });
    }

    // 5. Far Leg Liquidity Squeeze
    if (oiLeg2 < DEFAULT_QUANT_CONFIG.min_next_oi || volLeg2 < DEFAULT_QUANT_CONFIG.min_daily_volume) {
      alerts.push({
        code: "FAR_LEG_LIQUIDITY_DEFICIT",
        severity: "HIGH",
        title: "Liquidity Deficit in Deferred Leg",
        description: `Deferred contract open interest (${oiLeg2} lots) or daily turnover (${volLeg2} lots) is below safety buffers. Spread orders risk severe execution slippage.`,
        metric: `OI: ${oiLeg2} lots | Vol: ${volLeg2} lots`,
      });
    }

    return alerts;
  }
}
