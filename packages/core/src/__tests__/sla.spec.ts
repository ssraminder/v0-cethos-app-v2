import { describe, it, expect } from "vitest"
import { deliverySLA, defaultSLASettings, type SLASettings } from "../sla"

describe("SLA Calculations", () => {
  describe("deliverySLA", () => {
    it("should handle 1-3 pages rule", () => {
      expect(deliverySLA(1, defaultSLASettings)).toBe(2)
      expect(deliverySLA(2, defaultSLASettings)).toBe(2)
      expect(deliverySLA(3, defaultSLASettings)).toBe(2)
    })

    it("should handle 4+ pages rule with additional days", () => {
      expect(deliverySLA(4, defaultSLASettings)).toBe(3) // 2 base + 1 additional
      expect(deliverySLA(7, defaultSLASettings)).toBe(3) // 2 base + 1 additional (4-7 pages)
      expect(deliverySLA(8, defaultSLASettings)).toBe(4) // 2 base + 2 additional (8-11 pages)
      expect(deliverySLA(12, defaultSLASettings)).toBe(5) // 2 base + 3 additional (12-15 pages)
    })

    it("should handle custom SLA settings", () => {
      const customSLA: SLASettings = {
        rules: [
          { pages: "1-5", businessDays: 3 },
          { pages: "6-10", businessDays: 5 },
          { pages: "11+", businessDays: 7 },
        ],
      }

      expect(deliverySLA(3, customSLA)).toBe(3)
      expect(deliverySLA(8, customSLA)).toBe(5)
      expect(deliverySLA(15, customSLA)).toBe(7)
    })

    it("should fall back to default calculation for unmatched pages", () => {
      const limitedSLA: SLASettings = {
        rules: [{ pages: "1-2", businessDays: 1 }],
      }

      expect(deliverySLA(1, limitedSLA)).toBe(1)
      expect(deliverySLA(5, limitedSLA)).toBe(2) // Default fallback
    })
  })
})
