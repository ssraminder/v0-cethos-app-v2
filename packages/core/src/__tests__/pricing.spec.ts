import { describe, it, expect } from "vitest"
import {
  roundToQuarterWithThreshold,
  computePageUnits,
  computeItemUnits,
  roundRateToNext5,
  priceItem,
  type PageData,
  type ItemPricingData,
} from "../pricing"

describe("Pricing Engine", () => {
  describe("roundToQuarterWithThreshold", () => {
    it("should round to nearest 0.25 when decimal <= threshold", () => {
      // Test cases at threshold boundary (0.20)
      expect(roundToQuarterWithThreshold(1.19, 0.2)).toBe(1.25) // 0.19 <= 0.20, round to nearest
      expect(roundToQuarterWithThreshold(1.2, 0.2)).toBe(1.25) // 0.20 <= 0.20, round to nearest
      expect(roundToQuarterWithThreshold(1.21, 0.2)).toBe(1.25) // 0.21 > 0.20, ceil to next

      // Test near quarter boundaries
      expect(roundToQuarterWithThreshold(1.12, 0.2)).toBe(1.0) // Rounds down to 1.00
      expect(roundToQuarterWithThreshold(1.13, 0.2)).toBe(1.25) // Rounds up to 1.25
      expect(roundToQuarterWithThreshold(1.37, 0.2)).toBe(1.5) // Rounds down to 1.50
      expect(roundToQuarterWithThreshold(1.38, 0.2)).toBe(1.5) // Rounds up to 1.50
    })

    it("should ceil to next 0.25 when decimal > threshold", () => {
      expect(roundToQuarterWithThreshold(1.21, 0.2)).toBe(1.25)
      expect(roundToQuarterWithThreshold(1.51, 0.2)).toBe(1.75)
      expect(roundToQuarterWithThreshold(1.76, 0.2)).toBe(2.0)
      expect(roundToQuarterWithThreshold(2.01, 0.2)).toBe(2.25)
    })

    it("should handle edge cases", () => {
      expect(roundToQuarterWithThreshold(0, 0.2)).toBe(0)
      expect(roundToQuarterWithThreshold(0.25, 0.2)).toBe(0.25)
      expect(roundToQuarterWithThreshold(0.5, 0.2)).toBe(0.5)
      expect(roundToQuarterWithThreshold(0.75, 0.2)).toBe(0.75)
      expect(roundToQuarterWithThreshold(1.0, 0.2)).toBe(1.0)
    })
  })

  describe("computePageUnits", () => {
    it("should calculate raw page units correctly", () => {
      expect(computePageUnits(225, 225, 1.0)).toBe(1.0)
      expect(computePageUnits(450, 225, 1.0)).toBe(2.0)
      expect(computePageUnits(225, 225, 1.15)).toBe(1.15)
      expect(computePageUnits(300, 225, 1.3)).toBeCloseTo(1.733, 3)
    })
  })

  describe("computeItemUnits", () => {
    it("should sum rounded page units and enforce minimum 1.00", () => {
      const pages: PageData[] = [
        { words: 100, complexityMultiplier: 1.0 }, // ~0.44 raw, rounds to 0.5
        { words: 150, complexityMultiplier: 1.0 }, // ~0.67 raw, rounds to 0.75
      ]

      const result = computeItemUnits(pages, 225, 0.2)
      expect(result).toBe(1.25) // 0.5 + 0.75 = 1.25
    })

    it("should enforce minimum 1.00 per item", () => {
      const pages: PageData[] = [
        { words: 50, complexityMultiplier: 1.0 }, // ~0.22 raw, rounds to 0.25
      ]

      const result = computeItemUnits(pages, 225, 0.2)
      expect(result).toBe(1.0) // Enforced minimum
    })

    it("should handle multiple pages with different complexities", () => {
      const pages: PageData[] = [
        { words: 225, complexityMultiplier: 1.0 }, // 1.0 raw, stays 1.0
        { words: 225, complexityMultiplier: 1.15 }, // 1.15 raw, stays 1.25
        { words: 225, complexityMultiplier: 1.3 }, // 1.3 raw, stays 1.5
      ]

      const result = computeItemUnits(pages, 225, 0.2)
      expect(result).toBe(3.75) // 1.0 + 1.25 + 1.5
    })
  })

  describe("roundRateToNext5", () => {
    it("should round rate up to next $5 increment", () => {
      expect(roundRateToNext5(40)).toBe(40)
      expect(roundRateToNext5(41)).toBe(45)
      expect(roundRateToNext5(44.99)).toBe(45)
      expect(roundRateToNext5(45)).toBe(45)
      expect(roundRateToNext5(47.5)).toBe(50)
    })
  })

  describe("priceItem", () => {
    it("should calculate complete item pricing", () => {
      const data: ItemPricingData = {
        pages: [
          { words: 225, complexityMultiplier: 1.0 }, // 1.0 units
          { words: 300, complexityMultiplier: 1.15 }, // ~1.53 raw, rounds to 1.75
        ],
        baseRate: 40,
        tierMultiplier: 1.2,
        certificationPriceCents: 3500, // $35
      }

      const result = priceItem(data)

      expect(result.units).toBe(2.75) // 1.0 + 1.75
      expect(result.rate).toBe(50) // 40 * 1.2 = 48, rounded up to 50
      expect(result.subtotal).toBe(137.5) // 2.75 * 50
      expect(result.certificationCost).toBe(35)
      expect(result.total).toBe(172.5) // 137.5 + 35
    })

    it("should handle certification with multiplier", () => {
      const data: ItemPricingData = {
        pages: [{ words: 225, complexityMultiplier: 1.0 }],
        baseRate: 40,
        tierMultiplier: 1.0,
        certificationPriceCents: 1000, // $10 base
        certificationMultiplier: 1.5,
      }

      const result = priceItem(data)
      expect(result.certificationCost).toBe(15) // $10 * 1.5
    })
  })
})
