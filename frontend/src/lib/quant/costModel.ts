import { MCXSymbol, TransactionCostBreakdown } from "../types";
import { MCX_GOLD_SPECS } from "./specs";

export class CostModel {
  public static readonly MCX_TURNOVER_FEE_PCT = 0.000021; // 0.0021% (₹210 per crore)
  public static readonly CTT_PCT = 0.0001; // 0.01% Commodity Transaction Tax (sell side)
  public static readonly GST_PCT = 0.18; // 18% GST on brokerage + exchange fee
  public static readonly STAMP_DUTY_PCT = 0.00002; // 0.002% on buy turnover
  public static readonly SEBI_FEE_PCT = 0.000001; // ₹10 per crore

  /**
   * Computes complete institutional round-trip transaction costs for a 2-legged calendar/cross spread.
   * Spread involves 4 total order executions:
   * Leg 1: Entry + Exit (Buy + Sell)
   * Leg 2: Entry + Exit (Sell + Buy)
   */
  public static calculateRoundTripCosts(
    price1Norm: number,
    price2Norm: number,
    lotType: MCXSymbol = "GOLD",
    brokeragePerOrder: number = 20.0,
    slippageTicks: number = 1
  ): TransactionCostBreakdown {
    const spec = MCX_GOLD_SPECS[lotType] || MCX_GOLD_SPECS.GOLD;
    const lotMultiplier = spec.lot_multiplier; // 100 for GOLD, 10 for GOLDM

    const avgPrice = (price1Norm + price2Norm) / 2.0;
    const notionalPerLot = avgPrice * lotMultiplier;

    // 1. Brokerage: 4 orders
    const totalBrokerage = brokeragePerOrder * 4.0;
    const brokeragePer10g = totalBrokerage / lotMultiplier;

    // 2. MCX Turnover Charges: 4 executions * notional
    const totalTurnover = notionalPerLot * 4.0;
    const mcxExchangeFee = totalTurnover * this.MCX_TURNOVER_FEE_PCT;
    const exchangeFeePer10g = mcxExchangeFee / lotMultiplier;

    // 3. Commodity Transaction Tax (CTT): 2 sell orders
    const sellTurnover = notionalPerLot * 2.0;
    const ctt = sellTurnover * this.CTT_PCT;
    const cttPer10g = ctt / lotMultiplier;

    // 4. Stamp Duty: 2 buy orders
    const buyTurnover = notionalPerLot * 2.0;
    const stampDuty = buyTurnover * this.STAMP_DUTY_PCT;
    const stampDutyPer10g = stampDuty / lotMultiplier;

    // 5. GST: 18% on (Brokerage + Exchange Fees)
    const taxableServices = totalBrokerage + mcxExchangeFee;
    const gst = taxableServices * this.GST_PCT;
    const gstPer10g = gst / lotMultiplier;

    // 6. SEBI Fee: ₹10 per crore
    const sebiFee = totalTurnover * this.SEBI_FEE_PCT;
    const sebiPer10g = sebiFee / lotMultiplier;

    // 7. Slippage Proxy: slippageTicks per execution (4 executions)
    // 1 tick = ₹1.00 per 10g
    const slippagePer10g = slippageTicks * 4.0 * 1.0;
    const totalSlippageInr = slippagePer10g * lotMultiplier;

    // Aggregates
    const statutoryAndBrokerageInr = Math.round(
      (mcxExchangeFee + ctt + stampDuty + gst + sebiFee + totalBrokerage) * 100
    ) / 100;
    const totalFrictionInr = Math.round((statutoryAndBrokerageInr + totalSlippageInr) * 100) / 100;
    const totalFrictionPer10g = Math.round(
      (brokeragePer10g + exchangeFeePer10g + cttPer10g + stampDutyPer10g + gstPer10g + sebiPer10g + slippagePer10g) * 100
    ) / 100;

    return {
      lot_symbol: spec.symbol,
      lot_multiplier: lotMultiplier,
      notional_per_lot: Math.round(notionalPerLot * 100) / 100,
      brokerage_inr: Math.round(totalBrokerage * 100) / 100,
      exchange_fee_inr: Math.round(mcxExchangeFee * 100) / 100,
      ctt_inr: Math.round(ctt * 100) / 100,
      stamp_duty_inr: Math.round(stampDuty * 100) / 100,
      gst_inr: Math.round(gst * 100) / 100,
      sebi_inr: Math.round(sebiFee * 100) / 100,
      slippage_inr: Math.round(totalSlippageInr * 100) / 100,
      statutory_and_brokerage_inr: statutoryAndBrokerageInr,
      total_friction_inr: totalFrictionInr,
      friction_per_10g: totalFrictionPer10g,
      statutory_pct_of_turnover: Math.round((statutoryAndBrokerageInr / totalTurnover) * 10000) / 100,
    };
  }
}
