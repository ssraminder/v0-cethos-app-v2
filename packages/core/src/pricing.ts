/**
 * Core pricing engine for Cethos Quote Platform
 * Implements complex rounding rules and pricing calculations
 */

export interface PageData {
  words: number
  complexityMultiplier: number
}

export interface ItemPricingData {
  pages: PageData[]
  baseRate: number
  tierMultiplier: number
  certificationPriceCents?: number
  certificationMultiplier?: number
}

export interface QuotePricingResult {
  units: number
  rate: number
  subtotal: number
  certificationCost: number
  total: number
}

/**
 * Rounds to quarter with threshold logic
 * If decimal <= threshold, round to nearest 0.25
 * Else, ceil to next 0.25
 */
export function roundToQuarterWithThreshold(x: number, threshold = 0.2): number {
  const floor = Math.floor(x)
  const decimal = x - floor

  if (decimal <= threshold) {
    // Round to nearest 0.25 using MROUND logic
    return Math.round(x * 4) / 4
  } else {
    // Ceiling to next 0.25
    return Math.ceil(x * 4) / 4
  }
}

/**
 * Compute raw page units before rounding
 */
export function computePageUnits(words: number, divisor: number, complexityMultiplier: number): number {
  return (words / divisor) * complexityMultiplier
}

/**
 * Compute item units with per-page rounding and minimum enforcement
 */
export function computeItemUnits(pages: PageData[], divisor = 225, roundingThreshold = 0.2): number {
  const totalRoundedUnits = pages.reduce((sum, page) => {
    const rawUnits = computePageUnits(page.words, divisor, page.complexityMultiplier)
    const roundedUnits = roundToQuarterWithThreshold(rawUnits, roundingThreshold)
    return sum + roundedUnits
  }, 0)

  // Enforce minimum 1.00 unit per item
  return Math.max(totalRoundedUnits, 1.0)
}

/**
 * Round rate up to next $5 increment
 */
export function roundRateToNext5(rate: number): number {
  return Math.ceil(rate / 5) * 5
}

/**
 * Calculate item pricing with certification
 */
export function priceItem(data: ItemPricingData): QuotePricingResult {
  const units = computeItemUnits(data.pages)
  const adjustedRate = data.baseRate * data.tierMultiplier
  const rate = roundRateToNext5(adjustedRate)
  const subtotal = units * rate

  let certificationCost = 0
  if (data.certificationPriceCents) {
    certificationCost = data.certificationPriceCents / 100
    if (data.certificationMultiplier) {
      certificationCost *= data.certificationMultiplier
    }
  }

  const total = subtotal + certificationCost

  return {
    units,
    rate,
    subtotal,
    certificationCost,
    total,
  }
}

/**
 * Dual-ledger helpers for calc vs billed totals
 */
export interface DualLedgerTotals {
  calcUnits: number
  calcRate: number
  calcTotal: number
  billedUnits: number
  billedRate: number
  billedTotal: number
}

export function computedTotals(
  data: ItemPricingData,
): Omit<DualLedgerTotals, "billed" | "billedUnits" | "billedRate" | "billedTotal"> {
  const result = priceItem(data)
  return {
    calcUnits: result.units,
    calcRate: result.rate,
    calcTotal: result.total,
  }
}

export function toBilledTotals(calcTotals: ReturnType<typeof computedTotals>): DualLedgerTotals {
  return {
    ...calcTotals,
    billedUnits: calcTotals.calcUnits,
    billedRate: calcTotals.calcRate,
    billedTotal: calcTotals.calcTotal,
  }
}

export function keepBilledFrozen(
  calcTotals: ReturnType<typeof computedTotals>,
  existingBilled: { billedUnits: number; billedRate: number; billedTotal: number },
): DualLedgerTotals {
  return {
    ...calcTotals,
    ...existingBilled,
  }
}
