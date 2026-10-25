import { CalendarSpreadResult, TransactionCostBreakdown } from "../types";
import { CostModel } from "./costModel";
import { DEFAULT_QUANT_CONFIG, MCX_GOLD_SPECS } from "./specs";
import { TinyFishEvidenceAgent } from "./tinyfish";

export class SignalEngine {
  private static finalizeSignal(updated: CalendarSpreadResult): CalendarSpreadResult {
    const c1 = MCX_GOLD_SPECS[updated.leg1_symbol];
    const c2 = MCX_GOLD_SPECS[updated.leg2_symbol];
    updated.is_trade_candidate = updated.action === "LONG_SPREAD" || updated.action === "SHORT_SPREAD";
    if (c1 && c2) {
      updated.audit_trail = TinyFishEvidenceAgent.buildAuditTrail(updated, c1, c2);
      updated.evidence_ids = updated.audit_trail.verified_source_facts.map((f) => f.id);
    }
    return updated;
  }

  public static evaluateSignal(
    spreadData: CalendarSpreadResult,
    zScore: number,
    brokeragePerOrder: number = 20.0,
    slippageTicks: number = 1
  ): CalendarSpreadResult {
    const updated = { ...spreadData, z_score: zScore };
    const costBreakdown: TransactionCostBreakdown = CostModel.calculateRoundTripCosts(
      spreadData.leg1_norm_price,
      spreadData.leg2_norm_price,
      spreadData.leg1_symbol,
      brokeragePerOrder,
      slippageTicks
    );

    updated.costs = costBreakdown;
    const frictionPer10g = costBreakdown.friction_per_10g;
    updated.friction_per_10g = frictionPer10g;
    const minHurdle = frictionPer10g * DEFAULT_QUANT_CONFIG.friction_hurdle_multiplier;

    // Filter 1: Tender Delivery Window Check
    if (spreadData.in_tender_period) {
      updated.action = "NO_TRADE";
      updated.badge = "NO TRADE";
      updated.badge_color = "slate";
      updated.direction = "FLAT";
      updated.status = "REJECTED_RISK";
      updated.primary_reason = "Tender Notice Delivery Window Active";
      updated.rejection_detail = `Leg 1 is within ${spreadData.days_to_leg1_expiry} days of contract expiry (tender window). Physical delivery settlement intentions and stepped margin hikes prohibit initiating new calendar spread positions.`;
      updated.gross_expected_edge = 0.0;
      updated.net_expected_edge = 0.0;
      updated.thesis = "Safety Guardrail: Execution blocked due to physical delivery tender period proximity.";
      updated.confidence_score = 0;
      return this.finalizeSignal(updated);
    }


    // Filter 2: Liquidity Buffer Check
    if (spreadData.leg2_oi < DEFAULT_QUANT_CONFIG.min_next_oi) {
      updated.action = "NO_TRADE";
      updated.badge = "NO TRADE";
      updated.badge_color = "slate";
      updated.direction = "FLAT";
      updated.status = "REJECTED_LIQUIDITY";
      updated.primary_reason = `Insufficient Open Interest in Deferred Leg (${spreadData.leg2_oi} lots)`;
      updated.rejection_detail = `Deferred month open interest (${spreadData.leg2_oi} lots) is below the minimum liquidity requirement (${DEFAULT_QUANT_CONFIG.min_next_oi} lots). Trading in illiquid deferred expiries carries adverse bid-ask slippage.`;
      updated.gross_expected_edge = 0.0;
      updated.net_expected_edge = 0.0;
      updated.thesis = "Safety Guardrail: Low market depth prevents reliable two-way order execution.";
      updated.confidence_score = 0;
      return this.finalizeSignal(updated);
    }

    const dislocation = spreadData.dislocation_abs;
    const spreadAbs = spreadData.spread_norm_abs;

    // Signal Case 1: SHORT SPREAD (Overpriced Spread / Super Contango Collapse)
    // Sell Leg 2 (Deferred), Buy Leg 1 (Near). Expect spread to narrow towards fair value.
    if (zScore >= DEFAULT_QUANT_CONFIG.entry_z_score && dislocation > 0) {
      const grossEdge = Math.round(dislocation * 100) / 100;
      const netEdge = Math.round((grossEdge - frictionPer10g) * 100) / 100;

      if (netEdge < minHurdle) {
        updated.action = "NO_TRADE";
        updated.badge = "NO TRADE";
        updated.badge_color = "slate";
        updated.direction = "FLAT";
        updated.status = "REJECTED_FRICTION";
        updated.primary_reason = `Expected Edge (₹${grossEdge.toFixed(2)}/10g) Below Cost Hurdle (₹${minHurdle.toFixed(2)}/10g)`;
        updated.rejection_detail = `Although spread Z-Score is elevated (+${zScore.toFixed(2)}σ), gross edge of ₹${grossEdge}/10g fails to clear the required 2x total friction hurdle of ₹${minHurdle}/10g (institutional brokerage + CTT + GST + slippage = ₹${frictionPer10g}/10g).`;
        updated.gross_expected_edge = grossEdge;
        updated.net_expected_edge = netEdge;
        updated.thesis = "Sub-economic edge: Round-trip statutory and slippage frictions exceed the expected statistical alpha.";
        updated.confidence_score = 25;
        return this.finalizeSignal(updated);
      }

      updated.action = "SHORT_SPREAD";
      updated.badge = "TRADE CANDIDATE: SHORT SPREAD";
      updated.badge_color = "rose";
      updated.direction = "SELL_DEFERRED_BUY_FRONT";
      updated.status = "ACTIONABLE";
      updated.primary_reason = `Spread Overpriced (+${zScore.toFixed(2)}σ above 20d mean)`;
      updated.rejection_detail = null;
      updated.gross_expected_edge = grossEdge;
      updated.net_expected_edge = netEdge;
      updated.entry_spread = spreadAbs;
      updated.target_spread = spreadData.fair_spread_cost_of_carry;
      updated.stop_spread = Math.round((spreadAbs + frictionPer10g * 1.5) * 100) / 100;
      updated.thesis = `Implied carry rate (${spreadData.implied_carry_rate_pct}% p.a.) trades well above theoretical cost of carry. Quantitative thesis: Sell ${spreadData.leg2_symbol} (${spreadData.leg2_expiry}) and Buy ${spreadData.leg1_symbol} (${spreadData.leg1_expiry}) targeting spread compression to fair value.`;
      updated.confidence_score = Math.min(95, Math.round(70 + (Math.abs(zScore) - 1.8) * 15));
      return this.finalizeSignal(updated);
    }

    // Signal Case 2: LONG SPREAD (Underpriced Spread / Backwardation Reversion)
    // Buy Leg 2 (Deferred), Sell Leg 1 (Near). Expect spread to widen towards fair carry.
    if (zScore <= -DEFAULT_QUANT_CONFIG.entry_z_score && dislocation < 0) {
      const grossEdge = Math.round(Math.abs(dislocation) * 100) / 100;
      const netEdge = Math.round((grossEdge - frictionPer10g) * 100) / 100;

      if (netEdge < minHurdle) {
        updated.action = "NO_TRADE";
        updated.badge = "NO TRADE";
        updated.badge_color = "slate";
        updated.direction = "FLAT";
        updated.status = "REJECTED_FRICTION";
        updated.primary_reason = `Expected Edge (₹${grossEdge.toFixed(2)}/10g) Below Cost Hurdle (₹${minHurdle.toFixed(2)}/10g)`;
        updated.rejection_detail = `Depressed Z-Score (${zScore.toFixed(2)}σ) offers ₹${grossEdge}/10g gross edge, failing to surpass required friction hurdle of ₹${minHurdle}/10g.`;
        updated.gross_expected_edge = grossEdge;
        updated.net_expected_edge = netEdge;
        updated.thesis = "Sub-economic edge: Statistical dislocation does not sufficiently compensate for exchange friction.";
        updated.confidence_score = 25;
        return this.finalizeSignal(updated);
      }

      updated.action = "LONG_SPREAD";
      updated.badge = "TRADE CANDIDATE: LONG SPREAD";
      updated.badge_color = "emerald";
      updated.direction = "BUY_DEFERRED_SELL_FRONT";
      updated.status = "ACTIONABLE";
      updated.primary_reason = `Spread Underpriced (${zScore.toFixed(2)}σ below 20d mean)`;
      updated.rejection_detail = null;
      updated.gross_expected_edge = grossEdge;
      updated.net_expected_edge = netEdge;
      updated.entry_spread = spreadAbs;
      updated.target_spread = spreadData.fair_spread_cost_of_carry;
      updated.stop_spread = Math.round((spreadAbs - frictionPer10g * 1.5) * 100) / 100;
      updated.thesis = `Normalized spread (₹${spreadAbs}/10g, ${spreadData.implied_carry_rate_pct}% carry) is compressed below theoretical carry. Quantitative thesis: Buy ${spreadData.leg2_symbol} (${spreadData.leg2_expiry}) and Sell ${spreadData.leg1_symbol} (${spreadData.leg1_expiry}) targeting expansion back to carry equilibrium.`;
      updated.confidence_score = Math.min(95, Math.round(70 + (Math.abs(zScore) - 1.8) * 15));
      return this.finalizeSignal(updated);
    }

    // Default Equilibrium: NO TRADE
    updated.action = "NO_TRADE";
    updated.badge = "NO TRADE";
    updated.badge_color = "slate";
    updated.direction = "FLAT";
    updated.status = "EQUILIBRIUM";
    updated.primary_reason = `Market Spread Within Equilibrium Band (Z = ${zScore >= 0 ? "+" : ""}${zScore.toFixed(2)})`;
    updated.rejection_detail = `Normalized spread (₹${spreadAbs}/10g) trades within normal statistical variation (|Z| < ${DEFAULT_QUANT_CONFIG.entry_z_score}). No statistically significant or risk-adjusted relative-value arbitrage edge exists.`;
    updated.gross_expected_edge = 0.0;
    updated.net_expected_edge = 0.0;
    updated.thesis = "Market pricing is consistent with fair carry; standing aside in cash.";
    updated.confidence_score = 10;
    return this.finalizeSignal(updated);
  }
}

