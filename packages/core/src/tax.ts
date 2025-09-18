/**
 * Tax calculations for Canadian regions
 */

export interface TaxRegion {
  country: string
  province?: string
  taxPct: number
}

export interface TaxCalculation {
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  region: string
}

/**
 * Find tax rate for given country and province
 */
export function findTaxRate(country: string, province: string | null, taxRegions: TaxRegion[]): number {
  // First try to find exact match with province
  if (province) {
    const exactMatch = taxRegions.find((region) => region.country === country && region.province === province)
    if (exactMatch) return exactMatch.taxPct
  }

  // Fall back to country-level rate
  const countryMatch = taxRegions.find((region) => region.country === country && !region.province)
  if (countryMatch) return countryMatch.taxPct

  // Default to 0% for unknown regions
  return 0
}

/**
 * Calculate taxes for a given region
 */
export function taxesForRegion(
  subtotal: number,
  country: string,
  province: string | null,
  taxRegions: TaxRegion[],
): TaxCalculation {
  const taxRate = findTaxRate(country, province, taxRegions)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const regionName = province ? `${province}, ${country}` : country

  return {
    subtotal,
    taxRate,
    taxAmount,
    total,
    region: regionName,
  }
}

/**
 * Default Canadian tax regions
 */
export const defaultTaxRegions: TaxRegion[] = [
  // HST provinces
  { country: "CA", province: "NB", taxPct: 15.0 },
  { country: "CA", province: "NL", taxPct: 15.0 },
  { country: "CA", province: "NS", taxPct: 14.0 },
  { country: "CA", province: "ON", taxPct: 13.0 },
  { country: "CA", province: "PE", taxPct: 15.0 },
  // GST provinces
  { country: "CA", province: "AB", taxPct: 5.0 },
  { country: "CA", province: "NT", taxPct: 5.0 },
  { country: "CA", province: "NU", taxPct: 5.0 },
  { country: "CA", province: "YT", taxPct: 5.0 },
  // Outside Canada
  { country: "US", taxPct: 0.0 },
]
