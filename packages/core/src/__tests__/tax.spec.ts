import { describe, it, expect } from "vitest"
import { findTaxRate, taxesForRegion, defaultTaxRegions, type TaxRegion } from "../tax"

describe("Tax Calculations", () => {
  const testTaxRegions: TaxRegion[] = [
    { country: "CA", province: "ON", taxPct: 13.0 },
    { country: "CA", province: "AB", taxPct: 5.0 },
    { country: "CA", province: "NB", taxPct: 15.0 },
    { country: "US", taxPct: 0.0 },
  ]

  describe("findTaxRate", () => {
    it("should find exact province match", () => {
      expect(findTaxRate("CA", "ON", testTaxRegions)).toBe(13.0)
      expect(findTaxRate("CA", "AB", testTaxRegions)).toBe(5.0)
      expect(findTaxRate("CA", "NB", testTaxRegions)).toBe(15.0)
    })

    it("should fall back to country rate when province not found", () => {
      expect(findTaxRate("US", "CA", testTaxRegions)).toBe(0.0)
      expect(findTaxRate("US", null, testTaxRegions)).toBe(0.0)
    })

    it("should return 0 for unknown regions", () => {
      expect(findTaxRate("UK", null, testTaxRegions)).toBe(0.0)
      expect(findTaxRate("FR", "Paris", testTaxRegions)).toBe(0.0)
    })
  })

  describe("taxesForRegion", () => {
    it("should calculate HST correctly", () => {
      const result = taxesForRegion(100, "CA", "ON", testTaxRegions)

      expect(result.subtotal).toBe(100)
      expect(result.taxRate).toBe(13.0)
      expect(result.taxAmount).toBe(13.0)
      expect(result.total).toBe(113.0)
      expect(result.region).toBe("ON, CA")
    })

    it("should calculate GST correctly", () => {
      const result = taxesForRegion(100, "CA", "AB", testTaxRegions)

      expect(result.subtotal).toBe(100)
      expect(result.taxRate).toBe(5.0)
      expect(result.taxAmount).toBe(5.0)
      expect(result.total).toBe(105.0)
      expect(result.region).toBe("AB, CA")
    })

    it("should handle no tax regions", () => {
      const result = taxesForRegion(100, "US", null, testTaxRegions)

      expect(result.subtotal).toBe(100)
      expect(result.taxRate).toBe(0.0)
      expect(result.taxAmount).toBe(0.0)
      expect(result.total).toBe(100.0)
      expect(result.region).toBe("US")
    })
  })

  describe("defaultTaxRegions", () => {
    it("should include all Canadian HST provinces", () => {
      const hstProvinces = ["NB", "NL", "NS", "ON", "PE"]

      hstProvinces.forEach((province) => {
        const region = defaultTaxRegions.find((r) => r.province === province)
        expect(region).toBeDefined()
        expect(region!.taxPct).toBeGreaterThan(10) // HST rates are > 10%
      })
    })

    it("should include all Canadian GST provinces", () => {
      const gstProvinces = ["AB", "NT", "NU", "YT"]

      gstProvinces.forEach((province) => {
        const region = defaultTaxRegions.find((r) => r.province === province)
        expect(region).toBeDefined()
        expect(region!.taxPct).toBe(5.0) // GST is 5%
      })
    })

    it("should have 0% tax for US", () => {
      const usRegion = defaultTaxRegions.find((r) => r.country === "US")
      expect(usRegion).toBeDefined()
      expect(usRegion!.taxPct).toBe(0.0)
    })
  })
})
