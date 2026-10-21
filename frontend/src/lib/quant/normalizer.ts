import { MCXSymbol } from "../types";
import { MCX_GOLD_SPECS } from "./specs";

export class GoldNormalizer {
  public static readonly BENCHMARK_GRAMS = 10.0;
  public static readonly BENCHMARK_PURITY = 995;

  /**
   * Multiplier to convert raw contract quote into standardized ₹/10g @ 995 purity.
   * Formula:
   *   Factor = (10.0 / quotation_unit_grams) * (995 / contract_purity)
   */
  public static getNormalizationFactor(symbol: MCXSymbol): number {
    const spec = MCX_GOLD_SPECS[symbol];
    if (!spec) {
      throw new Error(`Unknown MCX contract symbol: ${symbol}`);
    }
    const weightMult = this.BENCHMARK_GRAMS / spec.quotation_unit_grams;
    const purityMult = this.BENCHMARK_PURITY / spec.purity_fineness;
    return weightMult * purityMult;
  }

  /**
   * Convert raw contract quotation to normalized benchmark: ₹ per 10 grams @ 995 purity.
   */
  public static normalizePrice(symbol: MCXSymbol, rawPrice: number): number {
    if (rawPrice <= 0) {
      throw new Error(`Raw price must be positive, got ${rawPrice}`);
    }
    const factor = this.getNormalizationFactor(symbol);
    return Math.round(rawPrice * factor * 100) / 100;
  }

  /**
   * Convert normalized benchmark price back to specific contract quotation price.
   */
  public static denormalizePrice(symbol: MCXSymbol, normalizedPrice: number): number {
    if (normalizedPrice <= 0) {
      throw new Error(`Normalized price must be positive, got ${normalizedPrice}`);
    }
    const factor = this.getNormalizationFactor(symbol);
    return Math.round((normalizedPrice / factor) * 100) / 100;
  }

  /**
   * Calculate total monetary value of 1 full contract lot in INR.
   */
  public static calculateLotValue(symbol: MCXSymbol, rawPrice: number): number {
    const spec = MCX_GOLD_SPECS[symbol];
    if (!spec) {
      throw new Error(`Unknown symbol: ${symbol}`);
    }
    return Math.round(spec.lot_multiplier * rawPrice * 100) / 100;
  }

  /**
   * Convert benchmark price to customized weight and purity (e.g. 24K, 22K jewellery, Tola).
   */
  public static convertCustom(
    pricePer10g995: number,
    targetGrams: number = 10.0,
    targetPurity: number = 995
  ) {
    const pricePerGram995 = pricePer10g995 / 10.0;
    const purePricePerGram = pricePerGram995 * (1000.0 / 995.0);
    const targetPricePerGram = purePricePerGram * (targetPurity / 1000.0);
    const totalValue = targetPricePerGram * targetGrams;

    return {
      benchmark_price_10g_995: pricePer10g995,
      target_grams: targetGrams,
      target_purity_fineness: targetPurity,
      target_price_per_gram: Math.round(targetPricePerGram * 100) / 100,
      total_value_inr: Math.round(totalValue * 100) / 100,
      karat_estimate: Math.round((targetPurity / 1000.0) * 24.0 * 10) / 10,
    };
  }


  public static normalizePriceToBenchmark(rawPrice: number, symbol: MCXSymbol): number {
    return this.normalizePrice(symbol, rawPrice);
  }
}

export { GoldNormalizer as ContractNormalizer };

